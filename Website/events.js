import { pastEvents, upcomingEvents } from './data/events.js';

const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
})[character]);

const externalAttributes = (href) => href.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : '';
const eventScope = (event) => event.scope === 'PHS chapter' ? 'local' : 'state';
const eventCategory = (event) => {
  if (eventScope(event) === 'local') return 'local';
  if (/deadline/i.test(event.title)) return 'deadline';
  return 'state';
};

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthIndexes = new Map(monthNames.map((month, index) => [month.toLowerCase(), index]));
const toDateKey = (date) => date.toISOString().slice(0, 10);
const fromDateKey = (key) => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};
const monthStart = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
const shiftMonth = (date, amount) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1));
const shiftDateMonth = (date, amount) => {
  const shiftedMonth = shiftMonth(date, amount);
  const lastDay = new Date(Date.UTC(shiftedMonth.getUTCFullYear(), shiftedMonth.getUTCMonth() + 1, 0)).getUTCDate();
  return new Date(Date.UTC(shiftedMonth.getUTCFullYear(), shiftedMonth.getUTCMonth(), Math.min(date.getUTCDate(), lastDay)));
};
const formatLongDate = (date) => new Intl.DateTimeFormat('en-US', {
  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
}).format(date);
const parseDateRange = (value) => {
  const match = value.match(/^([A-Za-z]+)\s+(\d{1,2})(?:\s*[–-]\s*([A-Za-z]+)?\s*(\d{1,2}))?,\s*(\d{4})$/);
  if (!match) return null;

  const [, startMonthName, startDayValue, endMonthName, endDayValue, yearValue] = match;
  const startMonth = monthIndexes.get(startMonthName.toLowerCase());
  const endMonth = endMonthName ? monthIndexes.get(endMonthName.toLowerCase()) : startMonth;
  if (startMonth === undefined || endMonth === undefined) return null;

  const year = Number(yearValue);
  const start = new Date(Date.UTC(year, startMonth, Number(startDayValue)));
  const end = new Date(Date.UTC(year, endMonth, Number(endDayValue || startDayValue)));
  return { start, end, startKey: toDateKey(start), endKey: toDateKey(end) };
};

const datedEvents = upcomingEvents
  .map((event) => ({ ...event, range: parseDateRange(event.date) }))
  .filter((event) => event.range)
  .sort((first, second) => first.range.start - second.range.start);
const undatedEvents = upcomingEvents.filter((event) => !parseDateRange(event.date));

const archive = document.querySelector('[data-past-list]');
if (archive) {
  archive.innerHTML = pastEvents.map((event, index) => `
    <article class="archive-card reveal-child">
      <figure class="archive-card__image"><img src="${escapeHTML(event.image)}" alt="${escapeHTML(event.alt)}" loading="lazy" decoding="async" /></figure>
      <div class="archive-card__body">
        <div class="event-row__meta"><span>${escapeHTML(event.date)}</span><span>Chapter archive</span></div>
        <h2>${escapeHTML(event.title.replace(/\s*·\s*(photo record|chapter photo)$/i, ''))}</h2>
        <p>${escapeHTML(event.alt)}</p>
        <span class="archive-card__index">${String(index + 1).padStart(2, '0')}</span>
      </div>
    </article>
  `).join('');
}

const formatHeroDate = (value) => {
  const match = value.match(/^([A-Za-z]+)\s+(\d{1,2})(?:\s*[–-].*)?,\s*(\d{4})$/);
  if (!match) return { month: 'DATE', day: '—', year: '' };
  return { month: match[1].slice(0, 3).toUpperCase(), day: match[2].padStart(2, '0'), year: match[3] };
};

const nextEvent = upcomingEvents.find((event) => event.status === 'confirmed') || upcomingEvents[0];
const nextEventCard = document.querySelector('[data-next-event-card]');

if (nextEventCard && nextEvent) {
  const date = formatHeroDate(nextEvent.date);
  const dateLabel = nextEvent.status === 'confirmed' ? 'Next published date' : 'Next date pending';
  nextEventCard.innerHTML = `
    <div class="events-hero__date-kicker">${dateLabel}</div>
    <div class="events-hero__date-lockup" aria-label="${escapeHTML(nextEvent.date)}">
      <strong class="events-hero__month">${date.month}</strong>
      <b class="events-hero__day">${date.day}</b>
      <span class="events-hero__year">${date.year}</span>
    </div>
    <div class="events-hero__date-meta">
      <strong>${escapeHTML(nextEvent.title)}</strong>
      <span>${escapeHTML(nextEvent.scope)} · ${escapeHTML(nextEvent.location)}</span>
    </div>
    <a class="button button--solid" href="${escapeHTML(nextEvent.href)}"${externalAttributes(nextEvent.href)}>${escapeHTML(nextEvent.action)} <span aria-hidden="true">↗</span></a>
  `;
} else if (nextEventCard) {
  nextEventCard.innerHTML = '<p class="events-hero__date-empty">No published dates yet. Check back with the chapter advisor.</p>';
}

const calendar = document.querySelector('[data-event-calendar]');
if (calendar) {
  const grid = calendar.querySelector('[data-calendar-grid]');
  const monthHeading = calendar.querySelector('[data-calendar-month]');
  const details = calendar.querySelector('[data-calendar-details]');
  const undatedPanel = document.querySelector('[data-calendar-undated]');
  const today = new Date();
  const todayKey = toDateKey(new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())));
  const firstFutureEvent = datedEvents.find((event) => event.range.endKey >= todayKey);
  const initialEvent = firstFutureEvent || datedEvents.at(-1);
  let selectedDateKey = initialEvent?.range.startKey || todayKey;
  let displayedMonth = monthStart(fromDateKey(selectedDateKey));
  const visibleEvents = () => datedEvents;
  const visibleUndatedEvents = () => undatedEvents;
  const shortMonthName = (date) => monthNames[date.getUTCMonth()];

  const eventCard = (event) => `
    <article class="calendar-event calendar-event--${eventCategory(event)}">
      <div class="calendar-event__meta"><span>${escapeHTML(event.scope)}</span><span>${event.status === 'pending' ? 'Date pending' : 'Published'}</span></div>
      <p class="calendar-event__date">${escapeHTML(event.date)}</p>
      <h4>${escapeHTML(event.title)}</h4>
      <p class="calendar-event__copy">${escapeHTML(event.detail)}</p>
      <dl class="calendar-event__facts"><div><dt>Time</dt><dd>${escapeHTML(event.time)}</dd></div><div><dt>Location</dt><dd>${escapeHTML(event.location)}</dd></div></dl>
      <a class="calendar-event__action" href="${escapeHTML(event.href)}"${externalAttributes(event.href)}>${escapeHTML(event.action)} <span aria-hidden="true">↗</span></a>
    </article>
  `;

  const getEventsForDate = (dateKey, events = visibleEvents()) => events.filter((event) => (
    event.range.startKey <= dateKey && event.range.endKey >= dateKey
  ));

  const focusDateForMonth = (month) => {
    const firstDay = monthStart(month);
    const lastDay = new Date(Date.UTC(firstDay.getUTCFullYear(), firstDay.getUTCMonth() + 1, 0));
    const firstKey = toDateKey(firstDay);
    const lastKey = toDateKey(lastDay);
    const firstEvent = visibleEvents().find((event) => event.range.startKey <= lastKey && event.range.endKey >= firstKey);
    if (!firstEvent) return firstKey;
    return firstEvent.range.startKey < firstKey ? firstKey : firstEvent.range.startKey;
  };

  const renderCalendar = ({ focusSelected = false } = {}) => {
    const firstDay = monthStart(displayedMonth);
    const gridStart = new Date(Date.UTC(firstDay.getUTCFullYear(), firstDay.getUTCMonth(), 1 - firstDay.getUTCDay()));
    monthHeading.textContent = `${shortMonthName(firstDay)} ${firstDay.getUTCFullYear()}`;

    const weekdayMarkup = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      .map((weekday, index) => `<span role="columnheader" aria-label="${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][index]}">${weekday}</span>`)
      .join('');
    const weekMarkup = Array.from({ length: 6 }, (_, weekIndex) => {
      const dayMarkup = Array.from({ length: 7 }, (_, dayIndex) => {
        const date = new Date(gridStart);
        date.setUTCDate(gridStart.getUTCDate() + weekIndex * 7 + dayIndex);
        const dateKey = toDateKey(date);
        const dayEvents = getEventsForDate(dateKey);
        const categoryNames = [...new Set(dayEvents.map(eventCategory))];
        const categoryClasses = categoryNames.map((category) => `has-${category}`).join(' ');
        const eventSummary = dayEvents.length
          ? `, ${dayEvents.length} ${dayEvents.length === 1 ? 'event' : 'events'}: ${dayEvents.map((event) => event.title).join(', ')}`
          : '';
        const isSelected = dateKey === selectedDateKey;
        const outsideMonth = date.getUTCMonth() !== firstDay.getUTCMonth();
        const classes = ['calendar-day', outsideMonth ? 'is-outside' : '', dayEvents.length ? 'has-events' : '', categoryClasses, isSelected ? 'is-selected' : '']
          .filter(Boolean).join(' ');
        const tileLabel = dayEvents.length === 1 ? dayEvents[0].title : `${dayEvents.length} events`;
        return `<div class="calendar-cell" role="gridcell" aria-selected="${isSelected}"><button class="${classes}" type="button" data-calendar-date="${dateKey}" aria-label="${escapeHTML(formatLongDate(date) + eventSummary)}" aria-pressed="${isSelected}"${dateKey === todayKey ? ' aria-current="date"' : ''} tabindex="${isSelected ? '0' : '-1'}"><span class="calendar-day__number">${date.getUTCDate()}</span>${dayEvents.length ? `<span class="calendar-day__title" aria-hidden="true">${escapeHTML(tileLabel)}</span>` : ''}</button></div>`;
      }).join('');
      return `<div class="calendar-week" role="row">${dayMarkup}</div>`;
    }).join('');

    grid.innerHTML = `<div class="calendar-week calendar-week--head" role="row">${weekdayMarkup}</div>${weekMarkup}`;
    grid.setAttribute('aria-label', `${monthHeading.textContent}. Use arrow keys to move between dates.`);
    if (focusSelected) grid.querySelector(`[data-calendar-date="${selectedDateKey}"]`)?.focus();
  };

  const renderDetails = () => {
    const selectedDate = fromDateKey(selectedDateKey);
    const dateEvents = getEventsForDate(selectedDateKey);
    details.innerHTML = `
      <div class="calendar-details__heading">
        <p class="calendar-overline">Selected date</p>
        <h3>${escapeHTML(formatLongDate(selectedDate))}</h3>
        <p>${dateEvents.length ? `${dateEvents.length} ${dateEvents.length === 1 ? 'event' : 'events'} on this date` : 'No published dates on this day.'}</p>
      </div>
      <div class="calendar-details__events">${dateEvents.length ? dateEvents.map(eventCard).join('') : '<p class="calendar-empty">Choose a marked date to see event details.</p>'}</div>
    `;
  };

  const renderUndatedEvents = () => {
    const events = visibleUndatedEvents();
    undatedPanel.hidden = events.length === 0;
    undatedPanel.innerHTML = events.length ? `
      <div class="calendar-undated__heading"><div><p class="calendar-overline">Not placed on a date</p><h3>Awaiting confirmation</h3></div><span class="event-status event-status--pending">PHS date pending</span></div>
      <div class="calendar-undated__events">${events.map(eventCard).join('')}</div>
    ` : '';
  };

  const selectDate = (date, focusSelected = true) => {
    selectedDateKey = toDateKey(date);
    displayedMonth = monthStart(date);
    renderCalendar({ focusSelected });
    renderDetails();
  };

  grid.addEventListener('click', (event) => {
    const button = event.target.closest('[data-calendar-date]');
    if (button) selectDate(fromDateKey(button.dataset.calendarDate));
  });

  grid.addEventListener('keydown', (event) => {
    const button = event.target.closest('[data-calendar-date]');
    if (!button) return;
    const date = fromDateKey(button.dataset.calendarDate);
    const weekday = date.getUTCDay();
    let nextDate;

    if (event.key === 'ArrowLeft') nextDate = new Date(date.getTime() - 86400000);
    else if (event.key === 'ArrowRight') nextDate = new Date(date.getTime() + 86400000);
    else if (event.key === 'ArrowUp') nextDate = new Date(date.getTime() - 7 * 86400000);
    else if (event.key === 'ArrowDown') nextDate = new Date(date.getTime() + 7 * 86400000);
    else if (event.key === 'Home') nextDate = new Date(date.getTime() - weekday * 86400000);
    else if (event.key === 'End') nextDate = new Date(date.getTime() + (6 - weekday) * 86400000);
    else if (event.key === 'PageUp') nextDate = shiftDateMonth(date, event.shiftKey ? -12 : -1);
    else if (event.key === 'PageDown') nextDate = shiftDateMonth(date, event.shiftKey ? 12 : 1);
    else return;

    event.preventDefault();
    selectDate(nextDate);
  });

  calendar.querySelector('[data-calendar-prev]').addEventListener('click', (event) => {
    displayedMonth = shiftMonth(displayedMonth, -1);
    selectedDateKey = focusDateForMonth(displayedMonth);
    renderCalendar();
    renderDetails();
    event.currentTarget.focus();
  });
  calendar.querySelector('[data-calendar-next]').addEventListener('click', (event) => {
    displayedMonth = shiftMonth(displayedMonth, 1);
    selectedDateKey = focusDateForMonth(displayedMonth);
    renderCalendar();
    renderDetails();
    event.currentTarget.focus();
  });
  calendar.querySelector('[data-calendar-today]').addEventListener('click', (event) => {
    selectedDateKey = todayKey;
    displayedMonth = monthStart(fromDateKey(todayKey));
    renderCalendar();
    renderDetails();
    event.currentTarget.focus();
  });

  renderCalendar();
  renderDetails();
  renderUndatedEvents();
}
