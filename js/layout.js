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
                    <img src="${basePath}assets/logoVelt.png" alt="Velt Logo" class="h-32 w-auto transition-all duration-300"> <!-- Adjusted size -->
                </div>

                <!-- Desktop Menu -->
                <div class="hidden md:flex items-center space-x-8">
                    <a href="${basePath}index.html" class="nav-link font-medium text-slate-600 hover:text-primary transition-colors">Início</a>
                    <a href="${basePath}solucoes.html" class="nav-link font-medium text-slate-600 hover:text-primary transition-colors">Soluções</a>
                    <a href="${basePath}funcionalidades.html" class="nav-link font-medium text-slate-600 hover:text-primary transition-colors">Funcionalidades</a>
                    <a href="${basePath}sobre.html" class="nav-link font-medium text-slate-600 hover:text-primary transition-colors">Sobre Nós</a>
                    <a href="${basePath}parceiros.html" class="nav-link font-medium text-slate-600 hover:text-primary transition-colors">Parceiros</a>
                    <a href="${basePath}blog.html" class="nav-link font-medium text-slate-600 hover:text-primary transition-colors">Blog</a>
                </div>

                <!-- CTA Buttons & Mobile Toggle -->
                <div class="flex items-center gap-4">
                    <a href="#" class="hidden lg:block font-semibold text-slate-600 hover:text-primary transition-colors">Entrar</a>
                    <a href="${basePath}contato.html" class="hidden md:block bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-primary/20 transform hover:-translate-y-0.5">
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
            <a href="${basePath}index.html" class="text-xl font-bold text-slate-800 hover:text-primary">Início</a>
            <a href="${basePath}solucoes.html" class="text-xl font-bold text-slate-800 hover:text-primary">Soluções</a>
            <a href="${basePath}funcionalidades.html" class="text-xl font-bold text-slate-800 hover:text-primary">Funcionalidades</a>
            <a href="${basePath}sobre.html" class="text-xl font-bold text-slate-800 hover:text-primary">Sobre Nós</a>
            <a href="${basePath}parceiros.html" class="text-xl font-bold text-slate-800 hover:text-primary">Parceiros</a>
            <a href="${basePath}blog.html" class="text-xl font-bold text-slate-800 hover:text-primary">Blog</a>
            <hr class="border-slate-100">
            <a href="#" class="text-xl font-bold text-slate-800 hover:text-primary">Entrar</a>
            <a href="${basePath}contato.html" class="bg-primary text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/20">Agendar Demo</a>
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
                        <img src="${basePath}assets/logoVelt.png" alt="Velt Logo" class="h-32 w-auto"> <!-- Smaller logo for footer -->
                    </div>
                    <p class="text-slate-500 mb-6 max-w-xs">A plataforma mais inteligente para gestão de viagens corporativas, quilometragem e despesas.</p>
                    <div class="flex gap-4">
                        <a href="#" class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-primary hover:text-white transition-all text-slate-500">
                            <span class="material-icons text-sm">facebook</span>
                        </a>
                        <a href="#" class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-primary hover:text-white transition-all text-slate-500">
                            <span class="material-icons text-sm">linked_camera</span>
                        </a>
                    </div>
                </div>

                <div>
                    <h4 class="font-bold text-secondary mb-6">Produto</h4>
                    <ul class="space-y-4 text-sm text-slate-500">
                        <li><a href="#" class="hover:text-primary transition-colors">Rastreamento</a></li>
                        <li><a href="#" class="hover:text-primary transition-colors">Relatórios</a></li>
                        <li><a href="#" class="hover:text-primary transition-colors">App Móvel</a></li>
                    </ul>
                </div>

                <div>
                    <h4 class="font-bold text-secondary mb-6">Empresa</h4>
                    <ul class="space-y-4 text-sm text-slate-500">
                        <li><a href="${basePath}sobre.html" class="hover:text-primary transition-colors">Sobre Nós</a></li>
                        <li><a href="${basePath}carreiras.html" class="hover:text-primary transition-colors">Carreiras</a></li>
                        <li><a href="${basePath}contato.html" class="hover:text-primary transition-colors">Contato</a></li>
                    </ul>
                </div>

                <div>
                    <h4 class="font-bold text-secondary mb-6">Legal</h4>
                    <ul class="space-y-4 text-sm text-slate-500">
                        <li><a href="#" class="hover:text-primary transition-colors">Privacidade</a></li>
                        <li><a href="#" class="hover:text-primary transition-colors">Termos</a></li>
                        <li><a href="#" class="hover:text-primary transition-colors">Segurança</a></li>
                    </ul>
                </div>
            </div>

            <div class="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
                <p>© 2026 Velt Tecnologia Ltda. Todos os direitos reservados.</p>
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
    const path = window.location.pathname;
    const page = path.split("/").pop() || 'index.html';

    // Select all nav links (both desktop and mobile)
    const links = document.querySelectorAll('.nav-link, #mobile-menu a');

    links.forEach(link => {
        if (link.getAttribute('href') === page) {
            link.classList.add('text-primary'); // Active color
            link.classList.remove('text-slate-600', 'text-slate-800');

            // Add font-bold if it's a desktop link
            if (link.classList.contains('nav-link')) {
                link.classList.add('font-bold');
                link.classList.remove('font-medium');
            }
        }
    });
}
