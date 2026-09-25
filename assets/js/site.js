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

  /* ---------- Vidéo d'accueil (chargée seulement si pertinent) ---------- */
  var video = $('.hero-video'), vbtn = $('.video-toggle');
  if (video) {
    var conn = navigator.connection || {};
    var light = conn.saveData || /2g/.test(conn.effectiveType || '');
    if (!reduce && !light) {
      var src = window.matchMedia('(max-width: 768px)').matches ? video.dataset.srcMobile : video.dataset.srcDesktop;
      video.src = src;
      video.addEventListener('playing', function () { video.classList.add('is-playing'); vbtn.hidden = false; });
      video.addEventListener('error', function () { video.remove(); vbtn && vbtn.remove(); });
      var p = video.play(); if (p && p.catch) p.catch(function () {});
      vbtn.addEventListener('click', function () {
        if (video.paused) { video.play(); vbtn.setAttribute('aria-pressed', 'false'); }
        else { video.pause(); vbtn.setAttribute('aria-pressed', 'true'); }
      });
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
