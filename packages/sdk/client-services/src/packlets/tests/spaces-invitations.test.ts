//
// Copyright 2021 DXOS.org
//

import { expect } from 'chai';

import { Trigger } from '@dxos/async';
import { Client, Invitation } from '@dxos/client';
import { raise } from '@dxos/debug';
import { log } from '@dxos/log';
import { describe, test, afterTest } from '@dxos/test';

import { TestBuilder, testSpace } from '../testing';

describe('Spaces/invitations', () => {
  test('creates a space and invites a peer', async () => {
    const testBuilder = new TestBuilder();

    const client1 = new Client({ services: testBuilder.createLocal() });
    const client2 = new Client({ services: testBuilder.createLocal() });
    await client1.initialize();
    await client2.initialize();
    await client1.halo.createIdentity({ displayName: 'Peer 1' });
    await client2.halo.createIdentity({ displayName: 'Peer 2' });

    log('initialized');

    afterTest(() => Promise.all([client1.destroy()]));
    afterTest(() => Promise.all([client2.destroy()]));

    const success1 = new Trigger<Invitation>();
    const success2 = new Trigger<Invitation>();

    const space1 = await client1.echo.createSpace();
    log('createSpace', { key: space1.key });
    const observable1 = space1.createInvitation({ type: Invitation.Type.INTERACTIVE_TESTING });

    observable1.subscribe({
      onConnecting: (invitation) => {
        const observable2 = client2.echo.acceptInvitation(invitation);
        observable2.subscribe({
          onSuccess: (invitation: Invitation) => {
            success2.wake(invitation);
          },
          onError: (err: Error) => raise(err)
        });
      },
      onSuccess: (invitation) => {
        log('onSuccess');
        success1.wake(invitation);
      },
      onError: (err) => raise(err)
    });

    const [invitation1, invitation2] = await Promise.all([success1.wait(), success2.wait()]);
    expect(invitation1.spaceKey).to.deep.eq(invitation2.spaceKey);
    expect(invitation1.state).to.eq(Invitation.State.SUCCESS);

    {
      const space = client2.echo.getSpace(invitation2.spaceKey!)!;
      await testSpace(space.internal.db);
    }
  });
});