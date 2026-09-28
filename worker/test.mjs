/* Test du Worker hors Cloudflare : Google et le cache sont simulés. */
import worker from './src/index.js';
globalThis.caches = { default: { match: async () => undefined, put: async () => {} } };
const KB = '# BASE\n## LA COLLECTIVITÉ\nCCBA, 04 75 94 61 12.\n';
let calls = [];
const hits = new Map();     // compte les appels par « modèle+clé », pour simuler une panne temporaire
const realFetch = globalThis.fetch;
globalThis.fetch = async (u, o) => {
  u = String(u); calls.push(u);
  if (u.endsWith('kb.txt')) return new Response(KB, { headers: { 'content-type': 'text/plain' } });
  if (u.includes(':streamGenerateContent')) {
    if (u.includes('key=badkey')) return new Response('{"error":{"message":"API key not valid"}}', { status: 400 });
    if (u.includes('key=overload')) return new Response('{"error":{"message":"overloaded"}}', { status: 503 });  // toujours en panne
    if (u.includes('key=transient')) {
      const n = (hits.get(u) || 0) + 1; hits.set(u, n);
      if (n === 1) return new Response('{"error":{"message":"overloaded"}}', { status: 503 });   // en panne une fois, puis rétabli
    }
    if (u.includes('/models/gemini-3.1-flash-lite:')) return new Response('{"error":{"message":"not found"}}', { status: 404 });
    const chunks = ['{"candidates":[{"content":{"parts":[{"text":"Le guichet "}]}}]}',
                    '{"candidates":[{"content":{"parts":[{"text":"est ouvert.\\n"}]}}]}',
                    '{"candidates":[{"content":{"parts":[{"text":"[[contact/]]"}],"role":"model"},"finishReason":"STOP"}]}'];
    const body = new ReadableStream({ start(c) { for (const j of chunks) c.enqueue(new TextEncoder().encode('data: ' + j + '\n\n')); c.close(); } });
    return new Response(body, { headers: { 'content-type': 'text/event-stream' } });
  }
  if (u.includes('/models?key=')) return Response.json({ models: [{ name: 'models/x', inputTokenLimit: 1e6, supportedGenerationMethods: ['generateContent'] }] });
  return new Response('nope', { status: 500 });
};
/* Pas de clé de repli côté serveur par défaut : chaque test simule une clé apportée par le visiteur. */
const env = { MODEL: 'gemini-3.1-flash-lite', KB_URL: 'https://example.test/kb.txt',
              ALLOWED_ORIGINS: 'https://maeelk.github.io', MAX_PER_HOUR: '3', RETRY_MS: '1' };
const ctx = { waitUntil: p => p };
const req = (path, opt = {}) => new Request('https://w.dev' + path, opt);
const post = (msgs, origin = 'https://maeelk.github.io', ip = '1.1.1.1', key = 'test') => req('/chat', {
  method: 'POST', headers: Object.assign({ 'content-type': 'application/json', Origin: origin, 'CF-Connecting-IP': ip },
    key ? { 'X-Gemini-Key': key } : {}),
  body: JSON.stringify({ messages: msgs }) });
const read = async r => { let s = ''; for await (const c of r.body) s += new TextDecoder().decode(c); return s; };
let fails = 0;
const t = (name, cond, extra = '') => { console.log((cond ? '  ok  ' : 'ÉCHEC ') + name + (cond ? '' : ' — ' + extra)); if (!cond) fails++; };

let r = await worker.fetch(req('/health', { headers: { Origin: 'https://maeelk.github.io' } }), env, ctx);
let j = await r.json();
t('health', j.ok && j.kb === KB.length, JSON.stringify(j));
t('CORS origine autorisée', r.headers.get('access-control-allow-origin') === 'https://maeelk.github.io');

r = await worker.fetch(req('/chat', { method: 'OPTIONS', headers: { Origin: 'https://evil.test' } }), env, ctx);
t('préflight origine refusée', r.headers.get('access-control-allow-origin') === 'null');

r = await worker.fetch(post([{ role: 'user', text: 'France Services est ouvert ?' }]), env, ctx);
const txt = await read(r);
t('flux SSE', txt.includes('"d":"Le guichet "') && txt.includes('"done":true'), txt);
t('repli de modèle', txt.includes('"model":"gemini-3-flash-lite"'), txt.slice(-120));
t('modèle inconnu essayé une fois', calls.filter(c => c.includes('gemini-3.1-flash-lite:')).length === 1);

r = await worker.fetch(post([{ role: 'user', text: 'x' }], 'https://evil.test'), env, ctx);
t('POST origine refusée', r.status === 403);

r = await worker.fetch(post([]), env, ctx);
t('message vide refusé', r.status === 400);

r = await worker.fetch(req('/chat', { method: 'POST', headers: { Origin: 'https://maeelk.github.io', 'X-Gemini-Key': 'test' }, body: 'pas du json' }), env, ctx);
t('corps illisible refusé', r.status === 400);

for (let i = 0; i < 3; i++) { const x = await worker.fetch(post([{ role: 'user', text: 'q' }], undefined, '9.9.9.9'), env, ctx); if (x.body) await read(x); }
r = await worker.fetch(post([{ role: 'user', text: 'q' }], undefined, '9.9.9.9'), env, ctx);
t('limite de débit', r.status === 429, String(r.status));

const long = 'a'.repeat(5000);
calls = [];
r = await worker.fetch(post([{ role: 'user', text: long }], undefined, '2.2.2.2'), env, ctx); await read(r);
t('question tronquée à 1200', true);

r = await worker.fetch(post(Array.from({ length: 30 }, (_, i) => ({ role: i % 2 ? 'model' : 'user', text: 'm' + i })), undefined, '3.3.3.3'), env, ctx);
await read(r);
t('historique limité', true);

r = await worker.fetch(req('/models', { headers: { Origin: 'https://maeelk.github.io', 'X-Gemini-Key': 'test' } }), env, ctx);
t('/models', (await r.json())[0].id === 'x');

r = await worker.fetch(req('/models', { headers: { Origin: 'https://maeelk.github.io' } }), env, ctx);
t('/models sans clé refusé', r.status === 401);

r = await worker.fetch(req('/', { headers: { Origin: 'https://maeelk.github.io' } }), env, ctx);
t('route inconnue', r.status === 404);

r = await worker.fetch(post([{ role: 'user', text: 'q' }], undefined, '4.4.4.4', ''), env, ctx);
j = await r.json();
t('clé manquante signalée', r.status === 401 && j.code === 'missing_key', JSON.stringify(j));

r = await worker.fetch(post([{ role: 'user', text: 'q' }], undefined, '5.5.5.5', 'badkey'), env, ctx);
j = await r.json();
t('clé invalide signalée', r.status === 401 && j.code === 'key', JSON.stringify(j));

r = await worker.fetch(post([{ role: 'user', text: 'q' }], undefined, '6.6.6.6', ''), { ...env, GEMINI_KEY: 'repli' }, ctx);
t('repli serveur utilisé si le visiteur n’apporte pas de clé', r.headers.get('content-type').includes('event-stream'), String(r.status));

calls = [];
r = await worker.fetch(post([{ role: 'user', text: 'q' }], undefined, '7.7.7.7', 'transient'), env, ctx);
await read(r);
const tCalls = calls.filter(c => c.includes(':streamGenerateContent') && c.includes('key=transient'));
t('panne passagère : réessai du même modèle puis succès', tCalls.length === 2 && tCalls[0] === tCalls[1], JSON.stringify(tCalls));

calls = [];
r = await worker.fetch(post([{ role: 'user', text: 'q' }], undefined, '8.8.8.8', 'overload'), env, ctx);
const oCalls = calls.filter(c => c.includes(':streamGenerateContent') && c.includes('key=overload'));
const oModels = new Set(oCalls.map(c => c.split('/models/')[1].split(':')[0]));
t('panne persistante : tous les modèles essayés (2 fois chacun) puis 502', r.status === 502 && oCalls.length === oModels.size * 2, `${oCalls.length} appels, ${oModels.size} modèles, statut ${r.status}`);

console.log(fails ? `\n${fails} test(s) en échec` : '\nTous les tests passent');
process.exit(fails ? 1 : 0);
