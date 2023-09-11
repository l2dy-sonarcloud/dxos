//
// Copyright 2023 DXOS.org
//

import React from 'react';

import '@dxosTheme';
import { StorybookDialog } from '../StorybookDialog';
import { Action } from './Action';
import { Actions } from './Actions';
import { Heading } from './Heading';
import { Label } from './Label';

export default {
  component: StorybookDialog,
  actions: { argTypesRegex: '^on.*' },
};

export const Normal = (props: any) => {
  return (
    <StorybookDialog {...props}>
      <Heading title='Panel heading' titleId='panel-heading'></Heading>
      <div className='p-3 text-center'>
        <Label>Lorem ipsum</Label>
        <Actions>
          <Action variant='ghost'>Ghost</Action>
          <Action>Normal</Action>
        </Actions>
      </div>
    </StorybookDialog>
  );
};

export const Primary = (props: any) => {
  return (
    <StorybookDialog {...props}>
      <Heading title='Panel heading' titleId='panel-heading'></Heading>
      <div className='p-3 text-center'>
        <Label>Lorem ipsum</Label>
        <Actions>
          <Action variant='ghost'>Ghost</Action>
          <Action variant='primary'>Primary</Action>
        </Actions>
      </div>
    </StorybookDialog>
  );
};