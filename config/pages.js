/**
 * config/pages.js — Central registry of all website pages.
 *
 * ➕ To add a new page:
 *   1. Create the HTML file in the project root (e.g. `carreiras.html`)
 *   2. Add one line here: { slug: 'carreiras', file: 'carreiras.html', title: 'Carreiras' }
 *   3. Done — the server will automatically serve it.
 */
module.exports = [
    { slug: '', file: 'index.html', title: 'Início' },
    { slug: 'solucoes', file: 'solucoes.html', title: 'Soluções' },
    { slug: 'funcionalidades', file: 'funcionalidades.html', title: 'Funcionalidades' },
    { slug: 'sobre', file: 'sobre.html', title: 'Sobre Nós' },
    { slug: 'parceiros', file: 'parceiros.html', title: 'Indique e ganhe' },
    { slug: 'contato', file: 'contato.html', title: 'Contato' },
    { slug: 'blog', file: 'blog.html', title: 'Blog' },
];
