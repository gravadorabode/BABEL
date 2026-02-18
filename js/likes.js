/**
 * Likes — GitHub Version
 */
const Likes = {
    createButtons(trackId, pCount, vCount) {
        return `
            <div class="track-likes">
                <button class="like-btn like-btn-producer" data-id="${trackId}" data-type="producer" title="Producer Like (+2)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    <span>${pCount}</span>
                </button>
                <button class="like-btn" data-id="${trackId}" data-type="visitor" title="Visitor Like (+1)">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    <span>${vCount}</span>
                </button>
            </div>
        `;
    },

    async toggle(trackId, type, btnElement) {
        // Optimistic UI update
        const countSpan = btnElement.querySelector('span');
        let current = parseInt(countSpan.textContent);

        // Check local state to toggle
        const isLiked = btnElement.classList.contains('liked');
        const increment = isLiked ? -1 : 1;

        // Update UI immediately
        btnElement.classList.toggle('liked');
        countSpan.textContent = current + increment;

        // Identify User
        let userId;
        if (type === 'producer') {
            const session = localStorage.getItem('ag_user');
            if (!session) {
                Toast.show('Faça login como produtor.', 'info');
                // Revert UI
                btnElement.classList.remove('liked');
                countSpan.textContent = current;
                return;
            }
            userId = JSON.parse(session).uid;
        } else {
            userId = localStorage.getItem('ag_visitor_id');
            if (!userId) {
                userId = 'v_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('ag_visitor_id', userId);
            }
        }

        try {
            // Fetch DB
            // Note: This is partial "race condition" risk on GitHub JSON
            // In a real app, this is bad. For a hackathon/creative project, it's accepted.
            const data = await DB.get('db');
            if (!data) throw new Error('DB Error');

            // Ensure structure
            if (!data.likes) data.likes = { producer: {}, visitor: {} };
            if (!data.likes[type]) data.likes[type] = {};
            if (!data.likes[type][trackId]) data.likes[type][trackId] = {};

            // Toggle Logic
            if (data.likes[type][trackId][userId]) {
                delete data.likes[type][trackId][userId]; // Unlike
            } else {
                data.likes[type][trackId][userId] = Date.now(); // Like
            }

            // Commit
            await DB.write('db', data, `${type === 'producer' ? 'Producer' : 'Visitor'} like on ${trackId}`);

        } catch (err) {
            console.error(err);
            Toast.show('Erro ao salvar like', 'error');
            // Revert UI logic here if desired
        }
    }
};
