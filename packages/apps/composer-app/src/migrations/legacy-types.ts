//
// Copyright 2024 DXOS.org
//

import { EchoSchema, Expando, Ref, S, TypedObject } from '@dxos/echo-schema';

export class FolderType extends TypedObject({
  typename: 'braneframe.Folder',
  version: '0.1.0',
  skipTypenameFormatCheck: true,
})({
  name: S.optional(S.String),
  objects: S.mutable(S.Array(Ref(Expando))),
}) {}

export class SectionType extends TypedObject({
  typename: 'braneframe.Stack.Section',
  version: '0.1.0',
  skipTypenameFormatCheck: true,
})({
  object: Ref(Expando),
}) {}

export class StackType extends TypedObject({
  typename: 'braneframe.Stack',
  version: '0.1.0',
  skipTypenameFormatCheck: true,
})({
  title: S.optional(S.String),
  sections: S.mutable(S.Array(Ref(SectionType))),
}) {}

export class FileType extends TypedObject({
  typename: 'braneframe.File',
  version: '0.1.0',
  skipTypenameFormatCheck: true,
})({
  filename: S.String,
  type: S.String,
  timestamp: S.optional(S.String),
  title: S.optional(S.String),
  cid: S.optional(S.String),
}) {}

export class SketchType extends TypedObject({
  typename: 'braneframe.Sketch',
  version: '0.1.0',
  skipTypenameFormatCheck: true,
})({
  title: S.optional(S.String),
  data: Ref(Expando),
}) {}

//
// Documents
//

export class TextType extends TypedObject({
  typename: 'dxos.Text.v0',
  version: '0.1.0',
  skipTypenameFormatCheck: true,
})({
  content: S.String,
}) {}

const CommentSchema = S.mutable(
  S.Struct({
    thread: S.optional(Ref(Expando)),
    cursor: S.optional(S.String),
  }),
);

export class DocumentType extends TypedObject({
  typename: 'braneframe.Document',
  version: '0.1.0',
  skipTypenameFormatCheck: true,
})({
  title: S.optional(S.String),
  content: Ref(TextType),
  comments: S.optional(S.mutable(S.Array(CommentSchema))),
}) {}

//
// Tables
//

const TablePropSchema = S.partial(
  S.mutable(
    S.Struct({
      id: S.String,
      prop: S.String,
      label: S.String,
      ref: S.String,
      refProp: S.String,
      size: S.Number,
    }),
  ),
);

export class TableType extends TypedObject({
  typename: 'braneframe.Table',
  version: '0.1.0',
  skipTypenameFormatCheck: true,
})({
  title: S.String,
  schema: S.optional(Ref(EchoSchema)),
  props: S.mutable(S.Array(TablePropSchema)),
}) {}

//
// Threads
//

const RecipientSchema = S.mutable(
  S.Struct({
    identityKey: S.optional(S.String),
    email: S.optional(S.String),
    name: S.optional(S.String),
  }),
);

export interface RecipientType extends S.Schema.Type<typeof RecipientSchema> {}

const BlockSchema = S.Struct({
  timestamp: S.String,
  // TODO(burdon): Should not be a separate object.
  content: S.optional(Ref(TextType)),
  object: S.optional(Ref(Expando)),
});

export interface BlockType extends S.Schema.Type<typeof BlockSchema> {}

export class MessageType extends TypedObject({
  typename: 'braneframe.Message',
  version: '0.1.0',
  skipTypenameFormatCheck: true,
})({
  type: S.optional(S.String),
  date: S.optional(S.String),
  from: RecipientSchema,
  to: S.optional(S.Array(RecipientSchema)),
  cc: S.optional(S.Array(RecipientSchema)),
  subject: S.optional(S.String),
  blocks: S.mutable(S.Array(BlockSchema)),
  links: S.optional(S.Array(Ref(Expando))),
  read: S.optional(S.Boolean),
  context: S.optional(
    S.Struct({
      space: S.optional(S.String),
      schema: S.optional(S.String),
      object: S.optional(S.String),
    }),
  ),
}) {}

export class ThreadType extends TypedObject({
  typename: 'braneframe.Thread',
  version: '0.1.0',
  skipTypenameFormatCheck: true,
})({
  title: S.optional(S.String),
  messages: S.mutable(S.Array(Ref(MessageType))),
  context: S.optional(
    S.Struct({
      space: S.optional(S.String),
      schema: S.optional(S.String),
      object: S.optional(S.String),
    }),
  ),
}) {}
