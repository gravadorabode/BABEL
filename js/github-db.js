/**
 * GitHub DB — Octokit wrapper for "Database" operations
 */
const DB = {
    owner: '',
    repo: '',
    branch: 'main',
    token: null,

    async init() {
        // Load config
        const res = await fetch('data/config.json');
        const config = await res.json();
        this.owner = config.repoOwner;
        this.repo = config.repoName;
        this.branch = config.branch || 'main';

        // Load token from auth (if logged in)
        const savedToken = localStorage.getItem('ag_token');
        if (savedToken) {
            this.token = CryptoUtils.decryptToken(savedToken);
        }
    },

    // Read JSON file
    async get(file) {
        // Use raw GitHub content for reading (fast, cached)
        const url = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/data/${file}.json?t=${Date.now()}`;
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('File not found');
            return await res.json();
        } catch (e) {
            console.error(`Error reading ${file}:`, e);
            return null;
        }
    },

    // Write JSON file (Commit)
    async write(file, data, message) {
        if (!this.token) throw new Error('Acesso não autorizado. Requer Token.');

        const octokit = new Octokit({ auth: this.token });
        const path = `data/${file}.json`;
        let sha;

        try {
            // Try to get current SHA
            const res = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
                owner: this.owner,
                repo: this.repo,
                path: path,
                ref: this.branch
            });
            sha = res.data.sha;
        } catch (e) {
            // If 404, file doesn't exist, so we create it (no SHA needed)
            if (e.status !== 404) {
                console.error(`Error getting SHA for ${file}:`, e);
                // We might proceed if it's a new repo, but let's log it.
            }
        }

        try {
            // Update or Create
            const content = btoa(JSON.stringify(data, null, 2));
            await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
                owner: this.owner,
                repo: this.repo,
                path: path,
                message: message || `Update ${file}`,
                content: content,
                sha: sha, // Undefined if new file
                branch: this.branch
            });

            return true;
        } catch (e) {
            console.error(`Error writing ${file}:`, e);
            throw e;
        }
    },

    // Upload Binary File (MP3/Image)
    async uploadFile(path, file, message) {
        if (!this.token) throw new Error('Acesso não autorizado. Requer Token.');

        const octokit = new Octokit({ auth: this.token });

        // Convert file to base64
        const toBase64 = file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });

        const content = await toBase64(file);

        try {
            await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
                owner: this.owner,
                repo: this.repo,
                path: path,
                message: message || `Upload ${path}`,
                content: content,
                branch: this.branch
            });

            // Return raw URL
            return `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/${path}`;
        } catch (e) {
            console.error('Error uploading file:', e);
            throw e;
        }
    }
};

// Expose Octokit for global use from CDN
import { Octokit } from "https://esm.sh/@octokit/core";
window.Octokit = Octokit;
window.DB = DB;
