import { gsap, ScrollTrigger } from '../motion.js';
import { referencePose } from './blue-hour-frame.js';
import { initSmoothScroll } from '../smoothScroll.js';

gsap.registerPlugin(ScrollTrigger);

const stopSmoothScroll = initSmoothScroll({ onScroll: () => ScrollTrigger.update() });

const journey = document.querySelector('.journey');
const stage = document.querySelector('.stage');
const host = document.querySelector('.stage__scene');
const poses = [...document.querySelectorAll('.pose')];
const chapters = [...document.querySelectorAll('.chapters > span')];
const toggle = document.querySelector('.motion-toggle');
const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
const mobileQuery = matchMedia('(max-width: 600px)');
const heroPose = referencePose;
const state = { ...heroPose, reveal: 0 };
let paused = false;
let sceneReady = false;
let sceneFailed = false;
let disposed = false;
let timeline;
let animationContext;
let renderOnce = () => {};
let disposeScene = () => {};
let stopScrollBindings = () => {};

function updateAccessiblePose(index) {
  poses.forEach((pose, i) => {
    pose.inert = i !== index;
    pose.setAttribute('aria-hidden', String(i !== index));
  });
  chapters.forEach((chapter, i) => chapter.classList.toggle('is-active', i === index));
}

function configureMotion() {
  stopScrollBindings();
  animationContext?.revert();
  const staticMode = reducedQuery.matches || paused || sceneFailed;
  document.body.classList.toggle('static-motion', staticMode);
  toggle.setAttribute('aria-pressed', String(paused || reducedQuery.matches));
  toggle.innerHTML = staticMode ? 'Enable motion <span aria-hidden="true">▷</span>' : 'Pause motion <span aria-hidden="true">Ⅱ</span>';
  toggle.disabled = reducedQuery.matches || sceneFailed;
  if (reducedQuery.matches) toggle.textContent = 'Reduced motion';
  if (sceneFailed) toggle.textContent = 'Still view';
  Object.assign(state, heroPose);
  updateAccessiblePose(0);
  animationContext = gsap.context(() => {
    gsap.set(poses[0], { autoAlpha: 1, y: 0, pointerEvents: 'auto' });
    gsap.set(poses.slice(1), { autoAlpha: 0, y: 35, pointerEvents: 'none' });
    gsap.set('.progress > div', { scaleX: 0 });
    if (staticMode) return;
    const setProgress = gsap.quickSetter('.progress > div', 'scaleX');
    const leadStart = 1.04, connectStart = 2.9;
    timeline = gsap.timeline({
      paused: true,
      defaults: { ease: 'power2.inOut' },
      onUpdate: () => {
        const progress = timeline.progress();
        updateAccessiblePose(timeline.time() < leadStart ? 0 : timeline.time() < connectStart ? 1 : 2);
        setProgress(progress);
      },
    });
    // The scene turns horizontal travel into a grounded, corner-by-corner roll.
    timeline.to(state, { x: -.215, duration: 1.2, ease: 'none' }, .15)
      .to(poses[0], { autoAlpha: 0, y: -50, pointerEvents: 'none', duration: .4 }, .35)
      .fromTo(poses[1], { y: 40 }, { autoAlpha: 1, y: 0, pointerEvents: 'auto', duration: .45 }, leadStart)
      .to(state, { x: .215, duration: 1.2, ease: 'none' }, 2.35)
      .to(poses[1], { autoAlpha: 0, y: -50, pointerEvents: 'none', duration: .35 }, 2.55)
      .fromTo(poses[2], { y: 40 }, { autoAlpha: 1, y: 0, pointerEvents: 'auto', duration: .45 }, connectStart)
      .to({}, { duration: .85 });
    const scrollTrigger = ScrollTrigger.create({
      trigger: journey, start: 'top top',
      // Match the CSS sticky boundary, including the stage's minimum height.
      end: () => `+=${Math.max(1,journey.offsetHeight-stage.offsetHeight)}`,
      animation: timeline,
      // Keep the playhead smooth while staying close to the scroll position.
      scrub: .38,
    });
    timeline.progress(scrollTrigger.progress);
    const skipToChapter = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element) || !event.target.closest('a[href="#chapter"], a[href="#about"]')) return;
      timeline.progress(1);
    };
    document.addEventListener('click',skipToChapter);
    stopScrollBindings = () => {
      document.removeEventListener('click',skipToChapter);
    };
    gsap.from('.chapter-card', { y: mobileQuery.matches ? 35 : 80, opacity: 0, stagger: .13, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: '.chapter__grid', start: 'top 85%', once: true } });
  });
  ScrollTrigger.refresh();
  renderOnce();
}

// Keyboard focus and touch users get a genuinely static, short version too.
toggle.addEventListener('click', () => {
  const inJourney = scrollY < document.querySelector('.journey').offsetHeight;
  paused = !paused;
  configureMotion();
  if (inJourney) window.scrollTo({ top: 0, behavior: 'instant' });
});
reducedQuery.addEventListener('change', configureMotion);
mobileQuery.addEventListener('change', configureMotion);

async function createScene() {
  const { createSculpture } = await import('./blue-hour-scene.js');
  const controller = await createSculpture({
    host, stage, state, toggle, mobileQuery, reducedQuery,
    isPaused: () => paused,
    onFailure: useFallback,
  });
  if (disposed) {
    controller.dispose();
    return;
  }
  renderOnce = controller.render;
  disposeScene = controller.dispose;
  sceneReady = true;
  host.dataset.renderer = 'three';
}

function useFallback(error) {
  if (error) console.warn('Blue Hour: using the still composition.', error);
  sceneFailed = true;
  host.classList.remove('has-webgl');
  host.querySelector('canvas')?.remove();
  configureMotion();
}

function intro() {
  const element = document.querySelector('.intro');
  if (!element) {
    state.reveal = 1;
    return;
  }
  const key = 'phs-blue-hour-intro';
  let played = false;
  try { played = sessionStorage.getItem(key) === 'true'; } catch { /* private browsing */ }
  if (played || reducedQuery.matches) {
    state.reveal = 1;
    return;
  }
  element.classList.add('is-active');
  const progress = { value: 0 };
  const introTimeline = gsap.timeline({ onComplete: () => {
    element.classList.remove('is-active');
    try { sessionStorage.setItem(key, 'true'); } catch { /* private browsing */ }
  } });
  introTimeline.from('.intro__word', { y: 35, opacity: 0, duration: .8, ease: 'power3.out' })
    .to(progress, { value: 100, duration: 2.1, ease: 'power2.inOut', onUpdate: () => {
      document.querySelector('.intro__count').textContent = `${Math.round(progress.value)}%`;
      gsap.set('.intro__track > div', { scaleX: progress.value / 100 });
    } }, 0)
    .to(element, { yPercent: -100, duration: .8, ease: 'power4.inOut' }, 2.2)
    .to(state, { reveal: 1, duration: 1.4, ease: 'power3.out' }, 2.2);
}

configureMotion();
intro();
createScene().catch(useFallback);
document.fonts.ready.then(() => ScrollTrigger.refresh());
// Reinitialize after hot edits, releasing WebGL resources and scroll handlers.
if (import.meta.hot) import.meta.hot.dispose(() => {
  disposed = true;
  stopSmoothScroll();
  stopScrollBindings();
  disposeScene();
  animationContext?.revert();
  timeline?.kill();
  gsap.killTweensOf(state);
  reducedQuery.removeEventListener('change', configureMotion);
  mobileQuery.removeEventListener('change', configureMotion);
});
// A small diagnostic state for browser verification, with no UI dependency.
Object.defineProperty(host, 'prototypeState', { get: () => ({ ready: sceneReady, fallback: sceneFailed, paused, reduced: reducedQuery.matches, rotation: state.ry, position: state.x }) });
