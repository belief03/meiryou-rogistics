/**
 * テーマ初期化（body 直後に配置。クエリ ?theme=keyence|tfc → localStorage と同期）
 */
(function () {
  'use strict';

  var STORAGE = 'meiryou-theme';

  function resolveTheme() {
    var q = new URLSearchParams(window.location.search).get('theme');
    if (q === 'tfc' || q === 'keyence') {
      try {
        localStorage.setItem(STORAGE, q);
      } catch (e) {}
      return q;
    }
    try {
      var s = localStorage.getItem(STORAGE);
      if (s === 'tfc' || s === 'keyence') return s;
    } catch (e) {}
    return 'keyence';
  }

  function applyTheme(name) {
    var t = name === 'tfc' ? 'tfc' : 'keyence';
    var b = document.body;
    if (!b) return;
    b.classList.remove('theme-keyence-b', 'theme-tfc-b');
    b.classList.add(t === 'tfc' ? 'theme-tfc-b' : 'theme-keyence-b');

    var path = (window.location.pathname || '').split('/').pop() || '';
    var isIndex = !path || path.toLowerCase() === 'index.html';
    b.classList.remove('tfc-hero-intro-pending', 'tfc-hero-intro-done');
    if (t === 'tfc' && isIndex) {
      try {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          b.classList.add('tfc-hero-intro-done');
        } else {
          b.classList.add('tfc-hero-intro-pending');
        }
      } catch (e) {
        b.classList.add('tfc-hero-intro-pending');
      }
    }
  }

  window.__meiryouApplyTheme = applyTheme;
  applyTheme(resolveTheme());
})();
