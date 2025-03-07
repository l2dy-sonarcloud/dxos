//
// Copyright 2025 DXOS.org
//

import { Capabilities, contributes, createIntent, LayoutAction, type PluginsContext } from '@dxos/app-framework';
import { ClientCapabilities } from '@dxos/plugin-client';
import { createExtension, type Node, ROOT_ID, toSignal } from '@dxos/plugin-graph';
import { memoizeQuery } from '@dxos/plugin-space';
import { getTypename, parseId, SpaceState } from '@dxos/react-client/echo';

import { AMBIENT_CHAT_DIALOG, AUTOMATION_PLUGIN } from '../meta';

export default (context: PluginsContext) => {
  const resolve = (typename: string) =>
    context.requestCapabilities(Capabilities.Metadata).find(({ id }) => id === typename)?.metadata ?? {};

  return contributes(Capabilities.AppGraphBuilder, [
    createExtension({
      id: `${AUTOMATION_PLUGIN}/ambient-chat`,
      filter: (node): node is Node<null> => node.id === ROOT_ID,
      actions: () => [
        {
          id: `${LayoutAction.UpdateDialog._tag}/ambient-chat/open`,
          data: async () => {
            const { dispatchPromise: dispatch } = context.requestCapability(Capabilities.IntentDispatcher);
            await dispatch(
              createIntent(LayoutAction.UpdateDialog, {
                part: 'dialog',
                subject: AMBIENT_CHAT_DIALOG,
                options: {
                  state: true,
                  blockAlign: 'end',
                },
              }),
            );
          },
          properties: {
            label: ['open ambient chat label', { ns: AUTOMATION_PLUGIN }],
            icon: 'ph--chat-centered-text--regular',
            disposition: 'pin-end',
            keyBinding: {
              macos: 'shift+meta+k',
              windows: 'shift+ctrl+k',
            },
          },
        },
      ],
    }),
    createExtension({
      id: `${AUTOMATION_PLUGIN}/service-registry`,
      resolver: ({ id }) => {
        if (!id.endsWith('~service-registry')) {
          return;
        }

        const type = 'orphan-settings-for-subject';
        const icon = 'ph--plugs--regular';

        const client = context.requestCapability(ClientCapabilities.Client);
        const [subjectId] = id.split('~');
        const { spaceId } = parseId(subjectId);
        const spaces = toSignal(
          (onChange) => client.spaces.subscribe(() => onChange()).unsubscribe,
          () => client.spaces.get(),
        );
        const space = spaces?.find((space) => space.id === spaceId && space.state.get() === SpaceState.SPACE_READY);
        return {
          id,
          type,
          data: null,
          properties: {
            icon,
            label: ['service registry label', { ns: AUTOMATION_PLUGIN }],
            object: null,
            space,
          },
        };
      },
    }),
    createExtension({
      id: `${AUTOMATION_PLUGIN}/automation-for-subject`,
      resolver: ({ id }) => {
        if (!id.endsWith('~automation')) {
          return;
        }

        const type = 'orphan-settings-for-subject';
        const icon = 'ph--magic-wand--regular';

        const client = context.requestCapability(ClientCapabilities.Client);
        const [subjectId] = id.split('~');
        const { spaceId, objectId } = parseId(subjectId);
        const spaces = toSignal(
          (onChange) => client.spaces.subscribe(() => onChange()).unsubscribe,
          () => client.spaces.get(),
        );
        const space = spaces?.find((space) => space.id === spaceId && space.state.get() === SpaceState.SPACE_READY);
        if (!objectId) {
          // TODO(burdon): Ref SPACE_PLUGIN ns.
          const label = space
            ? space.properties.name || ['unnamed space label', { ns: AUTOMATION_PLUGIN }]
            : ['unnamed object settings label', { ns: AUTOMATION_PLUGIN }];

          // TODO(wittjosiah): Support comments for arbitrary subjects.
          //   This is to ensure that the comments panel is not stuck on an old object.
          return {
            id,
            type,
            data: null,
            properties: {
              icon,
              label,
              showResolvedThreads: false,
              object: null,
              space,
            },
          };
        }

        const [object] = memoizeQuery(space, { id: objectId });
        if (!object || !subjectId) {
          return;
        }

        const meta = resolve(getTypename(object) ?? '');
        const label = meta.label?.(object) ||
          object.name ||
          meta.placeholder || ['unnamed object settings label', { ns: AUTOMATION_PLUGIN }];

        return {
          id,
          type,
          data: null,
          properties: {
            icon,
            label,
            object,
          },
        };
      },
    }),
    createExtension({
      id: `${AUTOMATION_PLUGIN}/assistant-for-subject`,
      resolver: ({ id }) => {
        if (!id.endsWith('~assistant')) {
          return;
        }

        const client = context.requestCapability(ClientCapabilities.Client);
        const [subjectId] = id.split('~');
        const { spaceId, objectId } = parseId(subjectId);
        const spaces = toSignal(
          (onChange) => client.spaces.subscribe(() => onChange()).unsubscribe,
          () => client.spaces.get(),
        );
        const space = spaces?.find((space) => space.id === spaceId && space.state.get() === SpaceState.SPACE_READY);
        if (!objectId) {
          // TODO(wittjosiah): Support assistant for arbitrary subjects.
          //   This is to ensure that the assistant panel is not stuck on an old object.
          return {
            id,
            type: 'orphan-automation-for-subject',
            data: null,
            properties: {
              icon: 'ph--atom--regular',
              label: ['assistant panel label', { ns: AUTOMATION_PLUGIN }],
              object: null,
              space,
            },
          };
        }

        const [object] = memoizeQuery(space, { id: objectId });
        return {
          id,
          type: 'orphan-automation-for-subject',
          data: null,
          properties: {
            icon: 'ph--atom--regular',
            label: ['assistant panel label', { ns: AUTOMATION_PLUGIN }],
            object,
          },
        };
      },
    }),
  ]);
};
