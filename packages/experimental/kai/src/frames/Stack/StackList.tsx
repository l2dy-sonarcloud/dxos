//
// Copyright 2023 DXOS.org
//

import React from 'react';
import { useNavigate } from 'react-router-dom';

import { DocumentStack, Document } from '@dxos/kai-types';
import { useQuery } from '@dxos/react-client';

import { ObjectList } from '../../components';
import { createPath, useAppRouter } from '../../hooks';

export const StackList = () => {
  const navigate = useNavigate();
  const { space, frame, objectId } = useAppRouter();
  const objects = useQuery(space, DocumentStack.filter());
  if (!space || !frame) {
    return null;
  }

  return (
    <ObjectList<DocumentStack>
      frame={frame}
      objects={objects}
      selected={objectId}
      getTitle={(object) => object.title}
      setTitle={(object, title) => (object.title = title)}
      onSelect={(objectId) => navigate(createPath({ spaceKey: space.key, frame: frame?.module.id, objectId }))}
      onCreate={async () => {
        const stack = await space.db.add(new DocumentStack());
        const section = new DocumentStack.Section({ object: new Document() });
        stack.sections.push(section);
        return stack;
      }}
    />
  );
};

export default StackList;