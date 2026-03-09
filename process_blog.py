import re

with open('blog.html', 'r', encoding='utf-8') as f:
    content = f.read()

image_map = {
    '/assets/blog/operacao.svg': 'https://images.unsplash.com/photo-1554774853-719586f82d77?auto=format&fit=crop&w=800&q=80',
    '/assets/blog/tecnologia.svg': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    '/assets/blog/financeiro.svg': 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    '/assets/blog/experiencia-do-viajante.svg': 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80',
    '/assets/blog/reducao-de-custos.svg': 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=80',
    '/assets/blog/gestao-de-milhas.svg': 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=800&q=80',
    '/assets/blog/viagens-corporativas.svg': 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80',
}

articles = re.findall(r'(<article.*?</article>)', content, re.DOTALL)

for old_article in articles:
    new_article = old_article
    
    # 1. Remove the "flex items-center gap-2 mb-3" div completely
    new_article = re.sub(r'<div class="flex items-center gap-2 mb-3">.*?</div>\s*(<h2)', r'\1', new_article, flags=re.DOTALL)
    
    # 2. Replace images
    for old_src, new_src in image_map.items():
        if old_src in new_article:
            new_article = new_article.replace(old_src, new_src)
            break
            
    # 3. Make whole grid clickable
    # Find the inner <a> and extract its href.
    href_match = re.search(r'<a href="([^"]+)"', new_article)
    if href_match:
        href = href_match.group(1)
        
        # Replace the inner <a href="...."> with a <div ...>
        inner_a_start_pattern = r'<a\s+href="[^"]+"(\s+class="[^"]+")>'
        new_article = re.sub(inner_a_start_pattern, r'<div\1>', new_article)
        
        # replace the closing </a> corresponding to the inner link
        new_article = new_article.replace('</a>', '</div>')
        
        # replace the outer <article> with <a>
        article_start_pattern = r'<article\s+class="([^"]+)"\s*>'
        new_article = re.sub(article_start_pattern, rf'<a href="{href}" class="\1 block cursor-pointer">', new_article)
        
        # replace closing </article> with </a>
        new_article = new_article.replace('</article>', '</a>')
        
    content = content.replace(old_article, new_article)

with open('blog.html', 'w', encoding='utf-8') as f:
    f.write(content)
