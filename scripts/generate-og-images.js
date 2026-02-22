const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../assets/blog');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Pillar configurations with icons and colors
const pillars = {
    'Viagens Corporativas': {
        slug: 'viagens-corporativas',
        icon: '✈️',
        subtitle: 'Gestão Inteligente de Viagens',
        gradient: ['#1E293B', '#334155'],
        accent: '#FF6B00'
    },
    'Redução de Custos': {
        slug: 'reducao-de-custos',
        icon: '📉',
        subtitle: 'Economia Real para Empresas',
        gradient: ['#1E293B', '#0F172A'],
        accent: '#FF6B00'
    },
    'Financeiro': {
        slug: 'financeiro',
        icon: '💰',
        subtitle: 'Gestão Financeira & Compliance',
        gradient: ['#1E293B', '#1E3A5F'],
        accent: '#FF6B00'
    },
    'Operação': {
        slug: 'operacao',
        icon: '⚙️',
        subtitle: 'Operação & Backoffice Eficiente',
        gradient: ['#1E293B', '#2D3748'],
        accent: '#FF6B00'
    },
    'Tecnologia': {
        slug: 'tecnologia',
        icon: '🤖',
        subtitle: 'Tecnologia & IA para Negócios',
        gradient: ['#1E293B', '#1A1A2E'],
        accent: '#FF6B00'
    },
    'Gestão de Milhas': {
        slug: 'gestao-de-milhas',
        icon: '🎯',
        subtitle: 'Milhas como Ativo Corporativo',
        gradient: ['#1E293B', '#1E2D3D'],
        accent: '#FF6B00'
    },
    'Experiência do Viajante': {
        slug: 'experiencia-do-viajante',
        icon: '😊',
        subtitle: 'Bem-estar & Produtividade',
        gradient: ['#1E293B', '#1B2838'],
        accent: '#FF6B00'
    }
};

function generateSVG(pillarName, config) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${config.gradient[0]}"/>
      <stop offset="100%" style="stop-color:${config.gradient[1]}"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${config.accent}"/>
      <stop offset="100%" style="stop-color:#FF8C33"/>
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  
  <!-- Decorative circles -->
  <circle cx="1050" cy="100" r="200" fill="${config.accent}" opacity="0.05"/>
  <circle cx="150" cy="530" r="150" fill="${config.accent}" opacity="0.05"/>
  <circle cx="900" cy="500" r="100" fill="${config.accent}" opacity="0.08"/>
  
  <!-- Decorative grid dots -->
  ${generateDots()}
  
  <!-- Accent line at top -->
  <rect x="0" y="0" width="1200" height="6" fill="url(#accent)"/>
  
  <!-- Icon circle -->
  <circle cx="600" cy="200" r="70" fill="${config.accent}" opacity="0.15"/>
  <text x="600" y="220" font-size="60" text-anchor="middle" dominant-baseline="middle">${config.icon}</text>
  
  <!-- Pillar name -->
  <text x="600" y="330" font-family="Inter, Arial, sans-serif" font-size="48" font-weight="800" fill="white" text-anchor="middle" letter-spacing="-1">${pillarName}</text>
  
  <!-- Subtitle -->
  <text x="600" y="380" font-family="Inter, Arial, sans-serif" font-size="22" fill="#94A3B8" text-anchor="middle">${config.subtitle}</text>
  
  <!-- Divider -->
  <rect x="540" y="420" width="120" height="4" rx="2" fill="url(#accent)"/>
  
  <!-- Velt branding -->
  <text x="600" y="490" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700" fill="${config.accent}" text-anchor="middle">VELT</text>
  <text x="600" y="520" font-family="Inter, Arial, sans-serif" font-size="16" fill="#64748B" text-anchor="middle">veltcorp.com.br</text>
  
  <!-- Bottom accent bar -->
  <rect x="0" y="624" width="1200" height="6" fill="url(#accent)"/>
</svg>`;
}

function generateDots() {
    let dots = '';
    for (let x = 80; x < 1200; x += 60) {
        for (let y = 80; y < 630; y += 60) {
            const opacity = Math.random() * 0.06 + 0.02;
            dots += `  <circle cx="${x}" cy="${y}" r="1.5" fill="white" opacity="${opacity}"/>\n`;
        }
    }
    return dots;
}

// Generate all pillar images
Object.entries(pillars).forEach(([name, config]) => {
    const svg = generateSVG(name, config);
    const outputPath = path.join(OUTPUT_DIR, `${config.slug}.svg`);
    fs.writeFileSync(outputPath, svg);
    console.log(`✅ Generated: ${config.slug}.svg`);
});

// Generate a default fallback image
const defaultSvg = generateSVG('Blog Velt', {
    slug: 'default',
    icon: '📖',
    subtitle: 'Insights para Viagens Corporativas',
    gradient: ['#1E293B', '#334155'],
    accent: '#FF6B00'
});
fs.writeFileSync(path.join(OUTPUT_DIR, 'default.svg'), defaultSvg);
console.log('✅ Generated: default.svg');

console.log(`\n✅ All OG images generated in: ${OUTPUT_DIR}`);
