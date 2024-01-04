//
// Copyright 2023 DXOS.org
//

import { DotOutline } from '@phosphor-icons/react';
import React, { useMemo, useRef } from 'react';

import { type Action, type Graph, type Label } from '@dxos/app-graph';
import { Keyboard, keySymbols } from '@dxos/keyboard';
import { Button, Dialog, useTranslation } from '@dxos/react-ui';
import { SearchList } from '@dxos/react-ui-searchlist';
import { descriptionText, getSize, mx } from '@dxos/react-ui-theme';

import { NAVTREE_PLUGIN } from '../meta';

// TODO(wittjosiah): This probably deserves its own plugin but for now it lives here w/ other navigation UI.
export const CommandsDialogContent = ({ graph }: { graph?: Graph }) => {
  const { t } = useTranslation(NAVTREE_PLUGIN);

  // TODO(burdon): Factor out.
  // TODO(burdon): How to access all translations across plugins?
  const toString = (label: Label) => (Array.isArray(label) ? t(...label) : label);

  // Traverse graph.
  // TODO(burdon): Factor out commonality with shortcut dialog.
  const actions = useMemo(() => {
    // TODO(burdon): Get from navtree (not keyboard).
    const current = Keyboard.singleton.getCurrentContext();
    const actionMap = new Set<string>();
    const actions: Action[] = [];
    graph?.traverse({
      visitor: (node, path) => {
        if (current.startsWith(path.join('/'))) {
          node.actions.forEach((action) => {
            if (!actionMap.has(action.id)) {
              actionMap.add(action.id);
              actions.push(action);
            }
          });
        }
      },
    });

    actions.sort(({ label: a }, { label: b }) => {
      return toString(a)?.toLowerCase().localeCompare(toString(b)?.toLowerCase());
    });

    // console.log(JSON.stringify(actions, undefined, 2));
    return actions;
  }, [graph]);

  // TODO(burdon): Remove.
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog.Content classNames={['md:max-is-[30rem] overflow-hidden']}>
      <Dialog.Title>{t('commands dialog title', { ns: NAVTREE_PLUGIN })}</Dialog.Title>

      {/* TODO(burdon): BUG: Overscrolls container. */}
      <SearchList.Root label={t('commandlist input placeholder')} classNames='flex flex-col grow overflow-hidden my-2'>
        <SearchList.Input placeholder={t('commandlist input placeholder')} classNames={mx('px-1 my-2')} />
        <SearchList.Content classNames={['max-bs-[30rem] overflow-auto']}>
          {actions?.map((action) => {
            const label = toString(action.label);
            const Icon = action.icon ?? DotOutline;
            return (
              <SearchList.Item
                value={label}
                key={action.id}
                onSelect={() => {
                  if (action.properties.disabled) {
                    return;
                  }

                  // TODO(burdon): Remove hack to close dialog (via hook?)
                  buttonRef.current?.click();
                  setTimeout(() => {
                    void action.invoke();
                  });
                }}
                classNames='flex items-center gap-2'
                disabled={action.properties.disabled}
                {...(action.properties?.testId && { 'data-testid': action.properties.testId })}
              >
                <Icon className={mx(getSize(4), 'shrink-0', !action.icon && 'invisible')} />
                <span className='grow truncate'>{label}</span>
                {action.keyBinding && (
                  <span className={mx('shrink-0', descriptionText)}>{keySymbols(action.keyBinding).join('')}</span>
                )}
              </SearchList.Item>
            );
          })}
        </SearchList.Content>
      </SearchList.Root>

      <Dialog.Close asChild>
        <Button ref={buttonRef} variant='primary' classNames='mbs-2'>
          {t('close label', { ns: 'os' })}
        </Button>
      </Dialog.Close>
    </Dialog.Content>
  );
};