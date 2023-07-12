//
// Copyright 2023 DXOS.org
//

import '@dxosTheme';
import React from 'react';

import { ThemePlugin } from '@braneframe/plugin-theme';
import { PluginContextProvider } from '@dxos/react-surface';

import { DndPlugin } from '../DndPlugin';
import { DndPluginDefaultStoryPlugin } from './DndPluginDefaultStoryPlugin';
import { DndPluginDefaultStoryPluginA } from './DndPluginDefaultStoryPluginA';
import { DndPluginDefaultStoryPluginB } from './DndPluginDefaultStoryPluginB';

const DndSurfacesApp = () => (
  <PluginContextProvider
    plugins={[
      ThemePlugin(),
      DndPlugin(),
      DndPluginDefaultStoryPlugin(),
      DndPluginDefaultStoryPluginA(),
      DndPluginDefaultStoryPluginB(),
    ]}
  />
);

export default {
  component: DndSurfacesApp,
};

export const Default = {
  args: {},
};