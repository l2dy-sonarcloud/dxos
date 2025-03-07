//
// Copyright 2023 DXOS.org
//

import React, { type PropsWithChildren } from 'react';

import { Clipboard, ElevationProvider, Tooltip, useThemeContext } from '@dxos/react-ui';

export type StorybookDialogProps = PropsWithChildren & {
  inOverlayLayout?: boolean;
};

// TODO(burdon): Move out of components.
export const StorybookDialog = (props: StorybookDialogProps) => {
  const { inOverlayLayout = false } = props;
  const { tx } = useThemeContext();
  return (
    <Tooltip.Provider>
      <ElevationProvider elevation='dialog'>
        <Clipboard.Provider>
          <div
            role='group'
            className={tx('dialog.content', 'dialog', { inOverlayLayout }, 'p-1', inOverlayLayout ? 'm-4' : '')}
          >
            {props.children}
          </div>
        </Clipboard.Provider>
      </ElevationProvider>
    </Tooltip.Provider>
  );
};
