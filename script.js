/**
 * 運送会社HP ベース - アニメーション・インタラクション
 * スクロールで要素を表示 / モバイルメニュー
 */

(function () {
  'use strict';

  // ----- スクロールで要素を表示（Intersection Observer） -----
  const animated = document.querySelectorAll('[data-animate]');
  if (animated.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { rootMargin: '0px 0px -40px 0px', threshold: 0.1 }
    );
    animated.forEach((el) => observer.observe(el));
  }

  // ----- モバイルメニュー（開閉） -----
  const menuBtn = document.querySelector('.menu-btn');
  const nav = document.querySelector('.nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      const isOpen = nav.getAttribute('aria-hidden') === 'true';
      nav.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      nav.classList.toggle('is-open', isOpen);
    });
  }

  // ----- ヒーロー・カルーセル（トップ：テーマ別スライド） -----
  const heroRoot = document.querySelector('[data-hero-carousel]');
  const slides = heroRoot ? heroRoot.querySelectorAll('[data-hero-slide]') : [];
  const dotsWrap = heroRoot ? heroRoot.querySelector('.hero-carousel__dots') : null;
  const btnPrev = heroRoot ? heroRoot.querySelector('.hero-carousel__btn--prev') : null;
  const btnNext = heroRoot ? heroRoot.querySelector('.hero-carousel__btn--next') : null;

  if (heroRoot && slides.length && dotsWrap) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isManual = heroRoot.dataset.heroManual === 'true';
    const forceAutoplay = heroRoot.dataset.heroAutoplay === 'true';
    if (reduceMotion) {
      heroRoot.classList.add('reduce-motion');
    }

    let index = 0;
    let timer = null;
    const intervalMs = Number(heroRoot.dataset.heroInterval || 6500);
    heroRoot.style.setProperty('--hero-progress-duration', intervalMs + 'ms');
    let wheelLock = false;
    let touchStartY = 0;
    let touchStartX = 0;

    const isFilmHero = heroRoot.classList.contains('hero--company');
    const filmDissolveMs = 2350;
    let filmStack = 10;
    let filmZTimer = null;

    function show(i) {
      const nextIndex = (i + slides.length) % slides.length;
      const prevIndex = index;

      if (isFilmHero && !reduceMotion && prevIndex !== nextIndex) {
        filmStack += 1;
        slides[prevIndex].style.zIndex = String(filmStack + 1);
        slides[nextIndex].style.zIndex = String(filmStack);
      }

      index = nextIndex;
      slides.forEach(function (slide, j) {
        const on = j === index;
        slide.classList.toggle('is-active', on);
        slide.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
      dotsWrap.querySelectorAll('.hero-carousel__dot').forEach(function (dot, j) {
        const on = j === index;
        dot.classList.toggle('is-current', on);
        if (on) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });

      if (isFilmHero && !reduceMotion) {
        if (filmZTimer) clearTimeout(filmZTimer);
        filmZTimer = window.setTimeout(function () {
          slides.forEach(function (slide) {
            slide.style.zIndex = '';
          });
          filmZTimer = null;
        }, filmDissolveMs);
      }
    }

    slides.forEach(function (_, j) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'hero-carousel__dot' + (j === 0 ? ' is-current' : '');
      dot.setAttribute('aria-label', 'スライド ' + (j + 1) + ' を表示');
      if (j === 0) dot.setAttribute('aria-current', 'true');
      dot.addEventListener('click', function () {
        show(j);
        restartTimer();
      });
      dotsWrap.appendChild(dot);
    });

    function next() {
      show(index + 1);
    }
    function prev() {
      show(index - 1);
    }

    function restartTimer() {
      if (isManual || !intervalMs) return;
      // 会社概要など「必ず動かしたい」ヒーローは、reduced motion を無視する
      if (reduceMotion && !forceAutoplay) return;
      if (timer) clearInterval(timer);
      timer = setInterval(next, intervalMs);
    }

    if (btnNext) btnNext.addEventListener('click', function () { next(); restartTimer(); });
    if (btnPrev) btnPrev.addEventListener('click', function () { prev(); restartTimer(); });

    // Keyence風の手動操作: ホイール上下でスライド切り替え
    heroRoot.addEventListener('wheel', function (event) {
      if (!isManual || reduceMotion) return;
      if (wheelLock || Math.abs(event.deltaY) < 14) return;

      event.preventDefault();
      wheelLock = true;

      if (event.deltaY > 0) next();
      else prev();

      setTimeout(function () {
        wheelLock = false;
      }, 520);
    }, { passive: false });

    // タッチ操作: 上下/左右のスワイプで切り替え
    heroRoot.addEventListener('touchstart', function (event) {
      if (!isManual || !event.touches.length) return;
      touchStartY = event.touches[0].clientY;
      touchStartX = event.touches[0].clientX;
    }, { passive: true });

    heroRoot.addEventListener('touchend', function (event) {
      if (!isManual || !event.changedTouches.length) return;
      const endY = event.changedTouches[0].clientY;
      const endX = event.changedTouches[0].clientX;
      const diffY = touchStartY - endY;
      const diffX = touchStartX - endX;

      if (Math.abs(diffY) > 38 || Math.abs(diffX) > 38) {
        if (Math.abs(diffY) >= Math.abs(diffX)) {
          if (diffY > 0) next();
          else prev();
        } else {
          if (diffX > 0) next();
          else prev();
        }
      }
    }, { passive: true });

    heroRoot.addEventListener('mouseenter', function () {
      if (timer) clearInterval(timer);
    });
    heroRoot.addEventListener('mouseleave', restartTimer);

    restartTimer();
  }
})();

// ----- ヘッダーナビの現在位置表示（Keyence風▼） -----
(function () {
  'use strict';

  const links = document.querySelectorAll('.nav-list a[href]');
  if (!links.length) return;

  const currentPath = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();

  links.forEach(function (link) {
    const href = (link.getAttribute('href') || '').toLowerCase();
    if (!href || href.startsWith('#')) return;
    if (href === currentPath) {
      link.setAttribute('aria-current', 'page');
      link.classList.add('is-current');
    } else {
      link.removeAttribute('aria-current');
      link.classList.remove('is-current');
    }
  });
})();

// ----- タブUI（Keyence風：タブで別ページへ） -----
(function () {
  'use strict';

  const tabRoots = document.querySelectorAll('.tabbed-links');
  if (!tabRoots.length) return;

  tabRoots.forEach(function (root) {
    const tabs = root.querySelectorAll('.tabbed-links__tab');
    const panels = root.querySelectorAll('.tabbed-links__panel');
    if (!tabs.length || !panels.length) return;

    function setActive(tab) {
      tabs.forEach(function (t) {
        const on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });

      panels.forEach(function (p) {
        const on = p.id === tab.getAttribute('aria-controls');
        p.classList.toggle('is-active', on);
      });
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        setActive(tab);
      });
    });
  });
})();

// ----- テーマ切替バー：現在のテーマを表示（theme-init.js が body クラスを設定済み） -----
(function () {
  'use strict';

  function currentTheme() {
    if (document.body.classList.contains('theme-tfc-b')) return 'tfc';
    return 'keyence';
  }

  document.querySelectorAll('.pattern-switch--theme a[href*="theme="]').forEach(function (a) {
    var href = a.getAttribute('href') || '';
    var m = href.match(/theme=(\w+)/);
    if (!m) return;
    if (m[1] === currentTheme()) {
      a.setAttribute('aria-current', 'true');
      a.classList.add('is-current');
    } else {
      a.removeAttribute('aria-current');
      a.classList.remove('is-current');
    }
  });
})();

// ----- テーマB TOP：線描画イントロ後に写真レイヤー＆写真サイクル開始 -----
(function () {
  'use strict';

  var body = document.body;
  if (!body.classList.contains('theme-tfc-b')) return;

  var mapHero = document.querySelector('.hero--tfc-map');
  var photoCycleTimer = null;
  var photoIndex = 0;
  var photoClasses = [
    'tfc-hero-photo-1',
    'tfc-hero-photo-2',
    'tfc-hero-photo-3',
    'tfc-hero-photo-4',
    'tfc-hero-photo-5',
  ];
  var switchFadeMs = 600;
  var photoIntervalMs = 10200;
  var firstPhotoHoldMs = 15000;

  function applyPhotoClass(nextIndex) {
    photoClasses.forEach(function (cls) {
      body.classList.remove(cls);
    });
    body.classList.add(photoClasses[nextIndex]);
  }

  function startHeroPhotoCycle() {
    if (photoCycleTimer) return;
    applyPhotoClass(photoIndex);

    function queueNextSwitch(delayMs) {
      photoCycleTimer = window.setTimeout(function () {
        body.classList.add('tfc-hero-photo-switch');
        window.setTimeout(function () {
          photoIndex = (photoIndex + 1) % photoClasses.length;
          applyPhotoClass(photoIndex);
          body.classList.remove('tfc-hero-photo-switch');
          queueNextSwitch(photoIntervalMs);
        }, switchFadeMs);
      }, delayMs);
    }

    // 1枚目だけ長めに見せて、以降は一定テンポで回す
    queueNextSwitch(firstPhotoHoldMs);
  }

  function finishTfcArrowIntro() {
    body.classList.remove('tfc-hero-intro-pending');
    body.classList.add('tfc-hero-intro-done');
    startHeroPhotoCycle();
  }

  if (!body.classList.contains('tfc-hero-intro-pending')) {
    if (body.classList.contains('tfc-hero-intro-done')) {
      startHeroPhotoCycle();
    }
    return;
  }

  if (!mapHero) {
    body.classList.remove('tfc-hero-intro-pending');
    return;
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    finishTfcArrowIntro();
    return;
  }

  /* ラインフロー描画〜流れ開始後、余韻を取ってから写真フェードへ */
  window.setTimeout(finishTfcArrowIntro, 4800);
})();

// ----- 事業カード：出荷試験画像を2種切り替え -----
(function () {
  'use strict';

  var cycleImages = document.querySelectorAll('.problem-card__photo--cycle[data-cycle-sources]');
  if (!cycleImages.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  cycleImages.forEach(function (img) {
    var sources = (img.getAttribute('data-cycle-sources') || '')
      .split(',')
      .map(function (src) { return src.trim(); })
      .filter(Boolean);
    if (sources.length < 2) return;

    var idx = 0;
    window.setInterval(function () {
      idx = (idx + 1) % sources.length;
      img.src = sources[idx];
    }, 4200);
  });
})();
