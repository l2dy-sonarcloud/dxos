//
// Copyright 2024 DXOS.org
//

import React, { useCallback, useMemo, useState } from 'react';

import { ComputeGraph } from '@dxos/conductor';
import { type ReactiveObject } from '@dxos/live-object';
import { DocumentType } from '@dxos/plugin-markdown/types';
import { SheetType } from '@dxos/plugin-sheet/types';
import { DiagramType } from '@dxos/plugin-sketch/types';
import { useClient } from '@dxos/react-client';
import { getTypename, type Space } from '@dxos/react-client/echo';
import { IconButton, Input, Toolbar, useAsyncEffect } from '@dxos/react-ui';
import { SyntaxHighlighter } from '@dxos/react-ui-syntax-highlighter';
import { Testing } from '@dxos/schema/testing';
import { jsonKeyReplacer, sortKeys } from '@dxos/util';

import { type ObjectGenerator, createGenerator, staticGenerators } from './ObjectGenerator';
import { SchemaTable } from './SchemaTable';
import { presets } from './presets';

export type SpaceGeneratorProps = {
  space: Space;
  onCreateObjects?: (objects: ReactiveObject<any>[]) => void;
};

export const SpaceGenerator = ({ space, onCreateObjects }: SpaceGeneratorProps) => {
  const client = useClient();
  const staticTypes = [DocumentType, DiagramType, SheetType, ComputeGraph]; // TODO(burdon): Make extensible.
  const mutableTypes = [Testing.OrgType, Testing.ProjectType, Testing.ContactType, Testing.EmailType];
  const [count, setCount] = useState(1);
  const [info, setInfo] = useState<any>({});

  // Create type generators.
  const typeMap = useMemo(() => {
    client.addTypes([...staticTypes, ...presets.schemas]);
    const mutableGenerators = new Map<string, ObjectGenerator<any>>(
      mutableTypes.map((type) => [type.typename, createGenerator(type as any)]),
    );

    return new Map([...staticGenerators, ...presets.items, ...mutableGenerators]);
  }, [client, mutableTypes]);

  // Query space to get info.
  const updateInfo = async () => {
    // Create schema map.
    const echoSchema = await space.db.schemaRegistry.query().run();
    const staticSchema = space.db.graph.schemaRegistry.schemas;

    // Create object map.
    const { objects } = await space.db.query().run();
    const objectMap = sortKeys(
      objects.reduce<Record<string, number>>((map, obj) => {
        const type = getTypename(obj);
        if (type) {
          const count = map[type] ?? 0;
          map[type] = count + 1;
        }
        return map;
      }, {}),
    );

    setInfo({
      schema: {
        static: staticSchema.length,
        mutable: echoSchema.length,
      },
      objects: objectMap,
    });
  };

  useAsyncEffect(updateInfo, [space]);

  const handleCreateData = useCallback(
    async (typename: string) => {
      const constructor = typeMap.get(typename);
      if (constructor) {
        // TODO(burdon): Input to specify number of objects.
        await constructor(space, count, onCreateObjects);
        await updateInfo();
      }
    },
    [typeMap, count],
  );

  return (
    <div role='none' className='flex flex-col divide-y divide-separator'>
      <Toolbar.Root classNames='p-1'>
        <IconButton icon='ph--arrow-clockwise--regular' iconOnly label='Refresh' onClick={updateInfo} />
        <Toolbar.Separator variant='gap' />
        <div className='flex'>
          <Input.Root>
            <Input.TextInput
              type='number'
              min={1}
              max={100}
              placeholder={'Count'}
              classNames='w-[80px]'
              value={count}
              onChange={(ev) => setCount(parseInt(ev.target.value))}
            />
          </Input.Root>
        </div>
      </Toolbar.Root>

      <SchemaTable types={staticTypes} objects={info.objects} label='Static Types' onClick={handleCreateData} />
      <SchemaTable types={mutableTypes} objects={info.objects} label='Mutable Types' onClick={handleCreateData} />
      <SchemaTable types={presets.types} objects={info.objects} label='Presets' onClick={handleCreateData} />

      <SyntaxHighlighter classNames='flex text-xs' language='json'>
        {JSON.stringify({ space, ...info }, jsonKeyReplacer({ truncate: true }), 2)}
      </SyntaxHighlighter>
    </div>
  );
};
