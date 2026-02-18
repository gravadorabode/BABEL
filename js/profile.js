/**
 * Profile — User profile via users.json
 */
const Profile = {
    profileId: null,
    profileData: null,

    async init() {
        const params = new URLSearchParams(window.location.search);
        this.profileId = params.get('id');

        // If no ID in URL, check local session
        if (!this.profileId) {
            const session = localStorage.getItem('ag_user');
            if (session) {
                const user = JSON.parse(session);
                this.profileId = user.uid;
                window.history.replaceState(null, '', `?id=${user.uid}`);
            } else {
                window.location.href = 'login.html';
                return;
            }
        }

        await this.loadProfile();
        await this.loadTracks();
        this.bindEvents();
    },

    async loadProfile() {
        try {
            const data = await DB.get('users');
            if (!data) return;

            this.profileData = data.users.find(u => u.uid === this.profileId);

            if (!this.profileData) {
                document.getElementById('profile-name').textContent = "Usuário não encontrado";
                return;
            }

            this.renderHeader(this.profileData);

            // Check owner to show edit buttons
            const session = localStorage.getItem('ag_user');
            if (session) {
                const currentUser = JSON.parse(session);
                if (currentUser.uid === this.profileId) {
                    const actions = document.getElementById('profile-actions');
                    if (actions) actions.style.display = 'flex';
                }
            }

        } catch (err) {
            console.error(err);
            Toast.show('Erro ao carregar perfil', 'error');
        }
    },

    renderHeader(data) {
        document.getElementById('profile-name').textContent = data.name;
        document.getElementById('profile-bio').textContent = data.bio || '';

        const avatarWrapper = document.getElementById('profile-avatar-wrapper');
        const initial = (data.name || '?')[0].toUpperCase();

        if (data.avatar) {
            avatarWrapper.innerHTML = `<img src="${data.avatar}" class="profile-avatar" alt="${data.name}">`;
        } else {
            avatarWrapper.innerHTML = `<div class="profile-avatar-placeholder">${initial}</div>`;
        }

        // Links
        const linksContainer = document.getElementById('profile-links');
        const links = [];
        if (data.links?.instagram) links.push(`<a href="${data.links.instagram}" target="_blank" class="profile-link">Instagram</a>`);
        if (data.links?.youtube) links.push(`<a href="${data.links.youtube}" target="_blank" class="profile-link">YouTube</a>`);
        linksContainer.innerHTML = links.join('');
    },

    async loadTracks() {
        const grid = document.getElementById('profile-tracks-grid');
        try {
            const data = await DB.get('db'); // db.json
            if (!data || !data.tracks) {
                grid.innerHTML = '<div class="empty-state">Sem faixas.</div>';
                return;
            }

            const tracks = data.tracks.filter(t => t.producerId === this.profileId);
            document.getElementById('profile-track-count').textContent = tracks.length;

            if (tracks.length === 0) {
                grid.innerHTML = '<div class="empty-state">Este produtor ainda não tem faixas.</div>';
                return;
            }

            // Calculate likes
            let totalLikes = 0;
            const pLikes = data.likes.producer || {};
            const vLikes = data.likes.visitor || {};

            tracks.forEach(t => {
                const pCount = pLikes[t.id] ? Object.keys(pLikes[t.id]).length : 0;
                const vCount = vLikes[t.id] ? Object.keys(vLikes[t.id]).length : 0;
                totalLikes += (pCount * 2) + vCount; // Weighted score
            });

            document.getElementById('profile-like-count').textContent = totalLikes;

            // Render Grid
            grid.innerHTML = tracks.map(track => {
                const pCount = pLikes[track.id] ? Object.keys(pLikes[track.id]).length : 0;
                const vCount = vLikes[track.id] ? Object.keys(vLikes[track.id]).length : 0;
                // Pass simple object to render
                return this.createCardHTML(track);
            }).join('');

            // Bind Play Buttons
            grid.querySelectorAll('.track-play-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = btn.closest('.track-card').dataset.trackId;
                    const track = tracks.find(t => t.id === id);
                    if (track) AudioPlayer.playTrack(track, tracks);
                });
            });

        } catch (err) {
            console.error(err);
            grid.innerHTML = '<div class="empty-state">Erro ao carregar faixas.</div>';
        }
    },

    createCardHTML(track) {
        return `
            <div class="track-card" data-track-id="${track.id}">
                <div class="track-cover" style="height:160px;">
                    ${track.cover ? `<img src="${track.cover}" class="track-cover-img">` : ''}
                    <div class="track-cover-overlay"></div>
                    <div class="track-play-btn">
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </div>
                </div>
                <div class="track-body">
                    <h4 style="font-size:1rem; margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${track.title}</h4>
                    <div style="font-size:0.8rem; color:var(--text-secondary);">${track.genre} • ${track.bpm} BPM</div>
                </div>
            </div>
        `;
    },

    bindEvents() {
        const modal = document.getElementById('modal-edit-profile');
        const editBtn = document.getElementById('btn-edit-profile');
        const closeBtn = document.getElementById('close-edit-profile');
        const form = document.getElementById('edit-profile-form');

        if (editBtn) {
            editBtn.addEventListener('click', () => {
                modal.classList.add('open');
                if (this.profileData) {
                    document.getElementById('edit-bio').value = this.profileData.bio || '';
                    document.getElementById('edit-instagram').value = this.profileData.links?.instagram || '';
                    document.getElementById('edit-youtube').value = this.profileData.links?.youtube || '';
                    document.getElementById('edit-whatsapp').value = this.profileData.links?.whatsapp || '';
                }
            });
        }

        if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('open'));

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveProfile();
            });
        }
    },

    async saveProfile() {
        const bio = document.getElementById('edit-bio').value;
        const instagram = document.getElementById('edit-instagram').value;
        const youtube = document.getElementById('edit-youtube').value;
        const whatsapp = document.getElementById('edit-whatsapp').value;
        // Avatar upload would be similar to track upload: uploadFile -> get URL -> update JSON

        try {
            const data = await DB.get('users');
            if (!data) throw new Error('DB Error');

            const idx = data.users.findIndex(u => u.uid === this.profileId);
            if (idx === -1) throw new Error('User not found');

            // Update local object
            data.users[idx].bio = bio;
            data.users[idx].links = { instagram, youtube, whatsapp };

            // Commit
            await DB.write('users', data, `Update profile ${this.profileId}`);

            Toast.show('Perfil atualizado!', 'success');
            document.getElementById('modal-edit-profile').classList.remove('open');
            this.loadProfile(); // Reload UI

        } catch (err) {
            console.error(err);
            Toast.show('Erro ao salvar: ' + err.message, 'error');
        }
    }
};

// Start if currently on profile page
if (window.location.pathname.includes('profile.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        DB.init().then(() => Profile.init());
    });
}
