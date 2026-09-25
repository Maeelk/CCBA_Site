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
    var open = weekday && ((m >= 510 && m < 720) || (m >= 840 && m < 1050));
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
   France Services : état d'ouverture en direct + frise horaire (8h–18h).
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
    var st = row.querySelector('[data-fs-status]'), track = row.querySelector('.fs-track');
    track.innerHTML = '';
    list.forEach(function (r) {
      var a = mins(r[0]), b = mins(r[1]), s = document.createElement('span');
      s.className = 'fs-slot'; s.style.left = ((a - 480) / 600 * 100) + '%'; s.style.width = ((b - a) / 600 * 100) + '%';
      track.appendChild(s);
    });
    if (live && n.m >= 480 && n.m <= 1080) { var c = document.createElement('i'); c.className = 'fs-now'; c.style.left = ((n.m - 480) / 600 * 100) + '%'; track.appendChild(c); }
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
