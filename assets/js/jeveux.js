/* ==========================================================================
   « Je veux… » — parcours guidés, animations codées
   Aucune bibliothèque. Techniques : Web Animations API (FLIP, cascades,
   rebonds), tracés SVG dessinés (stroke-dashoffset + pathLength), machine
   à écrire, Canvas 2D (gerbe d'étincelles à 45°, comme le trait du logo),
   dégradés CSS pilotés au pointeur. Tout est ponctuel (aucune boucle
   continue) et désactivé si l'usager demande de réduire les animations.
   Trois temps : un thème (page d'entrée), un besoin, puis une ou deux
   questions. Navigation par l'ancre (#habiter/1/0) : retour arrière du
   navigateur, liens partageables ; les anciennes ancres (#travaux/0) sont
   converties. Lecture sans JavaScript assurée par le HTML statique.
   ========================================================================== */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';
  var root = document.querySelector('[data-jv]');
  if (!root) return;
  var DATA = JSON.parse(document.getElementById('jv-data').textContent);
  var J = {}; DATA.journeys.forEach(function (j) { J[j.id] = j; });
  var ROOT = document.body.getAttribute('data-root') || './';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var anim = !reduce && typeof Element.prototype.animate === 'function';
  var $ = function (s, c) { return (c || root).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || root).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var EASE = 'cubic-bezier(.16,1,.3,1)', BACK = 'cubic-bezier(.34,1.56,.64,1)';
  var grid = $('.jv-grid'), stage = $('.jv-stage'), input = $('#jv-q'), count = $('#jv-count'), hits = $('.jv-hits'), other = $('.jv-else');
  var ICONS = DATA.icons, NEED = {}; DATA.needs.forEach(function (n) { NEED[n.id] = n; });
  var svgIco = function (name) { return '<svg class="jv-ico" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' + (ICONS[name] || '') + '</svg>'; };
  var ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>';
  var TITLE = document.title;
  root.classList.add('is-live');

  /* ---------------------------------------------------------------- tracés dessinés */
  function draw(svg, opt) {                              // chaque tracé du pictogramme se dessine à son tour
    opt = opt || {};
    if (!anim || !svg) return;
    Array.prototype.forEach.call(svg.querySelectorAll('path, circle'), function (p, k) {
      p.animate([{ strokeDashoffset: 1, opacity: 0 }, { opacity: 1, offset: .06 }, { strokeDashoffset: 0, opacity: 1 }],
        { duration: opt.dur || 620, delay: (opt.delay || 0) + k * (opt.step || 90), easing: 'cubic-bezier(.65,0,.35,1)', fill: 'backwards' });
    });
  }

  /* ---------------------------------------------------------------- titre : machine à écrire */
  var typed = $('.jv-typed'), caret = $('.jv-caret'), typeToken = 0;
  function typeTo(text, fast) {
    var token = ++typeToken;
    caret.classList.remove('is-rest');
    if (!anim) { typed.textContent = text; caret.classList.add('is-rest'); return Promise.resolve(); }
    var cur = typed.textContent;
    var eraseStep = fast ? 12 : 28, typeStep = fast ? 18 : 46;
    var p = Promise.resolve();
    // efface jusqu'au préfixe commun, puis tape la suite
    var common = 0; while (common < cur.length && common < text.length && cur[common] === text[common]) common++;
    for (var i = cur.length; i > common; i--) (function (n) { p = p.then(function () { if (token !== typeToken) return; typed.textContent = cur.slice(0, n - 1); return sleep(eraseStep); }); })(i);
    for (var k = common; k < text.length; k++) (function (n) { p = p.then(function () { if (token !== typeToken) return; typed.textContent = text.slice(0, n + 1); return sleep(typeStep + (/[ ,’]/.test(text[n]) ? typeStep : 0)); }); })(k);
    return p.then(function () { if (token === typeToken) caret.classList.add('is-rest'); });
  }
  function demo() {                                     // trois exemples, puis « … » (aucune boucle)
    var token = typeToken, pick = ['travaux', 'dechets', 'enfant'].map(function (id) { return NEED[id] ? NEED[id].label : ''; }).filter(Boolean);
    var p = sleep(700);
    pick.forEach(function (t) { p = p.then(function () { if (token === typeToken) return typeTo(t).then(function () { token = typeToken; return sleep(1300); }); }); });
    return p.then(function () { if (token === typeToken) return typeTo('…'); });
  }

  /* ---------------------------------------------------------------- recherche d'un besoin
     Dès qu'on écrit, les thèmes laissent la place aux besoins qui correspondent : on y va directement. */
  function filter() {
    var q = input.value.trim();
    if (!q) { hits.hidden = true; hits.innerHTML = ''; grid.hidden = false; count.textContent = ''; return; }
    var m = window.CCBAFind ? CCBAFind.matcher(q) : function (t) { return t.toLowerCase().indexOf(q.toLowerCase()) >= 0 ? 1 : 0; };
    var found = DATA.needs.map(function (n) { return { n: n, s: m(n.h) }; }).filter(function (x) { return x.s > 0; })
      .sort(function (a, b) { return b.s - a.s; }).map(function (x) { return x.n; });
    hits.innerHTML = found.map(function (n) {
      return '<li><a class="jv-hit" href="' + hashOf(n.g, [n.i]) + '">' + svgIco(n.icon) + '<span class="jv-hit-t"><span class="jv-dots" aria-hidden="true">…</span>' + esc(n.label) +
        '</span><span class="jv-hit-g">' + esc(J[n.g].label) + '</span>' + ARROW + '</a></li>';
    }).join('');
    grid.hidden = true; hits.hidden = !found.length;
    if (anim) $$('.jv-hit', hits).forEach(function (a, i) { a.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 320, delay: i * 35, easing: EASE, fill: 'backwards' }); });
    var n = found.length;
    count.innerHTML = n ? n + ' besoin' + (n > 1 ? 's correspondent' : ' correspond') + ' à « ' + esc(q) + ' »'
      : 'Aucun parcours ne correspond. <a href="' + ROOT + 'recherche/?q=' + encodeURIComponent(q) + '">Rechercher « ' + esc(q) + ' » sur tout le site</a>';
  }
  input.addEventListener('input', function () { typeToken++; caret.classList.add('is-rest'); filter(); });
  input.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    var vis = $$('.jv-hit', hits);
    if (vis.length === 1) vis[0].click(); else if (vis.length) vis[0].focus();
  });

  /* ---------------------------------------------------------------- parcours : lecture de l'ancre */
  function parse() {
    var h = decodeURIComponent(location.hash.slice(1)); if (!h) return null;
    var parts = h.split('/'), id = parts[0];
    var path = parts.slice(1).filter(function (x) { return x !== ''; }).map(Number).filter(function (n) { return n >= 0; });
    var al = DATA.alias[id];
    if (al) {                                             // ancienne ancre d'un besoin : on la réécrit sous son thème
      id = al[0]; path = [al[1]].concat(path);
      history.replaceState(null, '', hashOf(id, path));
    }
    if (!J[id]) return null;
    return { id: id, path: path };
  }
  function walk(j, path) {
    var qid = j.start, steps = [];
    for (var i = 0; i < path.length; i++) {
      var q = j.q[qid], o = q && q.options[path[i]];
      if (!o) break;
      steps.push({ qid: qid, q: q, o: o, i: path[i] });
      if (o.go.indexOf('r:') === 0) return { steps: steps, rid: o.go.slice(2), r: j.r[o.go.slice(2)] };
      qid = o.go;
    }
    return { steps: steps, qid: qid, q: j.q[qid] };
  }
  var hashOf = function (id, path) { return '#' + id + (path.length ? '/' + path.join('/') : ''); };

  /* ---------------------------------------------------------------- rendu d'une étape */
  function linkHTML(l, primary) {
    var ext = !l.url, href = ext ? l.href : ROOT + l.url;
    return '<a class="' + (primary ? 'btn btn-primary jv-go' : 'jv-link') + '" href="' + esc(href) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' +
      '<span>' + esc(l.label) + '</span>' + (ext ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8M18 14v5H5V6h5"/></svg><span class="sr-only"> (site externe, nouvelle fenêtre)</span>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>') + '</a>';
  }
  var TODAY = new Date().toISOString().slice(0, 10);
  var alive = function (x) { return !(x && typeof x === 'object' && x.u && x.u < TODAY); };   // éléments datés : masqués une fois passés
  var html = function (x) { return typeof x === 'object' ? x.h : x; };
  function resultHTML(j, r, path) {
    r = Object.assign({}, r, { points: r.points.filter(alive).map(html), steps: r.steps.filter(alive).map(html), links: r.links.filter(alive) });
    var internal = r.links.filter(function (l) { return l.url; }), others = r.links.filter(function (l) { return l !== internal[0]; });
    return '<article class="jv-res">' +
      '<p class="jv-res-k">Votre réponse</p><h2 class="jv-h" tabindex="-1">' + esc(r.title) + '</h2>' +
      (r.lead ? '<p class="jv-res-lead">' + esc(r.lead) + '</p>' : '') +
      (r.points.length ? '<h3 class="jv-sub">L’essentiel</h3><ul class="jv-points">' + r.points.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ul>' : '') +
      (r.steps.length ? '<h3 class="jv-sub">Les étapes</h3><ol class="jv-steps">' + r.steps.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ol>' : '') +
      (r.contact ? '<div class="jv-contact"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5 9 3l2 4.6-2.2 1.5a11 11 0 0 0 6.1 6.1l1.5-2.2 4.6 2-.5 2.4a2 2 0 0 1-2 1.6A16.5 16.5 0 0 1 5 5.5a2 2 0 0 1 1.6-2z"/></svg><p>' + r.contact + '</p></div>' : '') +
      '<div class="jv-links">' + (internal[0] ? linkHTML(internal[0], true) : '') + others.map(function (l) { return linkHTML(l, false); }).join('') + '</div>' +
      '<div class="jv-again"><a class="jv-restart" href="' + hashOf(j.id, path.slice(0, 1)) + '">Recommencer ce parcours</a><a class="jv-other" href="#">Un autre besoin</a>' +
      (r.src && r.src[0] ? '<p class="jv-src">Réponse tirée de la page <a href="' + ROOT + r.src[0] + '">' + esc(r.src[0].replace(/\/$/, '').split('/').pop().replace(/-/g, ' ')) + '</a> du site.</p>' : '') + '</div>' +
      '</article>';
  }
  function stepHTML(j, w, path) {
    var out = '<ol class="jv-trail">';
    w.steps.forEach(function (s, k) {
      out += '<li class="jv-step is-done" data-k="' + k + '"><span class="jv-node" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-9" pathLength="1"/></svg></span><span class="jv-seg" aria-hidden="true"></span>' +
        '<p class="jv-q-done">' + esc(s.q.text) + '</p><p class="jv-a-done"><span class="sr-only">Votre réponse : </span>' + esc(s.o.label) + '</p>' +
        '<a class="jv-edit" href="' + hashOf(j.id, path.slice(0, k)) + '">Modifier<span class="sr-only"> la réponse « ' + esc(s.o.label) + ' »</span></a></li>';
    });
    if (w.r) {
      out += '<li class="jv-step is-res"><span class="jv-node jv-node-ok" aria-hidden="true"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" pathLength="1"/><path d="M12 20.5l5.5 5.5L28.5 14" pathLength="1"/></svg></span>' + resultHTML(j, w.r, path) + '</li>';
    } else {
      var n = w.steps.length;
      out += '<li class="jv-step is-now"><span class="jv-node" aria-hidden="true"><span>' + (n + 1) + '</span></span>' +
        '<div class="jv-qbox" role="group" aria-labelledby="jv-qt"><h2 class="jv-h" id="jv-qt" tabindex="-1">' + esc(w.q.text) + '</h2><div class="jv-opts">' +
        w.q.options.map(function (o, i) {
          return '<a class="jv-opt' + (o.icon ? ' has-ico' : '') + '" href="' + hashOf(j.id, path.slice(0, n).concat(i)) + '" style="--o:' + i + '">' + (o.icon ? svgIco(o.icon) : '') + '<span class="jv-opt-t">' + esc(o.label) + '</span>' +
            (o.hint ? '<span class="jv-opt-h">' + esc(o.hint) + '</span>' : '') + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg></a>';
        }).join('') + '</div></div></li>';
    }
    return out + '</ol>';
  }
  function shell(j) {
    stage.innerHTML = '<div class="jv-bar"><a class="jv-back" href="#"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H6M11 6l-6 6 6 6"/></svg>Tous les thèmes</a>' +
      '<p class="jv-sel">' + svgIco(j.icon) + '<span><small>Je veux…</small><b></b></span></p></div>' +
      '<div class="jv-flow" aria-live="polite"></div>';
    stage.setAttribute('data-j', j.id);
  }
  /* ce que l'usager veut, au point où il en est : le thème, puis le besoin dès qu'il l'a choisi */
  function wish(j, path) {
    var o = path.length ? j.q[j.start].options[path[0]] : null;
    return o ? { label: o.label.replace(/^…/, ''), icon: o.icon } : { label: j.label, icon: j.icon };
  }
  function setSel(w, redraw) {                           // rappel à droite de la barre : pictogramme et libellé
    var sel = $('.jv-sel', stage), ico = sel.querySelector('.jv-ico'), b = sel.querySelector('b');
    if (b.textContent === w.label) return;
    b.textContent = w.label;
    if (ico.getAttribute('data-ico') !== w.icon) { ico.innerHTML = ICONS[w.icon] || ''; ico.setAttribute('data-ico', w.icon); if (redraw) draw(ico, { dur: 420, step: 60 }); }
  }

  /* ---------------------------------------------------------------- animations d'étape */
  function growSeg(li, delay) {                          // le trait descend jusqu'à l'étape suivante
    var seg = li && li.querySelector('.jv-seg'); if (!seg || !anim) return 0;
    seg.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 420, delay: delay || 0, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'backwards' });
    var tick = li.querySelector('.jv-node path');
    if (tick) tick.animate([{ strokeDashoffset: 1, opacity: 0 }, { opacity: 1, offset: .06 }, { strokeDashoffset: 0, opacity: 1 }], { duration: 360, delay: (delay || 0), easing: EASE, fill: 'backwards' });
    return 420;
  }
  function enterStep(li, delay) {
    if (!anim || !li) return;
    var node = li.querySelector('.jv-node');
    node.animate([{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 520, delay: delay, easing: BACK, fill: 'backwards' });
    var box = li.querySelector('.jv-qbox, .jv-res');
    box.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 640, delay: delay + 60, easing: EASE, fill: 'backwards' });
    $$('.jv-opt', li).forEach(function (o, i) {
      o.animate([{ opacity: 0, transform: 'translateX(-14px)' }, { opacity: 1, transform: 'none' }], { duration: 480, delay: delay + 180 + i * 70, easing: EASE, fill: 'backwards' });
    });
    if (li.classList.contains('is-res')) celebrate(li, delay);
  }
  function celebrate(li, delay) {                        // coche dessinée, rayon à 45°, gerbe d'étincelles
    var ok = li.querySelector('.jv-node-ok');
    $$('circle, path', ok).forEach(function (p, k) {
      p.animate([{ strokeDashoffset: 1, opacity: 0 }, { opacity: 1, offset: .06 }, { strokeDashoffset: 0, opacity: 1 }], { duration: k ? 380 : 620, delay: delay + (k ? 520 : 0), easing: 'cubic-bezier(.65,0,.35,1)', fill: 'backwards' });
    });
    var res = li.querySelector('.jv-res');
    var ray = document.createElement('span'); ray.className = 'jv-ray'; ray.setAttribute('aria-hidden', 'true'); res.appendChild(ray);
    ray.animate([{ transform: 'translateX(-120%) skewX(-45deg)', opacity: 0 }, { opacity: 1, offset: .25 }, { transform: 'translateX(220%) skewX(-45deg)', opacity: 0 }],
      { duration: 1100, delay: delay + 420, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'both' }).onfinish = function () { ray.remove(); };
    $$('.jv-points li, .jv-steps li', res).forEach(function (p, i) {
      p.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 460, delay: delay + 380 + i * 65, easing: EASE, fill: 'backwards' });
    });
    var go = res.querySelector('.jv-go');
    if (go) go.animate([{ transform: 'scale(.86)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 560, delay: delay + 700, easing: BACK, fill: 'backwards' });
    setTimeout(function () { sparks(ok); }, delay + 560);
  }
  function sparks(anchor) {                              // Canvas 2D : une gerbe, puis plus rien
    if (!anim || !anchor) return;
    var r = anchor.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1), S = 260;
    var c = document.createElement('canvas'); c.className = 'jv-sparks'; c.setAttribute('aria-hidden', 'true');
    c.width = S * dpr; c.height = S * dpr; c.style.width = c.style.height = S + 'px';
    c.style.left = (r.left + scrollX + r.width / 2 - S / 2) + 'px'; c.style.top = (r.top + scrollY + r.height / 2 - S / 2) + 'px';
    document.body.appendChild(c);
    var g = c.getContext('2d'); g.scale(dpr, dpr);
    var cols = ['#E14248', '#E14248', '#5E3A4F', '#C6B09C'], P = [];
    for (var i = 0; i < 34; i++) {
      var base = [-45, 135, -135, 45][i % 4] * Math.PI / 180, a = base + (Math.random() - .5) * 1.1, v = 55 + Math.random() * 70;
      P.push({ a: a, v: v, len: 4 + Math.random() * 9, w: 1.2 + Math.random() * 1.6, c: cols[i % cols.length], d: Math.random() * 90 });
    }
    var t0 = performance.now(), D = 900;
    (function frame(now) {
      var t = now - t0; g.clearRect(0, 0, S, S);
      P.forEach(function (p) {
        var u = Math.max(0, Math.min(1, (t - p.d) / D)); if (!u || u >= 1) return;
        var e = 1 - Math.pow(1 - u, 3), rad = 18 + p.v * e, x = S / 2 + Math.cos(p.a) * rad, y = S / 2 + Math.sin(p.a) * rad;
        g.globalAlpha = (1 - u) * (1 - u); g.strokeStyle = p.c; g.lineWidth = p.w; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x, y); g.lineTo(x - Math.cos(p.a) * p.len * (1 - u * .6), y - Math.sin(p.a) * p.len * (1 - u * .6)); g.stroke();
      });
      if (t < D + 100) requestAnimationFrame(frame); else c.remove();
    })(t0);
  }
  function flyIcon(fromSvg, a, toSvg) {                   // FLIP : le pictogramme de la carte rejoint l'en-tête du parcours
    if (!anim || !fromSvg || !toSvg || !a) return;
    var b = toSvg.getBoundingClientRect();
    if (!a.width || !b.width) return;
    var ghost = fromSvg.cloneNode(true); ghost.classList.add('jv-ghost');
    ghost.style.left = (b.left + scrollX) + 'px'; ghost.style.top = (b.top + scrollY) + 'px'; ghost.style.width = b.width + 'px'; ghost.style.height = b.height + 'px';
    document.body.appendChild(ghost);
    toSvg.style.opacity = 0;
    var dx = a.left - (b.left + scrollX), dy = a.top - (b.top + scrollY), s = a.width / b.width;
    ghost.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')' }, { transform: 'translate(' + dx * .35 + 'px,' + (dy * .35 - 40) + 'px) scale(' + (1 + (s - 1) * .5) + ') rotate(-8deg)', offset: .45 }, { transform: 'none' }],
      { duration: 760, easing: 'cubic-bezier(.45,0,.2,1)' }).onfinish = function () { ghost.remove(); toSvg.style.opacity = ''; draw(toSvg, { dur: 420, step: 60 }); };
  }

  /* ---------------------------------------------------------------- navigation */
  var state = null;
  function showGrid(fromId) {
    document.title = TITLE;
    if (!stage.hidden) {
      var go = function () { stage.hidden = true; stage.innerHTML = ''; };
      if (anim) stage.animate([{ clipPath: 'polygon(-30% 0%, 140% 0%, 140% 100%, 0% 100%)' }, { clipPath: 'polygon(140% 0%, 140% 0%, 140% 100%, 170% 100%)' }], { duration: 380, easing: 'cubic-bezier(.6,0,.3,1)' }).onfinish = go; else go();   // sortie par la découpe à 45° du splash
    }
    $('.jv-find').hidden = false; other.hidden = false;
    filter();                                             // thèmes, ou besoins trouvés si le champ est rempli
    if (fromId && anim && !grid.hidden) $$('.jv-grid > li').forEach(function (li, i) {
      li.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 560, delay: 120 + i * 35, easing: EASE, fill: 'backwards' });
    });
    typeTo('…', true);
    if (fromId && !grid.hidden) { var back = $('.jv-card[data-j="' + fromId + '"]'); if (back) { back.focus({ preventScroll: true }); back.scrollIntoView({ block: 'center', behavior: anim ? 'smooth' : 'auto' }); } }
  }
  function render(next, first) {
    var prev = state; state = next;
    if (!next) { showGrid(prev && prev.id); return; }
    var j = J[next.id], w = walk(j, next.path), path = w.steps.map(function (s) { return s.i; });
    var opening = !prev || prev.id !== next.id;
    var forward = !opening && path.length > prev.path.length && prev.path.every(function (v, i) { return path[i] === v; });
    state.path = path;
    var w0 = wish(j, path);
    document.title = 'Je veux ' + w0.label + ' – CCBA';
    var card = $('.jv-card[data-j="' + j.id + '"]'), fromIcon = card && card.querySelector('.jv-ico');
    var cr = fromIcon ? fromIcon.getBoundingClientRect() : null, cardRect = cr && cr.width ? { left: cr.left + scrollX, top: cr.top + scrollY, width: cr.width } : null;
    if (opening) {
      shell(j);
      grid.hidden = true; hits.hidden = true; other.hidden = true; $('.jv-find').hidden = true;
      stage.hidden = false;
    }
    setSel(w0, !opening);
    typeTo(w0.label, true);
    var flow = $('.jv-flow', stage), oldCount = $$('.jv-step', flow).length;
    flow.innerHTML = stepHTML(j, w, path);
    var steps = $$('.jv-step', flow), last = steps[steps.length - 1];
    if (opening) {
      if (anim) {
        stage.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 620, easing: EASE });
        if (cardRect && !first) flyIcon(fromIcon, cardRect, $('.jv-sel .jv-ico', stage)); else draw($('.jv-sel .jv-ico', stage), { delay: 200 });
        steps.forEach(function (li, k) { if (li !== last) growSeg(li, 200 + k * 160); });
        enterStep(last, 260 + (steps.length - 1) * 160);
      }
    } else if (forward) {
      var d0 = growSeg(steps[steps.length - 2], 0);
      enterStep(last, d0 - 120);
    } else enterStep(last, 0);
    // focus sur la question ou la réponse, puis défilement doux
    var h = $('.jv-h', last);
    if (h) h.focus({ preventScroll: true });
    var target = opening ? stage : last, rect = target.getBoundingClientRect();
    var hdr = (document.querySelector('.site-header, header') || {}).offsetHeight || 130;
    if (rect.top < hdr + 10 || rect.top > innerHeight * .55) window.scrollTo({ top: scrollY + rect.top - hdr - 24, behavior: anim && !first ? 'smooth' : 'auto' });
  }
  window.addEventListener('hashchange', function () { render(parse()); });

  /* clics : ondulation sur la réponse choisie, puis étape suivante */
  root.addEventListener('pointerdown', function (e) {
    var o = e.target.closest('.jv-opt, .jv-card[data-j], .jv-hit'); if (!o) return;
    var r = o.getBoundingClientRect();
    o.style.setProperty('--px', (e.clientX - r.left) + 'px'); o.style.setProperty('--py', (e.clientY - r.top) + 'px');
  });
  root.addEventListener('click', function (e) {
    var o = e.target.closest('.jv-opt');
    if (o && anim && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      if (!o.style.getPropertyValue('--px')) { o.style.setProperty('--px', '50%'); o.style.setProperty('--py', '50%'); }
      o.classList.add('is-press');
      $$('.jv-opt', o.parentNode).forEach(function (x) { if (x !== o) x.animate([{ opacity: 1 }, { opacity: .35 }], { duration: 220, fill: 'forwards' }); });
      setTimeout(function () { location.hash = o.getAttribute('href'); }, 230);
      return;
    }
    var b = e.target.closest('.jv-back, .jv-other');
    if (b) { e.preventDefault(); history.pushState(null, '', location.pathname + location.search); render(null); }
  });
  /* survol d'une carte : son pictogramme se redessine */
  if (anim && window.matchMedia('(hover: hover)').matches) $$('.jv-card[data-j]').forEach(function (a) {
    var busy = false;
    a.addEventListener('pointerenter', function () { if (busy) return; busy = true; draw(a.querySelector('.jv-ico'), { dur: 480, step: 70 }); setTimeout(function () { busy = false; }, 900); });
  });

  /* ---------------------------------------------------------------- départ */
  var init = parse();
  if (init) { typed.textContent = wish(J[init.id], init.path).label; caret.classList.add('is-rest'); render(init, true); }
  else {
    if (anim) {
      $$('.jv-trait path').forEach(function (p, k) { p.animate([{ strokeDashoffset: 1, opacity: 0 }, { opacity: 1, offset: .06 }, { strokeDashoffset: 0, opacity: 1 }], { duration: k ? 520 : 1400, delay: k ? 1500 : 250, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'backwards' }); });
      $$('.jv-grid > li').forEach(function (li, i) {
        li.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay: 300 + i * 55, easing: EASE, fill: 'backwards' });
        draw(li.querySelector('.jv-ico'), { delay: 520 + i * 55, dur: 700 });
      });
      typed.textContent = '';
      demo();
    } else caret.classList.add('is-rest');
  }
});
