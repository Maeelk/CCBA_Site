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
   Relief : courbes de niveau animées, dessinées en WebGL (aucune dépendance).
   - un champ de hauteur (bruit fractal) animé très lentement ;
   - une « colline » centrée sur le soleil rouge pêche, et une autre sous le curseur ;
   - repli : motif SVG statique si WebGL indisponible ; une seule image si l'usager réduit les animations ;
   - pause hors écran et onglet masqué (économie d'énergie).
   ========================================================================== */
(function () {
  'use strict';
  var list = Array.prototype.slice.call(document.querySelectorAll('canvas[data-relief]'));
  if (!list.length) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FS = [
    '#extension GL_OES_standard_derivatives : enable',
    'precision highp float;',
    'uniform vec2 uRes;uniform float uU;uniform float uT;uniform vec3 uHill;uniform vec3 uCur;uniform float uSeed;uniform float uLv;uniform float uSc;uniform vec3 uCol;uniform vec3 uAcc;uniform float uA;uniform float uRev;',
    'vec3 pm(vec3 x){return mod(((x*34.)+1.)*x,289.);}',
    'float sn(vec2 v){const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod(i,289.);vec3 p=pm(pm(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);m=m*m;m=m*m;vec3 x=2.*fract(p*C.www)-1.;vec3 h=abs(x)-.5;vec3 ox=floor(x+.5);vec3 a0=x-ox;m*=1.79284291400159-.85373472095314*(a0*a0+h*h);vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;return 130.*dot(m,g);}',
    'float fbm(vec2 p){float f=0.,a=.55;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<3;i++){f+=a*sn(p);p=m*p;a*=.38;}return f;}',
    'void main(){',
    ' vec2 uv=gl_FragCoord.xy/uU;',
    ' float t=uT*.018;',
    ' vec2 p=uv*uSc+uSeed*vec2(7.13,-3.71);',
    ' vec2 q=vec2(fbm(p+vec2(0.,t)),fbm(p+vec2(5.2,1.3)-t));',
    ' float h=fbm(p+.32*q+vec2(t*.6,-t*.4))*.5+.5;',
    ' float dh=length(uv-uHill.xy/uU);',
    ' float hill=uHill.z*exp(-dh*dh*3.2);',
    ' float dc=length(uv-uCur.xy/uU);',
    ' float cur=uCur.z*.32*exp(-dc*dc*26.);',
    ' h+=hill+cur;',
    ' float v=h*uLv; float fw=fwidth(v);',
    ' float d=abs(fract(v+.5)-.5)/max(fw,1e-4);',
    ' float k=floor(v+.5); float idx=1.-step(.5,mod(k,5.));',
    ' float ln=1.-smoothstep(mix(.45,.9,idx),mix(1.25,1.9,idx),d);',
    ' ln*=1.-smoothstep(.3,.65,fw);',
    ' float warm=clamp(hill*1.1+cur*2.6,0.,1.);',
    ' vec3 col=mix(uCol,uAcc,warm*warm);',
    ' float a=ln*uA*mix(.55,1.,idx)*mix(1.,1.7,warm*warm);',
    ' a*=1.-smoothstep(uRev-.3,uRev,dh);',
    ' gl_FragColor=vec4(col*a,a);',
    '}'].join('\n');

  function rgb(hex) { var n = parseInt(hex.replace('#', ''), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
  var css = getComputedStyle(document.documentElement);
  var COL = rgb((css.getPropertyValue('--relief-line') || '#B8A08A').trim());
  var ACC = rgb((css.getPropertyValue('--peche') || '#E14248').trim());

  function Relief(cv) {
    var gl = cv.getContext('webgl', { antialias: false, premultipliedAlpha: true, alpha: true, powerPreference: 'low-power' });
    if (!gl || !gl.getExtension('OES_standard_derivatives')) { cv.parentNode.classList.add('relief-fallback'); return null; }
    function sh(type, src) { var o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; }
    var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) { cv.parentNode.classList.add('relief-fallback'); return null; }
    var pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { cv.parentNode.classList.add('relief-fallback'); return null; }
    gl.useProgram(pr);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ['uRes', 'uU', 'uT', 'uHill', 'uCur', 'uSeed', 'uLv', 'uSc', 'uCol', 'uAcc', 'uA', 'uRev'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });
    var ds = cv.dataset;
    gl.uniform1f(U.uSeed, parseFloat(ds.seed || '1'));
    gl.uniform1f(U.uLv, parseFloat(ds.levels || '14'));
    gl.uniform1f(U.uSc, parseFloat(ds.scale || '2'));
    gl.uniform3fv(U.uCol, COL); gl.uniform3fv(U.uAcc, ACC);
    gl.uniform1f(U.uA, parseFloat(ds.alpha || '.5'));
    var anchor = ds.anchor ? document.querySelector(ds.anchor) : null;
    var hillH = parseFloat(ds.hill || '.5');
    var st = { w: 0, h: 0, dpr: 1, cur: [0, 0, 0], curT: [0, 0, 0], on: false, t0: performance.now(), rev: reduce ? 9 : 0, last: 0, raf: 0 };
    function size() {
      var r = cv.getBoundingClientRect();
      st.dpr = Math.min(window.devicePixelRatio || 1, r.width > 1100 ? 1.25 : 1.5);
      var w = Math.max(1, Math.round(r.width * st.dpr)), h = Math.max(1, Math.round(r.height * st.dpr));
      if (w !== st.w || h !== st.h) { st.w = cv.width = w; st.h = cv.height = h; gl.viewport(0, 0, w, h); }
      st.rect = r;
    }
    function hillPos() {
      if (!anchor) return [st.w * .8, st.h * .5];
      var a = anchor.getBoundingClientRect(), r = cv.getBoundingClientRect();
      return [(a.left + a.width / 2 - r.left) * st.dpr, (r.bottom - (a.top + a.height / 2)) * st.dpr];
    }
    function draw(now) {
      var t = (now - st.t0) / 1000;
      if (!reduce) st.rev = Math.min(9, t * 0.9);
      for (var i = 0; i < 3; i++) st.cur[i] += (st.curT[i] - st.cur[i]) * 0.08;
      var hp = hillPos();
      gl.uniform2f(U.uRes, st.w, st.h);
      gl.uniform1f(U.uU, 900 * st.dpr);
      gl.uniform1f(U.uT, reduce ? 0 : t);
      gl.uniform3f(U.uHill, hp[0], hp[1], hillH);
      gl.uniform3f(U.uCur, st.cur[0], st.cur[1], st.cur[2]);
      gl.uniform1f(U.uRev, st.rev);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    function loop(now) {
      st.raf = 0;
      if (!st.on) return;
      if (now - st.last > 48) { st.last = now; draw(now); }
      st.raf = requestAnimationFrame(loop);
    }
    function start() { if (!st.on && !reduce) { st.on = true; st.raf = requestAnimationFrame(loop); } }
    function stop() { st.on = false; if (st.raf) cancelAnimationFrame(st.raf); st.raf = 0; }
    size(); draw(performance.now());
    cv.classList.add('is-on');
    if (reduce) { window.addEventListener('resize', function () { size(); draw(performance.now()); }); return {}; }
    window.addEventListener('resize', size);
    if ('ResizeObserver' in window) new ResizeObserver(size).observe(cv);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es.forEach(function (e) { e.isIntersecting ? start() : stop(); }); }).observe(cv);
    else start();
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    if (fine && ds.interactive !== undefined) {
      var zone = cv.closest('section') || document.body;
      zone.addEventListener('pointermove', function (e) {
        var r = cv.getBoundingClientRect();
        st.curT = [(e.clientX - r.left) * st.dpr, (r.bottom - e.clientY) * st.dpr, 1];
        if (st.cur[2] < 0.01) { st.cur[0] = st.curT[0]; st.cur[1] = st.curT[1]; }
      }, { passive: true });
      zone.addEventListener('pointerleave', function () { st.curT[2] = 0; });
    }
    return st;
  }
  list.forEach(function (cv) { try { Relief(cv); } catch (e) { cv.parentNode.classList.add('relief-fallback'); } });
})();

/* Soleil couchant : le disque rouge pêche descend doucement derrière la crête au défilement */
(function () {
  var sun = document.querySelector('.hero-sun');
  if (!sun || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  var tick = false;
  function upd() { tick = false; var y = Math.min(window.scrollY, 700); sun.style.setProperty('--sink', (y * 0.14).toFixed(1) + 'px'); }
  window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
  upd();
})();

/* Lignes de crête du pied de page : tracé à l'apparition */
(function () {
  var c = document.querySelector('.footer-crest');
  if (!c) return;
  if (!('IntersectionObserver' in window)) { c.classList.add('is-in'); return; }
  var o = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { c.classList.add('is-in'); o.disconnect(); } }); }, { threshold: 0.4 });
  o.observe(c);
})();
