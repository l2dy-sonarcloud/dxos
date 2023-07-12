//
// Copyright 2020 DXOS.org
//

import '@dxosTheme';

import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { ClientPlugin } from '@braneframe/plugin-client';
import { DrawingPlugin } from '@braneframe/plugin-drawing';
import { GraphPlugin } from '@braneframe/plugin-graph';
import { KanbanPlugin } from '@braneframe/plugin-kanban';
import { MarkdownPlugin } from '@braneframe/plugin-markdown';
import { SpacePlugin } from '@braneframe/plugin-space';
import { SplitViewPlugin } from '@braneframe/plugin-splitview';
import { StackPlugin } from '@braneframe/plugin-stack';
import { ThemePlugin } from '@braneframe/plugin-theme';
import { TreeViewPlugin } from '@braneframe/plugin-treeview';
import { UrlSyncPlugin } from '@braneframe/plugin-url-sync';
import { Config, Defaults } from '@dxos/config';
import { initializeAppTelemetry } from '@dxos/react-appkit/telemetry';
import { PluginContextProvider } from '@dxos/react-surface';

// TODO(burdon): Factor out from composer-app.
// import { LocalFilesPlugin, GithubPlugin } from './plugins';

void initializeAppTelemetry({ namespace: 'labs-app', config: new Config(Defaults()) });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PluginContextProvider
      plugins={[
        ThemePlugin(),
        ClientPlugin(),
        GraphPlugin(),
        TreeViewPlugin(),
        UrlSyncPlugin(),
        SplitViewPlugin(),
        SpacePlugin(),
        MarkdownPlugin(),
        StackPlugin(),
        // GithubPlugin(),
        // LocalFilesPlugin(),
        DrawingPlugin(),
        KanbanPlugin(),
      ]}
    />
  </StrictMode>,
);