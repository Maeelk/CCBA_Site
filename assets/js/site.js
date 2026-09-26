/* CCBA – scripts du site (vanilla JS, aucune dépendance, compatible GitHub Pages) */
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

  /* ---------- Apparition au défilement ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) {
      var sibs = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.setProperty('--d', Math.min(sibs, 6) * 0.07 + 's');
      io.observe(el);
    });
  } else { reveals.forEach(function (el) { el.classList.add('is-in'); }); }

  /* ---------- Images indisponibles -> motif de remplacement ---------- */
  function broken(img) { img.classList.add('is-broken'); img.setAttribute('aria-hidden', 'true'); }
  $$('img').forEach(function (img) {
    var ok = function () { img.classList.add('is-loaded'); };
    if (img.complete) { if (img.naturalWidth === 0 && img.src) broken(img); else ok(); }
    img.addEventListener('load', ok);
    img.addEventListener('error', function () { broken(img); if (!img.closest('.ph')) img.style.display = 'none'; });
  });

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
        var poly = a.querySelector('polygon').getBoundingClientRect(), box = wrap.getBoundingClientRect();
        tip.textContent = name;
        tip.style.left = (poly.left - box.left + poly.width / 2) + 'px';
        tip.style.top = (poly.top - box.top + poly.height / 2) + 'px';
        tip.classList.add('is-on');
        $$('#liste-communes a').forEach(function (l) { l.classList.toggle('is-hl', l.textContent === name); });
      }
      function hide() { tip && tip.classList.remove('is-on'); $$('#liste-communes a.is-hl').forEach(function (l) { l.classList.remove('is-hl'); }); }
      a.addEventListener('mouseenter', show); a.addEventListener('focus', show);
      a.addEventListener('mouseleave', hide); a.addEventListener('blur', hide);
    });
  });
  $$('#liste-communes a').forEach(function (l) {
    l.addEventListener('mouseenter', function () { var m = $('.communes-map .m-commune[data-name="' + l.textContent.replace(/"/g, '\\"') + '"] polygon'); if (m) m.style.fill = 'var(--peche)'; });
    l.addEventListener('mouseleave', function () { $$('.communes-map polygon').forEach(function (p) { p.style.fill = ''; }); });
  });

  /* ---------- Sélecteurs « aller à » ---------- */
  $$('form[data-goto]').forEach(function (f) {
    f.addEventListener('submit', function (e) { e.preventDefault(); var v = f.querySelector('select').value; if (v) location.href = v; });
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
  $$('[data-upcoming]').forEach(function (grid) {
    var lim = parseInt(grid.getAttribute('data-limit') || '0', 10), shown = 0;
    $$('.ev-card', grid).forEach(function (c) {
      var ok = c.getAttribute('data-end') >= iso && (!lim || shown < lim);
      c.hidden = !ok; if (ok) shown++;
    });
    var empty = grid.parentElement.querySelector('[data-empty]');
    if (!shown && empty) { empty.hidden = false; grid.hidden = true; }
  });

  /* ---------- Carrousel (scroll-snap) ---------- */
  $$('[data-carousel]').forEach(function (car) {
    var sec = car.closest('section');
    function step(dir) { var s = car.querySelector('.slide'); car.scrollBy({ left: dir * (s ? s.getBoundingClientRect().width + 22 : 300), behavior: reduce ? 'auto' : 'smooth' }); }
    $$('[data-car]', sec).forEach(function (b) { b.addEventListener('click', function () { step(b.getAttribute('data-car') === 'next' ? 1 : -1); }); });
    car.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); step(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); } });
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

  /* ---------- Moteur de recherche (index JSON statique) ---------- */
  var results = $('#search-results');
  if (results) {
    var qInput = $('#q-page'), status = $('#search-status');
    var q = new URLSearchParams(location.search).get('q') || '';
    qInput.value = q;
    var escH = function (s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var run = function (data) {
      var terms = norm(q).split(/\s+/).filter(function (t) { return t.length > 1; });
      if (!terms.length) { status.textContent = 'Saisissez un ou plusieurs mots-clés.'; return; }
      var scored = [];
      data.forEach(function (d) {
        var t = norm(d.t), x = norm(d.x), k = norm(d.k || ''), r = norm(d.r || ''), s = 0, all = true;
        terms.forEach(function (w) {
          var hit = 0;
          if (t.indexOf(w) > -1) hit += (t.indexOf(w) === 0 ? 14 : 10);
          if (k.indexOf(w) > -1) hit += 5;
          if (r.indexOf(w) > -1) hit += 3;
          if (x.indexOf(w) > -1) hit += 2;
          if (!hit) all = false; s += hit;
        });
        if (s && all) { if (d.r === 'Actualité' || d.r === 'Agenda') s -= 3; scored.push([s, d]); }
      });
      scored.sort(function (a, b) { return b[0] - a[0]; });
      var hl = function (s) { var out = escH(s); terms.forEach(function (w) { out = out.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'), '<mark>$1</mark>'); }); return out; };
      status.textContent = scored.length ? scored.length + ' résultat' + (scored.length > 1 ? 's' : '') + ' pour « ' + q + ' »' : 'Aucun résultat pour « ' + q + ' ». Essayez un autre mot-clé ou consultez le plan du site.';
      results.innerHTML = scored.slice(0, 60).map(function (e) {
        var d = e[1];
        return '<li><span class="r-cat">' + escH(d.r || 'Page') + '</span><a href="' + ROOT + d.u + (d.u ? '/' : '') + '">' + hl(d.t) + '</a><p>' + escH(d.x || '') + '</p></li>';
      }).join('');
    };
    if (q) {
      status.textContent = 'Recherche en cours…';
      fetch(ROOT + 'search-index.json').then(function (r) { return r.json(); }).then(run).catch(function () { status.textContent = 'La recherche est momentanément indisponible.'; });
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

  /* Carte : bascule population */
  $$('[data-choro]').forEach(function (b) {
    var wrap = b.closest('.communes-map'), legend = wrap.querySelector('.map-legend');
    b.addEventListener('click', function () {
      var on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', String(on));
      wrap.classList.toggle('is-choro', on); legend.hidden = !on;
    });
  });

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
    if (cap) { cap.hidden = false; cap.innerHTML = '<span class="sc-l">Soleil sur Aubenas · </span>lever ' + fmt(t.rise) + ' · coucher ' + fmt(t.set); }
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

/* Projet de territoire : rosace + onglets accessibles (flèches, Début, Fin) */
(function () {
  var root = document.querySelector('[data-or-root]');
  if (!root) return;
  var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
  var panels = Array.prototype.slice.call(root.querySelectorAll('[data-orp]'));
  var segs = Array.prototype.slice.call(root.querySelectorAll('.seg'));
  var big = root.querySelector('[data-or-big]');
  root.classList.add('is-js');
  function select(i, focus) {
    tabs.forEach(function (t, k) { var on = k === i; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
    panels.forEach(function (p, k) { p.hidden = k !== i; });
    segs.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
    if (big) big.textContent = String(i + 1).padStart(2, '0');
    if (focus) tabs[i].focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(i); });
    t.addEventListener('keydown', function (e) {
      var k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (k) { e.preventDefault(); select((i + k + tabs.length) % tabs.length, true); }
      if (e.key === 'Home') { e.preventDefault(); select(0, true); }
      if (e.key === 'End') { e.preventDefault(); select(tabs.length - 1, true); }
    });
  });
  segs.forEach(function (s, i) {
    s.addEventListener('click', function () { select(i); });
    s.addEventListener('mouseenter', function () { s.classList.add('is-hover'); });
    s.addEventListener('mouseleave', function () { s.classList.remove('is-hover'); });
  });
  select(0);
})();

/* Orientations : panneaux dépliants (un seul ouvert à la fois) */
(function () {
  var root = document.querySelector('[data-orx]');
  if (!root) return;
  var ps = Array.prototype.slice.call(root.querySelectorAll('.orx-p'));
  root.classList.add('is-js');
  function open(i, focus) {
    ps.forEach(function (p, k) {
      var on = k === i; p.classList.toggle('is-open', on);
      p.querySelector('.orx-b').setAttribute('aria-expanded', String(on));
    });
    if (focus) ps[i].querySelector('.orx-b').focus();
  }
  ps.forEach(function (p, i) {
    var b = p.querySelector('.orx-b');
    b.addEventListener('click', function () { open(i); });
    b.addEventListener('keydown', function (e) {
      var k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (k) { e.preventDefault(); open((i + k + ps.length) % ps.length, true); }
    });
  });
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
  polys.forEach(function (a) { a.addEventListener('mouseenter', function () { show(a); }); a.addEventListener('focus', function () { show(a); }); });
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
      if (!rules) return '<li><span class="mc-t">' + label + '</span><span class="mc-v"><a href="' + ROOT + D.cu + '">voir les jours de collecte</a></span></li>';
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
  function all() { var v = get(); boxes.forEach(function (b, i) { b._id = i; render(b, v); }); }
  all();
})();

/* ==========================================================================
   Recherche instantanée : suggestions pendant la frappe (combobox accessible)
   et raccourci clavier « / » pour rechercher depuis n'importe quelle page.
   ========================================================================== */
(function () {
  var ROOT = document.body.getAttribute('data-root') || './';
  var inputs = ['q-top', 'q-hero'].map(function (id) { return document.getElementById(id); }).filter(Boolean);
  var DATA = null, loading = null;
  var norm = function (s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' '); };
  var escH = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function load() {
    if (DATA || loading) return loading;
    loading = fetch(ROOT + 'search-index.json').then(function (r) { return r.json(); }).then(function (d) { DATA = d; return d; }).catch(function () { loading = null; });
    return loading;
  }
  function search(q) {
    var terms = norm(q).split(/\s+/).filter(function (t) { return t.length > 1; });
    if (!terms.length || !DATA) return [];
    var out = [];
    DATA.forEach(function (d) {
      var t = norm(d.t), x = norm(d.x), k = norm(d.k || ''), r = norm(d.r || ''), s = 0, all = true;
      terms.forEach(function (w) {
        var hit = 0;
        if (t.indexOf(w) > -1) hit += (t.indexOf(w) === 0 ? 14 : 10);
        if (k.indexOf(w) > -1) hit += 5;
        if (r.indexOf(w) > -1) hit += 3;
        if (x.indexOf(w) > -1) hit += 2;
        if (!hit) all = false; s += hit;
      });
      if (s && all) { if (d.r === 'Actualité' || d.r === 'Agenda') s -= 4; out.push([s, d]); }
    });
    out.sort(function (a, b) { return b[0] - a[0]; });
    return out.slice(0, 6).map(function (e) { return e[1]; });
  }
  var hl = function (s, q) {
    var out = escH(s);
    norm(q).split(/\s+/).filter(function (t) { return t.length > 1; }).forEach(function (w) {
      var src = norm(s), i = src.indexOf(w);
      if (i > -1) { var seg = s.substr(i, w.length); out = out.replace(escH(seg), '<mark>' + escH(seg) + '</mark>'); }
    });
    return out;
  };
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
      var res = search(q); items = res;
      var html = res.map(function (d, i) {
        return '<li role="option" id="' + list.id + '-' + i + '" aria-selected="false"><a href="' + ROOT + d.u + (d.u ? '/' : '') + '" tabindex="-1"><span class="sg-t">' + hl(d.t, q) + '</span><span class="sg-r">' + escH(d.r || 'Page') + '</span></a></li>';
      }).join('');
      html += res.length ? '<li role="option" class="sg-all" id="' + list.id + '-all" aria-selected="false"><a href="' + form.getAttribute('action') + '?q=' + encodeURIComponent(q) + '" tabindex="-1">Tous les résultats pour « ' + escH(q) + ' »</a></li>'
                         : '<li class="sg-empty">Aucune suggestion : appuyez sur Entrée pour lancer la recherche.</li>';
      list.innerHTML = html; list.hidden = false; inp.setAttribute('aria-expanded', 'true'); active = -1;
    }
    inp.addEventListener('focus', load);
    inp.addEventListener('input', function () { var p = load(); if (DATA) render(); else if (p) p.then(render); });
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
