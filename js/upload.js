/**
 * Upload — GitHub Logic
 */
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btn-upload-track');
    const modal = document.getElementById('modal-upload');
    const close = document.getElementById('close-upload');
    const form = document.getElementById('upload-form');

    if (btn) btn.addEventListener('click', () => modal.classList.add('open'));
    if (close) close.addEventListener('click', () => modal.classList.remove('open'));

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const session = localStorage.getItem('ag_user');
            if (!session) {
                Toast.show('Faça login para enviar.', 'error');
                return;
            }
            const user = JSON.parse(session);

            const title = document.getElementById('upload-title').value;
            const genre = document.getElementById('upload-genre').value;
            const bpm = document.getElementById('upload-bpm').value;
            const file = document.getElementById('upload-audio').files[0];
            const submitBtn = document.getElementById('upload-submit');

            if (!file) {
                Toast.show('Selecione um arquivo.', 'error');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando ao GitHub...';

            try {
                // 1. Upload MP3
                const ext = file.name.split('.').pop();
                const fileName = `${Date.now()}_${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}`;
                const path = `audio/${fileName}`;

                // Upload binary
                const result = await DB.uploadFile(path, file, `Add track ${title}`);
                // Result is likely undefined from void promise, or we modify DB.uploadFile to return URL
                // Let's assume construction of RAW URL based on config
                // We need to fetch config again or use DB properties if exposed
                const rawUrl = `https://raw.githubusercontent.com/${DB.owner}/${DB.repo}/${DB.branch}/${path}`;

                // 2. Update DB.json
                let dbData = await DB.get('db');
                if (!dbData) {
                    dbData = { tracks: [], likes: { producer: {}, visitor: {} } };
                }
                if (!dbData.tracks) dbData.tracks = []; // safety

                const newTrack = {
                    id: 't_' + Date.now().toString(36),
                    producerId: user.uid,
                    producerName: user.name,
                    producerAvatar: user.avatar || '',
                    title: title,
                    genre: genre,
                    bpm: bpm,
                    key: document.getElementById('upload-key').value,
                    audioUrl: rawUrl,
                    createdAt: new Date().toISOString()
                };

                dbData.tracks.push(newTrack);

                // Commit JSON
                await DB.write('db', dbData, `Add metadata for ${title}`);

                Toast.show('Faixa publicada!', 'success');
                modal.classList.remove('open');
                form.reset();
                setTimeout(() => window.location.reload(), 1500);

            } catch (err) {
                console.error(err);
                let msg = err.message;
                if (err.message.includes('404')) msg = 'Erro 404: Verifique Token/Repo no config.json';
                if (err.message.includes('401') || err.message.includes('403')) msg = 'Erro de Permissão: Token Inválido?';

                Toast.show(msg, 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Enviar Faixa';
            }
        });
    }
});
