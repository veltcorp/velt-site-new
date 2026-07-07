const express = require('express');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

// ─── Cache TTLs ───────────────────────────────────────────────────────────────
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const NO_CACHE = 0;

// ─── Static Files ─────────────────────────────────────────────────────────────
app.use('/assets', express.static(path.join(__dirname, 'assets'), {
    maxAge: ONE_YEAR_MS,
    immutable: true,
    etag: true,
    lastModified: true,
}));

app.get('/js/layout.js', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, private, must-revalidate');
    res.sendFile(path.join(__dirname, 'js', 'layout.js'), { etag: true, lastModified: true });
});

app.use('/js', express.static(path.join(__dirname, 'js'), {
    maxAge: ONE_YEAR_MS,
    immutable: true,
    etag: true,
    lastModified: true,
}));

app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: NO_CACHE,
    etag: true,
    lastModified: true,
}));

app.use('/blog', express.static(path.join(__dirname, 'blog'), {
    maxAge: NO_CACHE,
    etag: true,
    lastModified: true,
}));

app.use(express.static(__dirname, {
    maxAge: NO_CACHE,
    etag: true,
    lastModified: true,
    index: 'index.html',
}));

// ─── Clean URL Middleware ──────────────────────────────────────────────────────
app.use((req, res, next) => {
    if (/\.\w+$/.test(req.path) || req.path.startsWith('/admin') || req.path.startsWith('/api') || req.path.startsWith('/health')) {
        return next();
    }

    const rawPath = req.path.replace(/\/$/, '') || '/index';
    const candidates = [
        path.join(__dirname, `${rawPath}.html`),
        path.join(__dirname, rawPath, 'index.html'),
    ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return res.sendFile(candidate, { headers: { 'Cache-Control': 'no-cache' } });
        }
    }
    next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.get('/admin', (req, res) => {
    res.redirect('/admin/index.html');
});

// ─── GitHub OAuth (Decap CMS) ─────────────────────────────────────────────────

function getBaseUrl(req) {
    if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    return `${proto}://${req.get('host')}`;
}

function createOAuthState() {
    const secret = process.env.OAUTH_STATE_SECRET || 'dev_oauth_secret_change_me';
    return crypto.createHmac('sha256', secret).update(String(Date.now())).digest('hex');
}

app.get('/api/auth', (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
        return res.status(500).send('GITHUB_CLIENT_ID não configurado.');
    }

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: `${getBaseUrl(req)}/api/auth/callback`,
        scope: 'repo',
        state: createOAuthState(),
    });

    res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

app.get('/api/auth/callback', async (req, res) => {
    const { code } = req.query;
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!code || !clientId || !clientSecret) {
        return res.status(400).send('Configuração OAuth incompleta ou código ausente.');
    }

    try {
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
            }),
        });

        const data = await tokenRes.json();

        if (data.error || !data.access_token) {
            return res.status(401).send(data.error_description || 'Falha na autenticação GitHub.');
        }

        const tokenPayload = JSON.stringify({ token: data.access_token, provider: 'github' });
        const message = `authorization:github:success:${tokenPayload}`;
        const origin = getBaseUrl(req);

        res.send(`<!DOCTYPE html>
<html><body><script>
(function() {
  window.opener.postMessage(${JSON.stringify(message)}, ${JSON.stringify(origin)});
  window.close();
})();
</script></body></html>`);
    } catch (err) {
        console.error('[oauth] callback error:', err);
        res.status(500).send('Erro interno na autenticação.');
    }
});

// ─── Start ────────────────────────────────────────────────────────────────────
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`✅  Server running at http://localhost:${PORT}`);
        console.log(`   Blog CMS:  http://localhost:${PORT}/admin`);
    });
}

module.exports = app;
