#!/usr/bin/env node
/**
 * scripts/new-post.js — Interactive CLI to scaffold a new blog post.
 *
 * Usage (with flags):
 *   node scripts/new-post.js --title "Meu Artigo" --pillar "Tecnologia" --author "Velt Corp" --description "Resumo do artigo"
 *
 * Usage (interactive prompts — run with no flags):
 *   node scripts/new-post.js
 *
 * After running, open the generated .md file and write your content.
 * Then run `npm run build` to publish.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const POSTS_DIR = path.join(__dirname, '../blog/posts');

const AVAILABLE_PILLARS = [
    'Viagens Corporativas',
    'Redução de Custos',
    'Financeiro',
    'Operação',
    'Tecnologia',
    'Gestão de Milhas',
    'Experiência do Viajante',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text) {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')   // remove diacritics
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')      // remove special chars
        .trim()
        .replace(/\s+/g, '-')              // spaces → hyphens
        .replace(/-+/g, '-');              // no duplicate hyphens
}

function parseArgs() {
    const args = process.argv.slice(2);
    const result = {};
    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith('--') && args[i + 1]) {
            result[args[i].slice(2)] = args[i + 1];
            i++;
        }
    }
    return result;
}

function prompt(rl, question) {
    return new Promise(resolve => rl.question(question, resolve));
}

function today() {
    return new Date().toISOString().split('T')[0];
}

function buildFrontmatter({ title, pillar, author, description }) {
    return `---
title: "${title.replace(/"/g, '\\"')}"
date: "${today()}"
author: "${author}"
description: "${description.replace(/"/g, '\\"')}"
pillar: "${pillar}"
image: ""
tags: ["${pillar}"]
---

## Introdução

Escreva a introdução do artigo aqui.

## Desenvolvimento

Adicione o conteúdo principal aqui.

## Conclusão

Finalize com suas conclusões e chamada para ação.
`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    const flags = parseArgs();
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    console.log('\n📝  Velt Blog — Novo Artigo\n');

    const title = flags.title || await prompt(rl, '  Título do artigo: ');
    const pillar = flags.pillar || await prompt(rl, `  Pilar (${AVAILABLE_PILLARS.join(' | ')}): `);
    const author = flags.author || await prompt(rl, '  Autor [Velt Corp]: ') || 'Velt Corp';
    const description = flags.description || await prompt(rl, '  Descrição curta (meta): ');

    rl.close();

    if (!title.trim()) {
        console.error('\n❌  O título é obrigatório.');
        process.exit(1);
    }

    if (!AVAILABLE_PILLARS.includes(pillar.trim())) {
        console.warn(`\n⚠️  Pilar "${pillar}" não reconhecido. Os pilares válidos são:\n  ${AVAILABLE_PILLARS.join('\n  ')}`);
        console.warn('  O arquivo será criado mesmo assim.\n');
    }

    const slug = slugify(title);
    const filename = `${slug}.md`;
    const filePath = path.join(POSTS_DIR, filename);

    if (fs.existsSync(filePath)) {
        console.error(`\n❌  Já existe um post com esse slug: ${filename}`);
        process.exit(1);
    }

    if (!fs.existsSync(POSTS_DIR)) {
        fs.mkdirSync(POSTS_DIR, { recursive: true });
    }

    const content = buildFrontmatter({ title: title.trim(), pillar: pillar.trim(), author: author.trim(), description: description.trim() });
    fs.writeFileSync(filePath, content, 'utf8');

    console.log(`\n✅  Post criado: blog/posts/${filename}`);
    console.log('   Edite o arquivo e depois rode:\n');
    console.log('   npm run build\n');
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
