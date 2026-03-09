// layout.js - Centralized Header and Footer with Mobile Menu

document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
    loadFooter();
    highlightActiveLink();
});

function getBasePath() {
    const path = window.location.pathname;
    // Simple check: if we are in /blog/ and not in the root blog.html
    if (path.includes('/blog/') && !path.endsWith('blog.html')) {
        return '../';
    }
    return '';
}

function loadHeader() {
    const basePath = getBasePath();

    const headerHTML = `
    <nav class="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all duration-300" id="navbar">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-24"> <!-- Increased height for larger logo -->
                <!-- Logo -->
                <div class="flex items-center gap-2 cursor-pointer" onclick="window.location.href='${basePath}index.html'">
                    <img src="${basePath}assets/logoVelt.png" alt="Velt Logo" class="h-8 w-auto transition-all duration-300"> <!-- Adjusted size -->
                </div>

                <!-- Desktop Menu -->
                <div class="hidden md:flex items-center space-x-8">
                    <a href="${basePath}" class="nav-link font-medium text-slate-600 hover:text-primary transition-colors">Início</a>
                    <a href="${basePath}solucoes" class="nav-link font-medium text-slate-600 hover:text-primary transition-colors">Soluções</a>
                    <a href="${basePath}funcionalidades" class="nav-link font-medium text-slate-600 hover:text-primary transition-colors">Funcionalidades</a>
                    <a href="${basePath}sobre" class="nav-link font-medium text-slate-600 hover:text-primary transition-colors">Sobre Nós</a>
                    <a href="${basePath}parceiros" class="nav-link font-medium text-slate-600 hover:text-primary transition-colors">Parceiros</a>
                    <a href="${basePath}blog" class="nav-link font-medium text-slate-600 hover:text-primary transition-colors">Blog</a>
                </div>

                <!-- CTA Buttons & Mobile Toggle -->
                <div class="flex items-center gap-4">
                    <a href="#" class="hidden lg:block font-semibold text-slate-600 hover:text-primary transition-colors">Entrar</a>
                    <a href="${basePath}contato" class="hidden md:block bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-primary/20 transform hover:-translate-y-0.5">
                        Agendar Demo
                    </a>
                    
                    <!-- Mobile Menu Button -->
                    <button id="mobile-menu-btn" class="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none">
                        <span class="material-icons text-3xl">menu</span>
                    </button>
                </div>
            </div>
        </div>
    </nav>
    `;

    const mobileMenuHTML = `
    <!-- Mobile Menu Overlay -->
    <div id="mobile-menu" class="fixed inset-0 z-[60] bg-white transform translate-x-full transition-transform duration-300 md:hidden flex flex-col pt-24 px-6 pb-6 overflow-y-auto">
        <div class="flex flex-col space-y-6 text-center">
            <a href="${basePath}" class="text-xl font-bold text-slate-800 hover:text-primary">Início</a>
            <a href="${basePath}solucoes" class="text-xl font-bold text-slate-800 hover:text-primary">Soluções</a>
            <a href="${basePath}funcionalidades" class="text-xl font-bold text-slate-800 hover:text-primary">Funcionalidades</a>
            <a href="${basePath}sobre" class="text-xl font-bold text-slate-800 hover:text-primary">Sobre Nós</a>
            <a href="${basePath}parceiros" class="text-xl font-bold text-slate-800 hover:text-primary">Parceiros</a>
            <a href="${basePath}blog" class="text-xl font-bold text-slate-800 hover:text-primary">Blog</a>
            <hr class="border-slate-100">
            <a href="#" class="text-xl font-bold text-slate-800 hover:text-primary">Entrar</a>
            <a href="${basePath}contato" class="bg-primary text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/20">Agendar Demo</a>
        </div>
        
        <!-- Close Button -->
        <button id="close-mobile-menu" class="absolute top-6 right-6 p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500 transition-colors">
            <span class="material-icons">close</span>
        </button>
    </div>
    `;

    const headerPlaceholder = document.getElementById('main-header');
    if (headerPlaceholder) {
        headerPlaceholder.innerHTML = headerHTML;

        // Inject Mobile Menu into Body to avoid Z-index/Clipping issues
        document.body.insertAdjacentHTML('beforeend', mobileMenuHTML);

        setupMobileMenu();
    }
}

function loadFooter() {
    const basePath = getBasePath();
    const footerHTML = `
    <footer class="bg-white border-t border-slate-200 pt-20 pb-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
                <div class="col-span-2">
                    <div class="flex items-center gap-2 mb-6">
                        <img src="${basePath}assets/logoVelt.png" alt="Velt Logo" class="h-8 w-auto"> <!-- Smaller logo for footer -->
                    </div>
                    <p class="text-slate-500 mb-6 max-w-xs">Plataforma all-in-one de gestão de viagens corporativas. Economia real, gestão financeira e uma parceria valiosa em toda a viagem</p>
                    <div class="flex gap-4 mb-6">
                        <a href="https://www.linkedin.com/company/velt-corp/" target="_blank" title="LinkedIn Velt" class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-primary hover:text-white transition-all text-slate-500">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clip-rule="evenodd"/></svg>
                        </a>
                        <a href="https://www.instagram.com/velt.corp" target="_blank" title="Instagram Velt" class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-primary hover:text-white transition-all text-slate-500">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" clip-rule="evenodd"/></svg>
                        </a>
                        <a href="https://www.facebook.com/veltcorporativo" target="_blank" title="Facebook Velt" class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-primary hover:text-white transition-all text-slate-500">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" clip-rule="evenodd"/></svg>
                        </a>
                    </div>
                    <div class="flex flex-col gap-3 text-sm text-slate-500">
                        <p class="font-bold text-secondary uppercase tracking-wider text-xs">Conecte-se com os fundadores:</p>
                        <a href="https://www.linkedin.com/in/bruno-brant-gotschalg/" target="_blank" class="hover:text-primary transition-colors flex items-center gap-2 group">
                            <svg class="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                            Bruno Brant (CEO)
                        </a>
                        <a href="https://www.linkedin.com/in/waajunior/" target="_blank" class="hover:text-primary transition-colors flex items-center gap-2 group">
                            <svg class="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                            Wellerson Junior (CTO)
                        </a>
                    </div>
                </div>

                <div>
                    <h4 class="font-bold text-secondary mb-6">Produto</h4>
                    <ul class="space-y-4 text-sm text-slate-500">
                        <li><a href="${basePath}solucoes" class="hover:text-primary transition-colors">Soluções</a></li>
                        <li><a href="${basePath}funcionalidades" class="hover:text-primary transition-colors">Funcionalidades</a></li>
                        <li><a href="${basePath}parceiros" class="hover:text-primary transition-colors">Parceiros</a></li>
                    </ul>
                </div>

                <div>
                    <h4 class="font-bold text-secondary mb-6">Empresa</h4>
                    <ul class="space-y-4 text-sm text-slate-500">
                        <li><a href="${basePath}sobre" class="hover:text-primary transition-colors">Sobre Nós</a></li>
                        <li><a href="${basePath}blog" class="hover:text-primary transition-colors">Blog</a></li>
                        <li><a href="${basePath}contato" class="hover:text-primary transition-colors">Contato</a></li>
                    </ul>
                </div>

                <div>
                    <h4 class="font-bold text-secondary mb-6">Legal</h4>
                    <ul class="space-y-4 text-sm text-slate-500">
                        <li><a href="${basePath}politicas-de-privacidade" class="hover:text-primary transition-colors">Políticas de Privacidade</a></li>
                        <li><a href="${basePath}termos-de-uso" class="hover:text-primary transition-colors">Termos de Uso</a></li>
                    </ul>
                </div>
            </div>

            <div class="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
                <p>© 2026 Velt Corporativo Ltda 61.127.816/0001-75. Todos os direitos reservados.</p>
                <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-green-500"></span>
                    <span>Sistemas Operacionais</span>
                </div>
            </div>
        </div>
    </footer>
    `;

    const footerPlaceholder = document.getElementById('main-footer');
    if (footerPlaceholder) {
        footerPlaceholder.innerHTML = footerHTML;
    }
}

function setupMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    const closeBtn = document.getElementById('close-mobile-menu');
    const body = document.body;

    if (btn && menu && closeBtn) {
        btn.addEventListener('click', () => {
            menu.classList.remove('translate-x-full');
            body.classList.add('overflow-hidden'); // Prevent scrolling
        });

        closeBtn.addEventListener('click', () => {
            menu.classList.add('translate-x-full');
            body.classList.remove('overflow-hidden');
        });
    }
}

function highlightActiveLink() {
    const pathname = window.location.pathname;
    // Normalise: strip trailing slash, strip .html, default to '/' for home
    const currentPath = pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';

    const links = document.querySelectorAll('.nav-link, #mobile-menu a');

    links.forEach(link => {
        const href = link.getAttribute('href') || '';
        // Normalise the link href the same way
        const linkPath = href.replace(/\.html$/, '').replace(/\/$/, '') || '/';

        if (linkPath === currentPath || (currentPath === '/' && (linkPath === '' || linkPath === '/'))) {
            link.classList.add('text-primary');
            link.classList.remove('text-slate-600', 'text-slate-800');

            if (link.classList.contains('nav-link')) {
                link.classList.add('font-bold');
                link.classList.remove('font-medium');
            }
        }
    });
}
