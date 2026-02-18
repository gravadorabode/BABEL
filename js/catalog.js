/**
 * Catalog — renders beat & sample cards, handles filtering
 */
const Catalog = {
  beatsData: [],
  samplesData: [],
  activeTab: 'beats',
  activeFilter: 'all',

  init(beats, samples) {
    this.beatsData = beats;
    this.samplesData = samples;
    this.renderTabs();
    this.renderFilters();
    this.renderCards();
    this.bindEvents();
  },

  renderTabs() {
    const tabsEl = document.getElementById('catalog-tabs');
    tabsEl.innerHTML = `
      <button class="tab active" data-tab="beats">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
        Beats
      </button>
      <button class="tab" data-tab="samples">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        Samples
      </button>
    `;
  },

  getGenres() {
    return [...new Set(this.beatsData.map(b => b.genre))];
  },

  getSampleTypes() {
    return [...new Set(this.samplesData.map(s => s.type))];
  },

  renderFilters() {
    const filtersEl = document.getElementById('catalog-filters');
    const items = this.activeTab === 'beats' ? this.getGenres() : this.getSampleTypes();

    filtersEl.innerHTML = `
      <button class="filter-btn active" data-filter="all">Todos</button>
      ${items.map(item => `
        <button class="filter-btn" data-filter="${item}">${item}</button>
      `).join('')}
    `;
    this.activeFilter = 'all';
  },

  renderCards() {
    const grid = document.getElementById('catalog-grid');
    let items;

    if (this.activeTab === 'beats') {
      items = this.activeFilter === 'all'
        ? this.beatsData
        : this.beatsData.filter(b => b.genre === this.activeFilter);
      grid.innerHTML = items.map(beat => this.beatCard(beat)).join('');
    } else {
      items = this.activeFilter === 'all'
        ? this.samplesData
        : this.samplesData.filter(s => s.type === this.activeFilter);
      grid.innerHTML = items.map(sample => this.sampleCard(sample)).join('');
    }

    // Animate cards in
    grid.querySelectorAll('.card').forEach((card, i) => {
      card.style.animationDelay = `${i * 0.08}s`;
    });
  },

  beatCard(beat) {
    const tagsHTML = beat.tags.map(t => `<span class="tag">${t}</span>`).join('');
    return `
      <div class="card beat-card" data-id="${beat.id}" data-audio="${beat.audioPreview}">
        <div class="card-cover">
          <div class="cover-gradient"></div>
          <div class="play-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
          <div class="progress-bar"><div class="progress-fill"></div></div>
        </div>
        <div class="card-body">
          <h3 class="card-title">${beat.title}</h3>
          <div class="card-meta">
            <span class="meta-item"><strong>${beat.bpm}</strong> BPM</span>
            <span class="meta-divider">•</span>
            <span class="meta-item">Key: <strong>${beat.key}</strong></span>
          </div>
          <div class="card-tags">${tagsHTML}</div>
          <div class="card-footer">
            <span class="genre-badge">${beat.genre}</span>
            <span class="price">${beat.price}</span>
          </div>
        </div>
      </div>
    `;
  },

  sampleCard(sample) {
    const tagsHTML = sample.tags.map(t => `<span class="tag">${t}</span>`).join('');
    return `
      <div class="card sample-card" data-id="${sample.id}" data-audio="${sample.audioPreview}">
        <div class="card-cover sample-cover">
          <div class="sample-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>
          </div>
          <div class="play-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
          <div class="progress-bar"><div class="progress-fill"></div></div>
        </div>
        <div class="card-body">
          <h3 class="card-title">${sample.title}</h3>
          <div class="card-meta">
            <span class="meta-item">${sample.type}</span>
            <span class="meta-divider">•</span>
            <span class="meta-item"><strong>${sample.count}</strong> sons</span>
          </div>
          <div class="card-tags">${tagsHTML}</div>
        </div>
      </div>
    `;
  },

  bindEvents() {
    // Tab switching
    document.getElementById('catalog-tabs').addEventListener('click', (e) => {
      const tab = e.target.closest('.tab');
      if (!tab) return;
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      this.activeTab = tab.dataset.tab;
      this.renderFilters();
      this.renderCards();
    });

    // Filter clicking
    document.getElementById('catalog-filters').addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.activeFilter = btn.dataset.filter;
      this.renderCards();
    });

    // Card play
    document.getElementById('catalog-grid').addEventListener('click', (e) => {
      const card = e.target.closest('.card');
      if (!card) return;
      const audio = card.dataset.audio;
      if (audio) {
        AudioPlayer.play(audio, card);
      }
    });
  }
};
