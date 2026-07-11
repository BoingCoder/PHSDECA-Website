import { events } from './data/events.js';

const list = document.querySelector('[data-event-list]');
if (list) {
  list.innerHTML = events.map((event, index) => `
    <article class="event reveal-child">
      <figure class="event__image"><img src="${event.image}" alt="${event.alt}" loading="lazy" /></figure>
      <div>
        <div class="event__date">${event.date} · ${String(index + 1).padStart(2, '0')}</div>
        <h2>${event.title}</h2>
        <p>${event.recap}</p>
      </div>
    </article>
  `).join('');
}
