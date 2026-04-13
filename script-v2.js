/**
 * 名菱運輸 v2 — Premium interactions
 * Pure vanilla JS, no external dependencies
 */

(function () {
  'use strict';

  var hero = document.getElementById('hero');
  var heroSlides = hero ? hero.querySelectorAll('.hero__slide') : [];
  var heroIndex = 0;
  var heroIntervalMs = 7000;
  var heroTimer = null;

  function showHeroSlide(index) {
    heroSlides.forEach(function (slide) {
      slide.classList.remove('is-active', 'kb-animate');
    });
    var target = heroSlides[index];
    if (!target) return;
    target.classList.add('is-active');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        target.classList.add('kb-animate');
      });
    });
  }

  function nextHeroSlide() {
    if (heroSlides.length < 2) return;
    heroIndex = (heroIndex + 1) % heroSlides.length;
    showHeroSlide(heroIndex);
  }

  function startHeroSlideshow() {
    if (heroSlides.length < 2) {
      if (heroSlides.length === 1) {
        setTimeout(function () {
          heroSlides[0].classList.add('kb-animate');
        }, 100);
      }
      return;
    }
    setTimeout(function () {
      heroSlides[0].classList.add('kb-animate');
    }, 100);
    heroTimer = window.setInterval(nextHeroSlide, heroIntervalMs);
  }

  function revealHero() {
    if (hero) {
      window.setTimeout(function () {
        hero.classList.add('is-loaded');
      }, 200);
    }
    startHeroSlideshow();
  }

  // ============================================================
  // TOP: Opening sequence → then hero motion（同一タブ内は1回のみ・sessionStorage）
  // ============================================================
  var introEl = document.getElementById('heroIntro');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var introSessionKey = 'meiryouHeroIntroShownSession';

  function skipIntroDom() {
    document.body.classList.remove('hero-intro-active');
    document.body.classList.add('hero-intro-done');
    if (introEl && introEl.parentNode) {
      introEl.parentNode.removeChild(introEl);
    }
    introEl = null;
    revealHero();
  }

  function finishIntro() {
    try {
      sessionStorage.setItem(introSessionKey, '1');
    } catch (e) {}
    document.body.classList.remove('hero-intro-active');
    document.body.classList.add('hero-intro-done');
    if (introEl && introEl.parentNode) {
      introEl.parentNode.removeChild(introEl);
    }
    introEl = null;
    revealHero();
  }

  if (introEl) {
    var introAlreadyShown = false;
    try {
      introAlreadyShown = sessionStorage.getItem(introSessionKey) === '1';
    } catch (e2) {}
    if (introAlreadyShown) {
      skipIntroDom();
    } else if (reduceMotion) {
      /* 視差アニメは抑制するが、初回は文言を約2.8秒見せてから本編へ */
      window.setTimeout(finishIntro, 2800);
    } else {
      var introDone = false;
      function completeOnce() {
        if (introDone) return;
        introDone = true;
        finishIntro();
      }
      introEl.addEventListener('animationend', function (e) {
        if (e.target === introEl) {
          completeOnce();
        }
      });
      window.setTimeout(completeOnce, 4000);
    }
  } else {
    revealHero();
  }

  // ============================================================
  // HEADER: Transparent → Solid on scroll
  // ============================================================
  var header = document.getElementById('header') || document.getElementById('siteHeader');
  var ticking = false;

  function updateHeader() {
    if (!header) return;
    /* 下層ページは常にソリッド（スクロール0で外すと透明になり白文字が読めない） */
    if (document.body.classList.contains('page-sub')) {
      header.classList.add('site-header--solid');
      ticking = false;
      return;
    }
    var scrollY = window.scrollY || window.pageYOffset;
    if (scrollY > 80) {
      header.classList.add('site-header--solid');
    } else {
      header.classList.remove('site-header--solid');
    }
    ticking = false;
  }

  if (header) {
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    }, { passive: true });
    updateHeader();
  }

  // ============================================================
  // MOBILE NAV
  // ============================================================
  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('nav');

  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var isOpen = menuBtn.classList.toggle('is-open');
      nav.classList.toggle('is-open', isOpen);
      menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        menuBtn.classList.remove('is-open');
        nav.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // ============================================================
  // SCROLL ANIMATIONS (Intersection Observer)
  // ============================================================
  var animatedElements = document.querySelectorAll('[data-animate]');

  if (animatedElements.length && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '0px 0px -60px 0px',
        threshold: 0.1
      }
    );

    animatedElements.forEach(function (el) {
      observer.observe(el);
    });
  }

  // ============================================================
  // COUNTER ANIMATION (for 2,000件以上)
  // ============================================================
  var counters = document.querySelectorAll('.counter[data-target]');

  if (counters.length && 'IntersectionObserver' in window) {
    var counterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(function (el) {
      counterObserver.observe(el);
    });
  }

  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-target'), 10);
    var duration = 2000;
    var startTime = null;

    function easeOutQuart(t) {
      return 1 - Math.pow(1 - t, 4);
    }

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var current = Math.floor(easeOutQuart(progress) * target);
      el.textContent = current.toLocaleString();

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        el.textContent = target.toLocaleString();
      }
    }

    window.requestAnimationFrame(step);
  }

  // ============================================================
  // CURRENT NAV HIGHLIGHT
  // ============================================================
  var navLinks = document.querySelectorAll('.site-header__nav-list a[href]');
  var currentPath = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();

  navLinks.forEach(function (link) {
    var href = (link.getAttribute('href') || '').toLowerCase();
    if (!href || href.startsWith('#')) return;
    if (href === currentPath) {
      link.classList.add('is-current');
    } else {
      link.classList.remove('is-current');
    }
  });
})();
