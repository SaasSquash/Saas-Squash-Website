/* SaaS Squash — script.js */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function updateNav() {
    const nav = document.getElementById('nav');
    if (!nav) return;

    if (window.scrollY > 40) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  function initNavScroll() {
    if (window.__saasSquashNavScrollBound) return;
    window.__saasSquashNavScrollBound = true;

    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav();
  }

  function initMobileMenu() {
    const menuBtn = document.getElementById('menuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    if (!menuBtn || !mobileMenu) return;

    if (!menuBtn.dataset.boundClick) {
      menuBtn.dataset.boundClick = 'true';
      menuBtn.addEventListener('click', function () {
        const isOpen = mobileMenu.classList.toggle('open');
        menuBtn.classList.toggle('open', isOpen);
        menuBtn.setAttribute('aria-expanded', String(isOpen));
        mobileMenu.setAttribute('aria-hidden', String(!isOpen));
      });
    }

    if (!mobileMenu.dataset.boundLinks) {
      mobileMenu.dataset.boundLinks = 'true';
      mobileMenu.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          mobileMenu.classList.remove('open');
          menuBtn.classList.remove('open');
          menuBtn.setAttribute('aria-expanded', 'false');
          mobileMenu.setAttribute('aria-hidden', 'true');
        });
      });
    }
  }

  function initFadeIn() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.fade-in').forEach(function (el) {
        el.classList.add('visible');
      });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    document.querySelectorAll('.fade-in').forEach(function (el) {
      if (el.dataset.fadeObserved === 'true') return;
      el.dataset.fadeObserved = 'true';
      observer.observe(el);
    });
  }

  function initSmoothScrollDelegation() {
    if (window.__saasSquashSmoothScrollBound) return;
    window.__saasSquashSmoothScrollBound = true;

    document.addEventListener('click', function (e) {
      const a = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;

      const href = a.getAttribute('href');
      if (!href || href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      const nav = document.getElementById('nav');
      const navHeight = nav ? nav.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({
        top: top,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    });
  }

  function init() {
    initNavScroll();
    initMobileMenu();
    initFadeIn();
    initSmoothScrollDelegation();
  }

  // Run once for non-partial environments, and again after partial injection.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  document.addEventListener('partials:loaded', init);

})();
