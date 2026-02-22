const fs = require('fs');
const path = require('path');
const marked = require('marked');
const frontMatter = require('front-matter');

// ─── Configuration ────────────────────────────────────────────────────────────
const POSTS_DIR = path.join(__dirname, '../blog/posts');
const OUTPUT_DIR = path.join(__dirname, '../blog');
const TEMPLATE_PATH = path.join(__dirname, '../blog/template.html');
const BLOG_INDEX_PATH = path.join(__dirname, '../blog.html');

const WATCH_MODE = process.argv.includes('--watch');
const FORCE = process.argv.includes('--force');

// ─── Pillar Config ────────────────────────────────────────────────────────────
const PILLAR_IMAGES = {
    'Viagens Corporativas': '/assets/blog/viagens-corporativas.svg',
    'Redução de Custos': '/assets/blog/reducao-de-custos.svg',
    'Financeiro': '/assets/blog/financeiro.svg',
    'Operação': '/assets/blog/operacao.svg',
    'Tecnologia': '/assets/blog/tecnologia.svg',
    'Gestão de Milhas': '/assets/blog/gestao-de-milhas.svg',
    'Experiência do Viajante': '/assets/blog/experiencia-do-viajante.svg',
};
const DEFAULT_IMAGE = '/assets/blog/default.svg';

const PILLAR_META = {
    'Viagens Corporativas': {
        slug: 'viagens-corporativas',
        description: 'Tudo sobre gestão inteligente de viagens corporativas: políticas, plataformas, TMCs e melhores práticas.',
        icon: '✈️', color: '#3B82F6',
    },
    'Redução de Custos': {
        slug: 'reducao-de-custos',
        description: 'Estratégias comprovadas para reduzir custos com viagens corporativas e aumentar a eficiência financeira.',
        icon: '📉', color: '#10B981',
    },
    'Financeiro': {
        slug: 'financeiro',
        description: 'Gestão financeira, compliance e governança aplicados a viagens corporativas.',
        icon: '💰', color: '#F59E0B',
    },
    'Operação': {
        slug: 'operacao',
        description: 'Eficiência operacional, automação de processos e backoffice inteligente para viagens.',
        icon: '⚙️', color: '#8B5CF6',
    },
    'Tecnologia': {
        slug: 'tecnologia',
        description: 'Inteligência artificial, automação e travel tech transformando viagens corporativas.',
        icon: '🤖', color: '#EC4899',
    },
    'Gestão de Milhas': {
        slug: 'gestao-de-milhas',
        description: 'Como transformar milhas em ativos corporativos com gestão inteligente e otimização.',
        icon: '🎯', color: '#EF4444',
    },
    'Experiência do Viajante': {
        slug: 'experiencia-do-viajante',
        description: 'Bem-estar, produtividade e experiência do viajante corporativo como diferencial competitivo.',
        icon: '😊', color: '#06B6D4',
    },
};

// ─── Shared Article Card (DRY) ────────────────────────────────────────────────
/**
 * Renders a standard blog post article card.
 * @param {Object} post - Post metadata + url
 * @returns {string} HTML string
 */
function renderArticleCard(post) {
    const pillar = post.pillar || post.tags?.[0] || 'Blog';
    const intent = post.intent || pillar;
    const funnel = post.funnel || '';
    return `
                <article class="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow border border-slate-100 group">
                    <div class="h-48 overflow-hidden">
                        <img src="${post.image}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="${post.title}" loading="lazy">
                    </div>
                    <div class="p-8">
                        <div class="flex items-center gap-2 mb-3">
                            <span class="text-xs font-bold text-primary uppercase">${intent}</span>
                            ${funnel ? `<span class="text-slate-300">•</span><span class="text-xs text-slate-400">${funnel}</span>` : ''}
                        </div>
                        <h2 class="text-xl font-bold text-secondary mb-3 leading-tight group-hover:text-primary transition-colors">
                            ${post.title}
                        </h2>
                        <p class="text-slate-500 text-sm mb-6 line-clamp-3">${post.description}</p>
                        <a href="${post.url}" class="text-secondary font-bold text-sm flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                            Ler Artigo <span class="material-icons text-sm">arrow_forward</span>
                        </a>
                    </div>
                </article>`;
}

// ─── Incremental Build Helper ─────────────────────────────────────────────────
function isOutputStale(mdSourcePath, htmlOutputPath) {
    if (FORCE || !fs.existsSync(htmlOutputPath)) return true;
    const srcMtime = fs.statSync(mdSourcePath).mtimeMs;
    const outMtime = fs.statSync(htmlOutputPath).mtimeMs;
    return srcMtime > outMtime;
}

// ─── Date Formatter ───────────────────────────────────────────────────────────
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
}

// ─── Build Posts ──────────────────────────────────────────────────────────────
function buildAllPosts() {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
    const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
    const posts = [];
    let builtCount = 0;

    console.log(`\n🔍  Found ${files.length} posts.`);

    files.forEach(file => {
        const mdPath = path.join(POSTS_DIR, file);
        const slug = file.replace('.md', '');
        const htmlPath = path.join(OUTPUT_DIR, `${slug}.html`);

        const fileContent = fs.readFileSync(mdPath, 'utf8');
        const { attributes, body } = frontMatter(fileContent);

        const resolvedImage = attributes.image
            || PILLAR_IMAGES[attributes.pillar]
            || PILLAR_IMAGES[attributes.category]
            || DEFAULT_IMAGE;

        const postMeta = {
            ...attributes,
            image: resolvedImage,
            slug,
            url: `/blog/${slug}.html`,
        };
        posts.push(postMeta);

        // ── Incremental: skip if output is fresh ──────────────────────────
        if (!isOutputStale(mdPath, htmlPath)) {
            return; // already up to date
        }

        const htmlContent = marked.parse(body);
        const wordCount = htmlContent.replace(/<[^>]*>/g, '').split(/\s+/).length;
        const readingTime = `${Math.ceil(wordCount / 200)} min de leitura`;

        const finalHtml = template
            .replace(/{{title}}/g, attributes.title)
            .replace(/{{description}}/g, attributes.description)
            .replace(/{{date}}/g, formatDate(attributes.date))
            .replace(/{{author}}/g, attributes.author || 'Velt Corp')
            .replace(/{{image}}/g, resolvedImage)
            .replace(/{{content}}/g, htmlContent)
            .replace(/{{reading_time}}/g, readingTime);

        fs.writeFileSync(htmlPath, finalHtml);
        console.log(`   ✅  Built: ${slug}.html`);
        builtCount++;
    });

    const skipped = files.length - builtCount;
    console.log(`\n   Done — ${builtCount} built, ${skipped} up-to-date (skipped).`);

    // Always regenerate index and pillar pages (they depend on all posts)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    updateBlogIndex(posts);
    generatePillarPages(posts);
}

// ─── Update Blog Index (blog.html) ────────────────────────────────────────────
function updateBlogIndex(posts) {
    if (!fs.existsSync(BLOG_INDEX_PATH)) {
        console.error('⚠️  blog.html not found — skipping index update.');
        return;
    }

    let blogIndexContent = fs.readFileSync(BLOG_INDEX_PATH, 'utf8');

    // Pillar nav pills
    const pillarNavHtml = Object.entries(PILLAR_META).map(([name, meta]) => {
        const count = posts.filter(p => (p.pillar || p.category) === name).length;
        return `
                    <a href="/blog/pillar-${meta.slug}.html"
                       class="flex items-center gap-3 px-5 py-3 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-primary/30 transition-all group">
                        <span class="text-2xl">${meta.icon}</span>
                        <div>
                            <span class="font-bold text-secondary group-hover:text-primary transition-colors block text-sm">${name}</span>
                            <span class="text-xs text-slate-400">${count} artigos</span>
                        </div>
                    </a>`;
    }).join('\n');

    const pillarSection = `
            <!-- Pillar Navigation -->
            <div class="mb-12">
                <h2 class="text-lg font-bold text-secondary mb-4 flex items-center gap-2">
                    <span class="material-icons text-primary">category</span> Explore por Pilar de Conteúdo
                </h2>
                <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
${pillarNavHtml}
                </div>
            </div>`;

    const postsHtml = posts.map(post => renderArticleCard(post)).join('\n');

    const gridRegex = /(<div class="grid md:grid-cols-3 gap-8"[^>]*>)([\s\S]*?)(<\/div>\s*<\/div>\s*<\/section>)/;

    if (gridRegex.test(blogIndexContent)) {
        // Remove any stale pillar section before injecting a fresh one
        blogIndexContent = blogIndexContent.replace(/\s*<!-- Pillar Navigation -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/m, '');
        const newContent = blogIndexContent.replace(gridRegex, `${pillarSection}\n$1\n${postsHtml}\n$3`);
        fs.writeFileSync(BLOG_INDEX_PATH, newContent);
        console.log('\n   📋  Updated blog.html');
    } else {
        console.error('⚠️  Could not find the articles grid in blog.html.');
    }
}

// ─── Generate Pillar Pages ────────────────────────────────────────────────────
function generatePillarPages(posts) {
    Object.entries(PILLAR_META).forEach(([pillarName, meta]) => {
        const pillarPosts = posts
            .filter(p => (p.pillar || p.category) === pillarName)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        const pillarImage = PILLAR_IMAGES[pillarName] || DEFAULT_IMAGE;
        const articlesHtml = pillarPosts.map(post => renderArticleCard(post)).join('\n');

        const otherPillarsHtml = Object.entries(PILLAR_META)
            .filter(([name]) => name !== pillarName)
            .map(([name, m]) => `
                    <a href="/blog/pillar-${m.slug}.html"
                       class="flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-primary/30 transition-all group">
                        <span class="text-xl">${m.icon}</span>
                        <span class="font-semibold text-sm text-secondary group-hover:text-primary transition-colors">${name}</span>
                    </a>`).join('\n');

        const pillarHtml = `<!DOCTYPE html>
<html lang="pt-BR" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pillarName} - Blog Velt</title>
    <meta name="description" content="${meta.description}">

    <!-- Open Graph / SEO -->
    <meta property="og:title" content="${pillarName} - Blog Velt">
    <meta property="og:description" content="${meta.description}">
    <meta property="og:image" content="${pillarImage}">
    <meta property="og:type" content="website">

    <!-- Performance: preconnect to external origins -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://cdn.tailwindcss.com">

    <script src="https://cdn.tailwindcss.com/3.4.16"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: { primary: '#FF6B00', secondary: '#1E293B', surface: '#F8FAFC' },
                    fontFamily: { sans: ['Inter', 'sans-serif'] },
                }
            }
        }
    </script>
    <style>body { font-family: 'Inter', sans-serif; background-color: #F8FAFC; color: #1E293B; }</style>
</head>
<body class="antialiased">

    <!-- Dynamic Header -->
    <div id="main-header"></div>

    <!-- Hero -->
    <header class="relative pt-20 pb-24 bg-secondary text-white overflow-hidden rounded-b-[3rem]">
        <div class="absolute inset-0 opacity-10">
            <div class="absolute top-10 right-10 w-72 h-72 rounded-full" style="background: ${meta.color}; filter: blur(100px);"></div>
            <div class="absolute bottom-10 left-10 w-52 h-52 rounded-full" style="background: #FF6B00; filter: blur(80px);"></div>
        </div>
        <div class="relative z-10 max-w-4xl mx-auto px-6 text-center">
            <div class="text-6xl mb-6">${meta.icon}</div>
            <h1 class="text-4xl md:text-5xl font-extrabold mb-4">${pillarName}</h1>
            <p class="text-xl text-slate-300 max-w-2xl mx-auto">${meta.description}</p>
            <p class="mt-4 text-sm text-slate-400">${pillarPosts.length} artigos</p>
        </div>
    </header>

    <!-- Breadcrumb -->
    <nav class="container mx-auto px-4 py-4 text-sm text-slate-500">
        <a href="/" class="hover:text-primary">Home</a> <span class="mx-2">/</span>
        <a href="/blog.html" class="hover:text-primary">Blog</a> <span class="mx-2">/</span>
        <span class="text-slate-800 font-medium">${pillarName}</span>
    </nav>

    <!-- Articles -->
    <section class="py-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid md:grid-cols-3 gap-8">
${articlesHtml}
            </div>
        </div>
    </section>

    <!-- Other Pillars -->
    <section class="py-12 bg-white border-t border-slate-100">
        <div class="max-w-5xl mx-auto px-4">
            <h2 class="text-xl font-bold text-secondary mb-6 text-center">Explore outros pilares</h2>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
${otherPillarsHtml}
            </div>
        </div>
    </section>

    <!-- Footer injected by JS -->
    <div id="main-footer"></div>
    <script src="../js/layout.js"></script>
</body>
</html>`;

        const outputPath = path.join(OUTPUT_DIR, `pillar-${meta.slug}.html`);
        fs.writeFileSync(outputPath, pillarHtml);
        console.log(`   🏷️  Pillar: pillar-${meta.slug}.html (${pillarPosts.length} articles)`);
    });
}

// ─── Watch Mode ───────────────────────────────────────────────────────────────
function startWatchMode() {
    console.log('\n👀  Watch mode active — watching blog/posts/ for changes...\n');
    let debounceTimer = null;

    fs.watch(POSTS_DIR, { persistent: true }, (eventType, filename) => {
        if (!filename || !filename.endsWith('.md')) return;
        // Debounce so rapid saves don't trigger multiple builds
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            console.log(`\n🔄  Change detected: ${filename}`);
            buildAllPosts();
        }, 300);
    });
}

// ─── Entry Point ──────────────────────────────────────────────────────────────
buildAllPosts();

if (WATCH_MODE) {
    startWatchMode();
}
