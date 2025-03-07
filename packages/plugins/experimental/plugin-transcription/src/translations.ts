//
// Copyright 2023 DXOS.org
//

import { TRANSCRIPTION_PLUGIN } from './meta';
import { TranscriptType } from './types';

export default [
  {
    'en-US': {
      [TranscriptType.typename]: {
        'typename label': 'Transcript',
      },
      [TRANSCRIPTION_PLUGIN]: {
        'plugin name': 'Transcription',
        'calls label': 'Transcript',
        'calls panel label': 'Transcription',
        'create calls label': 'Create transcription',
        'delete calls label': 'Delete',

        'delete button': 'Delete',
        'bookmark button': 'Bookmark',
      },
    },
  },
];
