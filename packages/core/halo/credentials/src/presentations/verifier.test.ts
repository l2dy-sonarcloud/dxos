//
// Copyright 2022 DXOS.org
//

import { describe, expect, test } from 'vitest';

import { randomBytes } from '@dxos/crypto';
import { Keyring } from '@dxos/keyring';
import { PublicKey } from '@dxos/keys';
import { type Chain, SpaceMember } from '@dxos/protocols/proto/dxos/halo/credentials';

import { signPresentation } from './presentation';
import { verifyPresentation, verifyPresentationSignature } from './verifier';
import { createCredential } from '../credentials';

describe('presentation verifier', () => {
  describe('chain', () => {
    test('pass', async () => {
      const keyring = new Keyring();
      const identity = await keyring.createKey();
      const device = await keyring.createKey();
      const issuer = await keyring.createKey();
      const spaceKey = PublicKey.random();

      const chain: Chain = {
        credential: await createCredential({
          assertion: {
            '@type': 'dxos.halo.credentials.AuthorizedDevice',
            deviceKey: device,
            identityKey: identity,
          },
          subject: device,
          issuer: identity,
          signer: keyring,
        }),
      };

      const credential = await createCredential({
        assertion: {
          '@type': 'dxos.halo.credentials.SpaceMember',
          spaceKey,
          role: SpaceMember.Role.ADMIN,
          genesisFeedKey: PublicKey.random(),
        },
        issuer,
        signer: keyring,
        subject: identity,
      });

      const presentation = await signPresentation({
        presentation: { credentials: [credential] },
        signer: keyring,
        signerKey: device,
        chain,
        nonce: randomBytes(32),
      });

      expect(await verifyPresentation(presentation)).to.deep.equal({ kind: 'pass' });
    });

    test('service access exercise by a device', async () => {
      const keyring = new Keyring();
      const serviceProvider = await keyring.createKey();
      const identity = await keyring.createKey();
      const device = await keyring.createKey();

      const serviceAccessCredential = await createCredential({
        assertion: {
          '@type': 'dxos.halo.credentials.ServiceAccess',
          serverName: 'hub.dxos.network',
          serverKey: serviceProvider,
          identityKey: identity,
          capabilities: ['beta'],
        },
        subject: identity,
        issuer: serviceProvider,
        signer: keyring,
      });

      const deviceAuthorization = await createCredential({
        assertion: {
          '@type': 'dxos.halo.credentials.AuthorizedDevice',
          deviceKey: device,
          identityKey: identity,
        },
        subject: device,
        issuer: identity,
        signer: keyring,
      });

      const presentation = await signPresentation({
        presentation: { credentials: [serviceAccessCredential] },
        signer: keyring,
        signerKey: device,
        chain: { credential: deviceAuthorization },
        nonce: randomBytes(32),
      });

      expect(await verifyPresentation(presentation)).to.deep.equal({ kind: 'pass' });
    });

    test('pass with empty parentIds', async () => {
      const keyring = new Keyring();
      const identity = await keyring.createKey();
      const device = await keyring.createKey();
      const issuer = await keyring.createKey();
      const spaceKey = PublicKey.random();

      const chain: Chain = {
        credential: await createCredential({
          assertion: {
            '@type': 'dxos.halo.credentials.AuthorizedDevice',
            deviceKey: device,
            identityKey: identity,
          },
          subject: device,
          issuer: identity,
          signer: keyring,
          parentCredentialIds: [],
        }),
      };

      const credential = await createCredential({
        assertion: {
          '@type': 'dxos.halo.credentials.SpaceMember',
          spaceKey,
          role: SpaceMember.Role.ADMIN,
          genesisFeedKey: PublicKey.random(),
        },
        issuer,
        signer: keyring,
        subject: identity,
        parentCredentialIds: [],
      });

      const presentation = await signPresentation({
        presentation: { credentials: [credential] },
        signer: keyring,
        signerKey: device,
        chain,
        nonce: randomBytes(32),
      });
      expect(credential.parentCredentialIds).not.to.be.undefined;
      expect(await verifyPresentation(presentation)).to.deep.equal({ kind: 'pass' });
    });

    test('fail', async () => {
      const keyring = new Keyring();
      const identity = await keyring.createKey();
      const device = await keyring.createKey();
      const spaceKey = PublicKey.random();
      const subject = PublicKey.random();

      const chain: Chain = {
        credential: await createCredential({
          assertion: {
            '@type': 'dxos.halo.credentials.AuthorizedDevice',
            deviceKey: device,
            identityKey: identity,
          },
          subject: device,
          issuer: identity,
          signer: keyring,
        }),
      };

      const credential = await createCredential({
        assertion: {
          '@type': 'dxos.halo.credentials.SpaceMember',
          spaceKey,
          role: SpaceMember.Role.ADMIN,
          genesisFeedKey: PublicKey.random(),
        },
        issuer: identity,
        signer: keyring,
        subject,
        signingKey: device,
        chain,
      });

      const presentation = await signPresentation({
        presentation: { credentials: [credential] },
        signer: keyring,
        signerKey: device,
        chain: {
          ...chain,
          credential: { ...chain.credential, proof: { ...chain.credential.proof, signer: PublicKey.random() } as any },
        },

        nonce: randomBytes(32),
      });

      expect(await verifyPresentation(presentation)).to.deep.contain({ kind: 'fail' });
    });
  });

  describe('signature', () => {
    test('pass', async () => {
      const keyring = new Keyring();
      const signingKey = await keyring.createKey();
      const spaceKey = PublicKey.random();
      const subject = PublicKey.random();

      const credential = await createCredential({
        assertion: {
          '@type': 'dxos.halo.credentials.SpaceMember',
          spaceKey,
          role: SpaceMember.Role.ADMIN,
          genesisFeedKey: PublicKey.random(),
        },
        issuer: signingKey,
        signer: keyring,
        subject,
      });

      const presentation = await signPresentation({
        presentation: { credentials: [credential] },
        signer: keyring,
        signerKey: signingKey,
        nonce: randomBytes(32),
      });

      expect(await verifyPresentationSignature(presentation, presentation.proofs![0])).to.deep.equal({ kind: 'pass' });
    });

    test('fail', async () => {
      const keyring = new Keyring();
      const signingKey = await keyring.createKey();
      const spaceKey = PublicKey.random();
      const subject = PublicKey.random();

      const credential = await createCredential({
        assertion: {
          '@type': 'dxos.halo.credentials.SpaceMember',
          spaceKey,
          role: SpaceMember.Role.ADMIN,
          genesisFeedKey: PublicKey.random(),
        },
        issuer: signingKey,
        signer: keyring,
        subject,
      });

      const presentation = await signPresentation({
        presentation: { credentials: [credential] },
        signer: keyring,
        signerKey: signingKey,
        nonce: randomBytes(32),
      });

      expect(
        await verifyPresentationSignature(presentation, { ...presentation.proofs![0], creationDate: new Date(0) }),
      ).to.deep.contain({
        kind: 'fail',
      });
    });
  });
});
