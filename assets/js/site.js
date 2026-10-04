/* CCBA – scripts du site (vanilla JS, aucune dépendance, compatible GitHub Pages) */
window.CCBA_JS = 1; document.documentElement.classList.add('js');   // garde-fou : si ce script n'arrive pas, la page retire la classe « js » et tout reste visible

/* ==========================================================================
   CCBAFind — moteur de recherche tolérant, entièrement dans le navigateur.
   Index statique (search-index.json : titre t, extrait x, mots-clés k,
   rubrique r, mots caractéristiques du texte b). Pour chaque mot saisi :
   · mots vides ignorés (« comment inscrire mon enfant » → inscrire, enfant) ;
   · singulier / pluriel, début de mot (recherche pendant la frappe) ;
   · fautes de frappe (distance d'édition 1, ou 2 pour les mots longs) ;
   · synonymes du quotidien (« poubelle » → collecte, ordures ménagères…).
   Toutes les pages doivent contenir tous les mots ; sinon on propose les
   plus proches. Aucune requête vers un service extérieur.
   ========================================================================== */
var CCBAFind = (function () {
  'use strict';
  var STOP = {};
  ('a au aux avec ce ces cet cette dans de des du elle en et il ils je j la le les leur lui ma me mes moi mon ne nos notre nous on ou par pas pour qu que qui sa se ses son sur ta te tes ton tu un une vos votre vous c d l m n s t y est sont etre avoir ai as faire fais veux voudrais souhaite souhaiterais besoin comment quand quel quelle quels quelles ou combien pourquoi puis peux peut dois doit il faut chez mais donc car si').split(' ').forEach(function (w) { STOP[w] = 1; });
  /* synonymes : clé (mot ou expression normalisés) → expressions cherchées à la place
     (chaque expression doit apparaître en entier dans la page) */
  var SYN = {
    'poubelle': ['collecte', 'ordures menageres', 'dechets'], 'poubelles': ['collecte', 'ordures menageres', 'dechets'],
    'ordure': ['ordures menageres'], 'ramassage': ['collecte'], 'eboueur': ['collecte'], 'benne': ['collecte', 'encombrants'],
    'bac jaune': ['tri', 'emballages recyclables'], 'sac jaune': ['tri', 'emballages recyclables'], 'recyclage': ['tri', 'recyclables'], 'recycler': ['tri', 'recyclables'],
    'decheterie': ['decheterie', 'dechetterie'], 'dechetterie': ['decheterie', 'dechetterie'], 'deposer dechets': ['decheterie', 'dechetterie'],
    'monstre': ['encombrants'], 'meuble': ['encombrants'], 'matelas': ['encombrants'], 'frigo': ['encombrants'], 'electromenager': ['encombrants'],
    'compost': ['compostage'], 'composteur': ['compostage'], 'composter': ['compostage'], 'dechets verts': ['compostage', 'decheterie'],
    'piscine': ['centre aquatique', 'hippocampe'], 'nager': ['centre aquatique', 'hippocampe'], 'natation': ['centre aquatique', 'hippocampe'], 'baignade': ['centre aquatique', 'hippocampe'],
    'bibliotheque': ['mediatheque'], 'livre': ['mediatheque'], 'livres': ['mediatheque'], 'lecture': ['mediatheque'], 'emprunter': ['mediatheque'],
    'spectacle': ['theatre', 'agenda'], 'concert': ['agenda'], 'sortie': ['agenda'], 'sortir': ['agenda'],
    'balade': ['randonnees'], 'rando': ['randonnees'], 'randonnee': ['randonnees'], 'sentier': ['randonnees'], 'marche a pied': ['randonnees'],
    'bus': ['tout enbus', 'transport'], 'autobus': ['tout enbus'], 'navette': ['tout enbus', 'transport a la demande'], 'autocar': ['tout enbus', 'transport'],
    'tad': ['transport a la demande'], 'velo': ['velo', 'voies douces'], 'vae': ['velo electrique'], 'covoit': ['covoiturage'], 'voie verte': ['voies douces'], 'piste cyclable': ['voies douces'],
    'creche': ['creche', 'multi accueil'], 'garderie': ['creche', 'multi accueil'], 'nounou': ['assistante maternelle', 'relais petite enfance'], 'nourrice': ['assistante maternelle', 'relais petite enfance'],
    'assistante maternelle': ['assistante maternelle', 'relais petite enfance'], 'assmat': ['relais petite enfance'], 'mode de garde': ['creche', 'relais petite enfance'], 'garde enfant': ['creche', 'relais petite enfance'], 'bebe': ['petite enfance'],
    'centre aere': ['centres de loisirs'], 'alsh': ['centres de loisirs'], 'vacances enfants': ['centres de loisirs', 'stages multisports'], 'mercredi enfants': ['centres de loisirs'],
    'cantine': ['ecoles'], 'college': ['ecoles'], 'lycee': ['ecoles'], 'ado': ['jeunesse'], 'adolescent': ['jeunesse'], 'jeune': ['jeunesse'],
    'permis de construire': ['permis de construire', 'autorisations d urbanisme'], 'construire': ['autorisations d urbanisme', 'permis de construire'], 'construction': ['autorisations d urbanisme'],
    'travaux': ['travaux', 'autorisations d urbanisme'], 'agrandir': ['autorisations d urbanisme'], 'extension': ['autorisations d urbanisme'], 'veranda': ['autorisations d urbanisme'], 'cloture': ['autorisations d urbanisme'], 'abri de jardin': ['autorisations d urbanisme'],
    'declaration prealable': ['declaration prealable', 'autorisations d urbanisme'], 'plu': ['plui', 'documents d urbanisme'], 'cadastre': ['urbanisme'], 'terrain': ['urbanisme', 'foncier'],
    'fosse septique': ['assainissement non collectif'], 'fosse': ['assainissement non collectif'], 'spanc': ['assainissement non collectif'], 'anc': ['assainissement non collectif'], 'vidange': ['assainissement non collectif'],
    'maison': ['logement', 'habitation', 'construire'], 'logement': ['logement', 'habitat'], 'appartement': ['logement'], 'louer': ['logement', 'loyer'], 'location': ['logement', 'loyer'], 'hlm': ['logement social'], 'garant': ['garantir son loyer', 'visale'],
    'renovation': ['renover', 'ameliorer son logement'], 'renover': ['renover', 'ameliorer son logement'], 'isolation': ['ameliorer son logement', 'renovation'], 'insalubre': ['habitat indigne'], 'insalubrite': ['habitat indigne'],
    'emploi': ['offres d emploi', 'recrutement'], 'job': ['offres d emploi'], 'travail': ['offres d emploi', 'emploi'], 'recrute': ['recrutement'], 'candidature': ['recrutement', 'offres d emploi'], 'stage': ['stage', 'recrutement'],
    'appel d offres': ['marches publics'], 'appel d offre': ['marches publics'], 'marche public': ['marches publics'],
    'mairie': ['communes', 'mairie'], 'maire': ['maire', 'communes'], 'elu': ['elus'], 'conseil': ['conseil communautaire'], 'compte rendu': ['deliberations', 'proces verbaux'], 'deliberation': ['deliberations'],
    'telephone': ['contact'], 'tel': ['contact'], 'joindre': ['contact'], 'adresse': ['contact'], 'mail': ['contact'], 'horaire': ['horaires'], 'ouverture': ['horaires'],
    'carte grise': ['france services'], 'caf': ['france services'], 'impot': ['france services'], 'impots': ['france services'], 'retraite': ['france services', 'seniors'], 'rsa': ['france services'], 'papiers': ['france services'], 'demarche administrative': ['france services'], 'ants': ['france services'], 'cpam': ['france services'],
    'personne agee': ['seniors'], 'personnes agees': ['seniors'], 'aine': ['seniors'], 'vieillir': ['seniors'], 'aidant': ['seniors'],
    'internet': ['numerique', 'fibre'], 'wifi': ['numerique', 'fibre'], 'haut debit': ['fibre'],
    'route': ['voirie', 'routes intercommunales'], 'nid de poule': ['voirie'], 'chaussee': ['voirie'],
    'subvention': ['subvention', 'aides'], 'financement': ['aides', 'subvention'], 'asso': ['associations'],
    'societe': ['entreprise'], 'creer entreprise': ['creer', 'implanter'], 'auto entrepreneur': ['entreprise', 'creer'], 'bureau': ['coworking', 'immobilier d entreprise'], 'local': ['immobilier d entreprise', 'foncier'],
    'gite': ['taxe de sejour', 'hebergements touristiques'], 'chambre d hote': ['taxe de sejour', 'hebergements touristiques'], 'meuble de tourisme': ['taxe de sejour'], 'airbnb': ['taxe de sejour'],
    'tourisme': ['tourisme', 'office de tourisme'], 'caravane': ['gens du voyage'], 'inondation': ['gemapi'], 'riviere': ['gemapi', 'eau'], 'solaire': ['cadastre solaire'], 'panneau solaire': ['cadastre solaire'], 'climat': ['plan climat'],
    'aide': ['aide', 'accompagnement']
  };
  var F = { t: 10, k: 5, r: 3, x: 2, b: 1.2 };
  var DATA = null, INV = null, VOCAB = null, DISP = null, loading = null, CACHE = {};

  function norm(s) {
    return (s || '').toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[’'`\-_/]/g, ' ').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function toks(s) { var n = norm(s); return n ? n.split(' ') : []; }
  function sing(w) {                                      // singulier approximatif
    if (w.length > 4 && /aux$/.test(w)) return w.slice(0, -3) + 'al';
    if (w.length > 3 && /[sx]$/.test(w)) return w.slice(0, -1);
    return w;
  }
  function dist(a, b, max) {                              // Damerau-Levenshtein borné
    var la = a.length, lb = b.length;
    if (Math.abs(la - lb) > max) return max + 1;
    var prev2 = null, prev = [], cur, i, j;
    for (j = 0; j <= lb; j++) prev[j] = j;
    for (i = 1; i <= la; i++) {
      cur = [i]; var best = i;
      for (j = 1; j <= lb; j++) {
        var c = a[i - 1] === b[j - 1] ? 0 : 1;
        var v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + c);
        if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
        cur[j] = v; if (v < best) best = v;
      }
      if (best > max) return max + 1;
      prev2 = prev; prev = cur;
    }
    return prev[lb];
  }
  function prep(data) {
    DATA = data; INV = Object.create(null); DISP = Object.create(null);
    data.forEach(function (d, i) {
      Object.keys(F).forEach(function (f) {
        if (!d[f]) return;
        var src = String(d[f]);
        if (f !== 'b') src.split(/[^A-Za-zÀ-ÖØ-öø-ÿŒœÆæ0-9]+/).forEach(function (w) { var n = norm(w); if (n && n.indexOf(' ') < 0 && !DISP[n]) DISP[n] = w.toLowerCase(); });
        toks(src).forEach(function (t, pos) {
          if (t.length < 2) return;
          var w = F[f] + (f === 't' && pos === 0 ? 4 : 0), m = INV[t] || (INV[t] = Object.create(null));
          if (!m[i] || m[i] < w) m[i] = w;
        });
      });
    });
    VOCAB = Object.keys(INV);
    return data;
  }
  function load(root) {
    if (DATA) return Promise.resolve(DATA);
    if (loading) return loading;
    loading = fetch((root || document.body.getAttribute('data-root') || './') + 'search-index.json')
      .then(function (r) { return r.json(); }).then(prep).catch(function (e) { loading = null; throw e; });
    return loading;
  }
  /* variantes d'un mot dans un vocabulaire : [{t, w, k}] (k : exact, forme, debut, faute) */
  function variants(term, vocab, inv) {
    var key = term + '|' + (vocab === VOCAB ? 'g' : vocab.length);
    if (vocab === VOCAB && CACHE[key]) return CACHE[key];
    var out = [], s = sing(term), n = term.length;
    vocab.forEach(function (v) {
      var w = 0, k = '';
      if (v === term) { w = 1; k = 'exact'; }
      else if (sing(v) === s) { w = .95; k = 'forme'; }
      else if (n >= 3 && v.indexOf(term) === 0) { w = n >= 5 ? .8 : .7; k = 'debut'; }
      else if (n >= 4) {
        var max = n >= 8 ? 2 : 1, d = dist(s, sing(v), max);
        if (d <= max) { w = d === 1 ? .7 : .55; k = 'faute'; }
        else {                                            // même racine : inscrire / inscription
          var p = 0, m = Math.min(v.length, n); while (p < m && v[p] === term[p]) p++;
          if (p >= 6 && p >= .75 * m) { w = .5; k = 'racine'; }
        }
      }
      if (w) out.push({ t: v, w: w, k: k });
    });
    out.sort(function (a, b) { return b.w - a.w || (inv ? Object.keys(inv[b.t] || {}).length - Object.keys(inv[a.t] || {}).length : 0); });
    out = out.slice(0, 14);
    if (vocab === VOCAB) CACHE[key] = out;
    return out;
  }
  /* requête → termes (expressions synonymes reconnues d'abord, mots vides retirés) */
  function parse(q) {
    var raw = toks(q), terms = [], i = 0;
    while (i < raw.length) {
      var hit = null;
      for (var L = 3; L >= 2 && !hit; L--) {
        if (i + L <= raw.length) { var ph = raw.slice(i, i + L).join(' '); if (SYN[ph]) hit = { text: ph, syn: SYN[ph], words: raw.slice(i, i + L).filter(function (w) { return !STOP[w]; }), n: L }; }
      }
      if (hit) { terms.push(hit); i += hit.n; continue; }
      var w = raw[i++];
      if (STOP[w] || w.length < 2) continue;
      terms.push({ text: w, syn: SYN[w] || SYN[sing(w)] || null, words: [w] });
    }
    if (!terms.length) raw.forEach(function (w) { if (w.length > 1) terms.push({ text: w, syn: null, words: [w] }); });
    return terms;
  }
  function docsWithAll(words) {                             // pages contenant tous les mots (forme exacte ou pluriel)
    var acc = null;
    words.forEach(function (w) {
      var m = Object.create(null);
      [w, sing(w)].concat(sing(w) !== w ? [] : [w + 's']).forEach(function (v) { var d = INV[v]; if (d) for (var k in d) if (!m[k] || m[k] < d[k]) m[k] = d[k]; });
      if (acc === null) acc = m;
      else { var n = Object.create(null); for (var k in acc) if (m[k]) n[k] = acc[k] + m[k]; acc = n; }
    });
    return acc || {};
  }
  function termScores(term, info) {
    var acc = Object.create(null), put = function (d, s) { if (!acc[d] || acc[d] < s) acc[d] = s; };
    if (term.words.length > 1) {
      var ph = docsWithAll(term.words); for (var d in ph) put(d, ph[d] / term.words.length * 1.1);
    } else {
      variants(term.words[0], VOCAB, INV).forEach(function (v) {
        var m = INV[v.t], used = false;
        for (var d in m) { put(d, m[d] * v.w); used = true; }
        if (used) info.tok[v.t] = v.k;
      });
    }
    var own = Object.keys(acc).length;
    if (term.syn) term.syn.forEach(function (p) {
      var ws = toks(p).filter(function (w) { return !STOP[w]; }), m = docsWithAll(ws), any = false;
      for (var d in m) { put(d, m[d] / ws.length * .85); any = true; }
      if (any) { ws.forEach(function (w) { info.tok[w] = info.tok[w] || 'syn'; }); info.syn.push(p); }
    });
    term.own = own;
    return acc;
  }
  function search(q, opt) {
    opt = opt || {};
    var res = { items: [], partial: false, fixes: [], syns: [], alt: null, terms: [] };
    if (!DATA) return res;
    var terms = parse(q); res.terms = terms;
    if (!terms.length) return res;
    /* corrections : mot absent de l'index mais proche d'un mot connu */
    var altWords = [], corrected = false;
    terms.forEach(function (t) {
      var w = t.words[0];
      if (t.words.length === 1 && !t.syn && !INV[w] && !INV[sing(w)] && !(INV[w + 's'])) {
        var best = variants(w, VOCAB, INV).filter(function (v) { return v.k === 'faute' || v.k === 'racine'; })[0];
        var pre = variants(w, VOCAB, INV).filter(function (v) { return v.k === 'debut'; })[0];
        if (best && !pre) { res.fixes.push({ from: w, to: DISP[best.t] || best.t }); altWords.push(DISP[best.t] || best.t); corrected = true; t.syn = SYN[best.t] || SYN[sing(best.t)] || null; return; }
      }
      altWords.push(t.text);
    });
    if (corrected) res.alt = altWords.join(' ');
    var info = { tok: Object.create(null), syn: [] };
    var maps = terms.map(function (t) { var i2 = { tok: info.tok, syn: [] }; var m = termScores(t, i2); if (i2.syn.length) res.syns.push({ from: t.text, to: i2.syn }); return m; });
    /* toutes les pages qui répondent à tous les termes ; sinon, aux plus nombreux */
    var score = Object.create(null), count = Object.create(null);
    maps.forEach(function (m) { for (var d in m) { score[d] = (score[d] || 0) + m[d]; count[d] = (count[d] || 0) + 1; } });
    var need = terms.length, ids = Object.keys(score).filter(function (d) { return count[d] === need; });
    if (!ids.length && need > 1) {
      res.partial = true;
      var best = 0; for (var d in count) best = Math.max(best, count[d]);
      ids = Object.keys(score).filter(function (d) { return count[d] === best; });
    }
    var list = ids.map(function (d) {
      var doc = DATA[d], s = score[d];
      if (doc.r === 'Actualité' || doc.r === 'Agenda') s *= .72;
      if (doc.r === 'Délibérations et procès-verbaux') s *= .8;
      if (opt.only && doc.r !== opt.only) s = 0;
      return { d: doc, s: s };
    }).filter(function (e) { return e.s > 0; });
    list.sort(function (a, b) { return b.s - a.s; });
    res.items = opt.limit ? list.slice(0, opt.limit) : list;
    res.tok = info.tok;
    res.hl = function (text) { return hl(text, info.tok); };
    return res;
  }
  var escH = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function hl(text, tok) {                                 // surligne les mots trouvés (y compris variantes)
    return String(text).split(/([A-Za-zÀ-ÖØ-öø-ÿŒœÆæ0-9]+)/).map(function (part, i) {
      if (i % 2 === 0) return escH(part);
      var n = norm(part);
      return tok[n] || tok[sing(n)] ? '<mark>' + escH(part) + '</mark>' : escH(part);
    }).join('');
  }
  /* correspondance d'une requête avec un petit texte (filtre de la page « Je veux… ») */
  function matcher(q) {
    var terms = parse(q);
    return function (text) {
      if (!terms.length) return 1;
      var vocab = toks(text).filter(function (w, i, a) { return a.indexOf(w) === i; }), total = 0;
      for (var i = 0; i < terms.length; i++) {
        var t = terms[i], best = 0;
        if (t.words.length > 1 && norm(text).indexOf(t.words.join(' ')) > -1) best = 1;
        variants(t.words[t.words.length - 1], vocab).forEach(function (v) { if (v.w > best) best = v.w; });
        if (t.syn) t.syn.forEach(function (p) { if ((' ' + vocab.join(' ') + ' ').indexOf(' ' + norm(p) + ' ') > -1) best = Math.max(best, .85); });
        if (!best) return 0;
        total += best;
      }
      return total;
    };
  }
  function url(root, d) { return root + d.u + (d.u && d.u.indexOf('#') < 0 ? '/' : ''); }
  return { load: load, search: search, norm: norm, matcher: matcher, url: url, esc: escH, ready: function () { return !!DATA; } };
})();
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var ROOT = document.body.getAttribute('data-root') || './';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mqMobile = window.matchMedia('(max-width: 1024px)');
  var norm = function (s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' '); };

  /* ---------- Méga-menu (boutons de divulgation accessibles) ---------- */
  var navBtns = $$('.nav-btn');
  function closeAll(except) {
    navBtns.forEach(function (b) {
      if (b !== except) { b.setAttribute('aria-expanded', 'false'); var p = document.getElementById(b.getAttribute('aria-controls')); if (p) p.hidden = true; }
    });
  }
  navBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var open = b.getAttribute('aria-expanded') === 'true';
      closeAll(b);
      b.setAttribute('aria-expanded', String(!open));
      document.getElementById(b.getAttribute('aria-controls')).hidden = open;
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var openBtn = navBtns.filter(function (b) { return b.getAttribute('aria-expanded') === 'true'; })[0];
      closeAll(); if (openBtn && !mqMobile.matches) openBtn.focus();
      closeSearch(); if (document.body.classList.contains('menu-open')) toggleMenu(false);
    }
  });
  document.addEventListener('click', function (e) {
    if (!mqMobile.matches && !e.target.closest('.nav-item')) closeAll();
  });
  $$('.nav-item').forEach(function (li) {
    li.addEventListener('focusout', function (e) {
      if (!mqMobile.matches && e.relatedTarget && !li.contains(e.relatedTarget)) closeAll();
    });
  });

  /* ---------- Tiroir mobile ---------- */
  var burger = $('.burger'), nav = $('#menu');
  function toggleMenu(open) {
    if (!nav) return;
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    if (open) { var f = $('.js-close-menu'); f && f.focus(); } else { burger.focus(); }
  }
  burger && burger.addEventListener('click', function () { toggleMenu(true); });
  var closer = $('.js-close-menu'); closer && closer.addEventListener('click', function () { toggleMenu(false); });
  document.addEventListener('click', function (e) {
    if (document.body.classList.contains('menu-open') && !e.target.closest('#menu') && !e.target.closest('.burger')) toggleMenu(false);
  });

  /* ---------- Panneau de recherche ---------- */
  var sOpen = $('[data-search-open]'), sPanel = $('#search-panel');
  function closeSearch() { if (sPanel && !sPanel.hidden) { sPanel.hidden = true; sOpen.setAttribute('aria-expanded', 'false'); } }
  if (sOpen && sPanel) {
    sOpen.setAttribute('role', 'button'); sOpen.setAttribute('aria-expanded', 'false'); sOpen.setAttribute('aria-controls', 'search-panel');
    sOpen.addEventListener('click', function (e) {
      e.preventDefault();
      var willOpen = sPanel.hidden;
      sPanel.hidden = !willOpen; sOpen.setAttribute('aria-expanded', String(willOpen));
      if (willOpen) { closeAll(); $('#q-top').focus(); }
    });
  }

  /* ---------- En-tête compact + bouton haut de page ---------- */
  var header = $('.site-header'), toTop = $('.to-top'), ticking = false;
  function onScroll() {
    var y = window.scrollY;
    header && header.classList.toggle('is-scrolled', y > 30);
    toTop && toTop.classList.toggle('is-on', y > 900);
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();

  /* ---------- Apparition au défilement, dans le vocabulaire du splash : les blocs montent à plat,
     les titres montent mot à mot derrière un masque, le trait des sections se trace ---------- */
  function splitWords(el) {
    if (el.querySelector('.mw')) return;
    var label = el.textContent.replace(/\s+/g, ' ').trim(), n = 0;
    if (!label) return;
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), nodes = [], t;
    while ((t = walker.nextNode())) if (t.nodeValue.trim() && !t.parentNode.closest('.sr-only, svg')) nodes.push(t);
    nodes.forEach(function (node) {
      var frag = document.createDocumentFragment();
      node.nodeValue.split(/([ \t\n\r]+)/).forEach(function (part) {          // les espaces insécables restent dans le mot
        if (!part) return;
        if (/^[ \t\n\r]+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        var m = document.createElement('span'), i = document.createElement('span');
        m.className = 'mw'; i.textContent = part; i.style.setProperty('--i', n++); m.appendChild(i); frag.appendChild(m);
      });
      node.parentNode.replaceChild(frag, node);
    });
    /* lecteurs d'écran : le titre garde son texte d'un seul tenant */
    if (!el.querySelector('a, button, .sr-only') && !el.hasAttribute('aria-label')) {
      var wrap = document.createElement('span'); wrap.setAttribute('aria-hidden', 'true');
      while (el.firstChild) wrap.appendChild(el.firstChild);
      el.appendChild(wrap); el.setAttribute('aria-label', label);
    }
  }
  var footBig = $('.footer-big'); if (footBig) footBig.classList.add('m-go');
  if (!reduce) $$('.sec-head h2, .h-sec, .m-go').forEach(function (el) { try { splitWords(el); } catch (e) {} });
  var reveals = $$('.reveal, .sec-head, .h-sec, .m-go');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) {
      if (el.classList.contains('reveal')) {
        var sibs = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
        el.style.setProperty('--d', Math.min(sibs, 6) * 0.07 + 's');
      }
      io.observe(el);
    });
    window.CCBA_reveal = function (el) { reveals.push(el); io.observe(el); };   // éléments ajoutés après coup (back-office)
    /* saut de page (ancre, touche Fin, barre de défilement) : ce qui est passé au-dessus sans être vu s'affiche quand même */
    var lateT = 0;
    window.addEventListener('scroll', function () {
      clearTimeout(lateT);
      lateT = setTimeout(function () {
        reveals = reveals.filter(function (el) { return !el.classList.contains('is-in'); });
        reveals.forEach(function (el) { if (el.getClientRects().length && el.getBoundingClientRect().bottom < 0) { el.classList.add('is-in'); io.unobserve(el); } });
      }, 220);
    }, { passive: true });
  } else { reveals.forEach(function (el) { el.classList.add('is-in'); }); window.CCBA_reveal = function (el) { el.classList.add('is-in'); }; }

  /* ---------- L'onde : un anneau rouge pêche part du point touché (le geste du splash : chaque impact fait une onde) ---------- */
  if (!reduce && document.body.animate) {
    document.addEventListener('pointerdown', function (e) {
      if (e.button) return;
      var t = e.target.closest && e.target.closest('a, button, summary, [role="button"]');
      if (!t || t.disabled || t.closest('.sp')) return;
      var r = t.getBoundingClientRect(), size = Math.max(64, Math.min(150, Math.max(r.width, r.height) * .9));
      var at = 'translate(' + e.clientX + 'px,' + e.clientY + 'px) ';
      [0, 110].forEach(function (delay, k) {
        var o = document.createElement('span'), s = size * (k ? .62 : 1);
        o.className = 'onde-clic'; o.setAttribute('aria-hidden', 'true');
        o.style.cssText = 'width:' + s + 'px;height:' + s + 'px;margin:' + (-s / 2) + 'px 0 0 ' + (-s / 2) + 'px;opacity:0';
        document.body.appendChild(o);
        o.animate([{ transform: at + 'scale(.12)' }, { transform: at + 'scale(1)' }], { duration: 700, delay: delay, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
        o.animate([{ opacity: 0 }, { opacity: 1, offset: .08 }, { opacity: .55, offset: .5 }, { opacity: 0 }], { duration: 700, delay: delay, easing: 'linear', fill: 'both' }).onfinish = function () { o.remove(); };
      });
    }, { passive: true });
  }

  /* ---------- Images indisponibles -> motif de remplacement ---------- */
  function broken(img) { img.classList.add('is-broken'); img.setAttribute('aria-hidden', 'true'); }
  $$('img').forEach(function (img) {
    var ok = function () { img.classList.add('is-loaded'); };
    if (img.complete) { if (img.naturalWidth === 0 && img.src) broken(img); else ok(); }
    img.addEventListener('load', ok);
    img.addEventListener('error', function () { broken(img); if (!img.closest('.ph')) img.style.display = 'none'; });
  });

  /* ---------- Accueil : le film tient en entier dans la fenêtre ----------
     Le bandeau prend la hauteur qui reste sous l'en-tête et le bloc du haut (« Ma commune », recherche).
     Ce bloc change de hauteur (commune choisie ou non) : on le mesure et on le transmet à la feuille de style. */
  var heroTop = $('.hero-top'), heroBand = $('.hero-band');
  if (heroTop && heroBand) {
    var fit = function () {
      var top = heroBand.getBoundingClientRect().top - heroTop.closest('.hero').getBoundingClientRect().top;
      document.documentElement.style.setProperty('--hero-top-h', Math.round(top) + 'px');
    };
    fit();
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(heroTop);
    window.addEventListener('resize', fit, { passive: true });
  }

  /* ---------- Film d'accueil : lecture en boucle, pause accessible, sobriété ---------- */
  var video = $('.hero-video'), vbtn = $('.video-toggle');
  if (video && vbtn) {
    var band = video.closest('.hero-band'), loaded = false, wanted = false;
    var conn = navigator.connection || {};
    var light = conn.saveData || /2g|3g/.test(conn.effectiveType || '');
    var wide = window.matchMedia('(min-width: 900px)').matches;
    var setState = function (on) { wanted = on; vbtn.setAttribute('data-state', on ? 'playing' : 'paused'); band.classList.toggle('is-paused', !on); };
    var play = function () {
      if (!loaded) { video.src = video.getAttribute('data-src'); loaded = true; }
      setState(true);
      var p = video.play(); if (p && p.catch) p.catch(function () { setState(false); });
    };
    video.addEventListener('playing', function () { video.classList.add('is-playing'); band.classList.add('is-live'); });
    video.addEventListener('error', function () { band.classList.remove('is-live'); video.remove(); vbtn.remove(); });
    vbtn.hidden = false;
    vbtn.addEventListener('click', function () { if (wanted) { video.pause(); setState(false); } else play(); });
    if (!reduce && !light && wide) {
      if (document.hidden) {   // onglet ouvert en arrière-plan : on attend qu'il soit affiché
        setState(false);
        var onVis = function () { if (!document.hidden) { document.removeEventListener('visibilitychange', onVis); play(); } };
        document.addEventListener('visibilitychange', onVis);
      } else play();
    } else setState(false);
    document.addEventListener('visibilitychange', function () { if (!loaded) return; if (document.hidden) video.pause(); else if (wanted) { var p = video.play(); p && p.catch && p.catch(function () {}); } });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (!loaded) return; if (!e.isIntersecting) video.pause(); else if (wanted) { var p = video.play(); p && p.catch && p.catch(function () {}); } });
      }, { threshold: 0.05 }).observe(band);
    }
  }

  /* ---------- Carte des communes : infobulle + liaison liste ---------- */
  $$('.commune-map').forEach(function (svg) {
    var wrap = svg.parentElement, tip = wrap.querySelector('.map-tip');
    $$('.m-commune', svg).forEach(function (a) {
      var name = a.getAttribute('data-name');
      a.setAttribute('aria-label', name);
      function show() {
        if (!tip) return;
        var poly = a.querySelector('.m-fill, polygon').getBoundingClientRect(), box = wrap.getBoundingClientRect();
        tip.textContent = name;
        tip.style.left = (poly.left - box.left + poly.width / 2) + 'px';
        tip.style.top = (poly.top - box.top + poly.height / 2) + 'px';
        tip.classList.add('is-on');
        $$('#liste-communes a').forEach(function (l) { var c = l.querySelector('.cn'); l.classList.toggle('is-hl', (c ? c.textContent : l.textContent) === name); });
      }
      function hide() { tip && tip.classList.remove('is-on'); $$('#liste-communes a.is-hl').forEach(function (l) { l.classList.remove('is-hl'); }); }
      a.addEventListener('mouseenter', show); a.addEventListener('focus', show);
      a.addEventListener('mouseleave', hide); a.addEventListener('blur', hide);
    });
  });
  $$('#liste-communes a').forEach(function (l) {                // la liste soulève la commune sur la carte
    var find = function () { return $('.communes-map .m-commune[data-name="' + l.querySelector('.cn').textContent.replace(/"/g, '\\"') + '"]'); };
    l.addEventListener('mouseenter', function () { var m = find(); if (m) { m.classList.add('is-hl'); m.dispatchEvent(new Event('ccba:lift')); } });
    l.addEventListener('mouseleave', function () { var m = find(); if (m) { m.classList.remove('is-hl'); m.dispatchEvent(new Event('ccba:drop')); } });
  });

  /* ---------- Sélecteurs « aller à » ---------- */
  $$('form[data-goto]').forEach(function (f) {
    var s = f.querySelector('select'), kb = 0;
    f.addEventListener('submit', function (e) { e.preventDefault(); if (s.value) location.href = s.value; });
    if (f.hasAttribute('data-go-on-change')) {         // fiche commune : choisir une autre commune l'ouvre aussitôt
      s.addEventListener('keydown', function (e) { kb = Date.now(); if (e.key === 'Enter' && s.value) { e.preventDefault(); location.href = s.value; } });
      s.addEventListener('change', function () { if (s.value && Date.now() - kb > 700) location.href = s.value; });   // au clavier, les flèches ne font que parcourir
    }
  });
  /* retour arrière (page restaurée depuis le cache du navigateur) : les sélecteurs repartent à zéro */
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) $$('form[data-go-on-change] select').forEach(function (s) { s.value = ''; });
  });

  /* ---------- Filtre texte de liste (communes) ---------- */
  $$('input[data-filter]').forEach(function (inp) {
    var list = $(inp.getAttribute('data-filter')), count = $('[data-count-for="' + inp.getAttribute('data-filter') + '"]');
    inp.addEventListener('input', function () {
      var q = norm(inp.value).trim(), n = 0;
      $$('[data-filter-item]', list).forEach(function (a) {
        var ok = !q || norm(a.getAttribute('data-filter-item')).indexOf(q) > -1;
        a.parentElement.hidden = !ok; if (ok) n++;
      });
      if (count) count.textContent = q ? n + (n > 1 ? ' communes trouvées' : ' commune trouvée') : '';
    });
  });

  /* ---------- Filtres délibérations ---------- */
  var df = $('[data-doc-filters]');
  if (df) {
    var rows = $$('[data-doc-list] .doc-row'), dcount = $('[data-doc-count]');
    var apply = function () {
      var y = $('[data-f="year"]', df).value, t = $('[data-f="type"]', df).value, q = norm($('[data-f="q"]', df).value).trim(), n = 0;
      rows.forEach(function (r) {
        var ok = (!y || r.dataset.year === y) && (!t || r.dataset.type === t) && (!q || norm(r.dataset.filterItem).indexOf(q) > -1);
        r.hidden = !ok; if (ok) n++;
      });
      dcount.textContent = n + (n > 1 ? ' documents' : ' document');
    };
    $$('select, input', df).forEach(function (el) { el.addEventListener('input', apply); el.addEventListener('change', apply); });
    var params = new URLSearchParams(location.search);
    if (params.get('annee')) $('[data-f="year"]', df).value = params.get('annee');
    apply();
  }

  /* ---------- Agenda : masquer les événements passés (site statique) ---------- */
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var iso = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  /* échéance (« Aujourd'hui », « Dans 5 jours »…) et mise en avant du prochain rendez-vous ; rejoué après un ajout du back-office */
  function evDeco(grid) {
    var first = true;
    $$('.ev-card', grid).forEach(function (c) {
      var next = first && !c.hidden; if (next) first = false;
      c.classList.toggle('is-next', next);
      var chip = c.querySelector('[data-ev-chip]'); if (!chip || c.hidden) return;
      var n = Math.round((new Date(c.getAttribute('data-start') + 'T00:00') - today) / 864e5);
      var t = n < 0 ? 'En cours' : n === 0 ? 'Aujourd’hui' : n === 1 ? 'Demain' : n <= 31 ? 'Dans ' + n + ' jours' : '';
      chip.textContent = t; chip.hidden = !t; chip.classList.toggle('is-now', n <= 0);
    });
    if (!grid.classList.contains('ev-line')) return;
    $$('.ev-sep', grid).forEach(function (h) { h.remove(); });      // page Agenda : un intitulé par mois, dans la marge
    var cur = '', head, k;
    $$('.ev-card', grid).forEach(function (c) {
      if (c.hidden) return;
      var s = c.getAttribute('data-start'), m = (s < iso ? iso : s).slice(0, 7);
      if (m !== cur) {
        cur = m; k = 0; head = document.createElement('h3'); head.className = 'ev-mh ev-sep';
        var lab = new Date(m + '-01T12:00').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        head.innerHTML = lab.charAt(0).toUpperCase() + lab.slice(1) + '<span class="ev-mc"></span>';
        grid.insertBefore(head, c);
      }
      head.style.setProperty('--n', ++k); head.lastChild.textContent = k + ' rendez-vous';
    });
    grid.classList.add('is-months');
  }
  window.CCBA_agenda = evDeco;
  $$('[data-upcoming]').forEach(function (grid) {
    var lim = parseInt(grid.getAttribute('data-limit') || '0', 10), shown = 0;
    $$('.ev-card', grid).forEach(function (c) {
      var ok = c.getAttribute('data-end') >= iso && (!lim || shown < lim);
      c.hidden = !ok; if (ok) shown++;
    });
    var empty = grid.parentElement.querySelector('[data-empty]');
    if (!shown && empty) { empty.hidden = false; grid.hidden = true; }
    evDeco(grid);
  });

  /* ---------- Formulaire de contact (mailto, site statique) ---------- */
  $$('form[data-mailto]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = f.querySelector('.form-error'), ok = true;
      $$('[required]', f).forEach(function (el) { var v = el.value.trim(); var bad = !v || (el.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)); el.setAttribute('aria-invalid', String(bad)); if (bad) ok = false; });
      err.hidden = ok;
      if (!ok) { f.querySelector('[aria-invalid="true"]').focus(); return; }
      var g = function (n) { return f.elements[n].value.trim(); };
      var body = 'Nom : ' + g('name') + '\nE-mail : ' + g('email') + '\nCommune : ' + g('commune') + '\n\n' + g('message');
      location.href = 'mailto:' + f.getAttribute('data-mailto') + '?subject=' + encodeURIComponent('[Site web] ' + g('subject')) + '&body=' + encodeURIComponent(body);
    });
  });

  /* ---------- Page de résultats (moteur CCBAFind) ---------- */
  var results = $('#search-results');
  if (results) {
    var qInput = $('#q-page'), status = $('#search-status'), help = $('#search-help');
    var q = new URLSearchParams(location.search).get('q') || '';
    qInput.value = q;
    var E = CCBAFind.esc;
    var link = function (label, qq) { return '<a href="?q=' + encodeURIComponent(qq) + '">' + E(label) + '</a>'; };
    var run = function () {
      var res = CCBAFind.search(q), n = res.items.length, notes = [];
      if (!res.terms.length) { status.textContent = 'Saisissez un ou plusieurs mots-clés.'; return; }
      if (res.fixes.length) notes.push('Orthographe corrigée : ' + res.fixes.map(function (f) { return '« ' + E(f.from) + ' » → « ' + E(f.to) + ' »'; }).join(', ') + '.');
      var wide = [];
      res.syns.forEach(function (s) { s.to.forEach(function (t) { if (CCBAFind.norm(t) !== CCBAFind.norm(s.from) && wide.indexOf(t) < 0) wide.push(t); }); });
      if (wide.length) notes.push('Recherche élargie à : ' + wide.map(function (t) { return E(t); }).join(', ') + '.');
      if (res.partial) notes.push('Aucune page ne contient tous vos mots : voici les plus proches.');
      status.textContent = n ? n + ' résultat' + (n > 1 ? 's' : '') + ' pour « ' + q + ' »' : 'Aucun résultat pour « ' + q + ' ».';
      var tips = '';
      if (!n) {
        tips = (res.alt ? '<p class="sr-alt">Vouliez-vous dire ' + link(res.alt, res.alt) + ' ?</p>' : '') +
          '<div class="sr-tips"><p class="sr-tips-t">Quelques pistes</p><ul>' +
          '<li><a href="' + ROOT + 'je-veux/">Je veux… : laissez-vous guider pas à pas</a></li>' +
          '<li><button type="button" class="sr-ask" data-bot-open="' + E(q) + '">Poser la question à Aube, l’assistante du site</button></li>' +
          '<li>Essayez un mot plus simple ou plus court (ex. : « collecte », « crèche », « permis »).</li>' +
          '<li><a href="' + ROOT + 'plan-du-site/">Plan du site</a> · <a href="' + ROOT + 'contact/">Contacter la CCBA</a></li></ul></div>';
      }
      help.innerHTML = (notes.length ? '<p class="sr-note">' + notes.join(' ') + '</p>' : '') + tips;
      results.innerHTML = res.items.slice(0, 60).map(function (e) {
        var d = e.d;
        return '<li' + (d.r === 'Je veux…' ? ' class="r-jv"' : '') + '><span class="r-cat">' + E(d.r || 'Page') + '</span><a href="' + CCBAFind.url(ROOT, d) + '">' + res.hl(d.t) + '</a><p>' + res.hl(d.x || '') + '</p></li>';
      }).join('');
    };
    if (q) {
      status.textContent = 'Recherche en cours…';
      CCBAFind.load(ROOT).then(run).catch(function () { status.textContent = 'La recherche est momentanément indisponible.'; });
    }
  }
})();

/* ---------- Améliorations v2 ---------- */
(function () {
  'use strict';
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Compteurs animés */
  var fmt = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
  var counters = $$('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduce) {
    var co = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        if (!e.isIntersecting) return;
        co.unobserve(e.target);
        var el = e.target, to = parseInt(el.getAttribute('data-count'), 10), t0 = null, dur = 1400;
        var step = function (t) { if (!t0) t0 = t; var k = Math.min(1, (t - t0) / dur); var v = Math.round(to * (1 - Math.pow(1 - k, 3))); el.textContent = fmt(v); if (k < 1) requestAnimationFrame(step); };
        el.textContent = '0'; requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  }

  /* Sommaire : section active */
  var tocLinks = $$('.toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    tocLinks.forEach(function (a) { map[decodeURIComponent(a.hash.slice(1))] = a; });
    var so = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        if (e.isIntersecting) { tocLinks.forEach(function (a) { a.classList.remove('is-active'); }); var a = map[e.target.id]; a && a.classList.add('is-active'); }
      });
    }, { rootMargin: '-15% 0px -70% 0px' });
    Object.keys(map).forEach(function (id) { var h = document.getElementById(id); h && so.observe(h); });
  }

  /* Progression de lecture (pages de contenu) */
  var prose = document.querySelector('.prose');
  if (prose && prose.textContent.length > 2500) {
    var bar = document.createElement('div'); bar.className = 'progress'; bar.setAttribute('aria-hidden', 'true'); document.body.appendChild(bar);
    var upd = function () {
      var r = prose.getBoundingClientRect(), total = r.height - window.innerHeight * .6;
      var k = Math.max(0, Math.min(1, (-r.top + window.innerHeight * .2) / (total > 0 ? total : 1)));
      bar.style.transform = 'scaleX(' + k + ')';
    };
    window.addEventListener('scroll', function () { requestAnimationFrame(upd); }, { passive: true }); upd();
  }
})();

/* Horaires : ouvert / fermé (heure de Paris) */
(function () {
  var b = document.querySelector('[data-open-status]'); if (!b) return;
  try {
    var parts = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    var get = function (t) { return (parts.filter(function (p) { return p.type === t; })[0] || {}).value; };
    var wd = get('weekday'), m = parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10);
    var weekday = !/sam|dim/i.test(wd);
    var open = weekday && ((m >= 540 && m < 720) || (m >= 840 && m < 1050));
    b.classList.toggle('is-open', open);
    b.querySelector('[data-status-label]').textContent = open ? 'Accueil ouvert' : 'Accueil fermé';
  } catch (e) {}
})();

/* ==========================================================================
   Soleil réel : position du soleil au-dessus d'Aubenas à l'heure de la visite
   (lever → gauche du bandeau, coucher → droite ; sous la crête la nuit).
   Calcul astronomique simplifié (algorithme type SunCalc), sans dépendance.
   ========================================================================== */
(function () {
  var band = document.querySelector('.hero-band[data-crest]');
  if (!band) return;
  var sun = band.querySelector('.hero-sun'), cap = band.querySelector('[data-sun-cap]');
  var crest = band.getAttribute('data-crest').split(',').map(parseFloat);
  var rad = Math.PI / 180, dayMs = 864e5, J1970 = 2440588, J2000 = 2451545, e = rad * 23.4397;
  var toDays = function (d) { return d.valueOf() / dayMs - 0.5 + J1970 - J2000; };
  var fromJ = function (j) { return new Date((j + 0.5 - J1970) * dayMs); };
  function times(date, lat, lng) {
    var lw = rad * -lng, phi = rad * lat, d = toDays(date);
    var n = Math.round(d - 0.0009 - lw / (2 * Math.PI));
    var ds = 0.0009 + lw / (2 * Math.PI) + n;
    var M = rad * (357.5291 + 0.98560028 * ds);
    var L = M + rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) + rad * 102.9372 + Math.PI;
    var dec = Math.asin(Math.sin(e) * Math.sin(L));
    var Jnoon = J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
    var w = Math.acos((Math.sin(-0.833 * rad) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec)));
    var a = 0.0009 + (w + lw) / (2 * Math.PI) + n;
    var Jset = J2000 + a + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
    return { rise: fromJ(Jnoon - (Jset - Jnoon)), set: fromJ(Jset), noonAlt: 90 - lat + dec / rad };
  }
  var fmt = function (d) { return new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' }).format(d).replace(':', 'h'); };
  function place() {
    var now = new Date(), t = times(now, 44.62, 4.39);
    var p = (now - t.rise) / (t.set - t.rise);
    var day = p >= 0 && p <= 1;
    var x = day ? p : (p < 0 ? 0.04 : 0.96);
    var xs = 0.06 + 0.88 * x, idx = xs * (crest.length - 1), i0 = Math.floor(idx), f = idx - i0;
    var cy = crest[i0] * (1 - f) + (crest[Math.min(i0 + 1, crest.length - 1)] || crest[i0]) * f;
    var lift = day ? Math.sin(Math.PI * p) * Math.min(1, t.noonAlt / 65) * 0.13 : -0.2;   // fraction de la hauteur du bandeau
    band.style.setProperty('--sun-x', (xs * 100).toFixed(2) + '%');
    band.style.setProperty('--sun-y', ((cy - lift) * 100).toFixed(2) + '%');
    band.classList.toggle('is-night', !day);
    if (cap) { cap.hidden = false; cap.innerHTML = '<span class="sc-l">Soleil sur la CCBA · </span>lever ' + fmt(t.rise) + ' · coucher ' + fmt(t.set); }
  }
  place(); setInterval(place, 60000);
})();

/* ==========================================================================
   Horaires (France Services, piscine, médiathèque, accueils…) : état d'ouverture
   en direct + frise horaire. La frise s'adapte à l'amplitude de chaque lieu via
   data-start/data-end (en minutes depuis minuit, 8h–18h par défaut).
   Les pastilles des jours sont cliquables : elles affichent les horaires d'un autre jour.
   ========================================================================== */
(function () {
  var rows = Array.prototype.slice.call(document.querySelectorAll('[data-fs]'));
  if (!rows.length) return;
  var DAYN = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  var mins = function (s) { var a = s.split(':'); return +a[0] * 60 + +a[1]; };
  var hh = function (m) { var h = Math.floor(m / 60), r = m % 60; return h + 'h' + (r ? String(r).padStart(2, '0') : ''); };
  var cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
  function nowParis() {
    var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    var g = function (t) { return (parts.filter(function (p) { return p.type === t; })[0] || {}).value; };
    var wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday'));
    return { d: wd === 0 ? 7 : wd, m: (+g('hour') % 24) * 60 + +g('minute') };
  }
  function draw(row, n) {
    var h = JSON.parse(row.getAttribute('data-fs')), day = row._day || n.d, live = day === n.d, list = h[day] || [];
    var s0 = +row.getAttribute('data-start'), e0 = +row.getAttribute('data-end');
    if (!isFinite(s0)) s0 = 480; if (!isFinite(e0) || e0 <= s0) e0 = 1080;
    var span = e0 - s0;
    var st = row.querySelector('[data-fs-status]'), track = row.querySelector('.fs-track');
    track.innerHTML = '';
    list.forEach(function (r) {
      var a = mins(r[0]), b = mins(r[1]), s = document.createElement('span');
      s.className = 'fs-slot'; s.style.left = ((a - s0) / span * 100) + '%'; s.style.width = ((b - a) / span * 100) + '%';
      track.appendChild(s);
    });
    if (live && n.m >= s0 && n.m <= e0) { var c = document.createElement('i'); c.className = 'fs-now'; c.style.left = ((n.m - s0) / span * 100) + '%'; track.appendChild(c); }
    var msg, state;
    if (!live) {
      state = 'day';
      msg = list.length ? cap(DAYN[day % 7]) + ' : ' + list.map(function (r) { return hh(mins(r[0])) + '–' + hh(mins(r[1])); }).join(', ') : 'Fermé le ' + DAYN[day % 7];
    } else {
      var open = list.filter(function (r) { return n.m >= mins(r[0]) && n.m < mins(r[1]); })[0];
      var later = list.filter(function (r) { return mins(r[0]) > n.m; })[0];
      if (open) { state = 'open'; msg = 'Ouvert · ferme à ' + hh(mins(open[1])); }
      else if (later) { state = 'soon'; msg = 'Fermé · ouvre à ' + hh(mins(later[0])); }
      else {
        state = 'closed'; msg = 'Fermé aujourd’hui';
        for (var k = 1; k <= 7; k++) { var dd = ((n.d - 1 + k) % 7) + 1; if (h[dd]) { msg = 'Fermé · ouvre ' + (k === 1 ? 'demain' : DAYN[dd % 7]) + ' à ' + hh(mins(h[dd][0][0])); break; } }
      }
    }
    st.textContent = msg;
    if (!live) { var bk = document.createElement('button'); bk.type = 'button'; bk.className = 'fs-back'; bk.textContent = 'Aujourd’hui'; bk.addEventListener('click', function () { select(row, n.d, true); }); st.appendChild(bk); }
    row.setAttribute('data-state', state);
    row.querySelectorAll('.fs-days button').forEach(function (b) {
      var d = +b.getAttribute('data-day'), on = d === day;
      b.classList.toggle('today', d === n.d);
      b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1;
    });
  }
  function select(row, d, focus) {
    var n = nowParis(); row._day = d; draw(row, n); pins();
    if (focus) { var b = row.querySelector('.fs-days button[data-day="' + d + '"]'); b && b.focus(); }
  }
  function pins() {
    var n = nowParis();
    Array.prototype.forEach.call(document.querySelectorAll('.fs-map .pin'), function (p) {
      var r = rows[+p.getAttribute('data-pin')], s = r ? r.getAttribute('data-state') : '';
      p.setAttribute('class', 'pin ' + (s === 'open' ? 'open' : '') + (p._hl ? ' is-hl' : ''));
    });
  }
  function render() { var n = nowParis(); rows.forEach(function (r) { draw(r, n); }); pins(); }
  rows.forEach(function (row) {
    var btns = Array.prototype.slice.call(row.querySelectorAll('.fs-days button'));
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () { select(row, +b.getAttribute('data-day')); });
      b.addEventListener('keydown', function (e) {
        var k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (k) { e.preventDefault(); select(row, +btns[(i + k + 7) % 7].getAttribute('data-day'), true); }
        if (e.key === 'Home') { e.preventDefault(); select(row, 1, true); }
        if (e.key === 'End') { e.preventDefault(); select(row, 7, true); }
      });
    });
    var pin = document.querySelector('.fs-map .pin[data-pin="' + row.getAttribute('data-i') + '"]');
    if (pin) {
      row.addEventListener('mouseenter', function () { pin._hl = true; pins(); });
      row.addEventListener('mouseleave', function () { pin._hl = false; pins(); });
    }
  });
  render(); setInterval(render, 60000);
})();

/* Lignes de crête du pied de page : tracé à l'apparition */
(function () {
  var c = document.querySelector('.footer-crest');
  if (!c) return;
  if (!('IntersectionObserver' in window)) { c.classList.add('is-in'); return; }
  var o = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { c.classList.add('is-in'); o.disconnect(); } }); }, { threshold: 0.4 });
  o.observe(c);
})();

/* Orientations : frise d'emblèmes animés (accordéon sur petit écran), un seul texte affiché à la fois */
(function () {
  var root = document.querySelector('[data-orx]');
  if (!root) return;
  var ps = Array.prototype.slice.call(root.querySelectorAll('.orx-p'));
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('is-js');
  /* (re)dessine l'emblème : on retire puis on remet la classe pour relancer le tracé */
  function draw(p, delay) {
    var em = p.querySelector('.em');
    if (!em || still) return;
    em.style.setProperty('--emd', (delay || 0) + 'ms');
    em.classList.remove('is-draw'); void em.getBoundingClientRect(); em.classList.add('is-draw');
  }
  function open(i, focus, redraw) {
    ps.forEach(function (p, k) {
      var on = k === i; p.classList.toggle('is-open', on);
      p.querySelector('.orx-b').setAttribute('aria-expanded', String(on));
    });
    root.style.setProperty('--orx-i', i);
    if (redraw) draw(ps[i]);
    if (focus) ps[i].querySelector('.orx-b').focus();
  }
  ps.forEach(function (p, i) {
    var b = p.querySelector('.orx-b');
    b.addEventListener('click', function () { var was = p.classList.contains('is-open'); open(i, false, !was); });
    b.addEventListener('keydown', function (e) {
      var k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (k) { e.preventDefault(); open((i + k + ps.length) % ps.length, true, true); }
      else if (e.key === 'Home') { e.preventDefault(); open(0, true, true); }
      else if (e.key === 'End') { e.preventDefault(); open(ps.length - 1, true, true); }
    });
  });
  /* première apparition : les sept emblèmes se dessinent l'un après l'autre */
  if ('IntersectionObserver' in window && !still) {
    var io = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      io.disconnect(); ps.forEach(function (p, k) { draw(p, 150 + k * 110); });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    io.observe(root);
  }
})();

/* Territoire : fiche express de la commune survolée ou focalisée */
(function () {
  var card = document.querySelector('[data-tc]');
  if (!card) return;
  var sec = card.closest('section'), total = 0;
  var polys = Array.prototype.slice.call(sec.querySelectorAll('.m-commune'));
  polys.forEach(function (a) { total += parseInt(a.getAttribute('data-pop') || '0', 10); });
  var q = function (s) { return card.querySelector(s); };
  var fmt = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
  function show(a) {
    var pop = parseInt(a.getAttribute('data-pop') || '0', 10), sh = total ? pop / total * 100 : 0;
    q('[data-tc-name]').textContent = a.getAttribute('data-name');
    var nm = a.getAttribute('data-name'); q('[data-tc-name2]').textContent = (/^[AEIOUYÂÉÈÊÎÔÛ]/i.test(nm) ? 'd’' : 'de ') + nm;
    q('[data-tc-pop]').textContent = pop ? fmt(pop) : '—';
    q('[data-tc-share]').textContent = pop ? sh.toFixed(1).replace('.', ',') + ' %' : '—';
    q('[data-tc-maire]').textContent = a.getAttribute('data-maire') || '—';
    q('[data-tc-bar]').style.width = Math.max(1, sh) + '%';
    q('[data-tc-link]').setAttribute('href', a.getAttribute('href'));
    card.classList.remove('is-swap'); void card.offsetWidth; card.classList.add('is-swap');
  }
  /* la fiche, la carte et le sélecteur « Choisir une commune » montrent toujours la même commune */
  var pick = sec.querySelector('form.commune-picker select'), byHref = {};
  polys.forEach(function (a) { byHref[a.getAttribute('href')] = a; });
  function select(a, fromPick) {
    if (!a) return;
    show(a);
    polys.forEach(function (p) { p.classList.toggle('is-sel', p === a); });
    if (pick && !fromPick) pick.value = a.getAttribute('href');
  }
  polys.forEach(function (a) { a.addEventListener('mouseenter', function () { select(a); }); a.addEventListener('focus', function () { select(a); }); });
  if (pick) ['change', 'input'].forEach(function (t) { pick.addEventListener(t, function () { select(byHref[pick.value], true); }); });
  /* commune affichée par défaut : celle du menu (valeur restaurée par le navigateur), sinon « Ma commune », sinon Aubenas */
  var bySlug = function (s) { return polys.filter(function (p) { return p.getAttribute('data-slug') === s; })[0]; };
  var mine = function () { try { return localStorage.getItem('ccba-commune'); } catch (e) { return null; } };
  function sync() { select((pick && byHref[pick.value]) || bySlug(mine()) || bySlug('aubenas')); }
  sync();
  window.addEventListener('pageshow', function (e) { if (e.persisted) sync(); });
  /* « Ma commune » vient de changer (encadré de l'accueil, autre onglet…) : la fiche et la carte suivent */
  document.addEventListener('ccba:mycom', function (e) { var a = bySlug(e.detail); if (a) select(a); });
})();

/* Tableaux longs (ex. jours de collecte) : filtre « trouver ma commune » */
(function () {
  var norm = function (s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' '); };
  Array.prototype.forEach.call(document.querySelectorAll('.prose .table-wrap'), function (wrap, k) {
    var trs = Array.prototype.slice.call(wrap.querySelectorAll('tr'));
    var hasTh = !!wrap.querySelector('th');
    var body = hasTh ? trs.filter(function (r) { return !r.querySelector('th'); }) : trs.slice(1);
    if (body.length < 12) return;
    var box = document.createElement('div'); box.className = 'table-filter';
    box.innerHTML = '<label for="tf-' + k + '">Filtrer le tableau</label><div class="filter-input"><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg><input id="tf-' + k + '" type="search" placeholder="Ex. : Vesseaux, lundi…" autocomplete="off"></div><p class="filter-count" aria-live="polite"></p>';
    wrap.parentNode.insertBefore(box, wrap);
    var inp = box.querySelector('input'), cnt = box.querySelector('.filter-count');
    inp.addEventListener('input', function () {
      var q = norm(inp.value).trim(), n = 0;
      body.forEach(function (r) { var ok = !q || norm(r.textContent).indexOf(q) > -1; r.hidden = !ok; if (ok) n++; });
      cnt.textContent = q ? n + (n > 1 ? ' lignes' : ' ligne') : '';
    });
  });
})();

/* Accueil : état en direct des guichets France Services dans la barre d'accès rapides */
(function () {
  var a = document.querySelector('[data-fs-dock]');
  if (!a) return;
  var lab = a.querySelector('[data-fs-dock-label]'), all = JSON.parse(a.getAttribute('data-fs-dock'));
  var DAYN = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  var mins = function (s) { var x = s.split(':'); return +x[0] * 60 + +x[1]; };
  var hh = function (m) { var h = Math.floor(m / 60), r = m % 60; return h + 'h' + (r ? String(r).padStart(2, '0') : ''); };
  function upd() {
    var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    var g = function (t) { return (parts.filter(function (p) { return p.type === t; })[0] || {}).value; };
    var wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday')), d = wd === 0 ? 7 : wd, m = (+g('hour') % 24) * 60 + +g('minute');
    var open = all.filter(function (h) { return (h[d] || []).some(function (r) { return m >= mins(r[0]) && m < mins(r[1]); }); }).length;
    if (open) { lab.textContent = open + (open > 1 ? ' guichets ouverts' : ' guichet ouvert'); a.classList.add('is-open'); return; }
    a.classList.remove('is-open');
    for (var k = 0; k <= 7; k++) {
      var dd = ((d - 1 + k) % 7) + 1, best = null;
      all.forEach(function (h) { (h[dd] || []).forEach(function (r) { var s = mins(r[0]); if ((k > 0 || s > m) && (best === null || s < best)) best = s; }); });
      if (best !== null) { lab.textContent = 'Rouvre ' + (k === 0 ? 'à ' : (k === 1 ? 'demain à ' : DAYN[dd % 7] + ' à ')) + hh(best); return; }
    }
  }
  upd(); setInterval(upd, 60000);
})();

/* ==========================================================================
   « Ma commune » : prochaines collectes, guichet France Services le plus proche,
   ajout des collectes à l'agenda (.ics). Le choix est mémorisé sur l'appareil
   uniquement (localStorage), sans compte ni suivi.
   ========================================================================== */
(function () {
  var boxes = Array.prototype.slice.call(document.querySelectorAll('[data-mycom]'));
  var dataEl = document.getElementById('mycom-data');
  if (!boxes.length || !dataEl) return;
  var D = JSON.parse(dataEl.textContent), ROOT = document.body.getAttribute('data-root') || './';
  var KEY = 'ccba-commune';
  var get = function () { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  var set = function (v) { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch (e) {} };
  var JOURS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
  var MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  // date « du jour » à Paris (minuit local)
  function today() {
    var p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function isoWeek(d) {
    var t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), n = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - n);
    return Math.ceil(((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
  }
  var wd = function (d) { return d.getDay() || 7; };
  function next(rules) {
    if (!rules || rules === 'point') return null;
    var t = today();
    for (var k = 0; k < 15; k++) {
      var d = new Date(t); d.setDate(t.getDate() + k);
      var ok = rules.some(function (r) { return r[0] === wd(d) && (r[1] === null || isoWeek(d) % 2 === r[1]); });
      if (ok) return { d: d, k: k };
    }
    return null;
  }
  function when(n) {
    if (!n) return '';
    var lab = n.k === 0 ? 'aujourd’hui' : n.k === 1 ? 'demain' : JOURS[n.d.getDay()] + ' ' + (n.d.getDate() === 1 ? '1er' : n.d.getDate()) + ' ' + MOIS[n.d.getMonth()];
    return lab;
  }
  function rhythm(rules) {
    if (!rules || rules === 'point') return '';
    return rules.map(function (r) { return ['', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'][r[0]] + (r[1] === null ? '' : r[1] === 0 ? ' (semaines paires)' : ' (semaines impaires)'); }).join(' et ');
  }
  function fsState(f) {
    var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    var g = function (t) { return (parts.filter(function (p) { return p.type === t; })[0] || {}).value; };
    var w = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday')), d = w === 0 ? 7 : w, m = (+g('hour') % 24) * 60 + +g('minute');
    var mins = function (s) { var x = s.split(':'); return +x[0] * 60 + +x[1]; };
    var hh = function (v) { var h = Math.floor(v / 60), r = v % 60; return h + 'h' + (r ? String(r).padStart(2, '0') : ''); };
    var o = (f.h[d] || []).filter(function (r) { return m >= mins(r[0]) && m < mins(r[1]); })[0];
    if (o) return { open: true, t: 'ouvert jusqu’à ' + hh(mins(o[1])) };
    for (var k = 0; k <= 7; k++) {
      var dd = ((d - 1 + k) % 7) + 1, best = null;
      (f.h[dd] || []).forEach(function (r) { var s = mins(r[0]); if ((k > 0 || s > m) && (best === null || s < best)) best = s; });
      if (best !== null) return { open: false, t: 'fermé · ouvre ' + (k === 0 ? '' : k === 1 ? 'demain ' : ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][dd % 7] + ' ') + 'à ' + hh(best) };
    }
    return { open: false, t: 'fermé' };
  }
  function foldIcs(txt) {
    return txt.split('\r\n').map(function (l) { var out = []; while (l.length > 72) { out.push(l.slice(0, 72)); l = ' ' + l.slice(72); } out.push(l); return out.join('\r\n'); }).join('\r\n');
  }
  window.CCBA_foldIcs = foldIcs;
  function ics(c) {
    var pad = function (n) { return String(n).padStart(2, '0'); };
    var ymd = function (d) { return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()); };
    var stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    var BY = ['', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
    var ev = [];
    [['om', 'Collecte des ordures ménagères', 'bac des ordures ménagères'], ['re', 'Collecte des emballages recyclables', 'bac des emballages recyclables']].forEach(function (t) {
      var rules = c[t[0]]; if (!rules || rules === 'point') return;
      rules.forEach(function (r) {
        var n = next([r]); if (!n) return;
        ev.push(['BEGIN:VEVENT', 'UID:' + t[0] + '-' + c.s + '-' + r[0] + '@bassin-aubenas', 'DTSTAMP:' + stamp,
          'DTSTART;VALUE=DATE:' + ymd(n.d), 'RRULE:FREQ=WEEKLY;INTERVAL=' + (r[1] === null ? 1 : 2) + ';BYDAY=' + BY[r[0]],
          'SUMMARY:' + t[1] + ' – ' + c.n, 'DESCRIPTION:Pensez à sortir le ' + t[2] + ' la veille au soir. Source : Communauté de Communes du Bassin d’Aubenas.',
          'TRANSP:TRANSPARENT', 'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:-PT5H', 'DESCRIPTION:Sortir le ' + t[2] + ' ce soir', 'END:VALARM', 'END:VEVENT'].join('\r\n'));
      });
    });
    return foldIcs(['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CCBA//Collectes ' + c.n + '//FR', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Collectes – ' + c.n].concat(ev, ['END:VCALENDAR']).join('\r\n'));
  }
  function download(name, text) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  var opts = D.communes.map(function (c) { return '<option value="' + c.s + '">' + esc(c.n) + '</option>'; }).join('');
  function render(box, slug) {
    var c = D.communes.filter(function (x) { return x.s === slug; })[0];
    box.hidden = false;
    if (!c) {
      box.classList.remove('is-set');
      box.innerHTML = '<p class="mc-k">Personnaliser</p><label class="mc-l" for="mc-' + box._id + '">Ma commune</label>' +
        '<div class="mc-pick"><select id="mc-' + box._id + '"><option value="">— Choisir —</option>' + opts + '</select></div>' +
        '<p class="mc-help">Vos prochaines collectes et le guichet France Services le plus proche. Choix mémorisé sur cet appareil uniquement.</p>';
      box.querySelector('select').addEventListener('change', function () { if (this.value) { set(this.value); all(); box.setAttribute('tabindex', '-1'); box.focus(); } });
      return;
    }
    box.classList.add('is-set');
    var om = next(c.om), re = next(c.re), f = D.fs[c.fs], st = fsState(f);
    var line = function (label, rules, n) {
      if (rules === 'point') return '<li><span class="mc-t">' + label + '</span><span class="mc-v">Point de regroupement</span></li>';
      if (!rules && c.nt === 'sictomsed') return '<li><span class="mc-t">' + label + '</span><span class="mc-v">Collecte assurée par le SICTOMSED<small><a href="http://www.sictomsed.fr/" target="_blank" rel="noopener">sictomsed.fr</a></small></span></li>';
      if (!rules) return '<li><span class="mc-t">' + label + '</span><span class="mc-v"><a href="' + ROOT + D.cu + '">voir les jours de collecte</a><small>ou service collecte : <a href="tel:+33800076015">0 800 07 60 15</a> (gratuit)</small></span></li>';
      return '<li><span class="mc-t">' + label + '</span><span class="mc-v"><strong>' + when(n) + '</strong><small>' + rhythm(rules).replace(' (semaines paires)', ', sem. paires').replace(' (semaines impaires)', ', sem. impaires') + '</small></span></li>';
    };
    var canIcs = (c.om && c.om !== 'point') || (c.re && c.re !== 'point');
    box.innerHTML = '<p class="mc-k">Ma commune</p>' +
      '<p class="mc-head"><a class="mc-name" href="' + ROOT + c.u + '">' + esc(c.n) + '</a><button type="button" class="mc-change">Changer</button></p>' +
      '<ul class="mc-list">' + line('Ordures', c.om, om) + line('Recyclables', c.re, re) +
      '<li><span class="mc-t">France Services</span><span class="mc-v"><a href="' + ROOT + D.fsu + '">' + esc(f.n) + '</a><small class="' + (st.open ? 'is-open' : '') + '">' + st.t + '</small></span></li></ul>' +
      (canIcs ? '<div class="mc-foot"><button type="button" class="mc-ics"><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>Ajouter à mon agenda</button><p class="mc-help">Rappel la veille à 19h pour sortir les bacs.</p></div>' : '');
    box.querySelector('.mc-change').addEventListener('click', function () { set(null); all(); var s = box.querySelector('select'); s && s.focus(); });
    var b = box.querySelector('.mc-ics');
    if (b) b.addEventListener('click', function () { download('collectes-' + c.s + '.ics', ics(c)); });
    // page des jours de collecte : mise en évidence de la ligne de la commune
    Array.prototype.forEach.call(document.querySelectorAll('.prose tr'), function (tr) {
      var first = tr.querySelector('td'); if (!first) return;
      var norm = function (s) { return s.toLowerCase().replace(/[’']/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]+/g, ' ').trim(); };
      tr.classList.toggle('is-mine', norm(first.textContent) === norm(c.n));
    });
  }
  var last = get();
  function all() {
    var v = get();
    boxes.forEach(function (b, i) { b._id = i; render(b, v); });
    if (v !== last) { last = v; if (v) document.dispatchEvent(new CustomEvent('ccba:mycom', { detail: v })); }
  }
  all();
  // la commune a pu changer ailleurs : retour arrière (page restaurée du cache) ou autre onglet
  window.addEventListener('pageshow', function (e) { if (e.persisted) all(); });
  window.addEventListener('storage', function (e) { if (e.key === KEY) all(); });
})();

/* ==========================================================================
   Recherche instantanée : suggestions pendant la frappe (combobox accessible)
   et raccourci clavier « / » pour rechercher depuis n'importe quelle page.
   ========================================================================== */
(function () {
  var ROOT = document.body.getAttribute('data-root') || './';
  var inputs = ['q-top', 'q-hero'].map(function (id) { return document.getElementById(id); }).filter(Boolean);
  var escH = CCBAFind.esc, load = function () { return CCBAFind.load(ROOT).catch(function () {}); };
  inputs.forEach(function (inp, n) {
    var form = inp.closest('form'), list = document.createElement('ul'), active = -1, items = [];
    list.className = 'suggest'; list.id = 'sg-' + n; list.setAttribute('role', 'listbox'); list.hidden = true;
    form.appendChild(list);
    inp.setAttribute('role', 'combobox'); inp.setAttribute('aria-autocomplete', 'list');
    inp.setAttribute('aria-expanded', 'false'); inp.setAttribute('aria-controls', list.id);
    function close() { list.hidden = true; inp.setAttribute('aria-expanded', 'false'); inp.removeAttribute('aria-activedescendant'); active = -1; }
    function setActive(i) {
      var lis = list.querySelectorAll('[role="option"]');
      active = (i + lis.length) % lis.length;
      Array.prototype.forEach.call(lis, function (li, k) { li.setAttribute('aria-selected', String(k === active)); });
      inp.setAttribute('aria-activedescendant', lis[active].id);
    }
    function render() {
      var q = inp.value.trim();
      if (q.length < 2) { close(); return; }
      var res = CCBAFind.search(q, { limit: 6 }); items = res.items;
      var html = '';
      if (res.items.length && (res.fixes.length || res.syns.length)) {
        html += '<li class="sg-note" aria-hidden="true">' + (res.fixes.length ? 'Résultats pour « ' + escH(res.alt) + ' »' : 'Recherche élargie à : ' + escH(res.syns[0].to.join(', '))) + '</li>';
      }
      html += res.items.map(function (e, i) {
        var d = e.d;
        return '<li role="option" id="' + list.id + '-' + i + '" aria-selected="false"' + (d.r === 'Je veux…' ? ' class="sg-jv"' : '') + '><a href="' + CCBAFind.url(ROOT, d) + '" tabindex="-1"><span class="sg-t">' + res.hl(d.t) + '</span><span class="sg-r">' + escH(d.r || 'Page') + '</span></a></li>';
      }).join('');
      html += res.items.length ? '<li role="option" class="sg-all" id="' + list.id + '-all" aria-selected="false"><a href="' + form.getAttribute('action') + '?q=' + encodeURIComponent(q) + '" tabindex="-1">Tous les résultats pour « ' + escH(q) + ' »</a></li>'
        : '<li class="sg-empty">Aucune suggestion' + (res.alt ? ' — vouliez-vous dire « ' + escH(res.alt) + ' » ?' : '.') + '</li>' +
          '<li role="option" class="sg-all" id="' + list.id + '-jv" aria-selected="false"><a href="' + ROOT + 'je-veux/" tabindex="-1">Laissez-vous guider : Je veux…</a></li>';
      list.innerHTML = html; list.hidden = false; inp.setAttribute('aria-expanded', 'true'); active = -1;
    }
    inp.addEventListener('focus', load);
    inp.addEventListener('input', function () { if (CCBAFind.ready()) render(); else load().then(render); });
    inp.addEventListener('keydown', function (e) {
      if (list.hidden) return;
      var lis = list.querySelectorAll('[role="option"]');
      if (e.key === 'ArrowDown' && lis.length) { e.preventDefault(); setActive(active + 1); }
      else if (e.key === 'ArrowUp' && lis.length) { e.preventDefault(); setActive(active - 1); }
      else if (e.key === 'Enter' && active > -1) { e.preventDefault(); location.href = lis[active].querySelector('a').href; }
      else if (e.key === 'Escape') { e.stopPropagation(); close(); }
    });
    inp.addEventListener('blur', function () { setTimeout(close, 180); });
  });
  // raccourci « / »
  document.addEventListener('keydown', function (e) {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target, tag = (t.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || t.isContentEditable) return;
    e.preventDefault();
    var hero = document.getElementById('q-hero');
    if (hero) { var r = hero.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) { hero.focus(); return; } }
    var open = document.querySelector('[data-search-open]'), panel = document.getElementById('search-panel');
    if (open && panel && panel.hidden) open.click();
    var top = document.getElementById('q-top'); top && top.focus();
  });
  var sb = document.querySelector('[data-search-open]');
  if (sb) { sb.setAttribute('aria-keyshortcuts', '/'); sb.setAttribute('title', 'Rechercher (raccourci : /)'); }
})();

/* Événements : ajouter à l'agenda (.ics) ; actualités et événements : partager */
(function () {
  Array.prototype.forEach.call(document.querySelectorAll('[data-share]'), function (b) {
    b.hidden = false;
    b.addEventListener('click', function () {
      var data = { title: document.title, url: location.href };
      if (navigator.share) { navigator.share(data).catch(function () {}); return; }
      var done = function () { var t = b.lastChild.textContent; b.lastChild.textContent = 'Lien copié'; b.classList.add('is-done'); setTimeout(function () { b.lastChild.textContent = t; b.classList.remove('is-done'); }, 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(done, function () { prompt('Copiez ce lien :', location.href); });
      else prompt('Copiez ce lien :', location.href);
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-ev]'), function (box) {
    var b = box.querySelector('[data-ev-ics]'); if (!b) return;
    b.addEventListener('click', function () {
      var ev = JSON.parse(box.getAttribute('data-ev')), pad = function (n) { return String(n).padStart(2, '0'); };
      var d = function (iso) { return iso.replace(/-/g, ''); };
      var start, end;
      if (ev.h && ev.s === ev.e) {
        var dt = new Date(ev.s + 'T' + ev.h + ':00'), fin = new Date(dt.getTime() + 2 * 36e5);
        var f = function (x) { return x.getFullYear() + pad(x.getMonth() + 1) + pad(x.getDate()) + 'T' + pad(x.getHours()) + pad(x.getMinutes()) + '00'; };
        start = 'DTSTART:' + f(dt); end = 'DTEND:' + f(fin);
      } else {
        var e2 = new Date(ev.e + 'T12:00:00'); e2.setDate(e2.getDate() + 1);
        start = 'DTSTART;VALUE=DATE:' + d(ev.s); end = 'DTEND;VALUE=DATE:' + e2.getFullYear() + pad(e2.getMonth() + 1) + pad(e2.getDate());
      }
      var escI = function (s) { return s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,'); };
      var txt = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CCBA//Agenda//FR', 'BEGIN:VEVENT',
        'UID:' + d(ev.s) + '-' + Math.abs(ev.t.split('').reduce(function (a, c) { return (a * 31 + c.charCodeAt(0)) | 0; }, 7)) + '@bassin-aubenas',
        'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''), start, end,
        'SUMMARY:' + escI(ev.t), 'URL:' + location.href, 'DESCRIPTION:' + escI('Plus d’informations : ' + location.href), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
      if (window.CCBA_foldIcs) txt = window.CCBA_foldIcs(txt);
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([txt], { type: 'text/calendar;charset=utf-8' }));
      a.download = 'evenement-' + d(ev.s) + '.ics'; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    });
  });
})();

/* ==========================================================================
   Écouter la page : lecture à voix haute (synthèse vocale du navigateur),
   paragraphe par paragraphe, avec surlignage du passage en cours.
   ========================================================================== */
(function () {
  var prose = document.querySelector('.prose');
  if (!prose || !('speechSynthesis' in window) || !window.SpeechSynthesisUtterance) return;
  var blocks = Array.prototype.slice.call(prose.querySelectorAll('h2, h3, h4, p, li, blockquote, figcaption'))
    .filter(function (el) { return !el.closest('table') && !el.querySelector('p, li') && el.textContent.trim().length > 1; });
  var words = prose.textContent.trim().split(/\s+/).length;
  if (words < 160) return;
  var h1 = document.querySelector('.page-head h1');
  var bar = document.createElement('div'); bar.className = 'listen';
  bar.innerHTML = '<button type="button" class="chip-btn listen-play" aria-pressed="false"><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg><span>Écouter la page</span></button>' +
    '<span class="listen-d">≈ ' + Math.max(1, Math.round(words / 150)) + ' min</span><button type="button" class="listen-stop" hidden>Arrêter</button>';
  prose.parentNode.insertBefore(bar, prose);
  var play = bar.querySelector('.listen-play'), lab = play.querySelector('span'), stop = bar.querySelector('.listen-stop');
  var i = 0, state = 'idle', voice = null, seq = blocks, fails = 0;
  var pick = function () { var v = speechSynthesis.getVoices().filter(function (x) { return /^fr/i.test(x.lang); }); voice = v.filter(function (x) { return /fr-FR/i.test(x.lang); })[0] || v[0] || null; };
  pick(); if (speechSynthesis.onvoiceschanged !== undefined) speechSynthesis.onvoiceschanged = pick;
  var mark = function (el) { blocks.concat(h1 ? [h1] : []).forEach(function (b) { b.classList.remove('is-reading'); }); if (el) { el.classList.add('is-reading'); var r = el.getBoundingClientRect(); if (r.top < 90 || r.bottom > innerHeight - 40) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } };
  function speak() {
    if (state !== 'playing') return;
    if (i >= seq.length) { reset(); return; }
    var el = seq[i], u = new SpeechSynthesisUtterance(el.textContent.replace(/\s+/g, ' ').trim());
    u.lang = 'fr-FR'; if (voice) u.voice = voice; u.rate = 1;
    u.onstart = function () { fails = 0; mark(el); };
    u.onend = function () { if (state === 'playing') { i++; speak(); } };
    u.onerror = function (e) {
      if (state !== 'playing' || (e && (e.error === 'interrupted' || e.error === 'canceled'))) return;
      if (++fails >= 3) { reset(); bar.querySelector('.listen-d').textContent = 'Lecture vocale indisponible sur cet appareil'; return; }
      i++; speak();
    };
    speechSynthesis.speak(u);
  }
  function reset() { state = 'idle'; i = 0; speechSynthesis.cancel(); mark(null); lab.textContent = 'Écouter la page'; play.setAttribute('aria-pressed', 'false'); stop.hidden = true; bar.classList.remove('is-on'); }
  play.addEventListener('click', function () {
    if (state === 'idle') {
      seq = (h1 ? [h1] : []).concat(blocks);
      state = 'playing'; lab.textContent = 'Pause'; play.setAttribute('aria-pressed', 'true'); stop.hidden = false; bar.classList.add('is-on'); speechSynthesis.cancel(); speak();
    } else if (state === 'playing') { state = 'paused'; speechSynthesis.pause(); lab.textContent = 'Reprendre'; play.setAttribute('aria-pressed', 'false'); }
    else { state = 'playing'; speechSynthesis.resume(); lab.textContent = 'Pause'; play.setAttribute('aria-pressed', 'true'); }
  });
  stop.addEventListener('click', reset);
  window.addEventListener('pagehide', function () { speechSynthesis.cancel(); });
})();


/* ==========================================================================
   Relief et profondeur. La carte des communes est une maquette en courbes de
   niveau calculée au build (terrain.py, altitudes IGN) : ici on se contente de
   la faire « monter » à partir d'une carte à plat quand elle apparaît, et de
   l'incliner légèrement sous le pointeur. Même projection que terrain.py.
   ========================================================================== */
var CCBA3D = (function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  var AZ = -14 * Math.PI / 180, TI = 44 * Math.PI / 180, CX = 110.5, CY = 187.5;
  var ca = Math.cos(AZ), sa = Math.sin(AZ), ct = Math.cos(TI), st = Math.sin(TI);
  function P(x, y, z) { var X = x - CX, Y = y - CY, yr = sa * X + ca * Y; return [ca * X - sa * Y, yr * ct - z * st, yr]; }
  var MAT = [ca, sa * ct, -sa, ca * ct, -ca * CX + sa * CY, -ct * (sa * CX + ca * CY)].map(function (v) { return v.toFixed(5); }).join(' ');
  function bounds(list) { var b = [1e9, 1e9, -1e9, -1e9]; list.forEach(function (p) { b[0] = Math.min(b[0], p[0]); b[1] = Math.min(b[1], p[1]); b[2] = Math.max(b[2], p[0]); b[3] = Math.max(b[3], p[1]); }); return b; }
  function parallax(zone, target) {                      // légère inclinaison de l'ensemble sous le pointeur
    if (!fine || reduce || !zone) return;
    var raf = 0, px = 0, py = 0;
    zone.addEventListener('pointermove', function (e) {
      var r = zone.getBoundingClientRect(); px = (e.clientX - r.left) / r.width - .5; py = (e.clientY - r.top) / r.height - .5;
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; target.style.setProperty('--mrx', (-py * 7).toFixed(2) + 'deg'); target.style.setProperty('--mry', (px * 9).toFixed(2) + 'deg'); });
    });
    zone.addEventListener('pointerleave', function () { target.style.setProperty('--mrx', '0deg'); target.style.setProperty('--mry', '0deg'); });
  }

  /* l'onde du splash : elle part d'Aubenas et allume les communes une à une, à vitesse constante */
  function wave(svg) {
    var pin = svg.querySelector('.rl-pin.is-aub'), group = svg.querySelector('.m-communes');
    var m = pin && /translate\(\s*([-\d.]+)[ ,]+([-\d.]+)/.exec(pin.getAttribute('transform') || '');
    if (!m || !group || !svg.animate) return;
    var ax = +m[1], ay = +m[2], T0 = 900, DUR = 1000, max = 1;
    var list = Array.prototype.map.call(group.querySelectorAll('.m-commune'), function (c) {
      var p = c.querySelector('.m-mairie'), d = p ? Math.hypot(+p.getAttribute('cx') - ax, (+p.getAttribute('cy') - ay) / ct) : 0;   // distance au sol (la carte est couchée)
      max = Math.max(max, d); return { el: c, d: d };
    });
    list.forEach(function (o) {
      var w = T0 + o.d / max * DUR, f = o.el.querySelector('.m-fill');
      o.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, delay: w, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
      if (f) f.animate([{ fill: 'rgba(225,66,72,.55)', offset: 0 }], { duration: 1000, delay: w, easing: 'ease-out', fill: 'backwards' });
    });
    [0, 170].forEach(function (lag) {
      var e = document.createElementNS(NS, 'ellipse'), R = max * 1.15;
      e.setAttribute('class', 'rl-onde'); e.setAttribute('cx', ax); e.setAttribute('cy', ay); e.setAttribute('rx', R.toFixed(1)); e.setAttribute('ry', (R * ct).toFixed(1));
      svg.insertBefore(e, pin);
      e.animate([{ transform: 'scale(0)', opacity: lag ? .5 : .95 }, { opacity: lag ? .4 : .8, offset: .7 }, { transform: 'scale(1)', opacity: 0 }],
        { duration: DUR * 1.15, delay: T0 + lag, easing: 'linear', fill: 'backwards' }).onfinish = function () { e.remove(); };
    });
  }

  function relief(svg) {                                 // la maquette monte palier par palier
    var art = svg.closest('.terr-art') || svg.parentElement;
    if (reduce || !('IntersectionObserver' in window)) svg.classList.add('is-up', 'no-anim');
    else {
      var io = new IntersectionObserver(function (es) {
        if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); svg.classList.add('is-up'); try { wave(svg); } catch (e) {} }
      }, { threshold: .3 });
      io.observe(svg);
    }
    parallax(art, svg);
  }

  function fsMap(svg) {                                    // France Services : trame couchée, épingles debout
    var dots = svg.querySelector('.ht-dots'); if (!dots) return;
    dots.setAttribute('transform', 'matrix(' + MAT + ')');
    var vb = svg.getAttribute('viewBox').split(/\s+/).map(Number), pts = [];
    [[vb[0], vb[1]], [vb[0] + vb[2], vb[1]], [vb[0], vb[1] + vb[3]], [vb[0] + vb[2], vb[1] + vb[3]]].forEach(function (c) { pts.push(P(c[0], c[1], 0)); });
    var pins = Array.prototype.slice.call(svg.querySelectorAll('.pin')), par = pins.length ? pins[0].parentNode : null;
    pins.map(function (pin, i) {
      var c = pin.querySelector('circle'), tx = pin.querySelector('text'), x = +c.getAttribute('cx'), y = +c.getAttribute('cy'), g = P(x, y, 0), hy = g[1] - 34;
      var sh = document.createElementNS(NS, 'ellipse'); sh.setAttribute('class', 'pin-shadow'); sh.setAttribute('cx', g[0].toFixed(1)); sh.setAttribute('cy', g[1].toFixed(1)); sh.setAttribute('rx', 7); sh.setAttribute('ry', 2.8);
      var stem = document.createElementNS(NS, 'line'); stem.setAttribute('class', 'pin-stem');
      stem.setAttribute('x1', g[0].toFixed(1)); stem.setAttribute('y1', g[1].toFixed(1)); stem.setAttribute('x2', g[0].toFixed(1)); stem.setAttribute('y2', (hy + 8).toFixed(1));
      var head = document.createElementNS(NS, 'g'); head.setAttribute('class', 'pin-head');
      c.setAttribute('cx', g[0].toFixed(1)); c.setAttribute('cy', hy.toFixed(1));
      tx.setAttribute('x', g[0].toFixed(1)); tx.setAttribute('y', (hy + 3.4).toFixed(1));
      head.appendChild(c); head.appendChild(tx);
      pin.appendChild(sh); pin.appendChild(stem); pin.appendChild(head);
      pin.style.setProperty('--i', i);
      pts.push([g[0], hy - 12]);
      return { pin: pin, d: g[2] };
    }).sort(function (a, b) { return a.d - b.d; }).forEach(function (o) { par.appendChild(o.pin); });
    var b = bounds(pts), m = 4;
    svg.setAttribute('viewBox', [b[0] - m, b[1] - m, b[2] - b[0] + 2 * m, b[3] - b[1] + 2 * m].map(function (v) { return v.toFixed(1); }).join(' '));
    svg.classList.add('is-3d');
    parallax(svg.closest('.fs-art'), svg);
  }

  Array.prototype.forEach.call(document.querySelectorAll('svg.relief'), function (svg) { try { relief(svg); } catch (e) {} });
  Array.prototype.forEach.call(document.querySelectorAll('svg.fs-map'), function (svg) { try { fsMap(svg); } catch (e) {} });

  /* cartes, tuiles et vignettes : un plateau clair se glisse dessous et une lueur suit le pointeur (à plat, sans inclinaison) */
  function halo(el) {
    if (!fine || reduce || el.classList.contains('tilt') || el.closest('.mega, .sp, .main-nav')) return;
    var surf = document.createElement('span'); surf.className = 'tilt-surf'; surf.setAttribute('aria-hidden', 'true');
    el.insertBefore(surf, el.firstChild);
    el.classList.add('tilt');
    var raf = 0, px = 0, py = 0;
    function apply() { raf = 0; el.style.setProperty('--gx', ((px + .5) * 100).toFixed(1) + '%'); el.style.setProperty('--gy', ((py + .5) * 100).toFixed(1) + '%'); }
    el.addEventListener('pointerenter', function () { el.classList.add('is-tilt'); });
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect(); px = (e.clientX - r.left) / r.width - .5; py = (e.clientY - r.top) / r.height - .5;
      if (!raf) raf = requestAnimationFrame(apply);
    });
    el.addEventListener('pointerleave', function () { el.classList.remove('is-tilt'); });
  }
  Array.prototype.forEach.call(document.querySelectorAll('.card, .hub-card, .ev-card, .news-feature, .news-item, .partner, .dock-a'), halo);
  return { P: P, halo: halo };
})();

/* ==========================================================================
   Bourse au foncier et à l'immobilier d'entreprise : filtres des annonces et
   masquage des annonces expirées (le site est statique : la date du jour est
   celle du visiteur).
   ========================================================================== */
(function () {
  var today = new Date().toISOString().slice(0, 10);
  Array.prototype.forEach.call(document.querySelectorAll('[data-exp]'), function (el) {
    var exp = el.getAttribute('data-exp');
    if (!exp || exp >= today) return;
    if (el.classList.contains('b-card')) { el.classList.add('is-expired'); el.hidden = true; }
    else { var n = el.querySelector('.b-expired'); if (n) n.hidden = false; }
  });
  var box = document.querySelector('[data-bourse]');
  if (!box) return;
  var cards = Array.prototype.slice.call(box.querySelectorAll('.b-card:not(.is-expired)'));
  var count = box.querySelector('[data-b-count]'), empty = box.querySelector('.b-empty');
  var val = function (k) { var el = box.querySelector('[data-bf="' + k + '"]' + (k === 't' ? ':checked' : '')); return el ? el.value : ''; };
  var find = function (q) { return window.CCBAFind ? CCBAFind.matcher(q) : function (t) { return t.toLowerCase().indexOf(q.toLowerCase()) > -1 ? 1 : 0; }; };
  function run() {
    var q = val('q').trim(), c = val('c'), k = val('k'), t = val('t'), m = find(q), n = 0;
    cards.forEach(function (li) {
      var ok = (!c || li.getAttribute('data-commune') === c) && (!t || li.getAttribute('data-kind') === t) &&
        (!k || li.getAttribute('data-cats').split('|').some(function (x) { return x === k || x + 's' === k || x === k + 's' || x.replace(/s$/, '') === k.replace(/s$/, ''); })) &&
        (!q || m(li.getAttribute('data-text')) > 0);
      li.hidden = !ok; if (ok) n++;
    });
    count.textContent = n + ' annonce' + (n > 1 ? 's' : '') + (n === cards.length ? '' : ' sur ' + cards.length);
    empty.hidden = n > 0;
  }
  box.addEventListener('input', run); box.addEventListener('change', run);
  run();
})();

/* ==========================================================================
   Back-office (Pages CMS). Les rédacteurs saisissent actualités et rendez-vous
   dans https://app.pagescms.org ; chaque enregistrement modifie un fichier du
   dépôt (contenu/actualites.json, contenu/agenda.json — schéma dans .pages.yml)
   et GitHub Pages republie le site. Ici, on lit ces deux fichiers et on les
   affiche là où le générateur a posé un attribut data-cms :
     actus-accueil, actus-liste     les actualités, mêlées aux existantes par date
     agenda-accueil, agenda-liste   les rendez-vous à venir
     actu, rdv                      la page de lecture (?a=… / ?e=…)
   Brouillons (« Publié » décoché) et actualités datées dans le futur sont
   ignorés. Le texte riche est nettoyé (balises et attributs autorisés seulement).
   ========================================================================== */
(function () {
  var hooks = Array.prototype.slice.call(document.querySelectorAll('[data-cms]'));
  if (!hooks.length || !window.fetch) return;
  var ROOT = document.body.getAttribute('data-root') || '';
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var now = new Date(), pad = function (n) { return String(n).padStart(2, '0'); };
  var TODAY = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
  var ARROW = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function iso(v) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || '')); return m ? m[0] : ''; }
  function fdate(d) { return +d.slice(8, 10) + ' ' + MOIS[+d.slice(5, 7) - 1] + ' ' + d.slice(0, 4); }
  function slug(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60); }
  function media(p) { p = String(p || '').trim(); if (!p) return ''; return /^(https?:)?\/\//.test(p) ? p : ROOT + p.replace(/^\/+/, ''); }
  function hour(v) { var m = /^(\d{1,2})\s?[hH:]\s?(\d{0,2})$/.exec(String(v || '').trim()); return m ? pad(m[1]) + ':' + pad(m[2] || 0) : ''; }
  function link(u) { u = String(u || '').trim(); return /^https?:\/\/\S+$/.test(u) ? u : ''; }
  function load(name) {
    return fetch(ROOT + 'contenu/' + name + '.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (a) { return Array.isArray(a) ? a : []; }, function () { return []; });
  }
  function ids(list) { var seen = {}; list.forEach(function (x) { var k = x.id, n = 2; while (seen[x.id]) x.id = k + '-' + n++; seen[x.id] = 1; }); return list; }
  function actus(raw) {
    return ids(raw.filter(function (x) { return x && x.titre && x.publie !== false && iso(x.date) && iso(x.date) <= TODAY; }).map(function (x) {
      var d = iso(x.date), t = String(x.titre).trim();
      return { t: t, d: d, x: String(x.resume || '').trim(), img: media(x.image), html: String(x.texte || ''), lien: link(x.lien), id: d + '-' + slug(t) };
    }).sort(function (a, b) { return a.d < b.d ? 1 : a.d > b.d ? -1 : 0; })).map(function (a) { a.url = ROOT + 'actualites/lire/?a=' + encodeURIComponent(a.id); return a; });
  }
  function rdvs(raw) {
    return ids(raw.filter(function (x) { return x && x.titre && x.publie !== false && iso(x.debut); }).map(function (x) {
      var s = iso(x.debut), e = iso(x.fin), t = String(x.titre).trim();
      if (!e || e < s) e = s;
      return { t: t, s: s, e: e, h: hour(x.heure), lieu: String(x.lieu || '').trim(), x: String(x.resume || '').trim(), img: media(x.image), html: String(x.texte || ''), lien: link(x.lien), id: s + '-' + slug(t) };
    }).sort(function (a, b) { return a.s < b.s ? -1 : a.s > b.s ? 1 : 0; })).map(function (e) { e.url = ROOT + 'agenda/voir/?e=' + encodeURIComponent(e.id); return e; });
  }
  function when(e) {
    if (e.s !== e.e) return 'Du ' + fdate(e.s) + ' au ' + fdate(e.e);
    return 'Le ' + fdate(e.s) + (e.h ? ' à ' + (+e.h.slice(0, 2)) + 'h' + (e.h.slice(3) === '00' ? '' : e.h.slice(3)) : '');
  }

  /* --- texte riche : on ne garde que des balises et attributs sûrs --- */
  var OK = { P: 1, BR: 1, STRONG: 1, B: 1, EM: 1, I: 1, U: 1, S: 1, A: 1, UL: 1, OL: 1, LI: 1, H2: 1, H3: 1, H4: 1, BLOCKQUOTE: 1, IMG: 1, HR: 1, TABLE: 1, THEAD: 1, TBODY: 1, TR: 1, TH: 1, TD: 1, FIGURE: 1, FIGCAPTION: 1, CODE: 1, PRE: 1 };
  var DROP = { SCRIPT: 1, STYLE: 1, IFRAME: 1, OBJECT: 1, EMBED: 1, FORM: 1, INPUT: 1, BUTTON: 1, TEXTAREA: 1, SELECT: 1, LINK: 1, META: 1, SVG: 1, MATH: 1, TEMPLATE: 1, NOSCRIPT: 1, VIDEO: 1, AUDIO: 1 };
  function clean(html) {
    var doc = new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html'), root = doc.body.firstChild;
    if (!root) return '';
    Array.prototype.slice.call(root.querySelectorAll('*')).reverse().forEach(function (el) {
      var tag = el.tagName.toUpperCase();
      if (DROP[tag]) { el.remove(); return; }
      if (tag === 'H1') { var h = doc.createElement('h2'); while (el.firstChild) h.appendChild(el.firstChild); el.parentNode.replaceChild(h, el); return; }
      if (!OK[tag]) { while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el); el.remove(); return; }
      var href = el.getAttribute('href'), src = el.getAttribute('src'), alt = el.getAttribute('alt'), cs = el.getAttribute('colspan'), rs = el.getAttribute('rowspan');
      Array.prototype.slice.call(el.attributes).forEach(function (a) { el.removeAttribute(a.name); });
      if (tag === 'A') {
        href = String(href || '').trim();
        if (/^(https?:\/\/|mailto:|tel:)/i.test(href)) { el.setAttribute('href', href); if (/^https?:/i.test(href)) { el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener'); } }
        else if (/^[\/#.\w-]/.test(href) && !/^\s*[a-z][a-z0-9+.-]*:/i.test(href)) el.setAttribute('href', href.charAt(0) === '/' ? ROOT + href.replace(/^\/+/, '') : href);
      }
      if (tag === 'IMG') {
        src = String(src || '').trim();
        if (!src || /^\s*(javascript|data|vbscript):/i.test(src)) { el.remove(); return; }
        el.setAttribute('src', media(src)); el.setAttribute('alt', alt || ''); el.setAttribute('loading', 'lazy');
      }
      if ((tag === 'TD' || tag === 'TH')) { if (/^\d+$/.test(cs || '')) el.setAttribute('colspan', cs); if (/^\d+$/.test(rs || '')) el.setAttribute('rowspan', rs); }
    });
    return root.innerHTML;
  }

  /* --- gabarits (mêmes balises que le générateur : render.py, pages.py, site.py) --- */
  var coverSrc = document.querySelector('.ph > svg.cover');
  function ph(img, cls) {
    var art = coverSrc ? coverSrc.outerHTML : '';
    return img ? '<div class="ph ' + cls + '">' + art + '<img src="' + esc(img) + '" alt="" loading="lazy" decoding="async"></div>'
               : '<div class="ph ph-art ' + cls + '" aria-hidden="true">' + art + '</div>';
  }
  function meta(d) { return '<p class="card-meta"><time datetime="' + d + '">' + fdate(d) + '</time></p>'; }
  function tFeature(a) {
    return '<article class="news-feature reveal"><a class="nf-media" href="' + esc(a.url) + '" tabindex="-1" aria-hidden="true">' + (a.ph || ph(a.img, 'nf-ph')) + '</a>' + meta(a.d) +
      '<h3 class="nf-title"><a href="' + esc(a.url) + '">' + esc(a.t) + '</a></h3>' + (a.x ? '<p class="nf-text">' + esc(a.x) + '</p>' : '') + '</article>';
  }
  function tItem(a) {
    return '<li class="reveal"><article class="news-item">' + (a.ph || ph(a.img, 'ni-media')) + '<div class="ni-body">' + meta(a.d) +
      '<h3 class="ni-title"><a href="' + esc(a.url) + '">' + esc(a.t) + '</a></h3></div></article></li>';
  }
  function tCard(a) {
    return '<article class="card news-card reveal">' + ph(a.img, 'card-media') + '<div class="card-body">' + meta(a.d) +
      '<h3 class="card-title"><a href="' + esc(a.url) + '">' + esc(a.t) + '</a></h3>' + (a.x ? '<p class="card-text">' + esc(a.x) + '</p>' : '') + '</div></article>';
  }
  var IC = { clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>', pin: '<path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>' };
  var MABR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'], DOW = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
  function evM(i, t) { return '<span class="ev-m"><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + IC[i] + '</svg>' + esc(t) + '</span>'; }
  function tEvent(e, thumb) {                                      // même gabarit que ev_card() du générateur
    var d = new Date(e.s + 'T12:00'), f = new Date(e.e + 'T12:00'), multi = e.s !== e.e;
    return '<article class="ev-card reveal" data-start="' + e.s + '" data-end="' + e.e + '"><div class="ev-date" aria-hidden="true"><span class="ev-dow">' + DOW[d.getDay()] + '</span><span class="ev-day">' + d.getDate() + '</span>' +
      '<span class="ev-month">' + MABR[d.getMonth()] + '</span>' + (d.getFullYear() !== new Date().getFullYear() ? '<span class="ev-year">' + d.getFullYear() + '</span>' : '') +
      (multi ? '<span class="ev-to">→ ' + f.getDate() + (e.s.slice(0, 7) === e.e.slice(0, 7) ? '' : ' ' + MABR[f.getMonth()]) + '</span>' : '') + '</div>' +
      '<div class="ev-body"><p class="ev-chip" data-ev-chip hidden></p><h3 class="card-title"><a href="' + esc(e.url) + '">' + esc(e.t) + '</a></h3>' +
      '<p class="ev-meta"><span class="sr-only">' + esc(when(e)) + '. </span>' + (multi ? evM('calendar', 'Jusqu’au ' + f.getDate() + ' ' + MOIS[f.getMonth()]) : e.h ? evM('clock', (+e.h.slice(0, 2)) + 'h' + (e.h.slice(3) === '00' ? '' : e.h.slice(3))) : '') + (e.lieu ? evM('pin', e.lieu) : '') + '</p>' +
      (e.x ? '<p class="card-text">' + esc(e.x) + '</p>' : '') + '</div>' + (thumb && e.img ? '<img class="ev-thumb" src="' + esc(e.img) + '" alt="" loading="lazy" decoding="async">' : '') + '</article>';
  }
  function node(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
  function dress(el) {                                             // même habillage que les cartes d'origine : apparition au défilement, halo au survol
    try { Array.prototype.forEach.call(el.matches('.card, .ev-card, .news-feature') ? [el] : el.querySelectorAll('.news-item'), CCBA3D.halo); } catch (e) {}
    setTimeout(function () { if (window.CCBA_reveal) window.CCBA_reveal(el); else el.classList.add('is-in'); }, 0);
    Array.prototype.forEach.call(el.querySelectorAll('.ph img'), function (img) {   // l'image apparaît une fois chargée ; absente, le motif reste
      var ok = function () { img.classList.add('is-loaded'); };
      if (img.complete && img.naturalWidth) ok(); else img.addEventListener('load', ok);
      img.addEventListener('error', function () { img.classList.add('is-broken'); img.setAttribute('aria-hidden', 'true'); });
    });
    return el;
  }

  /* --- accueil : les cinq actualités les plus récentes, back-office et existantes mêlées --- */
  function homeNews(box, list) {
    if (!list.length) return;
    var feat = box.querySelector('.news-feature'), ol = box.querySelector('.news-list'); if (!feat || !ol) return;
    var old = [feat].concat(Array.prototype.slice.call(ol.querySelectorAll('.news-item'))).map(function (el) {
      var a = el.querySelector('h3 a'), t = el.querySelector('time'), p = el.querySelector('.ph'), x = el.querySelector('.nf-text');
      return { t: a.textContent, url: a.getAttribute('href'), d: t ? t.getAttribute('datetime') : '', x: x ? x.textContent : '', phEl: p };
    });
    var all = list.concat(old).sort(function (a, b) { return a.d < b.d ? 1 : a.d > b.d ? -1 : 0; }).slice(0, old.length);
    var cls = function (a, c) { if (!a.phEl) return ''; var k = a.phEl.cloneNode(true); k.classList.remove('nf-ph', 'ni-media'); k.classList.add(c); return k.outerHTML; };
    var nf = node(tFeature(Object.assign({}, all[0], { ph: cls(all[0], 'nf-ph') })));
    feat.parentNode.replaceChild(dress(nf), feat);
    ol.innerHTML = '';
    all.slice(1).forEach(function (a) { ol.appendChild(dress(node(tItem(Object.assign({}, a, { ph: cls(a, 'ni-media') }))))); });
  }
  /* --- page Actualités : chaque actualité saisie prend sa place dans la liste, par date --- */
  function listNews(grid, list) {
    list.slice().reverse().forEach(function (a) {
      var cards = Array.prototype.slice.call(grid.children), before = null;
      for (var i = 0; i < cards.length; i++) { var t = cards[i].querySelector('time'); if (t && t.getAttribute('datetime') <= a.d) { before = cards[i]; break; } }
      grid.insertBefore(dress(node(tCard(a))), before);
    });
  }
  /* --- agenda (accueil et page) : les rendez-vous à venir, dans l'ordre --- */
  function events(grid, list) {
    var up = list.filter(function (e) { return e.e >= TODAY; }); if (!up.length) return;
    var sec = grid.closest('section') || document, lim = parseInt(grid.getAttribute('data-limit') || '0', 10);
    if (!grid.hasAttribute('data-upcoming')) {                       // l'accueil montrait les derniers rendez-vous passés : place aux prochains
      grid.innerHTML = ''; grid.setAttribute('data-upcoming', ''); if (!lim) lim = 4;
      var k = sec.querySelector('.sec-head .kicker'); if (k) k.textContent = 'Sortir, participer';
    }
    up.forEach(function (e) {
      var cards = Array.prototype.slice.call(grid.querySelectorAll('.ev-card')), before = null;
      for (var i = 0; i < cards.length; i++) { var s = cards[i].getAttribute('data-start') || cards[i].getAttribute('data-end'); if (s > e.s) { before = cards[i]; break; } }
      grid.insertBefore(dress(node(tEvent(e, grid.classList.contains('ev-line')))), before);
    });
    var shown = 0;
    Array.prototype.forEach.call(grid.querySelectorAll('.ev-card'), function (c) { var ok = c.getAttribute('data-end') >= TODAY && (!lim || shown < lim); c.hidden = !ok; if (ok) shown++; });
    grid.hidden = false;
    Array.prototype.forEach.call(grid.parentElement.querySelectorAll('[data-empty]'), function (m) { m.hidden = true; });
    if (window.CCBA_agenda) window.CCBA_agenda(grid);
  }
  /* --- page de lecture --- */
  function title(text) {
    var h = document.querySelector('[data-cms-title]'); if (!h) return;
    h.setAttribute('aria-label', text);
    h.className = 'm-split' + (text.length > 70 ? ' h-xl' : text.length > 38 ? ' h-long' : '');
    h.innerHTML = '<span aria-hidden="true">' + text.split(/[ \t\n\r]+/).filter(Boolean).map(function (w, i) { return '<span class="mw"><span style="--i:' + i + '">' + esc(w) + '</span></span>'; }).join(' ') + '</span>';
    var c = document.querySelector('.crumbs [aria-current]'); if (c) c.textContent = text;
    document.title = text + ' – CCBA';
  }
  function reader(box, list, param, kind) {
    var id = '', body = box.querySelector('[data-cms-body]'), date = box.querySelector('[data-cms-date]');
    try { id = new URLSearchParams(location.search).get(param) || ''; } catch (e) {}
    var it = list.filter(function (x) { return x.id === id; })[0];
    if (!it) {
      title(kind === 'actu' ? 'Actualité introuvable' : 'Rendez-vous introuvable');
      Array.prototype.forEach.call(box.querySelectorAll('.art-meta, .callout, .ev-actions'), function (el) { el.hidden = true; });
      body.innerHTML = '<p>Ce contenu n’existe pas ou n’est plus en ligne.</p>';
      return;
    }
    title(it.t);
    var lead = document.querySelector('[data-cms-lead]'); if (lead && it.x) { lead.textContent = it.x; lead.hidden = false; }
    var md = document.querySelector('meta[name="description"]'); if (md && it.x) md.setAttribute('content', it.x);
    if (date) date.textContent = kind === 'actu' ? 'Publié le ' + fdate(it.d) : when(it);
    if (kind === 'rdv') {
      var lieu = box.querySelector('[data-cms-lieu]'); if (lieu && it.lieu) { lieu.querySelector('span').textContent = it.lieu; lieu.hidden = false; }
      var ev = box.querySelector('[data-ev]'); if (ev) ev.setAttribute('data-ev', JSON.stringify({ t: it.t, s: it.s, e: it.e, h: it.h }));
    }
    var html = (it.img ? '<p class="cms-img"><img src="' + esc(it.img) + '" alt=""></p>' : '') + clean(it.html);
    if (it.lien) html += '<p><a class="link-arrow" href="' + esc(it.lien) + '" target="_blank" rel="noopener">En savoir plus ' + ARROW + '<span class="sr-only"> (nouvelle fenêtre)</span></a></p>';
    body.innerHTML = html;
  }

  var need = function (re) { return hooks.some(function (h) { return re.test(h.getAttribute('data-cms')); }); };
  Promise.all([need(/^actu/) ? load('actualites') : [], need(/^(agenda|rdv)/) ? load('agenda') : []]).then(function (r) {
    var A = actus(r[0]), E = rdvs(r[1]);
    hooks.forEach(function (h) {
      try {
        var k = h.getAttribute('data-cms');
        if (k === 'actus-accueil') homeNews(h, A);
        else if (k === 'actus-liste') listNews(h, A);
        else if (k === 'agenda-accueil' || k === 'agenda-liste') events(h, E);
        else if (k === 'actu') reader(h, A, 'a', 'actu');
        else if (k === 'rdv') reader(h, E, 'e', 'rdv');
      } catch (e) { if (window.console) console.warn('back-office :', e); }
    });
  });
})();
