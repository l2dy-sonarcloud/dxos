//
// Copyright 2025 DXOS.org
//

import React, { useMemo } from 'react';

import { useLayout } from '@dxos/app-framework';
import { type Node } from '@dxos/app-graph';
import { toLocalizedString, useTranslation } from '@dxos/react-ui';
import { Tree } from '@dxos/react-ui-list';
import { Tabs } from '@dxos/react-ui-tabs';

import { useNavTreeContext } from './NavTreeContext';
import { NavTreeItemColumns } from './NavTreeItemColumns';
import { useLoadDescendents } from '../hooks';
import { NAVTREE_PLUGIN } from '../meta';
import { l0ItemType } from '../util';

type L1PanelProps = { item: Node<any>; path: string[]; currentItemId: string };

const L1Panel = ({ item, path, currentItemId }: L1PanelProps) => {
  const layout = useLayout();
  const navTreeContext = useNavTreeContext();
  const { t } = useTranslation(NAVTREE_PLUGIN);
  return (
    <Tabs.Tabpanel
      key={item.id}
      value={item.id}
      classNames={[
        'absolute inset-block-0 inline-end-0 is-[calc(100%-var(--l0-size))] lg:is-[--l1-size] grid-cols-1 grid-rows-[var(--rail-size)_1fr]',
        item.id === currentItemId && 'grid',
      ]}
      tabIndex={-1}
      {...(!layout.sidebarOpen && { inert: 'true' })}
    >
      {item.id === currentItemId && (
        <>
          <h2 className='flex items-center border-be border-separator pis-4 app-drag'>
            <span className='flex-1 truncate cursor-default'>{toLocalizedString(item.properties.label, t)}</span>
            <NavTreeItemColumns path={path} item={item} open />
          </h2>
          <div role='none' className='overflow-y-auto'>
            <Tree
              {...navTreeContext}
              id={item.id}
              root={item}
              path={path}
              levelOffset={5}
              draggable
              gridTemplateColumns='[tree-row-start] 1fr min-content min-content min-content [tree-row-end]'
              renderColumns={NavTreeItemColumns}
            />
          </div>
        </>
      )}
    </Tabs.Tabpanel>
  );
};

const L1PanelCollection = ({ item, path, currentItemId }: L1PanelProps) => {
  const { getItems } = useNavTreeContext();
  useLoadDescendents(item);
  const collectionItems = getItems(item);
  const groupPath = useMemo(() => [...path, item.id], [item.id, path]);
  return (
    <>
      {collectionItems
        .filter((item) => l0ItemType(item) === 'tab')
        .map((item) => (
          <L1Panel key={item.id} item={item} path={groupPath} currentItemId={currentItemId} />
        ))}
    </>
  );
};

export const L1Panels = ({
  topLevelItems,
  path,
  currentItemId,
}: {
  topLevelItems: Node<any>[];
  path: string[];
  currentItemId: string;
}) => {
  return (
    <>
      {topLevelItems.map((item) => {
        const type = l0ItemType(item);
        switch (type) {
          case 'collection':
            return <L1PanelCollection key={item.id} item={item} path={path} currentItemId={currentItemId} />;
          case 'tab':
            return <L1Panel key={item.id} item={item} path={path} currentItemId={currentItemId} />;
          default:
            return null;
        }
      })}
    </>
  );
};
