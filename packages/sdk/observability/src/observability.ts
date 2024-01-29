//
// Copyright 2023 DXOS.org
//

import { Event, scheduleTaskInterval } from '@dxos/async';
import { type Client, type Config } from '@dxos/client';
import { type Space } from '@dxos/client-protocol';
import { Context } from '@dxos/context';
import { invariant } from '@dxos/invariant';
import { log } from '@dxos/log';
import { ConnectionState } from '@dxos/network-manager';
import { DeviceKind, type NetworkStatus, Platform } from '@dxos/protocols/proto/dxos/client/services';
import { isNode } from '@dxos/util';

import buildSecrets from './cli-observability-secrets.json';
import { DatadogMetrics } from './datadog';
import { SegmentTelemetry, type EventOptions, type PageOptions } from './segment';
import {
  captureException as sentryCaptureException,
  enableSentryLogProcessor,
  configureTracing as sentryConfigureTracing,
  init as sentryInit,
  type InitOptions,
  setTag as sentrySetTag,
} from './sentry';
import { mapSpaces } from './util';

const SPACE_METRICS_MIN_INTERVAL = 1000 * 60;
// const DATADOG_IDLE_INTERVAL = 1000 * 60 * 5;
const DATADOG_IDLE_INTERVAL = 1000 * 60 * 1;

// TODO(nf): add allowlist for telemetry tags?
const ERROR_TAGS = ['identityKey', 'username', 'deviceKey', 'group'];

// Secrets? EnvironmentConfig?

export type ObservabilitySecrets = {
  DX_ENVIRONMENT: string | null;
  DX_RELEASE: string | null;
  SENTRY_DESTINATION: string | null;
  TELEMETRY_API_KEY: string | null;
  IPDATA_API_KEY: string | null;
  DATADOG_API_KEY: string | null;
  DATADOG_APP_KEY: string | null;
};

export type Mode = 'basic' | 'full' | 'disabled';

export type ObservabilityOptions = {
  /// The webapp (e.g. 'composer.dxos.org'), 'cli', or 'agent'.
  namespace: string;
  // TODO(nf): make platform a required extension?
  // platform: Platform;
  config?: Config;
  secrets?: Record<string, string>;
  group?: string;
  mode?: Mode;

  telemetry?: {
    batchSize?: number;
  };

  errorLog?: {
    sentryInitOptions?: InitOptions;
  };
  logProcessor?: boolean;
};

/*
 * Observability provides a common interface for error logging, metrics, and telemetry.
 * It currently provides these capabilities using Sentry, Datadog, and Segment.
 */
export class Observability {
  // TODO(wittjosiah): Generic metrics interface.
  private _metrics?: DatadogMetrics;
  // TODO(wittjosiah): Generic telemetry interface.
  private _telemetryBatchSize: number;
  private _telemetry?: SegmentTelemetry;
  // TODO(wittjosiah): Generic error logging interface.
  private _errorReportingOptions?: InitOptions;
  private _errorLogProcessor: boolean;

  private _secrets: ObservabilitySecrets;
  private _namespace: string;
  private _config?: Config;
  private _mode: Mode = 'disabled';
  private _group?: string;
  // TODO(nf): accept upstream context?
  private _ctx = new Context();
  private _tags = new Map<string, string>();

  // TODO(nf): make platform a required extension?
  constructor({ namespace, config, secrets, group, mode, telemetry, errorLog, logProcessor }: ObservabilityOptions) {
    this._namespace = namespace;
    this._config = config;
    this._mode = mode ?? 'disabled';
    this._group = group;
    this._secrets = this._loadSecrets(config, secrets);
    this._telemetryBatchSize = telemetry?.batchSize ?? 30;
    this._errorReportingOptions = errorLog?.sentryInitOptions;
    this._errorLogProcessor = logProcessor ?? false;

    if (this._group) {
      this.setTag('group', this._group);
    }
    this.setTag('namespace', this._namespace);

    if (this._mode === 'full') {
      // TODO(nf): set group and hostname?
    }
  }

  private _loadSecrets(config: Config | undefined, secrets?: Record<string, string>) {
    if (isNode()) {
      return buildSecrets as ObservabilitySecrets;
    } else {
      invariant(config, 'runtime config is required');
      log('config', { rtc: this._secrets, config });
      return {
        DX_ENVIRONMENT: config.get('runtime.app.env.DX_ENVIRONMENT'),
        DX_RELEASE: config.get('runtime.app.env.DX_RELEASE'),
        SENTRY_DESTINATION: config.get('runtime.app.env.DX_SENTRY_DESTINATION'),
        TELEMETRY_API_KEY: config.get('runtime.app.env.DX_TELEMETRY_API_KEY'),
        IPDATA_API_KEY: config.get('runtime.app.env.DX_IPDATA_API_KEY'),
        DATADOG_API_KEY: config.get('runtime.app.env.DX_DATADOG_API_KEY'),
        DATADOG_APP_KEY: config.get('runtime.app.env.DX_DATADOG_APP_KEY'),
        ...secrets,
      };
    }
  }

  initialize() {
    this._initMetrics();
    this._initTelemetry();
    this._initErrorLogs();
  }

  async close() {
    await this._ctx.dispose();

    // TODO(wittjosiah): Remove telemetry, etc. scripts.
  }

  setMode(mode: Mode) {
    this._mode = mode;
  }

  get mode() {
    return this._mode;
  }

  get enabled() {
    return this._mode !== 'disabled';
  }

  //
  // Tags
  //

  /**
   * Set a tag for all observability services.
   */
  setTag(key: string, value: string) {
    if (this.enabled && ERROR_TAGS.includes(key)) {
      sentrySetTag(key, value);
    }

    this._tags.set(key, value);
  }

  // TODO(nf): Combine with setDeviceTags.
  async setIdentityTags(client: Client) {
    client.services.services.IdentityService!.queryIdentity().subscribe((idqr) => {
      if (!idqr?.identity?.identityKey) {
        log('empty response from identity service', { idqr });
        return;
      }

      // TODO(nf): check mode
      // TODO(nf): cardinality
      this.setTag('identityKey', idqr?.identity?.identityKey.truncate());
      if (idqr?.identity?.profile?.displayName) {
        this.setTag('username', idqr?.identity?.profile?.displayName);
      }
    });
  }

  async setDeviceTags(client: Client) {
    client.services.services.DevicesService!.queryDevices().subscribe((dqr) => {
      if (!dqr || !dqr.devices || dqr.devices.length === 0) {
        log('empty response from device service', { device: dqr });
        return;
      }
      invariant(dqr, 'empty response from device service');

      const thisDevice = dqr.devices.find((device) => device.kind === DeviceKind.CURRENT);
      if (!thisDevice) {
        log('no current device', { device: dqr });
        return;
      }
      this.setTag('deviceKey', thisDevice.deviceKey.truncate());
      if (thisDevice.profile?.label) {
        this.setTag('deviceProfile', thisDevice.profile.label);
      }
    });
  }

  //
  // Metrics
  //

  private _initMetrics() {
    if (this.enabled && this._secrets.DATADOG_API_KEY) {
      this._metrics = new DatadogMetrics({
        apiKey: this._secrets.DATADOG_API_KEY,
        getTags: () => this._tags,
        // TODO(nf): move/refactor from telementryContext, needed to read CORS proxy
        config: this._config!,
      });
    } else {
      log('datadog disabled');
    }
  }

  /**
   * Gauge metric.
   *
   * The default implementation uses Datadog.
   */
  gauge(name: string, value: number | any, extraTags?: any) {
    this._metrics?.gauge(name, value, extraTags);
  }

  // TODO(nf): Refactor into ObservabilityExtensions.

  startNetworkMetrics(client: Client) {
    const updateSignalMetrics = new Event<NetworkStatus>();

    // const lcsh = (csp as LocalClientServices).host;
    updateSignalMetrics.on(this._ctx, async (networkStatus) => {
      log('send signal metrics');
      (networkStatus.signaling as NetworkStatus.Signal[]).forEach(({ server, state }) => {
        this.gauge('dxos.client.network.signal.connectionState', state, { server });
      });

      let swarmCount = 0;
      const connectionStates = new Map<string, number>();
      for (const state in ConnectionState) {
        connectionStates.set(state, 0);
      }

      let totalReadBufferSize = 0;
      let totalWriteBufferSize = 0;
      let totalChannelBufferSize = 0;

      networkStatus.connectionInfo?.forEach((connectionInfo) => {
        swarmCount++;

        for (const conn of connectionInfo.connections ?? []) {
          connectionStates.set(conn.state, (connectionStates.get(conn.state) ?? 0) + 1);
          totalReadBufferSize += conn.readBufferSize ?? 0;
          totalWriteBufferSize += conn.writeBufferSize ?? 0;

          for (const stream of conn.streams ?? []) {
            totalChannelBufferSize += stream.writeBufferSize ?? 0;
          }
        }

        this.gauge('dxos.client.network.swarm.count', swarmCount);
        for (const state in ConnectionState) {
          this.gauge('dxos.client.network.connection.count', connectionStates.get(state) ?? 0, { state });
        }
        this.gauge('dxox.client.network.totalReadBufferSize', totalReadBufferSize);
        this.gauge('dxos.client.network.totalWriteBufferSize', totalWriteBufferSize);
        this.gauge('dxos.client.network.totalChannelBufferSize', totalChannelBufferSize);
      });
    });

    client.services.services.NetworkService?.queryStatus().subscribe((networkStatus) => {
      updateSignalMetrics.emit(networkStatus);
    });

    // scheduleTaskInterval(ctx, async () => updateSignalMetrics.emit(), DATADOG_IDLE_INTERVAL);
  }

  startSpacesMetrics(client: Client) {
    let spaces = client.spaces.get();
    const subscriptions = new Map<string, { unsubscribe: () => void }>();
    this._ctx.onDispose(() => subscriptions.forEach((subscription) => subscription.unsubscribe()));

    const updateSpaceMetrics = new Event<Space>().debounce(SPACE_METRICS_MIN_INTERVAL);
    updateSpaceMetrics.on(this._ctx, async (space) => {
      log('send space update');
      for (const sp of mapSpaces(spaces, { truncateKeys: true })) {
        this.gauge('dxos.client.space.members', sp.members, { key: sp.key });
        this.gauge('dxos.client.space.objects', sp.objects, { key: sp.key });
        this.gauge('dxos.client.space.epoch', sp.epoch, { key: sp.key });
        this.gauge('dxos.client.space.currentDataMutations', sp.currentDataMutations, { key: sp.key });
      }
    });

    const subscribeToSpaceUpdate = (space: Space) =>
      space.pipeline.subscribe({
        next: () => {
          updateSpaceMetrics.emit();
        },
      });

    spaces.forEach((space) => {
      subscriptions.set(space.key.toHex(), subscribeToSpaceUpdate(space));
    });

    client.spaces.subscribe({
      next: async () => {
        spaces = client.spaces.get();
        // spaces = await this.getSpaces(this._agent.client);
        spaces
          .filter((space) => !subscriptions.has(space.key.toHex()))
          .forEach((space) => {
            subscriptions.set(space.key.toHex(), subscribeToSpaceUpdate(space));
          });
      },
    });

    scheduleTaskInterval(this._ctx, async () => updateSpaceMetrics.emit(), DATADOG_IDLE_INTERVAL);
  }

  async startRuntimeMetrics(client: Client, frequency: number = DATADOG_IDLE_INTERVAL) {
    const platform = await client.services.services.SystemService?.getPlatform();
    invariant(platform, 'platform is required');

    this.setTag('platform_type', Platform.PLATFORM_TYPE[platform.type as number].toLowerCase());
    if (this._mode === 'full') {
      // platform[foo] does not work?
      if (platform.platform) {
        this.setTag('platform', platform.platform);
      }
      if (platform.arch) {
        this.setTag('arch', platform.arch);
      }
      if (platform.runtime) {
        this.setTag('runtime', platform.runtime);
      }
    }
    scheduleTaskInterval(
      this._ctx,
      async () => {
        log('platform');
        client.services.services.SystemService?.getPlatform()
          .then((platform) => {
            log('platform', { platform });
            if (platform.memory) {
              this.gauge('dxos.client.runtime.rss', platform.memory.rss);
              this.gauge('dxos.client.runtime.heapTotal', platform.memory.heapTotal);
              this.gauge('dxos.client.runtime.heapUsed', platform.memory.heapUsed);
            }
          })
          .catch((error) => log('platform error', { error }));
      },
      frequency,
    );
  }

  //
  // Telemetry
  //

  private _initTelemetry() {
    if (this._secrets.TELEMETRY_API_KEY && this._mode !== 'disabled') {
      this._telemetry = new SegmentTelemetry({
        apiKey: this._secrets.TELEMETRY_API_KEY,
        batchSize: this._telemetryBatchSize,
        getTags: () => this._tags,
      });
    } else {
      log('segment disabled');
    }
  }

  /**
   * A telemetry event.
   *
   * The default implementation uses Segment.
   */
  event(options: EventOptions) {
    this._telemetry?.event(options);
  }

  /**
   * A telemetry page view.
   *
   * The default implementation uses Segment.
   */
  page(options: PageOptions) {
    this._telemetry?.page(options);
  }

  //
  // Error Logs
  //

  private _initErrorLogs() {
    if (this._secrets.SENTRY_DESTINATION && this._mode !== 'disabled') {
      // TODO(nf): refactor package into this one?
      log.info('Initializing Sentry', {
        dest: this._secrets.SENTRY_DESTINATION,
        options: this._errorReportingOptions,
      });
      sentryInit({
        ...this._errorReportingOptions,
        destination: this._secrets.SENTRY_DESTINATION,
        scrubFilenames: this._mode !== 'full',
      });
      if (this._errorReportingOptions?.tracing) {
        sentryConfigureTracing();
      }
      // TODO(nf): set platform at instantiation? needed for node.
      if (this._errorLogProcessor) {
        enableSentryLogProcessor();
      }
      // TODO(nf): is this different than passing as properties in options?
      this._tags.forEach((v, k) => {
        if (ERROR_TAGS.includes(k)) {
          sentrySetTag(k, v);
        }
      });
    } else {
      log('sentry disabled');
    }
  }

  /**
   * Manually capture an exception.
   *
   * The default implementation uses Sentry.
   */
  captureException(err: any) {
    if (this.enabled) {
      sentryCaptureException(err);
    }
  }
}