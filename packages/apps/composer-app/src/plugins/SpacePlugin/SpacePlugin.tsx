//
// Copyright 2023 DXOS.org
//

import {
  ArrowLineLeft,
  Article,
  ArticleMedium,
  Download,
  EyeSlash,
  Intersect,
  PaperPlane,
  PencilSimpleLine,
  Planet,
  Plus,
  Trash,
  Upload,
} from '@phosphor-icons/react';
import React, { FC } from 'react';

import { Document } from '@braneframe/types';
import { EventSubscriptions } from '@dxos/async';
import { useTranslation } from '@dxos/aurora';
import { TextKind } from '@dxos/aurora-composer';
import { defaultDescription, mx } from '@dxos/aurora-theme';
import { PublicKey, PublicKeyLike } from '@dxos/keys';
import { createStore, createSubscription } from '@dxos/observable-object';
import { observer } from '@dxos/observable-object/react';
import {
  EchoDatabase,
  IFrameClientServicesHost,
  IFrameClientServicesProxy,
  ShellLayout,
  Space,
  SpaceState,
  TypedObject,
} from '@dxos/react-client';
import {
  Surface,
  definePlugin,
  findPlugin,
  ClientPluginProvides,
  GraphNode,
  GraphProvides,
  useGraphContext,
  RouterPluginProvides,
  SplitViewProvides,
  TreeViewProvides,
  useTreeView,
} from '@dxos/react-surface';

import { DialogRenameSpace } from './DialogRenameSpace';
import { DialogRestoreSpace } from './DialogRestoreSpace';
import { SpaceTreeItem } from './SpaceTreeItem';
import { backupSpace } from './backup';
import { getSpaceDisplayName } from './getSpaceDisplayName';

export type SpacePluginProvides = GraphProvides & RouterPluginProvides;

export const isSpace = (datum: unknown): datum is Space =>
  datum && typeof datum === 'object'
    ? 'key' in datum && datum.key instanceof PublicKey && 'db' in datum && datum.db instanceof EchoDatabase
    : false;

export const SpaceMain: FC<{}> = observer(() => {
  const treeView = useTreeView();
  const graph = useGraphContext();
  const [parentId, childId] = treeView.selected;

  const parentNode = graph.roots[SpacePlugin.meta.id].find((node) => node.id === parentId);
  const childNode = parentNode?.children?.find((node) => node.id === childId);

  const data = parentNode ? (childNode ? [parentNode.data, childNode.data] : [parentNode.data]) : null;
  return <Surface data={data} role='main' />;
});

export const SpaceMainEmpty = () => {
  const { t } = useTranslation('composer');
  return (
    <div
      role='none'
      className='min-bs-screen is-full flex items-center justify-center p-8'
      data-testid='composer.firstRunMessage'
    >
      <p
        role='alert'
        className={mx(
          defaultDescription,
          'border border-dashed border-neutral-400/50 rounded-xl flex items-center justify-center p-8 font-system-normal text-lg',
        )}
      >
        {t('first run message')}
      </p>
    </div>
  );
};

const objectsToGraphNodes = (parent: GraphNode<Space>, objects: TypedObject[]): GraphNode[] => {
  return objects.map((obj) => ({
    id: obj.id,
    label: obj.title ?? 'Untitled',
    description: obj.description,
    icon: obj.content?.kind === TextKind.PLAIN ? ArticleMedium : Article,
    data: obj,
    parent,
    actions: [
      {
        id: 'delete',
        label: ['delete document label', { ns: 'composer' }],
        icon: Trash,
        invoke: async () => {
          parent.data?.db.remove(obj);
        },
      },
    ],
  }));
};

const nodes = createStore<GraphNode[]>([]);
const nodeAttributes = new Map<string, { [key: string]: any }>();
const rootObjects = new Map<string, GraphNode[]>();
const subscriptions = new EventSubscriptions();

const EmptyTree = () => {
  const { t } = useTranslation('composer');
  return (
    <div
      role='none'
      className={mx(
        'p-2 mli-2 mbe-2 text-center border border-dashed border-neutral-400/50 rounded-xl',
        defaultDescription,
      )}
    >
      {t('empty tree message')}
    </div>
  );
};

const EmptySpace = () => {
  const { t } = useTranslation('composer');
  return (
    <div
      role='none'
      className={mx(
        'p-2 mli-2 mbe-2 text-center border border-dashed border-neutral-400/50 rounded-xl',
        defaultDescription,
      )}
    >
      {t('empty space message')}
    </div>
  );
};

// TODO(wittjosiah): Specify and factor out fully qualified names + utils (e.g., subpaths, uris, etc).
const getSpaceId = (spaceKey: PublicKeyLike) => {
  if (spaceKey instanceof PublicKey) {
    spaceKey = spaceKey.toHex();
  }

  return `${SpacePlugin.meta.id}/${spaceKey}`;
};

export const SpacePlugin = definePlugin<SpacePluginProvides>({
  meta: {
    id: 'dxos:space',
  },
  ready: async (plugins) => {
    const clientPlugin = findPlugin<ClientPluginProvides>(plugins, 'dxos:ClientPlugin');
    const treeViewPlugin = findPlugin<TreeViewProvides>(plugins, 'dxos:TreeViewPlugin');
    const splitViewPlugin = findPlugin<SplitViewProvides>(plugins, 'dxos:SplitViewPlugin');
    if (!clientPlugin) {
      return;
    }

    const client = clientPlugin.provides.client;
    const identity = client.halo.identity.get();
    const subscription = client.spaces.subscribe((spaces) => {
      nodes.splice(
        0,
        nodes.length,
        ...spaces.map((space) => {
          const id = getSpaceId(space.key);
          const node: GraphNode<Space> = {
            id,
            label: space.properties.name ?? 'Untitled space',
            description: space.properties.description,
            icon: Planet,
            data: space,
            actions: [
              {
                id: 'create-doc',
                testId: 'spacePlugin.createDocument',
                label: ['create document label', { ns: 'composer' }],
                icon: Plus,
                invoke: async () => {
                  const document = space.db.add(new Document());
                  if (treeViewPlugin) {
                    treeViewPlugin.provides.treeView.selected = [id, document.id];
                  }
                },
              },
              {
                id: 'rename-space',
                label: ['rename space label', { ns: 'composer' }],
                icon: PencilSimpleLine,
                invoke: async () => {
                  if (splitViewPlugin?.provides.splitView) {
                    splitViewPlugin.provides.splitView.dialogOpen = true;
                    splitViewPlugin.provides.splitView.dialogContent = ['dxos:space/RenameSpaceDialog', space];
                  }
                },
              },
              {
                id: 'view-invitations',
                label: ['view invitations label', { ns: 'composer' }],
                icon: PaperPlane,
                invoke: async () => {
                  await clientPlugin.provides.setLayout(ShellLayout.SPACE_INVITATIONS, { spaceKey: space.key });
                },
              },
              {
                id: 'hide-space',
                label: ['hide space label', { ns: 'composer' }],
                icon: EyeSlash,
                invoke: async () => {
                  if (identity) {
                    const identityHex = identity.identityKey.toHex();
                    space.properties.members = {
                      ...space.properties.members,
                      [identityHex]: {
                        ...space.properties.members?.[identityHex],
                        hidden: true,
                      },
                    };
                    if (treeViewPlugin?.provides.treeView.selected[0] === id) {
                      treeViewPlugin.provides.treeView.selected = [];
                    }
                  }
                },
              },
              {
                id: 'backup-space',
                label: ['download all docs in space label', { ns: 'composer' }],
                icon: Download,
                invoke: async (t) => {
                  const backupBlob = await backupSpace(space, t('untitled document title'));
                  const url = URL.createObjectURL(backupBlob);
                  const element = document.createElement('a');
                  element.setAttribute('href', url);
                  element.setAttribute('download', `${getSpaceDisplayName(t, space)} backup.zip`);
                  element.setAttribute('target', 'download');
                  element.click();
                },
              },
              {
                id: 'restore-space',
                label: ['upload all docs in space label', { ns: 'composer' }],
                icon: Upload,
                invoke: async () => {
                  if (splitViewPlugin?.provides.splitView) {
                    splitViewPlugin.provides.splitView.dialogOpen = true;
                    splitViewPlugin.provides.splitView.dialogContent = ['dxos:space/RestoreSpaceDialog', space];
                  }
                },
              },
            ],
          };

          let attributes = nodeAttributes.get(id);
          if (!attributes) {
            attributes = createStore<{ hidden: boolean }>();
            const handle = createSubscription(() => {
              if (!identity) {
                return;
              }
              attributes!.hidden = space.properties.members?.[identity.identityKey.toHex()]?.hidden === true;
            });
            handle.update([space.properties]);
            subscriptions.add(handle.unsubscribe);
          }
          attributes.disabled = space.state.get() !== SpaceState.READY;
          attributes.error = space.state.get() === SpaceState.ERROR;
          node.attributes = attributes ?? {};

          let children = rootObjects.get(id);
          if (!children) {
            const query = space.db.query(Document.filter());
            const objects = createStore(objectsToGraphNodes(node, query.objects));
            subscriptions.add(
              query.subscribe((query) => {
                objects.splice(0, objects.length, ...objectsToGraphNodes(node, query.objects));
              }),
            );

            children = objects;
            rootObjects.set(id, children);
          }
          node.children = children ?? [];

          return node;
        }),
      );
    });

    subscriptions.add(subscription.unsubscribe);

    if (!treeViewPlugin) {
      return;
    }

    const treeView = treeViewPlugin.provides.treeView;

    if (client.services instanceof IFrameClientServicesProxy || client.services instanceof IFrameClientServicesHost) {
      client.services.joinedSpace.on((spaceKey) => {
        treeView.selected = [getSpaceId(spaceKey)];
      });
    }

    const nodeHandle = createSubscription(() => {
      const [prefixedId] = treeView.selected ?? [''];
      if (prefixedId) {
        const [_prefix, id] = prefixedId?.split('/');
        if (
          client.services instanceof IFrameClientServicesProxy ||
          client.services instanceof IFrameClientServicesHost
        ) {
          client.services.setSpaceProvider(() => PublicKey.safeFrom(id));
        }
      }
    });
    nodeHandle.update([treeView]);
    subscriptions.add(nodeHandle.unsubscribe);
  },
  unload: async () => {
    subscriptions.clear();
  },
  provides: {
    router: {
      routes: () => [
        {
          path: '/dxos/space/:spaceId',
          element: (
            <Surface
              component='dxos:SplitViewPlugin/SplitView'
              surfaces={{
                sidebar: { component: 'dxos:TreeViewPlugin/TreeView' },
                main: { component: 'dxos:space/SpaceMain' },
              }}
            />
          ),
        },
        {
          path: '/dxos/space/:spaceId/:objectId',
          element: (
            <Surface
              component='dxos:SplitViewPlugin/SplitView'
              surfaces={{
                sidebar: { component: 'dxos:TreeViewPlugin/TreeView' },
                main: { component: 'dxos:space/SpaceMain' },
              }}
            />
          ),
        },
      ],
      current: (params): string[] | null => {
        const spaceKey = PublicKey.safeFrom(params.spaceId);
        const spaceId = spaceKey && getSpaceId(spaceKey);
        if (spaceId && params.objectId) {
          return [spaceId, params.objectId];
        } else if (spaceId) {
          return [spaceId];
        } else {
          return null;
        }
      },
      next: (path, params): string[] | null => {
        if (!path.startsWith('/dxos/space/')) {
          return null;
        }

        return SpacePlugin.provides!.router.current!(params);
      },
    },
    component: (datum, role) => {
      switch (role) {
        case 'main':
          switch (true) {
            case isSpace(datum):
              return SpaceMainEmpty;
            default:
              return null;
          }
        case 'treeitem':
          switch (true) {
            case isSpace(datum?.data):
              return SpaceTreeItem;
            default:
              return null;
          }
        case 'tree--empty':
          switch (true) {
            case datum === 'root':
              return EmptyTree;
            case isSpace(datum?.data):
              return EmptySpace;
            default:
              return null;
          }
        case 'dialog':
          if (Array.isArray(datum)) {
            switch (datum[0]) {
              case 'dxos:space/RenameSpaceDialog':
                return DialogRenameSpace;
              case 'dxos:space/RestoreSpaceDialog':
                return DialogRestoreSpace;
              default:
                return null;
            }
          } else {
            return null;
          }
        default:
          return null;
      }
    },
    components: {
      SpaceMain,
    },
    graph: {
      nodes: () => nodes,
      actions: (plugins) => {
        const clientPlugin = findPlugin<ClientPluginProvides>(plugins, 'dxos:ClientPlugin');
        const splitViewPlugin = findPlugin<SplitViewProvides>(plugins, 'dxos:SplitViewPlugin');
        if (!clientPlugin) {
          return [];
        }

        // TODO(wittjosiah): Disable if no identity.
        return [
          {
            id: 'create-space',
            testId: 'spacePlugin.createSpace',
            label: ['create space label', { ns: 'os' }],
            icon: Planet,
            invoke: async () => {
              await clientPlugin.provides.client.createSpace();
            },
          },
          {
            id: 'join-space',
            testId: 'spacePlugin.joinSpace',
            label: ['join space label', { ns: 'os' }],
            icon: Intersect,
            invoke: async () => {
              await clientPlugin.provides.setLayout(ShellLayout.JOIN_SPACE);
            },
          },
          {
            // TODO(wittjosiah): Move to SplitViewPlugin.
            id: 'close-sidebar',
            label: ['close sidebar label', { ns: 'os' }],
            icon: ArrowLineLeft,
            invoke: async () => {
              if (splitViewPlugin?.provides.splitView) {
                splitViewPlugin.provides.splitView.sidebarOpen = false;
              }
            },
          },
        ];
      },
    },
  },
});