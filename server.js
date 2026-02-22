const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const frontMatter = require('front-matter');
const { exec } = require('child_process');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Cache TTLs ───────────────────────────────────────────────────────────────
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000; // 1 year (immutable assets)
const NO_CACHE = 0;                           // always revalidate HTML

// ─── Static Files ─────────────────────────────────────────────────────────────
// Immutable assets (images, fonts, videos, js bundles) — cache for 1 year
app.use('/assets', express.static(path.join(__dirname, 'assets'), {
    maxAge: ONE_YEAR_MS,
    immutable: true,
    etag: true,
    lastModified: true,
}));
app.use('/js', express.static(path.join(__dirname, 'js'), {
    maxAge: ONE_YEAR_MS,
    immutable: true,
    etag: true,
    lastModified: true,
}));

// Admin panel UI assets
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: NO_CACHE,
    etag: true,
    lastModified: true,
}));

// Blog static HTML (generated pages — revalidate but allow conditional caching)
app.use('/blog', express.static(path.join(__dirname, 'blog'), {
    maxAge: NO_CACHE,
    etag: true,
    lastModified: true,
}));

// Main website HTML pages (root)
app.use(express.static(__dirname, {
    maxAge: NO_CACHE,
    etag: true,
    lastModified: true,
    index: 'index.html',
}));

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Session ──────────────────────────────────────────────────────────────────
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret_key_change_me',
    resave: false,
    saveUninitialized: false, // don't create session until something stored
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 8 * 60 * 60 * 1000, // 8 hours
    },
}));

// ─── Multer (Image Uploads) ────────────────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'assets/blog');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});
const upload = multer({ storage });

// ─── Auth Middleware ───────────────────────────────────────────────────────────
const requireAuth = (req, res, next) => {
    if (req.session.isAuthenticated) return next();
    res.redirect('/admin/login');
};

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// ─── Admin Routes ─────────────────────────────────────────────────────────────

// Login
app.get('/admin/login', (req, res) => {
    res.render('admin/login', { error: null });
});

app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASS || 'admin';

    if (username === adminUser && password === adminPass) {
        req.session.isAuthenticated = true;
        res.redirect('/admin');
    } else {
        res.render('admin/login', { error: 'Credenciais inválidas' });
    }
});

// Logout
app.get('/admin/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/admin/login'));
});

// Dashboard — list posts
app.get('/admin', requireAuth, (req, res) => {
    const postsDir = path.join(__dirname, 'blog/posts');
    const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));

    const posts = files
        .map(file => {
            const content = fs.readFileSync(path.join(postsDir, file), 'utf-8');
            const { attributes } = frontMatter(content);
            return { filename: file, title: attributes.title, date: attributes.date, author: attributes.author };
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    res.render('admin/dashboard', { posts });
});

// New post editor
app.get('/admin/new', requireAuth, (req, res) => {
    res.render('admin/editor', { post: null });
});

// Edit post editor
app.get('/admin/edit/:filename', requireAuth, (req, res) => {
    const filePath = path.join(__dirname, 'blog/posts', req.params.filename);
    if (!fs.existsSync(filePath)) return res.redirect('/admin');

    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = frontMatter(content);
    res.render('admin/editor', {
        post: { filename: req.params.filename, ...parsed.attributes, body: parsed.body },
    });
});

// Save post
app.post('/admin/save', requireAuth, (req, res) => {
    const { filename, title, date, author, description, image, tags, content } = req.body;

    const fileContent = [
        '---',
        `title: "${title.replace(/"/g, '\\"')}"`,
        `date: "${date}"`,
        `author: "${author}"`,
        `description: "${description.replace(/"/g, '\\"')}"`,
        `image: "${image}"`,
        `tags: [${tags.split(',').map(t => `"${t.trim()}"`).join(', ')}]`,
        '---',
        '',
        content,
    ].join('\n');

    let targetFilename = filename;
    if (!targetFilename) {
        const slug = title.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
        targetFilename = `${slug}.md`;
    }

    fs.writeFileSync(path.join(__dirname, 'blog/posts', targetFilename), fileContent);
    triggerBuild();
    res.redirect('/admin');
});

// Delete post
app.post('/admin/delete', requireAuth, (req, res) => {
    const filePath = path.join(__dirname, 'blog/posts', req.body.filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        triggerBuild();
    }
    res.redirect('/admin');
});

// Image upload
app.post('/admin/upload', requireAuth, upload.single('image'), (req, res) => {
    if (req.file) {
        res.json({ url: `/assets/blog/${req.file.filename}` });
    } else {
        res.status(400).json({ error: 'No file uploaded' });
    }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function triggerBuild() {
    exec('node scripts/build-blog.js', (error, stdout, stderr) => {
        if (error) console.error(`[build] Error: ${error.message}`);
        if (stdout) console.log(`[build] ${stdout.trim()}`);
        if (stderr) console.error(`[build] stderr: ${stderr.trim()}`);
    });
}

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`✅  Server running at http://localhost:${PORT}`);
    console.log(`   Admin panel: http://localhost:${PORT}/admin`);
});
