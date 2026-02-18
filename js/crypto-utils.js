/**
 * Crypto Utils — Client-side hashing and encryption
 */
const CryptoUtils = {
    async hashPassword(password, salt = 'antigravity') {
        const msgBuffer = new TextEncoder().encode(password + salt);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    // Simple XOR cipher for "obfuscating" the token in localStorage
    // NOTE: This is NOT secure against a determined attacker, but prevents cleartext storage
    encryptToken(token, key = 'antigravity-secret') {
        let result = '';
        for (let i = 0; i < token.length; i++) {
            result += String.fromCharCode(token.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return btoa(result);
    },

    decryptToken(cypher, key = 'antigravity-secret') {
        try {
            const str = atob(cypher);
            let result = '';
            for (let i = 0; i < str.length; i++) {
                result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            }
            return result;
        } catch (e) {
            return null;
        }
    }
};
