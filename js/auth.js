/**
 * Auth — GitHub-based Authentication
 */
const Auth = {
    currentUser: null,

    async init() {
        // Toggle forms logic (same as before)
        const showReg = document.getElementById('show-register');
        const showLog = document.getElementById('show-login');
        if (showReg) {
            showReg.addEventListener('click', () => {
                document.getElementById('login-form-wrapper').style.display = 'none';
                document.getElementById('register-form-wrapper').style.display = 'block';
            });
        }
        if (showLog) {
            showLog.addEventListener('click', () => {
                document.getElementById('register-form-wrapper').style.display = 'none';
                document.getElementById('login-form-wrapper').style.display = 'block';
            });
        }

        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.login();
            });
        }

        // Register form
        const regForm = document.getElementById('register-form');
        if (regForm) {
            regForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.register();
            });
        }

        // Check session
        const session = localStorage.getItem('ag_user');
        if (session) {
            this.currentUser = JSON.parse(session);
            this.updateNavbar(this.currentUser);

            // If on login page, redirect
            if (window.location.pathname.includes('login.html')) {
                window.location.href = 'profile.html?id=' + this.currentUser.uid;
            }
        } else {
            this.updateNavbar(null);
        }
    },

    async login() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');
        const btn = document.querySelector('#login-form button');

        btn.disabled = true;
        btn.textContent = 'Verificando...';

        try {
            // Get users DB
            const data = await DB.get('users');
            if (!data) throw new Error('Erro ao conectar com banco de dados.');

            const user = data.users.find(u => u.email === email);
            if (!user) throw new Error('Usuário não encontrado.');

            // Check password hash
            const hash = await CryptoUtils.hashPassword(password);
            if (hash !== user.passwordHash) throw new Error('Senha incorreta.');

            // Success
            this.setSession(user);
            Toast.show('Login realizado!', 'success');
            setTimeout(() => window.location.href = 'profile.html?id=' + user.uid, 500);

        } catch (err) {
            errorEl.textContent = err.message || 'Erro no login.';
            errorEl.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Entrar';
        }
    },

    async register() {
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        // Ideally, ask for PAT here or use a system-wide encrypted one
        // For this demo, we assume the user might need to input a PAT if we want true "public repo" writing without a proxy
        // But per plan, we'll try to find a global PAT or ask for it. 
        // SIMPLIFICATION: We'll ask for a PAT in the register form for the "First User" or prompt via modal.
        // ACTUALLY: Let's prompt for PAT if not set in localStorage, otherwise assume System/Admin set it.

        const errorEl = document.getElementById('register-error');
        const btn = document.querySelector('#register-form button');

        if (!name) {
            errorEl.textContent = 'Nome obrigatório.';
            errorEl.style.display = 'block';
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Criando conta...';

        try {
            // 1. Check if token exists
            let token = localStorage.getItem('ag_token');
            if (!token) {
                // Creating the first user? Or need to provide one?
                // Prompt user for GitHub PAT (Not ideal UX but necessary for client-side only write)
                const pat = prompt("Para registrar no banco de dados GitHub, insira seu Personal Access Token (PAT) com permissão 'repo':");
                if (!pat) throw new Error('Token necessário para escrita.');

                // Encrypt and save
                token = CryptoUtils.encryptToken(pat);
                localStorage.setItem('ag_token', token);
                DB.token = pat; // Update memory
            }

            // 2. Get Users DB
            let data = await DB.get('users');
            if (!data) {
                // If file doesn't exist, bootstrap it
                data = { users: [] };
            }

            if (data.users.find(u => u.email === email)) {
                throw new Error('Email já cadastrado.');
            }

            // 3. Create User
            const uid = 'u_' + Date.now().toString(36);
            const hash = await CryptoUtils.hashPassword(password);

            const newUser = {
                uid,
                name,
                email,
                passwordHash: hash, // Storing hash
                bio: '',
                avatar: '',
                links: {},
                role: 'producer',
                createdAt: new Date().toISOString()
            };

            data.users.push(newUser);

            // 4. Commit
            await DB.write('users', data, `Register user ${name}`);

            this.setSession(newUser);
            Toast.show('Conta criada!', 'success');
            setTimeout(() => window.location.href = 'profile.html?id=' + uid, 500);

        } catch (err) {
            errorEl.textContent = err.message || 'Erro ao registrar.';
            errorEl.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Criar Conta';
        }
    },

    logout() {
        localStorage.removeItem('ag_user');
        // Optional: clear token if we want strict security, but reusing PAT is convenient
        window.location.href = 'index.html';
    },

    setSession(user) {
        // Don't store hash in session
        const safeUser = { ...user };
        delete safeUser.passwordHash;
        localStorage.setItem('ag_user', JSON.stringify(safeUser));
        this.currentUser = safeUser;
    },

    updateNavbar(user) {
        const navUser = document.getElementById('nav-user');
        if (!navUser) return;

        if (user) {
            const initial = (user.name || '?')[0].toUpperCase();
            navUser.innerHTML = `
                <a href="profile.html?id=${user.uid}" class="nav-avatar-placeholder" title="${user.name}">${initial}</a>
                <button class="btn-login-nav" onclick="Auth.logout()">Sair</button>
            `;
        } else {
            navUser.innerHTML = `<a href="login.html" class="btn-login-nav">Entrar</a>`;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => Auth.init());
