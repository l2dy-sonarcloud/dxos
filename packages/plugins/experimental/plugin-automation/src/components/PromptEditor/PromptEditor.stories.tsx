//
// Copyright 2023 DXOS.org
//

import '@dxos-theme';

import { type Meta } from '@storybook/react';
import React, { useState } from 'react';

import { create, makeRef } from '@dxos/live-object';
import { useClient } from '@dxos/react-client';
import { withClientProvider } from '@dxos/react-client/testing';
import { withLayout, withTheme } from '@dxos/storybook-utils';

import { PromptEditor } from './PromptEditor';
import translations from '../../translations';
import { ChainPromptType, ChainType } from '../../types';

const template = [
  '# Comment',
  '',
  'You are a machine that is an expert chess player.',
  'The move history of the current game is: {history}',
  'If asked to suggest a move explain why it is a good move.',
  '',
  '---',
  '',
  '{input}',
].join('\n');

const Render = () => {
  const client = useClient();
  const [chain] = useState(() => {
    const space = client.spaces.default;
    return space.db.add(
      create(ChainType, {
        prompts: [makeRef(create(ChainPromptType, { command: 'test', template, inputs: [] }))],
      }),
    );
  });

  return (
    <div role='none' className='flex w-[350px] border border-separator overflow-hidden'>
      <PromptEditor prompt={chain.prompts![0]!.target!} />
    </div>
  );
};

export const Default = {};

const meta: Meta = {
  title: 'plugins/plugin-automation/PromptEditor',
  render: Render,
  decorators: [
    withClientProvider({ createIdentity: true, createSpace: true, types: [ChainType, ChainPromptType] }),
    withLayout({ fullscreen: true, classNames: 'flex justify-center m-2' }),
    withTheme,
  ],
  parameters: {
    translations,
  },
};

export default meta;
