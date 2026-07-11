/* global gsap */

import { products } from './data/products.js';

const row = document.querySelector('[data-marquee-row]');
const card = (product) => `<a class="product-card" href="${product.href}" aria-label="Ask about ${product.name}"><div class="product-frame"><img src="${product.image}" alt="${product.name} concept image" loading="lazy" /></div><div class="product-info"><h2 class="product-name">${product.name}</h2><span class="product-price">${product.price}</span></div></a>`;
const set = (hidden = false) => `<div class="marquee-set"${hidden ? ' aria-hidden="true"' : ''}>${products.map(card).join('')}</div>`;

if (row) {
  row.innerHTML = `<div class="marquee-track">${set()}${set(true)}</div>`;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced && window.gsap) {
    const track = row.querySelector('.marquee-track');
    const firstSet = row.querySelector('.marquee-set');
    const state = { x: 0, speed: 42 };
    const setter = gsap.quickSetter(track, 'x', 'px');
    let previous = performance.now();
    gsap.ticker.add(() => {
      const now = performance.now();
      const delta = Math.min((now - previous) / 1000, .05);
      previous = now;
      const width = firstSet.getBoundingClientRect().width;
      state.x -= state.speed * delta;
      if (state.x <= -width) state.x += width;
      setter(state.x);
    });
    const speedTo = (speed) => gsap.to(state, { speed, duration: .3, overwrite: true });
    row.addEventListener('pointerenter', () => speedTo(0));
    row.addEventListener('pointerleave', () => speedTo(42));
    row.addEventListener('focusin', () => speedTo(0));
    row.addEventListener('focusout', () => speedTo(42));
  }
}
