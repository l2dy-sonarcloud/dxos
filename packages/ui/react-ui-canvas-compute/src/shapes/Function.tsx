//
// Copyright 2024 DXOS.org
//

import React from 'react';

import { AnyOutput, FunctionInput } from '@dxos/conductor';
import { S } from '@dxos/echo-schema';
import { type ShapeComponentProps, type ShapeDef } from '@dxos/react-ui-canvas-editor';

import { createFunctionAnchors, FunctionBody, getHeight } from './common';
import { ComputeShape, createShape, type CreateShapeProps } from './defs';

export const FunctionShape = S.extend(
  ComputeShape,
  S.Struct({
    type: S.Literal('function'),
  }),
);

export type FunctionShape = S.Schema.Type<typeof FunctionShape>;

export type CreateFunctionProps = CreateShapeProps<FunctionShape>;

export const createFunction = (props: CreateFunctionProps) =>
  createShape<FunctionShape>({ type: 'function', size: { width: 192, height: getHeight(FunctionInput) }, ...props });

export const FunctionComponent = ({ shape }: ShapeComponentProps<FunctionShape>) => {
  return <FunctionBody shape={shape} inputSchema={FunctionInput} outputSchema={AnyOutput} />;
};

export const functionShape: ShapeDef<FunctionShape> = {
  type: 'function',
  name: 'Function',
  icon: 'ph--function--regular',
  component: FunctionComponent,
  createShape: createFunction,
  // TODO(burdon): Get dynamic schema.
  getAnchors: (shape) => createFunctionAnchors(shape, FunctionInput, AnyOutput),
};
