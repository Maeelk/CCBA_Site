/* ==========================================================================
   « Aube » — assistante du site (chatbot)
   Visage dessiné en SVG : il cligne des yeux, suit le pointeur, réfléchit
   pendant l'attente et parle pendant la réponse. Les réponses viennent d'un
   modèle Gemini qui reçoit, en prompt système, le contenu du site (assets/data/kb.txt) —
   directement depuis le navigateur, ou via le Worker Cloudflare (worker/src/index.js) si son
   adresse est renseignée dans assets/data/bot.json.
   Chaque visiteur apporte sa propre clé API Gemini (gratuite, aistudio.google.com/apikey) :
   Aube la demande dans la fenêtre de discussion avant la première question. Elle est gardée
   uniquement dans ce navigateur (localStorage) et envoyée au Worker dans l'en-tête X-Gemini-Key
   à chaque question — jamais conservée par la CCBA. La conversation, elle, vit dans l'onglet.
   ========================================================================== */
(function () {
  'use strict';
  var ROOT = document.body.getAttribute('data-root') || './';
  var API = document.body.getAttribute('data-bot') || '';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var KEY = 'ccba-chat';
  var KEY_LS = 'ccba-chat-key';
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function getApiKey() { try { return localStorage.getItem(KEY_LS) || ''; } catch (e) { return ''; } }
  function setApiKey(k) { try { localStorage.setItem(KEY_LS, k); } catch (e) {} }
  function clearApiKey() { try { localStorage.removeItem(KEY_LS); } catch (e) {} }

  /* ---------------------------------------------------------------- visage */
  /* Aube : un petit soleil levant — le motif du site (le nom, l'intro « Un trait de lumière »,
     le soleil rouge pêche de l'accueil et la diagonale du logo). */
  var RAYS = '';
  for (var k = 0; k < 8; k++) RAYS += '<line class="cb-ray" style="--r:' + k + '" transform="rotate(' + (k * 45) + ' 24 24)" x1="24" y1="5.5" x2="24" y2="1.5"/>';
  var FACE = '<svg class="cb-face" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' +
    '<g class="cb-rays">' + RAYS + '</g>' +
    '<path class="cb-diag" d="M34 13 41 6"/>' +
    '<circle class="cb-disc" cx="24" cy="24" r="15.5"/>' +
    '<g class="cb-eyes">' +
      '<g class="cb-eye"><circle class="cb-pup" cx="19" cy="22" r="1.9"/></g>' +
      '<g class="cb-eye"><circle class="cb-pup" cx="29" cy="22" r="1.9"/></g>' +
    '</g>' +
    '<path class="cb-mouth" d="M18.5 28.5q5.5 5 11 0"/>' +
    '<g class="cb-think"><circle cx="17.5" cy="24" r="2"/><circle cx="24" cy="24" r="2"/><circle cx="30.5" cy="24" r="2"/></g>' +
    '</svg>';

  function animateFace(svg) {
    var eyes = svg.querySelector('.cb-eyes');
    if (reduce) return { look: function () {}, stop: function () {} };
    var blink = 0;
    function doBlink() {
      svg.classList.add('is-blink');
      setTimeout(function () { svg.classList.remove('is-blink'); }, 150);
      blink = setTimeout(doBlink, 2600 + Math.random() * 4200);
    }
    blink = setTimeout(doBlink, 1800 + Math.random() * 2000);
    function look(e) {
      var r = svg.getBoundingClientRect();
      if (!r.width) return;
      var dx = (e.clientX - (r.left + r.width / 2)) / (r.width * 1.7);
      var dy = (e.clientY - (r.top + r.height / 2)) / (r.height * 1.7);
      var m = Math.min(1, Math.hypot(dx, dy)) / (Math.hypot(dx, dy) || 1);
      eyes.style.setProperty('--ex', (dx * m * 1.9).toFixed(2));
      eyes.style.setProperty('--ey', (dy * m * 1.5).toFixed(2));
    }
    return { look: look, stop: function () { clearTimeout(blink); } };
  }

  /* ---------------------------------------------------------------- bouton */
  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'cb-btn'; btn.id = 'cb-btn';
  btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'cb-panel');
  btn.innerHTML = FACE + '<span class="cb-btn-l">Poser une question</span><span class="sr-only">Ouvrir l’assistante du site</span>';
  document.body.appendChild(btn);
  var faceAnim = animateFace(btn.querySelector('.cb-face'));
  if (!reduce) addEventListener('pointermove', function (e) { faceAnim.look(e); }, { passive: true });

  var panel = null, list = null, input = null, form = null, hist = [], busy = false, controller = null;

  var SUGGEST = [
    'Quel jour sont ramassées mes poubelles à Vesseaux ?',
    'France Services est ouvert maintenant ?',
    'Je veux agrandir ma maison, quelles démarches ?',
    'Comment inscrire mon enfant au centre de loisirs ?',
    'Quels sont les horaires de la piscine ?',
  ];

  function build() {
    panel = document.createElement('section');
    panel.className = 'cb-panel'; panel.id = 'cb-panel'; panel.hidden = true;
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'false'); panel.setAttribute('aria-labelledby', 'cb-title');
    panel.innerHTML =
      '<header class="cb-head">' + FACE +
        '<div><p class="cb-title" id="cb-title">Aube</p><p class="cb-sub">L’assistante du site</p></div>' +
        '<button type="button" class="cb-x" aria-label="Fermer l’assistante"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '</header>' +
      '<div class="cb-log" id="cb-log" role="log" aria-live="polite" aria-atomic="false" tabindex="0"></div>' +
      '<form class="cb-form">' +
        '<label class="sr-only" for="cb-in">Votre question</label>' +
        '<textarea id="cb-in" rows="1" placeholder="Votre question…" maxlength="1200" autocomplete="off"></textarea>' +
        '<button type="submit" class="cb-send" aria-label="Envoyer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h14M12 5l7 7-7 7"/></svg></button>' +
      '</form>' +
      '<p class="cb-legal">Réponses générées automatiquement à partir des pages du site. Elles peuvent être incomplètes&nbsp;: en cas de doute, <a href="' + ROOT + 'contact/">contactez la CCBA</a>. N’indiquez pas d’informations personnelles. Votre clé API Gemini reste dans ce navigateur — <button type="button" class="cb-linklike" id="cb-rekey">changer de clé</button>.</p>';
    document.body.appendChild(panel);
    list = panel.querySelector('.cb-log'); form = panel.querySelector('.cb-form'); input = panel.querySelector('#cb-in');
    animateFace(panel.querySelector('.cb-face'));
    panel.querySelector('#cb-rekey').addEventListener('click', function () { clearApiKey(); askKey('Collez une nouvelle clé pour continuer.'); });
    panel.querySelector('.cb-x').addEventListener('click', function () { toggle(false); });
    form.addEventListener('submit', function (e) { e.preventDefault(); send(input.value); });
    input.addEventListener('input', function () { input.style.height = 'auto'; input.style.height = Math.min(120, input.scrollHeight) + 'px'; });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
    });
    panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.stopPropagation(); toggle(false); } });
    restore();
  }

  /* ---------------------------------------------------------------- messages */
  function linkify(t) {
    var out = esc(t);
    out = out.replace(/\[\[([^\]\s]+?)\]\]/g, function (_, p) {          // [[chemin/]] → lien interne
      var lab = p.split('#')[0].replace(/\/+$/, '').split('/').pop().replace(/-/g, ' ').trim() || 'Accueil';
      if (lab === 'je veux') lab = 'Je veux…';
      return '<a class="cb-src" href="' + ROOT + p + '">' + esc(lab.charAt(0).toUpperCase() + lab.slice(1)) + '</a>';
    });
    /* les remplacements suivants ne touchent que le texte, jamais l'intérieur d'une balise déjà créée */
    out = out.split(/(<[^>]+>)/).map(function (seg, i) {
      if (i % 2) return seg;
      return seg
        .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>')
        .replace(/\b([\w.+-]+@[\w-]+\.[\w.]+)\b/g, '<a href="mailto:$1">$1</a>')
        .replace(/(^|[^\d+])(0[ .\u202f]?\d(?:[ .\u202f]?\d){8})(?!\d)/g, function (_, p, n) {
          return p + '<a href="tel:+33' + n.replace(/\D/g, '').slice(1) + '">' + n + '</a>'; })
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    }).join('');
    var lines = out.split('\n'), html = '', ul = false;
    lines.forEach(function (l) {
      var m = l.match(/^\s*[-*•]\s+(.*)$/);
      if (m) { if (!ul) { html += '<ul>'; ul = true; } html += '<li>' + m[1] + '</li>'; }
      else { if (ul) { html += '</ul>'; ul = false; } if (l.trim()) html += '<p>' + l + '</p>'; }
    });
    if (ul) html += '</ul>';
    return html || '<p>' + out + '</p>';
  }
  function bubble(role, html, cls) {
    var li = document.createElement('div');
    li.className = 'cb-msg cb-' + role + (cls ? ' ' + cls : '');
    li.innerHTML = (role === 'model' ? '<span class="sr-only">Aube : </span>' : '<span class="sr-only">Vous : </span>') + html;
    list.appendChild(li); scroll();
    return li;
  }
  function scroll() { list.scrollTop = list.scrollHeight; }

  function greet() {
    if (!getApiKey()) { askKey(); return; }
    greetChips();
  }
  function greetChips() {
    bubble('model', '<p>Bonjour&nbsp;! Je réponds à vos questions sur les services de la Communauté de communes&nbsp;: déchets, urbanisme, enfance, transports, logement…</p>');
    var chips = document.createElement('div'); chips.className = 'cb-chips';
    SUGGEST.forEach(function (s) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'cb-chip'; b.textContent = s;
      b.addEventListener('click', function () { send(s); });
      chips.appendChild(b);
    });
    list.appendChild(chips); scroll();
  }

  /* ---------------------------------------------------------------- clé API du visiteur */
  function askKey(reason) {
    bubble('model', '<p>' + esc(reason || 'Avant de répondre, j’ai besoin d’une clé API Google Gemini. Elle est gratuite, reste uniquement dans ce navigateur et n’est jamais conservée par la CCBA : elle sert seulement à générer vos réponses.') + '</p>' +
      '<p>Obtenez la vôtre en quelques secondes sur <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey<span class="sr-only"> (nouvelle fenêtre)</span></a> (compte Google requis), puis collez-la ci-dessous.</p>');
    var wrap = document.createElement('form'); wrap.className = 'cb-keyform';
    wrap.innerHTML = '<label class="sr-only" for="cb-key">Votre clé API Gemini</label>' +
      '<input id="cb-key" type="password" autocomplete="off" spellcheck="false" placeholder="Collez votre clé (commence par AIza…)">' +
      '<button type="submit">Valider</button>';
    list.appendChild(wrap); scroll();
    var kInput = wrap.querySelector('#cb-key');
    wrap.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = kInput.value.trim();
      if (!v) return;
      setApiKey(v);
      wrap.remove();
      bubble('model', '<p>Merci, votre clé est enregistrée dans ce navigateur. Posez votre question&nbsp;!</p>');
      greetChips();
    });
    setTimeout(function () { kInput.focus(); }, 0);
  }

  /* ---------------------------------------------------------------- appel du modèle
     Deux voies, même comportement pour l'usager :
     - Worker configuré (assets/data/bot.json) : le Worker ajoute la base et relaie à Gemini ;
     - sinon, appel direct de Gemini depuis le navigateur avec la clé du visiteur : la base de
       connaissances est lue sur le site (assets/data/kb.txt) et placée dans le prompt système.
     Chaque voie appelle onText(morceau) au fil de la réponse. */
  var GAPI = 'https://generativelanguage.googleapis.com/v1beta';
  var MODELS = ['gemini-3.1-flash-lite', 'gemini-3-flash-lite', 'gemini-3.1-flash', 'gemini-3-flash',
    'gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash-lite', 'gemini-2.0-flash'];
  var picked = null, kbText = null;
  try { picked = sessionStorage.getItem('ccba-chat-model'); } catch (e) {}
  var SYSTEM = function (kb, today) { return 'Tu es « Aube », l’assistante en ligne du site de la Communauté de Communes du Bassin d’Aubenas (CCBA), en Ardèche. Tu réponds aux habitants, aux entreprises et aux associations du territoire.\n\n' +
    'RÈGLES ABSOLUES\n' +
    '1. Tu réponds UNIQUEMENT à partir de la BASE DE CONNAISSANCES ci-dessous, qui est le contenu du site. Tu n’inventes jamais un horaire, un tarif, un numéro de téléphone, une adresse, une date, un nom ou une démarche. Si l’information n’y est pas, tu le dis franchement et tu orientes vers l’accueil de la CCBA (04 75 94 61 12, contact@cdcba.fr) ou vers la page la plus proche.\n' +
    '2. Tu cites toujours la ou les pages utiles, à la fin de ta réponse, sous la forme [[chemin/de/la/page/]] — exactement le chemin donné dans la base, sans inventer d’adresse. Une à trois pages au maximum. Pour un site extérieur, donne l’adresse complète en clair.\n' +
    '3. Tu ne traites que ce qui concerne la CCBA et son territoire : services, démarches, équipements, communes, vie locale. Pour tout autre sujet (actualité générale, devoirs, code, conseils personnels, autres collectivités), tu expliques poliment que tu ne réponds que sur le Bassin d’Aubenas.\n' +
    '4. Tu ne donnes jamais de conseil juridique, médical ou financier personnalisé, et tu ne prends aucune décision à la place des services : tu renvoies vers le service compétent.\n' +
    '5. Compétences : la CCBA n’est pas la mairie. L’état civil, les cartes d’identité, les écoles, le cimetière, l’urbanisme décidé par le maire relèvent des communes ; dis-le et renvoie vers la mairie concernée quand c’est le cas.\n' +
    '6. Tu ne demandes jamais de données personnelles (nom, adresse, téléphone, numéro de dossier) et tu rappelles de ne pas en écrire ici si l’usager en donne.\n\n' +
    'STYLE\n' +
    '- Français simple et direct, vouvoiement, phrases courtes. Pas de jargon administratif : si un sigle est nécessaire (ADS, SPANC, PLUi, RPE, TAD), explique-le en quelques mots.\n' +
    '- Réponse brève : 2 à 6 phrases, ou une courte liste à puces quand il y a des étapes ou des horaires. Pas de titres, pas de gras superflu.\n' +
    '- Tu donnes tout de suite l’information utile (le jour, l’heure, le numéro, le lieu), pas seulement un lien.\n' +
    '- Si la question est vague, tu donnes la réponse la plus probable ET tu proposes une précision : « Vous cherchez plutôt … ou … ? »\n' +
    '- Si la question concerne une commune précise, utilise les données de cette commune (jour de collecte, guichet France Services le plus proche).\n\n' +
    'DATE DU JOUR : ' + today + '. Les horaires « ouvert aujourd’hui » se déduisent de cette date. N’annonce pas comme à venir un événement dont la date est passée.\n\n' +
    'BASE DE CONNAISSANCES (contenu du site) :\n' + kb; };

  function keyError(msg) { var e = new Error(msg || 'Clé API manquante ou invalide.'); e.code = 'key'; return e; }
  function readSSE(r, onData) {
    var reader = r.body.getReader(), dec = new TextDecoder(), buf = '';
    return (function pump() {
      return reader.read().then(function (res) {
        if (res.done) return;
        buf += dec.decode(res.value, { stream: true }).replace(/\r/g, '');
        var i;
        while ((i = buf.indexOf('\n\n')) >= 0) {
          var line = buf.slice(0, i).trim(); buf = buf.slice(i + 2);
          if (!line.startsWith('data:')) continue;
          var j; try { j = JSON.parse(line.slice(5)); } catch (e) { continue; }
          onData(j);
        }
        return pump();
      });
    })();
  }

  function viaWorker(msgs, signal, onText) {
    return fetch(API.replace(/\/$/, '') + '/chat', {
      method: 'POST', headers: { 'content-type': 'application/json', 'X-Gemini-Key': getApiKey() }, signal: signal,
      body: JSON.stringify({ messages: msgs }),
    }).then(function (r) {
      if (r.status === 401) return r.json().catch(function () { return {}; }).then(function (j) { throw keyError(j.error); });
      if (!r.ok) return r.json().catch(function () { return {}; }).then(function (j) { throw new Error(j.error || 'Service indisponible (' + r.status + ').'); });
      return readSSE(r, function (j) { if (j.error) throw new Error(j.error); if (j.d) onText(j.d); });
    });
  }

  function loadKB() {
    if (kbText) return Promise.resolve(kbText);
    return fetch(ROOT + 'assets/data/kb.txt').then(function (r) {
      if (!r.ok) throw new Error('Base de connaissances indisponible (' + r.status + ').');
      return r.text();
    }).then(function (t) { kbText = t; return t; });
  }

  function direct(msgs, signal, onText) {
    return loadKB().then(function (kb) {
      var today = new Date().toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      var body = JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM(kb, today) }] },
        contents: msgs.map(function (m) { return { role: m.role === 'model' ? 'model' : 'user', parts: [{ text: String(m.text).slice(0, 1200) }] }; }),
        generationConfig: { temperature: 0.2, topP: 0.9, maxOutputTokens: 900 },
        safetySettings: ['HARM_CATEGORY_HARASSMENT', 'HARM_CATEGORY_HATE_SPEECH', 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'HARM_CATEGORY_DANGEROUS_CONTENT']
          .map(function (c) { return { category: c, threshold: 'BLOCK_ONLY_HIGH' }; }),
      });
      var order = picked ? [picked].concat(MODELS.filter(function (m) { return m !== picked; })) : MODELS.slice();
      function attempt(i) {
        if (i >= order.length) throw new Error('Aucun modèle Gemini disponible pour cette clé.');
        var model = order[i];
        return fetch(GAPI + '/models/' + model + ':streamGenerateContent?alt=sse', {
          method: 'POST', signal: signal, body: body,
          headers: { 'content-type': 'application/json', 'x-goog-api-key': getApiKey() },
        }).then(function (r) {
          if (r.ok) {
            picked = model; try { sessionStorage.setItem('ccba-chat-model', model); } catch (e) {}
            var sent = 0;
            return readSSE(r, function (j) {
              if (j.error) throw new Error(j.error.message || 'La réponse a été interrompue.');
              var c = j.candidates && j.candidates[0];
              var t = c && c.content && c.content.parts ? c.content.parts.map(function (p) { return p.text || ''; }).join('') : '';
              if (t) { sent += t.length; onText(t); }
              if (c && c.finishReason && c.finishReason !== 'STOP' && !sent)
                onText('Je ne peux pas répondre à cette question. Pour toute demande, l’accueil de la CCBA répond au 04 75 94 61 12.');
            });
          }
          return r.text().then(function (txt) {
            if (r.status === 401 || r.status === 403 || (r.status === 400 && /API_KEY_INVALID|API key not valid|API key expired/i.test(txt)))
              throw keyError('Votre clé API Gemini est invalide ou a expiré.');
            if (r.status === 429) throw new Error('Le quota gratuit de votre clé Gemini est atteint pour le moment. Réessayez dans une minute.');
            if (r.status === 404 || r.status === 400) return attempt(i + 1);   // modèle inconnu pour cette clé → suivant
            throw new Error('Service Gemini indisponible (' + r.status + ').');
          });
        });
      }
      return attempt(0);
    });
  }

  /* ---------------------------------------------------------------- échange */
  function send(text) {
    text = (text || '').trim();
    if (!text || busy) return;
    if (!getApiKey()) { askKey(); return; }
    var chips = list.querySelector('.cb-chips'); if (chips) chips.remove();
    input.value = ''; input.style.height = 'auto';
    bubble('user', '<p>' + esc(text) + '</p>');
    hist.push({ role: 'user', text: text });
    busy = true; panel.classList.add('is-busy'); btn.classList.add('is-busy');
    var out = bubble('model', '<p class="cb-dots" aria-label="Aube rédige sa réponse"><span></span><span></span><span></span></p>', 'is-live');
    var acc = '';
    controller = new AbortController();
    var onText = function (t) { acc += t; out.innerHTML = '<span class="sr-only">Aube : </span>' + linkify(acc); scroll(); };
    (API ? viaWorker : direct)(hist.slice(-16), controller.signal, onText).then(function () {
      if (!acc) throw new Error('Réponse vide.');
      hist.push({ role: 'model', text: acc });
      save();
    }).catch(function (e) {
      if (e.name === 'AbortError') { out.remove(); return; }
      hist.pop();
      if (e.code === 'key') {
        clearApiKey(); out.remove();
        askKey('Votre clé API Gemini semble invalide ou a expiré. Merci d’en coller une nouvelle pour continuer.');
        return;
      }
      out.classList.add('cb-err');
      out.innerHTML = '<p>Je n’arrive pas à répondre pour le moment. ' +
        'Vous pouvez <a href="' + ROOT + 'recherche/?q=' + encodeURIComponent(text.slice(0, 60)) + '">chercher sur le site</a>, ' +
        'utiliser les <a href="' + ROOT + 'je-veux/">parcours guidés</a> ou appeler la CCBA au <a href="tel:+33475946112">04 75 94 61 12</a>.</p>' +
        '<p class="cb-errd">' + esc(e.message || '') + '</p>';
    }).then(function () {
      busy = false; controller = null;
      panel.classList.remove('is-busy'); btn.classList.remove('is-busy');
      out.classList.remove('is-live');
      input.focus();
    });
  }

  /* ---------------------------------------------------------------- mémoire d'onglet */
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(hist.slice(-20))); } catch (e) {} }
  function restore() {
    var raw = null; try { raw = sessionStorage.getItem(KEY); } catch (e) {}
    var old = null; try { old = raw ? JSON.parse(raw) : null; } catch (e) {}
    if (old && old.length) {
      hist = old;
      old.forEach(function (m) { bubble(m.role === 'model' ? 'model' : 'user', linkify(m.text)); });
      var p = document.createElement('p'); p.className = 'cb-resume'; p.textContent = 'Conversation reprise';
      list.insertBefore(p, list.firstChild);
    } else greet();
  }

  /* ---------------------------------------------------------------- ouverture */
  function toggle(open) {
    if (!panel) build();
    if (open === undefined) open = panel.hidden;
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    btn.classList.toggle('is-open', open);
    document.documentElement.classList.toggle('cb-on', open);
    if (open) { setTimeout(function () { input.focus(); scroll(); }, 60); }
    else { btn.focus(); if (controller) controller.abort(); }
  }
  btn.addEventListener('click', function () { toggle(); });

  /* Adresse du Worker (facultative) : attribut de la page, sinon assets/data/bot.json — ce fichier
     peut être modifié directement dans le dépôt, sans regénérer le site. Sans Worker, Aube
     interroge Gemini directement avec la clé du visiteur : le bouton est donc toujours affiché. */
  if (!API) {
    fetch(ROOT + 'assets/data/bot.json', { cache: 'no-cache' })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (j && j.api) API = j.api; })
      .catch(function () {});
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel && !panel.hidden) toggle(false);
  });
  /* liens « Poser la question à Aube » ailleurs dans la page (y compris ceux créés après coup,
     comme la piste affichée quand une recherche ne donne rien), gérés par délégation. */
  document.documentElement.classList.add('cb-ready');
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-bot-open]');
    if (!a) return;
    e.preventDefault(); toggle(true);
    var q = a.getAttribute('data-bot-open');
    if (q && input && !busy) { input.value = q; input.dispatchEvent(new Event('input')); }
  });
})();
