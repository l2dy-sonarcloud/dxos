//
// Copyright 2023 DXOS.org
//

import { Invitation } from '@dxos/react-client/invitations';

/**
 * This map assigns a numeric value to invitation states to facilitate
 * more terse code which uses combinations of `>`, `<`, and `=` instead of
 * longer sequences of `===` and `||` predicates.
 */
export const invitationStatusValue = new Map<Invitation.State, number>([
  [Invitation.State.ERROR, -3],
  [Invitation.State.TIMEOUT, -2],
  [Invitation.State.CANCELLED, -1],
  [Invitation.State.INIT, 0],
  [Invitation.State.CONNECTING, 1],
  [Invitation.State.CONNECTED, 2],
  [Invitation.State.READY_FOR_AUTHENTICATION, 3],
  [Invitation.State.AUTHENTICATING, 4],
  [Invitation.State.SUCCESS, 5],
]);
