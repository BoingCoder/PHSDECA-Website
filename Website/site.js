import { initSmoothScroll } from './src/smoothScroll.js';
import { gsap, ScrollTrigger } from './src/motion.js';
import { renderSiteChrome } from './src/siteChrome.js';
import { renderBoard } from './data/board.js';

renderSiteChrome();
renderBoard();

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const header = $('[data-site-header]');
const updateHeader = () => header?.classList.toggle('is-scrolled', scrollY > 24);
updateHeader();
addEventListener('scroll', updateHeader, { passive: true });

// Keep the original percentage intro, but play it only once in a browser session.
const preloader = $('.preloader');
const introKey = 'phs-deca-intro-played';
const transitionKey = 'phs-deca-page-transition';
let played = false;
let arrivingFromPage = false;
try { played = sessionStorage.getItem(introKey) === 'true'; } catch { /* privacy mode */ }
try {
  arrivingFromPage = sessionStorage.getItem(transitionKey) === 'true';
  sessionStorage.removeItem(transitionKey);
} catch { /* privacy mode */ }

const curtain = $('.page-transition');
if (arrivingFromPage && curtain) {
  curtain.style.transform = 'translateY(0)';
  // Hand the first-paint CSS state to the animation without uncovering the page.
  document.documentElement.classList.remove('is-page-arriving');

  if (reduced || !curtain.animate) {
    curtain.style.transform = 'translateY(-100%)';
  } else {
    const enterAnimation = curtain.animate(
      [
        { transform: 'translateY(0)' },
        { transform: 'translateY(-100%)' },
      ],
      { duration: 200, easing: 'cubic-bezier(.65, 0, .35, 1)', fill: 'forwards' },
    );

    enterAnimation.finished.finally(() => {
      curtain.style.transform = 'translateY(100%)';
      enterAnimation.cancel();
    });
  }
}

// A page restored from the back-forward cache may retain the covered state.
addEventListener('pageshow', (event) => {
  if (!event.persisted || !curtain) return;
  document.documentElement.classList.remove('is-page-arriving');
  curtain.getAnimations().forEach((animation) => animation.cancel());
  curtain.style.transform = 'translateY(100%)';
  document.body.classList.remove('is-transitioning');
});

const revealHero = () => {
  document.documentElement.classList.remove('show-intro');
  document.body.classList.remove('is-loading');
  if (reduced) return;
  gsap.from('.hero-reveal', { opacity: 0, y: 42, duration: .72, stagger: .09, ease: 'power3.out' });
  gsap.to('.hero .image-reveal', { '--cover-y': '-101%', duration: .6, stagger: .07, ease: 'power3.inOut' });
  gsap.to('.hero .image-reveal img', { scale: 1, duration: .8, stagger: .07, ease: 'power3.out' });
};

if (!preloader || reduced || played) {
  document.documentElement.classList.remove('show-intro');
  if (preloader) preloader.style.display = 'none';
  revealHero();
} else {
  const count = { value: 0 };
  gsap.set('.preloader__letter', { yPercent: 120, opacity: 0, scale: .82 });
  gsap.timeline()
    .to(count, { value: 89, duration: 1.25, ease: 'power2.out', onUpdate: () => {
      $('.preloader__count').textContent = `${Math.round(count.value)}%`;
      $('.preloader__progress-bar').style.width = `${count.value}%`;
    }})
    .to('.preloader__letter', { yPercent: 0, opacity: 1, scale: 1, duration: .7, stagger: { amount: 1.6 }, ease: 'back.out(1.5)' }, '<')
    .to(count, { value: 100, duration: 1, onUpdate: () => {
      $('.preloader__count').textContent = `${Math.round(count.value)}%`;
      $('.preloader__progress-bar').style.width = `${count.value}%`;
    }})
    .to('.preloader__curtain', { height: '100%', duration: .38, ease: 'power3.inOut' })
    .to(preloader, { yPercent: -100, duration: .55, ease: 'power4.inOut', onComplete: () => {
      try { sessionStorage.setItem(introKey, 'true'); } catch { /* privacy mode */ }
      document.documentElement.classList.remove('show-intro');
      preloader.style.display = 'none';
      revealHero();
    }});
}

// Fast royal-blue curtain for internal page changes. Relative URLs keep GitHub Pages subpaths intact.
$$('a[href]').forEach((link) => link.addEventListener('click', (event) => {
  const raw = link.getAttribute('href');
  if (!raw || raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:') || link.target === '_blank' || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const url = new URL(raw, location.href);
  if (url.origin !== location.origin || url.href === location.href) return;
  event.preventDefault();
  document.body.classList.add('is-transitioning');
  try { sessionStorage.setItem(transitionKey, 'true'); } catch { /* privacy mode */ }

  let hasNavigated = false;
  const navigate = () => {
    if (hasNavigated) return;
    hasNavigated = true;
    location.assign(url.href);
  };

  if (!curtain) {
    navigate();
  } else if (reduced || !curtain.animate) {
    curtain.style.transform = 'translateY(0)';
    setTimeout(navigate, 80);
  } else {
    const leaveAnimation = curtain.animate(
      [
        { transform: 'translateY(100%)' },
        { transform: 'translateY(0)' },
      ],
      { duration: 430, easing: 'cubic-bezier(.65, 0, .35, 1)', fill: 'forwards' },
    );

    leaveAnimation.finished.then(navigate).catch(navigate);
    // Navigation must never depend solely on an animation-completion callback.
    setTimeout(navigate, 480);
  }
}));

initSmoothScroll({ onScroll: () => ScrollTrigger.update() });

if (!reduced) {
  $$('.section, .contact, .event-list, .resource-band, .marquee-stage').forEach((section) => {
    const items = $$('.reveal, .reveal-child', section);
    if (!items.length) return;
    gsap.from(items, { opacity: 0, y: 42, duration: .72, stagger: .09, ease: 'power3.out', scrollTrigger: { trigger: section, start: 'top 76%', once: true } });
  });

  $$('.image-reveal, .event__image').forEach((frame) => {
    const image = $('img', frame);
    if (!image) return;
    gsap.to(image, { yPercent: -7, ease: 'none', scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  $$('[data-count]').forEach((number) => {
    const target = Number(number.dataset.count);
    const state = { value: 0 };
    gsap.to(state, { value: target, duration: 1.25, ease: 'power2.out', scrollTrigger: { trigger: number, start: 'top 85%', once: true }, onUpdate: () => number.textContent = Math.round(state.value) });
  });

  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.magnetic').forEach((item) => {
      item.addEventListener('pointermove', (event) => {
        const box = item.getBoundingClientRect();
        gsap.to(item, { x: (event.clientX - box.left - box.width / 2) * .2, y: (event.clientY - box.top - box.height / 2) * .25, duration: .25 });
      });
      item.addEventListener('pointerleave', () => gsap.to(item, { x: 0, y: 0, duration: .5, ease: 'elastic.out(1,.35)' }));
    });
  }
}

// The post-hero editorial layer has its own reveal rhythm. Keeping this below
// the existing intro/hero flow means the protected opening never depends on
// the homepage content being present or on a lower-page animation completing.
const editorialHome = document.querySelector('.editorial-home');
if (editorialHome && !reduced) {
  $$('.editorial-home > section', document).forEach((section) => {
    const items = $$('[data-reveal]:not([data-editorial-motion])', section);
    if (!items.length) return;
    gsap.from(items, {
      opacity: 0,
      y: 34,
      duration: .82,
      stagger: .08,
      ease: 'power3.out',
      scrollTrigger: { trigger: section, start: 'top 78%', once: true },
    });
  });

  $$('.diary-photo__frame, .editorial-contact__photo', editorialHome).forEach((frame) => {
    const image = $('img', frame);
    if (!image) return;
    gsap.to(image, {
      yPercent: -5,
      ease: 'none',
      scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.program-row', editorialHome).forEach((row) => {
      row.addEventListener('pointermove', (event) => {
        const box = row.getBoundingClientRect();
        row.style.setProperty('--pointer-x', `${event.clientX - box.left}px`);
        row.style.setProperty('--pointer-y', `${event.clientY - box.top}px`);
      });
    });
  }

  const diary = $('.editorial-diary', editorialHome);
  const diaryLarge = $('[data-editorial-motion="diary-large"] .diary-photo__frame', editorialHome);
  const diaryNote = $('[data-editorial-motion="diary-note"]', editorialHome);
  const diarySmall = $('[data-editorial-motion="diary-small"] .diary-photo__frame', editorialHome);
  if (diary && diaryLarge && diaryNote && diarySmall) {
    gsap.timeline({ scrollTrigger: { trigger: diary, start: 'top 72%', once: true } })
      .fromTo(diaryLarge, { clipPath: 'inset(14% 0 0 0)', scale: 1.08 }, { clipPath: 'inset(0% 0 0 0)', scale: 1, duration: 1.05, ease: 'power3.out' })
      .fromTo(diaryNote, { opacity: 0, x: 64 }, { opacity: 1, x: 0, duration: .72, ease: 'power3.out' }, .16)
      .fromTo(diarySmall, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: .78, ease: 'power3.inOut' }, .3);
  }

  const contact = $('.editorial-contact', editorialHome);
  const contactPhoto = $('[data-editorial-motion="contact-photo"]', editorialHome);
  const contactCopy = $('[data-editorial-motion="contact-copy"]', editorialHome);
  if (contact && contactPhoto && contactCopy) {
    gsap.timeline({ scrollTrigger: { trigger: contact, start: 'top 78%', once: true } })
      .fromTo(contactPhoto, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: .95, ease: 'power3.inOut' })
      .fromTo(contactCopy, { opacity: 0, x: 70 }, { opacity: 1, x: 0, duration: .82, ease: 'power3.out' }, .18);
  }

  const marquee = $('.marquee-track', editorialHome);
  if (marquee) {
    editorialHome.classList.add('editorial-home--scripted');
    gsap.fromTo(marquee, { xPercent: 0 }, {
      xPercent: -28,
      ease: 'none',
      scrollTrigger: { trigger: marquee.parentElement, start: 'top bottom', end: 'bottom top', scrub: .8 },
    });
  }
}

// The smooth-scroll helper intentionally lands anchors a little above their
// target. Nudge editorial anchors after the helper settles so a fixed header
// never covers the new section's heading; this does not touch the protected
// Blue Hour scene or its own scroll timeline.
if (editorialHome) {
  const editorialAnchors = $$('a[href="#about"], a[href="#pathways"], a[href="#people"], a[href="#next"]');
  const settleEditorialAnchor = (target) => {
    if (!target) return;
    const headerHeight = header?.getBoundingClientRect().height || 0;
    const safeTop = headerHeight + 16;
    const delta = target.getBoundingClientRect().top - safeTop;
    if (delta < 0) window.scrollBy({ top: delta, left: 0, behavior: 'auto' });
  };
  editorialAnchors.forEach((link) => {
    link.addEventListener('click', () => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      requestAnimationFrame(() => requestAnimationFrame(() => settleEditorialAnchor(target)));
      setTimeout(() => settleEditorialAnchor(target), 1500);
    }, { capture: true });
  });
}
