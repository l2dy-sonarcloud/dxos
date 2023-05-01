//
// Copyright 2023 DXOS.org
//

import { ComponentFunction } from '@dxos/aurora-types';

import { mx } from '../../util';
import { dataDisabled, subduedFocus } from '../fragments';

export const dropdownMenuItem: ComponentFunction<{}> = (_styleProps, ...options) =>
  mx(
    'flex cursor-pointer select-none items-center rounded-md px-2 py-2 text-sm',
    'text-neutral-900 data-[highlighted]:bg-neutral-50 dark:text-neutral-100 dark:data-[highlighted]:bg-neutral-900',
    subduedFocus,
    dataDisabled,
    ...options
  );