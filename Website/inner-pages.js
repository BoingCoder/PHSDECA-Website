/* Small, page-scoped interactions for the non-homepage routes. */

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const setPressed = (buttons, active) => buttons.forEach((button) => {
  button.setAttribute('aria-pressed', String(button === active));
});

const filterRows = ({ buttons, rows, getValue }) => {
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const value = button.dataset.filter || 'all';
      setPressed(buttons, button);
      rows.forEach((row) => {
        const values = getValue(row);
        row.hidden = value !== 'all' && (Array.isArray(values) ? !values.includes(value) : values !== value);
      });
    });
  });
};

const resourceFilters = document.querySelector('[data-resource-filters]');
if (resourceFilters) {
  const buttons = [...resourceFilters.querySelectorAll('[data-filter]')];
  const rows = [...document.querySelectorAll('[data-resource-table] .comparison-row:not(.comparison-row--head)')];
  filterRows({
    buttons,
    rows,
    getValue: (row) => row.dataset.format || 'live',
  });
}

/* A restrained pointer tilt makes the hero image feel tactile on capable devices. */
if (!reduced && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('[data-tilt]').forEach((frame) => {
    frame.addEventListener('pointermove', (event) => {
      const box = frame.getBoundingClientRect();
      const x = ((event.clientX - box.left) / box.width - .5) * 2;
      const y = ((event.clientY - box.top) / box.height - .5) * 2;
      frame.style.transform = `perspective(900px) rotateX(${y * -1.5}deg) rotateY(${x * 1.5}deg)`;
    });
    frame.addEventListener('pointerleave', () => {
      frame.style.transform = '';
    });
  });
}
