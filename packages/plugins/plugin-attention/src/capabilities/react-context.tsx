//
// Copyright 2025 DXOS.org
//

import React, { type PropsWithChildren } from 'react';

import { Capabilities, contributes, useCapability } from '@dxos/app-framework';
import { RootAttentionProvider, SelectionProvider } from '@dxos/react-ui-attention';

import { AttentionCapabilities } from './capabilities';
import { ATTENTION_PLUGIN } from '../meta';

export default () =>
  contributes(Capabilities.ReactContext, {
    id: ATTENTION_PLUGIN,
    context: (props: PropsWithChildren) => {
      const attention = useCapability(AttentionCapabilities.Attention);
      const selection = useCapability(AttentionCapabilities.Selection);

      return (
        <RootAttentionProvider
          attention={attention}
          onChange={(nextAttended) => {
            // TODO(Zan): Workout why this was in deck plugin. It didn't seem to work?
            // if (layout.values.scrollIntoView && nextAttended.has(layout.values.scrollIntoView)) {
            //   layout.values.scrollIntoView = undefined;
            // }
          }}
        >
          <SelectionProvider selection={selection}>{props.children}</SelectionProvider>
        </RootAttentionProvider>
      );
    },
  });
