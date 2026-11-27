import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { verifyFirebaseIdToken } from './middleware/auth.js';
import { VertexAIVectorSearchService } from './services/vectorSearch.js';
import { SemanticSearchEngine } from './services/semanticSearch.js';

function base64Url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf-8') : input;
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function createSignedJwt(
  payload: Record<string, any>,
  privateKey: crypto.KeyObject,
  kid = 'test-kid-1'
): string {
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid }));
  const body = base64Url(JSON.stringify(payload));
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(`${header}.${body}`);
  const sig = base64Url(signer.sign(privateKey));
  return `${header}.${body}.${sig}`;
}

async function runTests() {
  // 1. Firebase ID Token RS256 verification
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const publicPem = publicKey.export({ type: 'spki', format: 'pem' }) as string;
  const certs = { 'test-kid-1': publicPem };
  const now = Math.floor(Date.now() / 1000);

  const validJwt = createSignedJwt(
    {
      sub: 'user_abc_123',
      aud: 'pixsort-62b7b',
      iss: 'https://securetoken.google.com/pixsort-62b7b',
      iat: now - 10,
      exp: now + 3600,
    },
    privateKey
  );
  const verified = await verifyFirebaseIdToken(validJwt, certs, 'pixsort-62b7b');
  assert.equal(verified.sub, 'user_abc_123');

  // Expired token must fail
  const expiredJwt = createSignedJwt(
    {
      sub: 'user_abc_123',
      aud: 'pixsort-62b7b',
      iss: 'https://securetoken.google.com/pixsort-62b7b',
      iat: now - 7200,
      exp: now - 10,
    },
    privateKey
  );
  await assert.rejects(() => verifyFirebaseIdToken(expiredJwt, certs, 'pixsort-62b7b'), /Token expired/);

  // Wrong audience must fail
  const wrongAudJwt = createSignedJwt(
    {
      sub: 'user_abc_123',
      aud: 'other-project',
      iss: 'https://securetoken.google.com/pixsort-62b7b',
      iat: now - 10,
      exp: now + 3600,
    },
    privateKey
  );
  await assert.rejects(() => verifyFirebaseIdToken(wrongAudJwt, certs, 'pixsort-62b7b'), /Invalid token audience/);

  // 2. Vector dimension isolation & user scoping
  const vs = new VertexAIVectorSearchService();
  await vs.upsertVector({
    id: 'p1',
    userId: 'u1',
    vector: [1, 0, 0],
    metadata: { dateTaken: '2026-07-01', location: 'Goa', isFavorite: false, albumIds: [], isTrash: false },
  });
  await vs.upsertVector({
    id: 'p2_wrong_dim',
    userId: 'u1',
    vector: [1, 0, 0, 0],
    metadata: { dateTaken: '2026-07-01', location: 'Goa', isFavorite: false, albumIds: [], isTrash: false },
  });
  await vs.upsertVector({
    id: 'p3_other_user',
    userId: 'u2',
    vector: [1, 0, 0],
    metadata: { dateTaken: '2026-07-01', location: 'Goa', isFavorite: false, albumIds: [], isTrash: false },
  });

  const matches = await vs.queryNearestNeighbors([1, 0, 0], { userId: 'u1' }, 10);
  assert.deepEqual(
    matches.map((m) => m.id),
    ['p1'],
    'Should only match same user and exact vector dimension'
  );

  // 3. SemanticSearchEngine dynamic year parsing
  const sse = new SemanticSearchEngine();
  const intent = sse.parseIntent('beach photos in July');
  assert.equal(intent.dateFilter, `${new Date().getFullYear()}-07`);

  const explicitIntent = sse.parseIntent('beach photos in July 2024');
  assert.equal(explicitIntent.dateFilter, '2024-07');

  console.log('ALL_VERIFICATION_CHECKS_PASSED');
  process.exit(0);
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
