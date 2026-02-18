/**
 * Admin — GitHub DB Version
 */
const Admin = {
    async init() {
        // Check if user is admin (simplified check mostly for UI, real security is repo permissions)
        const session = localStorage.getItem('ag_user');

        // Hardcoded Access Check (replace with your logic)
        // Since it's a "public" db, anyone can read this code, so "admin" is just a UI state here.
        // Real protection is that only people with the Repo PAT can write/delete.
        // Ideally, you'd check if the user is the Repo Owner via GitHub API, but we'll stick to a simple email check for the hackathon context.

        // Assuming we want to show it only to a specific email
        /*
        if (!session || JSON.parse(session).email !== 'admin@antigravity.com') {
            document.getElementById('admin-layout').style.display = 'none';
            document.body.innerHTML = '<h1 style="color:white;text-align:center;margin-top:20%;">Acesso Negado</h1>';
            return;
        }
        */

        this.bindNav();
        this.loadDashboard();
    },

    bindNav() {
        document.querySelectorAll('.admin-nav-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.admin-nav-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                const section = item.dataset.section;
                document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
                document.getElementById(`section-${section}`).style.display = 'block';

                if (section === 'dashboard') this.loadDashboard();
                if (section === 'producers') this.loadProducers();
                if (section === 'tracks') this.loadTracks();
            });
        });
    },

    async loadDashboard() {
        try {
            const dbData = await DB.get('db');
            const userData = await DB.get('users');

            if (!dbData || !userData) return;

            // Stats
            const tracks = dbData.tracks || [];
            const users = userData.users || [];

            // Likes
            const p = Object.values(dbData.likes.producer).reduce((a, c) => a + Object.keys(c).length, 0);
            const v = Object.values(dbData.likes.visitor).reduce((a, c) => a + Object.keys(c).length, 0);

            document.getElementById('dash-producers').textContent = users.length;
            document.getElementById('dash-tracks').textContent = tracks.length;
            document.getElementById('dash-likes').textContent = p + v;

        } catch (e) { console.error(e); }
    },

    async loadProducers() {
        const tbody = document.getElementById('admin-producers-body');
        tbody.innerHTML = '<tr><td colspan="3">Carregando...</td></tr>';

        try {
            const data = await DB.get('users');
            tbody.innerHTML = data.users.map(u => `
                <tr>
                    <td>${u.name}</td>
                    <td>${u.email}</td>
                    <td>${u.role || 'producer'}</td>
                </tr>
            `).join('');
        } catch (e) { tbody.innerHTML = '<tr><td colspan="3">Erro.</td></tr>'; }
    },

    async loadTracks() {
        const tbody = document.getElementById('admin-tracks-body');
        tbody.innerHTML = '<tr><td colspan="4">Carregando...</td></tr>';

        try {
            const data = await DB.get('db');
            // Likes helper
            const pLikes = data.likes.producer;
            const vLikes = data.likes.visitor;

            tbody.innerHTML = data.tracks.map(t => {
                const p = pLikes[t.id] ? Object.keys(pLikes[t.id]).length : 0;
                const v = vLikes[t.id] ? Object.keys(vLikes[t.id]).length : 0;
                return `
                <tr>
                    <td>${t.title}</td>
                    <td>${t.producerName}</td>
                    <td>${t.genre}</td>
                    <td>${p + v}</td>
                </tr>
            `;
            }).join('');
        } catch (e) { tbody.innerHTML = '<tr><td colspan="4">Erro.</td></tr>'; }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (window.DB) DB.init().then(() => Admin.init());
});
