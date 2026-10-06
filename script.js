/* ==========================================================================
   Portfolio — scripts (vanilla JS, chargé en defer)
   0. Langue (FR/EN)  1. Thème clair/sombre  2. Menu mobile  3. Header au scroll
   4. Apparition au scroll  5. Lien de nav actif  6. Formulaire mailto  7. Année
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 0. LANGUE (FR/EN) --------------------------------------------------------
     Dictionnaire fourni par i18n.js (window.I18N). Éléments marqués :
       data-i18n="clé"       -> textContent
       data-i18n-html="clé"  -> innerHTML (contenu statique de confiance)
       data-i18n-attrs='{"aria-label":"clé", "alt":"clé"}' -> attributs
     ------------------------------------------------------------------------- */
  var LANGS = ['fr', 'en'];
  var DEFAULT_LANG = 'fr';
  var OG_LOCALE = { fr: 'fr_FR', en: 'en_US' };
  var currentLang = DEFAULT_LANG;

  function dict(lang) { return (window.I18N && window.I18N[lang]) || {}; }

  function storedLang() {
    try { return localStorage.getItem('lang'); } catch (e) { return null; }
  }

  function urlLang() {
    try {
      var p = new URLSearchParams(window.location.search).get('lang');
      return LANGS.indexOf(p) !== -1 ? p : null;
    } catch (e) { return null; }
  }

  function resolveInitialLang() {
    var fromUrl = urlLang();
    if (fromUrl) return fromUrl;
    var stored = storedLang();
    if (stored && LANGS.indexOf(stored) !== -1) return stored;
    return DEFAULT_LANG;
  }

  function applyLanguage(lang) {
    if (LANGS.indexOf(lang) === -1) lang = DEFAULT_LANG;
    currentLang = lang;
    var d = dict(lang);

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (d[key] !== undefined) el.textContent = d[key];
    });

    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      if (d[key] !== undefined) el.innerHTML = d[key];
    });

    document.querySelectorAll('[data-i18n-attrs]').forEach(function (el) {
      var map;
      try { map = JSON.parse(el.getAttribute('data-i18n-attrs')); } catch (e) { return; }
      Object.keys(map).forEach(function (attr) {
        var key = map[attr];
        if (d[key] !== undefined) el.setAttribute(attr, d[key]);
      });
    });

    document.querySelectorAll('[data-cv-fr]').forEach(function (el) {
      el.setAttribute('href', el.getAttribute(lang === 'en' ? 'data-cv-en' : 'data-cv-fr'));
    });

    root.setAttribute('lang', lang);

    var ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) ogLocale.setAttribute('content', OG_LOCALE[lang] || 'fr_FR');

    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-lang') === lang));
    });

    syncThemeButton();
    syncNavToggleLabel();

    try { localStorage.setItem('lang', lang); } catch (e) { /* stockage indisponible */ }

    try {
      var url = new URL(window.location.href);
      url.searchParams.set('lang', lang);
      window.history.replaceState(null, '', url.toString());
    } catch (e) { /* URL non manipulable (ex. file://) */ }
  }

  var langSwitch = document.querySelector('.lang-switch');
  if (langSwitch) {
    langSwitch.addEventListener('click', function (e) {
      var btn = e.target.closest('.lang-btn');
      if (!btn) return;
      var lang = btn.getAttribute('data-lang');
      if (LANGS.indexOf(lang) !== -1 && lang !== currentLang) applyLanguage(lang);
    });
  }

  /* 1. THÈME ---------------------------------------------------------------- */
  var themeBtn = document.querySelector('.theme-toggle');

  function storedTheme() {
    try { return localStorage.getItem('theme'); } catch (e) { return null; }
  }

  function currentTheme() {
    var t = root.getAttribute('data-theme');
    if (t === 'light' || t === 'dark') return t;
    return darkQuery.matches ? 'dark' : 'light';
  }

  function syncThemeButton() {
    if (!themeBtn) return;
    var isDark = currentTheme() === 'dark';
    var d = dict(currentLang);
    themeBtn.setAttribute('aria-pressed', String(isDark));
    themeBtn.setAttribute('aria-label', isDark ? d['theme.ariaLight'] : d['theme.ariaDark']);
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) { /* stockage indisponible */ }
      syncThemeButton();
    });
  }

  // Suit la préférence système tant que l'utilisateur n'a rien choisi
  var onSchemeChange = function () { if (!storedTheme()) syncThemeButton(); };
  if (darkQuery.addEventListener) darkQuery.addEventListener('change', onSchemeChange);
  else if (darkQuery.addListener) darkQuery.addListener(onSchemeChange);

  syncThemeButton();

  /* 2. MENU MOBILE ---------------------------------------------------------- */
  var navToggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');

  function syncNavToggleLabel() {
    if (!navToggle || !nav) return;
    var d = dict(currentLang);
    var open = nav.classList.contains('is-open');
    navToggle.setAttribute('aria-label', open ? d['navToggle.close'] : d['navToggle.open']);
  }

  function closeNav() {
    if (!nav || !navToggle) return;
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    syncNavToggleLabel();
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
      syncNavToggleLabel();
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        closeNav();
        navToggle.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target) && !navToggle.contains(e.target)) {
        closeNav();
      }
    });

    window.matchMedia('(min-width: 901px)').addEventListener('change', function (e) {
      if (e.matches) closeNav();
    });
  }

  /* 3. HEADER AU SCROLL ----------------------------------------------------- */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* 4. APPARITION AU SCROLL ------------------------------------------------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  }

  /* 5. LIEN DE NAVIGATION ACTIF --------------------------------------------- */
  var navLinks = nav ? nav.querySelectorAll('a[href^="#"]') : [];
  if (navLinks.length && 'IntersectionObserver' in window) {
    var linkById = {};
    navLinks.forEach(function (a) { linkById[a.getAttribute('href').slice(1)] = a; });

    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.remove('is-active'); a.removeAttribute('aria-current'); });
        var link = linkById[entry.target.id];
        if (link) { link.classList.add('is-active'); link.setAttribute('aria-current', 'true'); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    document.querySelectorAll('main section[id]').forEach(function (s) { sectionObserver.observe(s); });
  }

  /* 6. FORMULAIRE DE CONTACT (mailto:, sans backend) ------------------------ */
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var name = form.elements.nom.value.trim();
      var subject = form.elements.objet.value.trim();
      var message = form.elements.message.value.trim();
      var body = message + '\n\n— ' + name;
      window.location.href = 'mailto:epiphanezongo23@gmail.com'
        + '?subject=' + encodeURIComponent(subject)
        + '&body=' + encodeURIComponent(body);
    });
  }

  /* 7. ANNÉE DU FOOTER ------------------------------------------------------ */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* Initialisation de la langue (après que toutes les sections ci-dessus
     aient référencé leurs éléments DOM) */
  applyLanguage(resolveInitialLang());
})();
