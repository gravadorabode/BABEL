/**
 * AudioPlayer — Global bottom bar player with queue
 */
const AudioPlayer = {
    audioEl: null,
    queue: [],
    currentIndex: -1,
    isPlaying: false,

    init() {
        this.audioEl = document.createElement('audio');
        this.audioEl.preload = 'metadata';
        document.body.appendChild(this.audioEl);

        this.audioEl.addEventListener('ended', () => this.next());
        this.audioEl.addEventListener('timeupdate', () => this.updateProgress());
        this.audioEl.addEventListener('loadedmetadata', () => this.updateDuration());

        // Bind controls
        const playBtn = document.getElementById('player-play');
        const prevBtn = document.getElementById('player-prev');
        const nextBtn = document.getElementById('player-next');
        const progressBar = document.getElementById('player-progress-bar');
        const volBtn = document.getElementById('player-vol-btn');
        const volSlider = document.getElementById('volume-slider');

        if (playBtn) playBtn.addEventListener('click', () => this.togglePlay());
        if (prevBtn) prevBtn.addEventListener('click', () => this.prev());
        if (nextBtn) nextBtn.addEventListener('click', () => this.next());

        if (progressBar) {
            progressBar.addEventListener('click', (e) => {
                const rect = progressBar.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                if (this.audioEl.duration) {
                    this.audioEl.currentTime = pct * this.audioEl.duration;
                }
            });
        }

        if (volSlider) {
            volSlider.addEventListener('click', (e) => {
                const rect = volSlider.getBoundingClientRect();
                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                this.audioEl.volume = pct;
                const fill = document.getElementById('volume-fill');
                if (fill) fill.style.width = (pct * 100) + '%';
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.code === 'Space') { e.preventDefault(); this.togglePlay(); }
            if (e.code === 'ArrowRight') this.next();
            if (e.code === 'ArrowLeft') this.prev();
        });
    },

    setQueue(tracks) {
        this.queue = tracks;
    },

    playTrack(track, allTracks) {
        if (allTracks) this.queue = allTracks;

        const idx = this.queue.findIndex(t => t.id === track.id);
        if (idx >= 0) this.currentIndex = idx;

        this.audioEl.src = track.audioUrl || '';
        this.audioEl.play().catch(() => { });
        this.isPlaying = true;

        this.updatePlayerUI(track);
        this.showPlayer();
        this.updatePlayIcon(true);

        // Highlight playing card
        document.querySelectorAll('.track-card').forEach(c => c.classList.remove('playing'));
        const card = document.querySelector(`[data-track-id="${track.id}"]`);
        if (card) card.classList.add('playing');

        // Track play count
        if (track.id) {
            db.collection('tracks').doc(track.id).update({
                plays: firebase.firestore.FieldValue.increment(1)
            }).catch(() => { });
        }
    },

    togglePlay() {
        if (!this.audioEl.src) return;
        if (this.audioEl.paused) {
            this.audioEl.play().catch(() => { });
            this.isPlaying = true;
            this.updatePlayIcon(true);
        } else {
            this.audioEl.pause();
            this.isPlaying = false;
            this.updatePlayIcon(false);
        }
    },

    next() {
        if (this.queue.length === 0) return;
        this.currentIndex = (this.currentIndex + 1) % this.queue.length;
        this.playTrack(this.queue[this.currentIndex]);
    },

    prev() {
        if (this.queue.length === 0) return;
        this.currentIndex = (this.currentIndex - 1 + this.queue.length) % this.queue.length;
        this.playTrack(this.queue[this.currentIndex]);
    },

    updateProgress() {
        if (!this.audioEl.duration) return;
        const pct = (this.audioEl.currentTime / this.audioEl.duration) * 100;

        const fill = document.getElementById('player-progress-fill');
        if (fill) fill.style.width = pct + '%';

        const current = document.getElementById('player-time-current');
        if (current) current.textContent = this.formatTime(this.audioEl.currentTime);

        // Update card progress bar too
        if (this.queue[this.currentIndex]) {
            const card = document.querySelector(`[data-track-id="${this.queue[this.currentIndex].id}"]`);
            if (card) {
                const cardFill = card.querySelector('.track-progress-fill');
                if (cardFill) cardFill.style.width = pct + '%';
            }
        }
    },

    updateDuration() {
        const total = document.getElementById('player-time-total');
        if (total) total.textContent = this.formatTime(this.audioEl.duration);
    },

    updatePlayerUI(track) {
        const title = document.getElementById('player-title');
        const artist = document.getElementById('player-artist');
        if (title) title.textContent = track.title || '—';
        if (artist) artist.textContent = track.producerName || '—';
    },

    updatePlayIcon(playing) {
        const icon = document.getElementById('player-play-icon');
        if (!icon) return;
        if (playing) {
            icon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
        } else {
            icon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
        }
    },

    showPlayer() {
        const player = document.getElementById('global-player');
        if (player) player.classList.add('visible');
    },

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }
};

document.addEventListener('DOMContentLoaded', () => AudioPlayer.init());
