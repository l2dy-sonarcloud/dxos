//
// Copyright 2021 DXOS.org
//

/* THIS FILE WILL BE LOADED BY CONTEXT REPLACEMENT PLUGIN IN BROWSER ENVS. */

/* global __DXOS_CONFIG__ __CONFIG_ENVS__ __CONFIG_DEFAULTS__ __CONFIG_LOCAL__ */

import localforage from 'localforage';

import { log } from '@dxos/log';

const CONFIG_ENDPOINT = '/.well-known/dx/config';

export const Local = () => {
  return typeof __CONFIG_LOCAL__ !== 'undefined' ? __CONFIG_LOCAL__ : {};
};

export const Dynamics = async () => {
  const { publicUrl = '', dynamic } = __DXOS_CONFIG__;
  if (!dynamic) {
    log('dynamics disabled');
    return {};
  }

  log('fetching config...', { publicUrl });
  return await fetch(`${publicUrl}${CONFIG_ENDPOINT}`)
    .then((res) => res.json())
    .catch((error) => {
      log.warn('Failed to fetch dynamic config.', error);
      return {};
    });
};

export const Envs = () => {
  return typeof __CONFIG_ENVS__ !== 'undefined' ? __CONFIG_ENVS__ : {};
};

export const Defaults = () => {
  return typeof __CONFIG_DEFAULTS__ !== 'undefined' ? __CONFIG_DEFAULTS__ : {};
};

/**
 * Settings config from browser storage.
 */
export const Storage = async () => {
  try {
    const config = await localforage.getItem('dxos.org/settings/config');
    if (config) {
      return config;
    }
  } catch (err) {
    log.warn('Failed to load config', { err });
  }
  return {};
};

export const Remote = (target, authenticationToken) => {
  if (!target) {
    return {};
  }

  try {
    const url = new URL(target);
    const protocol = url.protocol.slice(0, -1);

    return {
      runtime: {
        client: {
          // TODO(burdon): Remove vault.html.
          remoteSource: url.origin + (protocol.startsWith('http') ? '/vault.html' : ''),
          remoteSourceAuthenticationToken: authenticationToken,
        },
      },
    };
  } catch (err) {
    log.catch(err);
    return {};
  }
};
