//
// Copyright 2023 DXOS.org
//

export * from './core-database';
export * from './object-core';
// TODO(wittjosiah): Vitest fails without explicit exports here.
export {
  type DecodedAutomergePrimaryValue,
  type DecodedAutomergeValue,
  type IDocHandle,
  type KeyPath,
  DocAccessor,
  createDocAccessor,
  isValidKeyPath,
} from './types';
