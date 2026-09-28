/**
 * CCBA — Worker « Aube », l'assistant du site de la Communauté de Communes du Bassin d'Aubenas.
 *
 * Rôle : relayer les questions des usagers vers l'API Google Gemini. Chaque visiteur apporte sa
 * propre clé API Gemini (gratuite, obtenue sur aistudio.google.com/apikey) : le Worker ne stocke
 * ni ne journalise cette clé, il la transmet telle quelle à Google pour la durée de la requête.
 * Elle voyage dans l'en-tête `X-Gemini-Key`, jamais dans l'URL ni dans le corps journalisable.
 * La base de connaissances (assets/data/kb.txt, générée à chaque mise en ligne du site) est
 * téléchargée par le Worker, mise en cache et placée dans le prompt système : le modèle ne répond
 * donc qu'avec le contenu réellement publié, et suit le site sans redéploiement du Worker.
 *
 * Configuration (wrangler.toml) :
 *   MODEL             var      modèle préféré ; repli automatique sur les modèles voisins
 *   KB_URL            var      adresse de la base de connaissances
 *   ALLOWED_ORIGINS   var      origines autorisées, séparées par des virgules
 *   MAX_PER_HOUR      var      questions par adresse IP et par heure (défaut 40)
 *   GEMINI_KEY        secret   optionnel : clé de repli côté serveur, si un jour on en veut une
 *                              (wrangler secret put GEMINI_KEY) — sinon chaque visiteur apporte
 *                              la sienne et ce secret peut rester absent.
 *
 * Points d'entrée :
 *   POST /chat     { messages:[...] }, en-tête X-Gemini-Key  → réponse en flux (SSE)
 *   GET  /health   état du Worker, modèle utilisé, taille de la base
 *   GET  /models   modèles disponibles pour une clé donnée (en-tête X-Gemini-Key ou ?key=)
 *
 * Si l'en-tête X-Gemini-Key est absent ou que Google refuse la clé, le Worker répond 401 avec
 * un champ `code` ('missing_key' ou 'key') : c'est le signal que le site utilise pour demander
 * (ou redemander) la clé dans la fenêtre de discussion.
 */

const FALLBACK_MODELS = [
  'gemini-3.1-flash-lite', 'gemini-3-flash-lite', 'gemini-3.1-flash', 'gemini-3-flash',
  'gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash-lite', 'gemini-2.0-flash',
];
const API = 'https://generativelanguage.googleapis.com/v1beta';
const KB_TTL = 3600;             // secondes : la base est relue au plus une fois par heure
const MAX_CHARS = 1200;          // longueur d'une question
const MAX_TURNS = 16;            // tours d'historique transmis

let KB = null, KB_AT = 0, PICKED = null;         // cache mémoire de l'isolat
const HITS = new Map();                           // limitation de débit (par isolat : approximative)

const SYSTEM = (kb, today) => `Tu es « Aube », l'assistante en ligne du site de la Communauté de Communes du Bassin d'Aubenas (CCBA), en Ardèche. Tu réponds aux habitants, aux entreprises et aux associations du territoire.

RÈGLES ABSOLUES
1. Tu réponds UNIQUEMENT à partir de la BASE DE CONNAISSANCES ci-dessous, qui est le contenu du site. Tu n'inventes jamais un horaire, un tarif, un numéro de téléphone, une adresse, une date, un nom ou une démarche. Si l'information n'y est pas, tu le dis franchement et tu orientes vers l'accueil de la CCBA (04 75 94 61 12, contact@cdcba.fr) ou vers la page la plus proche.
2. Tu cites toujours la ou les pages utiles, à la fin de ta réponse, sous la forme [[chemin/de/la/page/]] — exactement le chemin donné dans la base, sans inventer d'adresse. Une à trois pages au maximum. Pour un site extérieur, donne l'adresse complète en clair.
3. Tu ne traites que ce qui concerne la CCBA et son territoire : services, démarches, équipements, communes, vie locale. Pour tout autre sujet (actualité générale, devoirs, code, conseils personnels, autres collectivités), tu expliques poliment que tu ne réponds que sur le Bassin d'Aubenas.
4. Tu ne donnes jamais de conseil juridique, médical ou financier personnalisé, et tu ne prends aucune décision à la place des services : tu renvoies vers le service compétent.
5. Compétences : la CCBA n'est pas la mairie. L'état civil, les cartes d'identité, les écoles, le cimetière, l'urbanisme décidé par le maire relèvent des communes ; dis-le et renvoie vers la mairie concernée quand c'est le cas.
6. Tu ne demandes jamais de données personnelles (nom, adresse, téléphone, numéro de dossier) et tu rappelles de ne pas en écrire ici si l'usager en donne.

STYLE
- Français simple et direct, vouvoiement, phrases courtes. Pas de jargon administratif : si un sigle est nécessaire (ADS, SPANC, PLUi, RPE, TAD), explique-le en quelques mots.
- Réponse brève : 2 à 6 phrases, ou une courte liste à puces quand il y a des étapes ou des horaires. Pas de titres, pas de gras superflu.
- Tu donnes tout de suite l'information utile (le jour, l'heure, le numéro, le lieu), pas seulement un lien.
- Si la question est vague, tu donnes la réponse la plus probable ET tu proposes une précision : « Vous cherchez plutôt … ou … ? »
- Si la question concerne une commune précise, utilise les données de cette commune (jour de collecte, guichet France Services le plus proche).

DATE DU JOUR : ${today}. Les horaires « ouvert aujourd'hui » se déduisent de cette date. N'annonce pas comme à venir un événement dont la date est passée.

BASE DE CONNAISSANCES (contenu du site) :
${kb}`;

const cors = (origin, allowed) => ({
  'Access-Control-Allow-Origin': allowed ? origin : 'null',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, x-gemini-key',
  'Access-Control-Max-Age': '86400',
  Vary: 'Origin',
});

function allowedOrigin(origin, env) {
  const list = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!origin) return true;                                   // appel direct (curl, tests)
  if (!list.length) return true;
  return list.some(a => a === '*' || a === origin);
}

function limited(ip, env) {
  const max = +(env.MAX_PER_HOUR || 40), now = Date.now(), win = 3600e3;
  const t = (HITS.get(ip) || []).filter(x => now - x < win);
  if (t.length >= max) { HITS.set(ip, t); return true; }
  t.push(now); HITS.set(ip, t);
  if (HITS.size > 5000) for (const [k, v] of HITS) if (!v.some(x => now - x < win)) HITS.delete(k);
  return false;
}

async function kb(env, ctx) {
  const now = Date.now() / 1000;
  if (KB && now - KB_AT < KB_TTL) return KB;
  const url = env.KB_URL || 'https://maeelk.github.io/CCBA_Site/assets/data/kb.txt';
  const cache = caches.default;
  let r = await cache.match(url);
  if (!r) {
    r = await fetch(url, { cf: { cacheTtl: KB_TTL, cacheEverything: true } });
    if (!r.ok) throw new Error('base de connaissances indisponible (' + r.status + ')');
    r = new Response(r.body, r);
    r.headers.set('Cache-Control', 'max-age=' + KB_TTL);
    ctx.waitUntil(cache.put(url, r.clone()));
  }
  KB = await r.text(); KB_AT = now;
  return KB;
}

/** Appelle un modèle, en essayant le modèle demandé puis les suivants (les noms évoluent). */
async function callGemini(env, key, body, stream) {
  const wanted = [...new Set([env.MODEL, ...FALLBACK_MODELS].filter(Boolean))];
  const order = PICKED ? [PICKED, ...wanted.filter(m => m !== PICKED)] : wanted;
  let last = null;
  for (const model of order) {
    const path = stream ? 'streamGenerateContent?alt=sse&key=' : 'generateContent?key=';
    const r = await fetch(`${API}/models/${model}:${path}${key}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
    });
    if (r.ok) { PICKED = model; return { r, model }; }
    const txt = await r.text();
    last = { status: r.status, model, txt: txt.slice(0, 400) };
    if (r.status === 403 || (r.status === 400 && /API_KEY_INVALID|API key not valid/i.test(txt))) {
      const e = new Error('Clé API refusée par Google.'); e.code = 'key'; e.detail = last; throw e;
    }
    if (r.status !== 404 && r.status !== 400) break;           // 404/400 : modèle inconnu → on essaie le suivant
  }
  const e = new Error('Aucun modèle disponible : ' + JSON.stringify(last));
  e.detail = last;
  throw e;
}

function sse(obj) { return new TextEncoder().encode('data: ' + JSON.stringify(obj) + '\n\n'); }

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';
    const ok = allowedOrigin(origin, env);
    const H = cors(origin, ok);
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: H });

    if (url.pathname === '/health') {
      let size = 0, err = null;
      try { size = (await kb(env, ctx)).length; } catch (e) { err = String(e.message || e); }
      return Response.json({ ok: !err, model: PICKED || env.MODEL || FALLBACK_MODELS[0], kb: size, kbError: err,
        key: 'apportée par chaque visiteur (en-tête X-Gemini-Key)' + (env.GEMINI_KEY ? ' + repli serveur configuré' : ''),
        origins: env.ALLOWED_ORIGINS || '(toutes)' }, { headers: H });
    }

    if (url.pathname === '/models') {                          // aide au réglage : modèles offerts par une clé donnée
      const key = request.headers.get('X-Gemini-Key') || url.searchParams.get('key') || env.GEMINI_KEY || '';
      if (!key) return Response.json({ error: 'Fournissez une clé : en-tête X-Gemini-Key ou ?key=.', code: 'missing_key' }, { status: 401, headers: H });
      const r = await fetch(`${API}/models?key=${key}`);
      const d = await r.json();
      return Response.json((d.models || []).map(m => ({
        id: m.name.replace('models/', ''), in: m.inputTokenLimit, methods: m.supportedGenerationMethods })), { headers: H });
    }

    if (url.pathname !== '/chat' || request.method !== 'POST')
      return new Response('CCBA — assistant. POST /chat, GET /health, GET /models.', { status: 404, headers: H });

    if (!ok) return Response.json({ error: 'Origine non autorisée.' }, { status: 403, headers: H });

    const key = request.headers.get('X-Gemini-Key') || env.GEMINI_KEY || '';
    if (!key) return Response.json({ error: 'Merci de renseigner votre clé API Gemini.', code: 'missing_key' }, { status: 401, headers: H });

    const ip = request.headers.get('CF-Connecting-IP') || 'anon';
    if (limited(ip, env))
      return Response.json({ error: 'Vous avez posé beaucoup de questions d’affilée. Merci de réessayer dans quelques minutes, ou de contacter la CCBA au 04 75 94 61 12.' }, { status: 429, headers: H });

    let payload;
    try { payload = await request.json(); } catch { return Response.json({ error: 'Requête illisible.' }, { status: 400, headers: H }); }
    const msgs = (payload.messages || []).slice(-MAX_TURNS)
      .filter(m => m && typeof m.text === 'string' && m.text.trim())
      .map(m => ({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: String(m.text).slice(0, MAX_CHARS) }] }));
    if (!msgs.length) return Response.json({ error: 'Question vide.' }, { status: 400, headers: H });

    let base;
    try { base = await kb(env, ctx); } catch (e) { return Response.json({ error: String(e.message || e) }, { status: 502, headers: H }); }

    const today = new Date().toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const body = {
      systemInstruction: { parts: [{ text: SYSTEM(base, today) }] },
      contents: msgs,
      generationConfig: { temperature: 0.2, topP: 0.9, maxOutputTokens: 900 },
      safetySettings: ['HARM_CATEGORY_HARASSMENT', 'HARM_CATEGORY_HATE_SPEECH', 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'HARM_CATEGORY_DANGEROUS_CONTENT']
        .map(category => ({ category, threshold: 'BLOCK_ONLY_HIGH' })),
    };

    let up;
    try { up = await callGemini(env, key, body, true); }
    catch (e) {
      if (e.code === 'key') return Response.json({ error: 'Votre clé API Gemini est invalide ou a expiré.', code: 'key' }, { status: 401, headers: H });
      return Response.json({ error: 'Le service de réponse est momentanément indisponible.', detail: e.detail || String(e) }, { status: 502, headers: H });
    }

    /* transformation du flux Gemini en flux simple : {d:"texte"} puis {done:true} */
    const { readable, writable } = new TransformStream();
    const w = writable.getWriter();
    ctx.waitUntil((async () => {
      const reader = up.r.body.getReader(), dec = new TextDecoder();
      let buf = '', sent = 0;
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let i;
          while ((i = buf.indexOf('\n')) >= 0) {
            const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
            if (!line.startsWith('data:')) continue;
            const raw = line.slice(5).trim();
            if (raw === '[DONE]') continue;
            let j; try { j = JSON.parse(raw); } catch { continue; }
            const c = j.candidates && j.candidates[0];
            const t = c && c.content && c.content.parts ? c.content.parts.map(p => p.text || '').join('') : '';
            if (t) { sent += t.length; await w.write(sse({ d: t })); }
            if (c && c.finishReason && c.finishReason !== 'STOP' && !sent)
              await w.write(sse({ d: 'Je ne peux pas répondre à cette question. Pour toute demande, l’accueil de la CCBA répond au 04 75 94 61 12.' }));
          }
        }
        if (!sent) await w.write(sse({ d: 'Je n’ai pas trouvé d’élément de réponse sur le site. L’accueil de la CCBA peut vous renseigner au 04 75 94 61 12 ou à contact@cdcba.fr.' }));
        await w.write(sse({ done: true, model: up.model }));
      } catch (e) {
        await w.write(sse({ error: 'La réponse a été interrompue.' }));
      } finally { await w.close(); }
    })());

    return new Response(readable, { headers: { ...H, 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache', connection: 'keep-alive' } });
  },
};
