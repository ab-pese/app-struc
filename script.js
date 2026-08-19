async function init() {
  const res = await fetch('apps.json', { cache: 'no-store' });
  const data = await res.json();

  const categories = data.categories || [];
  const apps = data.apps || [];

  document.getElementById('sheet-no').textContent =
    'A-' + String(apps.length).padStart(3, '0');
  document.getElementById('rev-no').textContent =
    new Date().toISOString().slice(0, 10);

  if (apps.length === 0) {
    document.getElementById('empty-state').hidden = false;
    return;
  }

  // group apps by category id, preserving category order; unknown ids fall
  // into a trailing "Uncategorized" group so nothing silently disappears.
  const byCategory = new Map();
  categories.forEach(c => byCategory.set(c.id, []));
  const fallbackId = '__uncategorized__';

  apps.forEach(app => {
    const key = byCategory.has(app.category) ? app.category : fallbackId;
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key).push(app);
  });

  if (byCategory.has(fallbackId)) {
    categories.push({ id: fallbackId, code: 'GEN', label: 'Uncategorized' });
  }

  const filterbar = document.getElementById('filterbar');
  const sheetIndex = document.getElementById('sheet-index');

  categories.forEach(cat => {
    const list = byCategory.get(cat.id) || [];
    if (list.length === 0) return;

    // filter chip
    const chip = document.createElement('button');
    chip.className = 'filter-chip';
    chip.dataset.filter = cat.id;
    chip.textContent = cat.label.toUpperCase();
    filterbar.appendChild(chip);

    // section
    const section = document.createElement('section');
    section.className = 'category-section';
    section.dataset.category = cat.id;

    const heading = document.createElement('div');
    heading.className = 'category-heading';
    heading.innerHTML = `
      <span class="category-heading__code">${cat.code}</span>
      <span class="category-heading__label">${cat.label}</span>
      <span class="category-heading__count">${String(list.length).padStart(2, '0')} APP${list.length === 1 ? '' : 'S'}</span>
    `;
    section.appendChild(heading);

    const grid = document.createElement('div');
    grid.className = 'app-grid';

    list.forEach((app, i) => {
      const card = document.createElement('a');
      card.className = 'app-card';
      card.href = app.url;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      card.dataset.category = cat.id;

      const markNo = String(i + 1).padStart(2, '0');
      card.innerHTML = `
        <div class="app-card__marker"><span>${cat.code}</span><span>${markNo}</span></div>
        <div class="app-card__name">${escapeHtml(app.name)}</div>
        <div class="app-card__desc">${escapeHtml(app.description || '')}</div>
        <div class="app-card__open">OPEN APP &rarr;</div>
      `;
      grid.appendChild(card);
    });

    section.appendChild(grid);
    sheetIndex.appendChild(section);
  });

  // filtering
  filterbar.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-chip');
    if (!btn) return;
    filterbar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('is-active'));
    btn.classList.add('is-active');

    const filter = btn.dataset.filter;
    sheetIndex.querySelectorAll('.category-section').forEach(section => {
      section.hidden = !(filter === 'all' || section.dataset.category === filter);
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

init().catch(err => {
  console.error('Failed to load apps.json', err);
  document.getElementById('empty-state').hidden = false;
});
