/* ============================================================
 * mathdown.js — Galion 2.0
 *
 * Parses a Mathdown source (a Markdown-flavored DSL with semantic
 * directives) and renders it into HTML. The page form lives in
 * mathdown.css; the source substance lives inside the page itself
 * as <script type="text/mathdown" id="mathdown-source">…</script>.
 *
 * Mathdown syntax (v0):
 *
 *   ---                        front-matter (YAML-ish, scalar values only)
 *   fiche: 1                   metadata used by banner
 *   theme: …
 *   level: …
 *   brand: …
 *   ---
 *
 *   # Title                    h1 → consumed by banner on page 1
 *   ## Section                 h2
 *   ### Subsection             h3
 *
 *   - item                     bullet list
 *   1. item                    numbered list (start = first number)
 *
 *   $math$                     inline math (passed to MathJax)
 *   $$ math $$                 display math (block, single line)
 *
 *   **bold**, *italic*, _underline_, [link](url)
 *
 *   :role[content]{attrs}      inline directive
 *   ::role[content]{attrs}     leaf-block directive  (same renderer, block context)
 *   :::role[label]{attrs}      container directive (multi-line, fenced by `:::`)
 *
 * Roles supported by default (extend the ROLE table to add more):
 *   inline   : heading, defined, label, ref, exemple, notation,
 *              strong, emph, underline, math
 *   block    : page, callout, remarque, attention, methode,
 *              definition, theoreme, propriete, lemme, corollaire,
 *              demonstration, exemple, contre-exemple, notation,
 *              niveau, exercice, solution, indication, figure
 *
 * Boot:
 *   - reads #mathdown-source, parses, renders into #mathdown-root
 *     (or document.body if absent)
 *   - retypesets MathJax over the rendered tree
 *   - if ?edit=1 is in the URL, dynamically loads
 *     mathdown-editor.js and mathdown-editor.css
 * ============================================================ */

(function (global) {
  'use strict';

  // ---------- Front matter ----------

  function extractFrontMatter(src) {
    // Trim a leading newline that often appears when source comes from a
    // <script type="text/mathdown"> element.
    const trimmed = src.replace(/^\s*\n/, '');
    const m = /^---[ \t]*\n([\s\S]*?)\n---[ \t]*\n?/.exec(trimmed);
    if (!m) return { fm: {}, body: src };
    const fm = {};
    m[1].split('\n').forEach(line => {
      const i = line.indexOf(':');
      if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    });
    return { fm, body: trimmed.slice(m[0].length) };
  }

  // ---------- Block parser ----------

  const RX = {
    blank:     /^\s*$/,
    heading:   /^(#{1,6})\s+(.+?)\s*$/,
    container: /^:::([\w-]+)(?:\[([^\]]*)\])?(?:\{([^}]*)\})?\s*$/,
    closer:    /^:::\s*$/,
    leaf:      /^::([\w-]+)(?:\[([^\]]*)\])?(?:\{([^}]*)\})?\s*$/,
    bullet:    /^-\s+(.*)$/,
    number:    /^(\d+)\.\s+(.*)$/,
    dispMath:  /^\$\$\s*$/,
    dispMath1: /^\$\$(.+)\$\$\s*$/   // single-line $$ math $$
  };

  function parseBlocks(body) {
    const lines = body.split('\n');
    const blocks = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const iAtStart = i;

      if (RX.blank.test(line)) { i++; continue; }

      // Orphan ::: at top level (typically the user mid-typing
      // a directive). Skip it so we don't infinite-loop in the
      // paragraph collector below — which excludes closer lines.
      if (RX.closer.test(line)) { i++; continue; }

      // Container directive
      let m = RX.container.exec(line);
      if (m) {
        const [, role, label, attrs] = m;
        let depth = 1, j = i + 1;
        const inner = [];
        while (j < lines.length && depth > 0) {
          if (RX.container.test(lines[j])) { depth++; inner.push(lines[j]); }
          else if (RX.closer.test(lines[j])) { depth--; if (depth === 0) break; inner.push(lines[j]); }
          else inner.push(lines[j]);
          j++;
        }
        blocks.push({
          type: 'container', role,
          label: label || null,
          attrs: parseAttrs(attrs),
          children: parseBlocks(inner.join('\n'))
        });
        i = j + 1;
        continue;
      }

      // Leaf-block directive  ::role[…]
      m = RX.leaf.exec(line);
      if (m) {
        const [, role, label, attrs] = m;
        blocks.push({
          type: 'leaf', role,
          content: label || '',
          attrs: parseAttrs(attrs)
        });
        i++; continue;
      }

      // Heading
      m = RX.heading.exec(line);
      if (m) {
        blocks.push({ type: 'heading', level: m[1].length, content: m[2] });
        i++; continue;
      }

      // Display math (single-line)
      m = RX.dispMath1.exec(line);
      if (m) {
        blocks.push({ type: 'displaymath', content: m[1].trim() });
        i++; continue;
      }

      // Display math (multi-line)
      if (RX.dispMath.test(line)) {
        const buf = []; let j = i + 1;
        while (j < lines.length && !RX.dispMath.test(lines[j])) { buf.push(lines[j]); j++; }
        blocks.push({ type: 'displaymath', content: buf.join('\n').trim() });
        i = j + 1; continue;
      }

      // Bullet list (with nested-list support via 2+-space indent)
      if (RX.bullet.test(line)) {
        const items = [];
        while (i < lines.length && RX.bullet.test(lines[i])) {
          const content = RX.bullet.exec(lines[i])[1];
          i++;
          const r = collectIndentedChildren(lines, i);
          items.push({ content, children: r.children });
          i = r.nextI;
        }
        blocks.push({ type: 'bulletlist', items });
        continue;
      }

      // Numbered list (with nested-list support via 2+-space indent)
      if (RX.number.test(line)) {
        const start = +RX.number.exec(line)[1];
        const items = [];
        while (i < lines.length && RX.number.test(lines[i])) {
          const content = RX.number.exec(lines[i])[2];
          i++;
          const r = collectIndentedChildren(lines, i);
          items.push({ content, children: r.children });
          i = r.nextI;
        }
        blocks.push({ type: 'orderedlist', start, items });
        continue;
      }

      // Paragraph (collect until a blank line or another block opener)
      const paraLines = [];
      while (
        i < lines.length &&
        !RX.blank.test(lines[i]) &&
        !RX.heading.test(lines[i]) &&
        !RX.container.test(lines[i]) &&
        !RX.closer.test(lines[i]) &&
        !RX.leaf.test(lines[i]) &&
        !RX.bullet.test(lines[i]) &&
        !RX.number.test(lines[i]) &&
        !RX.dispMath.test(lines[i]) &&
        !RX.dispMath1.test(lines[i])
      ) {
        paraLines.push(lines[i]);
        i++;
      }
      if (paraLines.length) blocks.push({ type: 'paragraph', content: paraLines.join(' ') });

      // Safety net: if nothing in this iteration advanced i, force a step
      // forward so a malformed line can never freeze the editor.
      if (i === iAtStart) i++;
    }
    return blocks;
  }

  // After a list item's first line, gather any indented (2+ spaces) lines
  // and recursively parse them as the item's children. The minimum indent
  // is stripped so deeper nesting is preserved relative to its level.
  function collectIndentedChildren(lines, i) {
    const subLines = [];
    while (i < lines.length && /^[ ]{2,}\S/.test(lines[i])) {
      subLines.push(lines[i]);
      i++;
    }
    if (!subLines.length) return { children: [], nextI: i };
    const minIndent = Math.min(...subLines.map(l => l.match(/^[ ]*/)[0].length));
    const stripped = subLines.map(l => l.slice(minIndent));
    return { children: parseBlocks(stripped.join('\n')), nextI: i };
  }

  function parseAttrs(s) {
    if (!s) return {};
    const out = {};
    // crude parse: key=value (value may be quoted) or .class or #id
    s.replace(/(?:^|\s)(\.([\w-]+)|#([\w-]+)|([\w-]+)=("[^"]*"|'[^']*'|\S+))/g,
      (_, full, cls, id, k, v) => {
        if (cls) out.class = (out.class ? out.class + ' ' : '') + cls;
        else if (id) out.id = id;
        else if (k) out[k] = v.replace(/^["']|["']$/g, '');
      });
    return out;
  }

  // ---------- Inline renderer ----------

  function renderInline(text) {
    if (!text) return '';

    // 1. Stash inline math $…$ (NOT $$ – display math is block-level)
    const mathStash = [];
    text = text.replace(/\$([^$\n]+?)\$/g, (m) => {
      mathStash.push(m);
      return ` M${mathStash.length - 1} `;
    });

    // 2. Inline directives  :role[content]{attrs}
    //    (run before bold/italic so :defined[**X**] etc. could be added later;
    //    for now content is plain, then re-processed by passes 3-5)
    text = text.replace(
      /:([\w-]+)\[([^\]]*)\](?:\{([^}]*)\})?/g,
      (_, role, content, attrs) => renderRoleInline(role, content, parseAttrs(attrs))
    );

    // 3. Strong / em / underline. Order matters: ** first.
    text = text.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/(^|[^\w*])\*([^*\n]+?)\*(?!\w)/g, '$1<em>$2</em>');
    text = text.replace(/(^|[^\w_])_([^_\n]+?)_(?!\w)/g, '$1<u>$2</u>');

    // 4. Links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // 5. Restore math (typography is applied later, on final HTML)
    text = text.replace(/ M(\d+) /g, (_, i) => mathStash[+i]);

    return text;
  }

  function renderRoleInline(role, content, attrs) {
    // content is raw — its inline markup will be processed by the
    // bold/italic/underline passes that run *after* this substitution.
    const cls = `role-${role}` + (attrs.class ? ' ' + attrs.class : '');
    const idAttr = attrs.id ? ` id="${attrs.id}"` : '';
    const dataAttrs = Object.entries(attrs)
      .filter(([k]) => k !== 'class' && k !== 'id')
      .map(([k, v]) => ` data-${k}="${escapeAttr(v)}"`)
      .join('');
    switch (role) {
      case 'strong':    return `<strong${idAttr}${dataAttrs}>${content}</strong>`;
      case 'emph':      return `<em${idAttr}${dataAttrs}>${content}</em>`;
      case 'underline': return `<u${idAttr}${dataAttrs}>${content}</u>`;
      case 'math':      return `$${content}$`;
      case 'ref':       return `<a class="${cls}"${idAttr}${dataAttrs} href="#${content}">${content}</a>`;
      // Default: a span with role class. Tag choice can be tuned per role.
      case 'heading':   return `<strong class="${cls}"${idAttr}${dataAttrs}>${content}</strong>`;
      case 'defined':   return `<strong class="${cls}"${idAttr}${dataAttrs}>${content}</strong>`;
      case 'label':     return `<em class="${cls}"${idAttr}${dataAttrs}>${content}</em>`;
      default:          return `<span class="${cls}"${idAttr}${dataAttrs}>${content}</span>`;
    }
  }

  // ---------- Block renderer ----------

  function renderBlocks(blocks) {
    return blocks.map(renderBlock).join('\n');
  }

  function renderBlock(b) {
    switch (b.type) {
      case 'heading':
        return `<h${b.level}>${renderInline(b.content)}</h${b.level}>`;
      case 'paragraph':
        return `<p>${renderInline(b.content)}</p>`;
      case 'bulletlist':
        return `<ul>\n${b.items.map(renderListItem).join('\n')}\n</ul>`;
      case 'orderedlist':
        return `<ol${b.start && b.start !== 1 ? ` start="${b.start}"` : ''}>\n${b.items.map(renderListItem).join('\n')}\n</ol>`;
      case 'displaymath':
        return `<div class="math-display">$$${b.content}$$</div>`;
      case 'leaf':
      case 'container':
        return renderRoleBlock(b);
      default:
        return '';
    }
  }

  function renderListItem(it) {
    // Item is either a plain string (legacy) or { content, children } (new).
    const content  = typeof it === 'string' ? it : (it.content || '');
    const children = typeof it === 'string' ? [] : (it.children || []);
    const inner = renderInline(content);
    const childHtml = children.length ? '\n' + children.map(renderBlock).join('\n') : '';
    return `  <li>${inner}${childHtml}</li>`;
  }

  function renderRoleBlock(b) {
    const role = b.role;
    const inner = b.children ? renderBlocks(b.children) : renderInline(b.content || '');
    const labelHtml = b.label ? renderInline(b.label) : '';
    const attrs = b.attrs || {};
    const classes = [`block-${role}`].concat(attrs.class ? [attrs.class] : []).join(' ');
    const idAttr = attrs.id ? ` id="${attrs.id}"` : '';
    const dataAttrs = Object.entries(attrs)
      .filter(([k]) => k !== 'class' && k !== 'id')
      .map(([k, v]) => ` data-${k}="${escapeAttr(v)}"`)
      .join('');

    // role-specific renderers (extend here when needed)
    if (role === 'cols') {
      // Per-list multi-column wrapper. Two source forms supported:
      //
      //   1. Flat list ->  N-column grid (good for "all paired" case).
      //         :::cols
      //         - A
      //         - B
      //         - C
      //         - D
      //         :::
      //
      //   2. Nested list -> per-item paired/solo rows. A top-level item
      //      with one sub-bullet renders as a 2-cell row; a top-level
      //      item with no sub-bullet renders as a full-width row.
      //         :::cols
      //         - A
      //             - A partner
      //         - long item alone
      //         - B
      //             - B partner
      //         :::
      //
      // The renderer picks the mode based on whether any top-level item
      // has children. Mode 2 is always 2 columns (the [3] label only
      // affects mode 1).
      const n = parseInt(b.label, 10) || 2;
      const list = (b.children || []).find(c => c.type === 'bulletlist' || c.type === 'orderedlist');
      const items = list ? list.items : [];
      const hasNested = items.some(it =>
        typeof it === 'object' && (it.children || []).some(c => c.type === 'bulletlist' || c.type === 'orderedlist')
      );

      if (hasNested) {
        const rows = items.map(item => {
          const topContent = renderInline(typeof item === 'string' ? item : (item.content || ''));
          const sub = typeof item === 'object'
            ? (item.children || []).find(c => c.type === 'bulletlist' || c.type === 'orderedlist')
            : null;
          if (sub && sub.items.length > 0) {
            const partner = sub.items[0];
            const partnerContent = renderInline(typeof partner === 'string' ? partner : (partner.content || ''));
            return `  <div class="cols-row"><div class="cols-cell">${topContent}</div><div class="cols-cell">${partnerContent}</div></div>`;
          }
          return `  <div class="cols-row cols-solo">${topContent}</div>`;
        });
        return `<div class="block-cols block-cols-paired" data-cols="2"${idAttr}${dataAttrs}>\n${rows.join('\n')}\n</div>`;
      }

      return `<div class="block-cols" data-cols="${n}"${idAttr}${dataAttrs}>\n${inner}\n</div>`;
    }
    if (role === 'pagebreak' || role === 'break') {
      // Two strengths:
      //   ::pagebreak           — soft hint, only used if the page overflows
      //   ::pagebreak[strong]   — hard, always splits here regardless
      const label = (b.label || '').trim();
      const hard = label === 'strong' || label === 'hard';
      const cls = hard ? 'page-break-hint page-break-hard' : 'page-break-hint';
      return `<div class="${cls}" aria-hidden="true"></div>`;
    }
    if (role === 'page') {
      return `<div class="${classes} page"${idAttr}${dataAttrs}>\n${inner}\n</div>`;
    }
    if (role === 'niveau') {
      const level = labelHtml || attrs.level || '1';
      const stars = '★'.repeat(+level || 1);
      return `<div class="${classes} diff" data-level="${level}"${idAttr}${dataAttrs}>${
        attrs.title ? `<h3><span class="stars">${stars}</span>${escapeHtml(attrs.title)}</h3>` : ''
      }\n${inner}\n</div>`;
    }

    const titleHtml = labelHtml
      ? `<div class="block-title">${labelHtml}</div>\n`
      : '';
    return `<div class="${classes}"${idAttr}${dataAttrs}>\n${titleHtml}${inner}\n</div>`;
  }

  // ---------- Banner (composed from front-matter + first H1) ----------

  // Front-matter keys are accepted in French (canonical for this project)
  // and English (legacy aliases). Use this helper to read either.
  function fmGet(fm, ...keys) {
    for (const k of keys) if (fm[k]) return fm[k];
    return undefined;
  }

  function extractBanner(blocks, fm) {
    // Find first heading at level 1; consume it for the banner.
    let bannerTitle = null;
    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i].type === 'heading' && blocks[i].level === 1) {
        bannerTitle = blocks[i].content;
        blocks.splice(i, 1);
        break;
      }
    }
    const fiche = fmGet(fm, 'fiche');
    const theme = fmGet(fm, 'cours', 'theme');
    const level = fmGet(fm, 'niveau', 'level');
    const brand = fmGet(fm, 'serie', 'brand');
    if (!bannerTitle && !fiche && !theme) return '';

    const tag = fiche ? `FICHE ${escapeHtml(fiche)}` : '';
    const metaParts = [];
    if (theme) metaParts.push(escapeHtml(theme));
    if (level) metaParts.push(escapeHtml(level));
    if (brand) metaParts.push(escapeHtml(brand));
    return `<header class="banner">
  <div class="top">
    ${tag ? `<span class="tag">${tag}</span>` : ''}
    ${metaParts.length ? `<span class="meta">${metaParts.join(' • ')}</span>` : ''}
  </div>
  ${bannerTitle ? `<h1>${renderInline(bannerTitle)}</h1>` : ''}
</header>`;
  }

  // ---------- Typography (lang-keyed post-processor) ----------
  //
  // Runs once on the final HTML, BEFORE math is restored — wait, math is
  // already restored inline; here we walk the HTML and skip math segments
  // and HTML tag interiors, applying language-specific spacing rules to
  // text nodes only.
  //
  // Add a new entry to TYPOGRAPHY to support another language.

  function frenchTypography(html) {
    // Stash math segments first so they're opaque to text rules.
    // Critical for quote pairing: a quoted phrase like
    //   "l'Italie appartient à $P$"
    // would otherwise be cut into three pieces by walkText, breaking
    // the pair-matching regex (it would pair the closing " of one
    // phrase with the opening " of the next).
    const mathStash = [];
    html = html.replace(/\$[^$\n]+?\$/g, (m) => {
      mathStash.push(m);
      return `\u0001M${mathStash.length - 1}\u0001`;
    });

    // Walk text outside HTML tags only — math is now a placeholder.
    html = html.replace(/(<[^>]+>)|([^<]+)/g, (m, tag, text) => {
      if (tag) return m;
      return text
        // Pair of straight double-quotes "…" -> French guillemets « … »
        // (with NBSP added by the next rules). Spans math placeholders.
        .replace(/"([^"\n]*)"/g, '« $1 »')
        // Curly apostrophe between letters: l'ensemble -> l’ensemble.
        .replace(/(\p{L})'(\p{L})/gu, '$1’$2')
        // NBSP before ; : ? ! and closing guillemet (U+00BB)
        .replace(/ ([:;?!»])/g, ' $1')
        // NBSP after opening guillemet (U+00AB)
        .replace(/« /g, '« ')
        // Glue math placeholder to closing punct (» ; : ? !) so the line
        // doesn't break at the inline-block boundary inserted by MathJax.
        .replace(/(\u0001M\d+\u0001) ([»;:?!])/g, '<span class="nobr">$1 $2</span>')
        .replace(/« (\u0001M\d+\u0001)/g, '<span class="nobr">« $1</span>')
        // Glue math directly followed by close-punct (no space) so a
        // period, comma, or closing bracket cannot orphan onto the
        // next line at the inline-block boundary.
        .replace(/(\u0001M\d+\u0001)([.,\)\]])/g, '<span class="nobr">$1$2</span>');
    });

    // Restore math.
    html = html.replace(/\u0001M(\d+)\u0001/g, (_, i) => mathStash[+i]);
    return html;
  }

  const TYPOGRAPHY = {
    fr: frenchTypography
    // en: englishTypography,
    // de: germanTypography,
    // …
  };

  function applyTypography(html, lang) {
    const fn = TYPOGRAPHY[lang];
    return fn ? fn(html) : html;
  }

  // ---------- Public API ----------

  function render(source) {
    const { fm, body } = extractFrontMatter(source);
    const blocks = parseBlocks(body);
    const bannerHtml = extractBanner(blocks, fm);
    const bodyHtml = renderBlocks(blocks);
    // If the source has no explicit :::page wrapper, wrap everything
    // in a single page container so existing CSS keeps working.
    const hasExplicitPage = blocks.some(b => b.type === 'container' && b.role === 'page');
    const wrapped = hasExplicitPage
      ? `${bannerHtml}\n${bodyHtml}`
      : `<div class="page">\n${bannerHtml}\n${bodyHtml}\n</div>`;
    const html = applyTypography(wrapped, fmGet(fm, 'langue', 'lang'));
    return { fm, html };
  }

  // ---------- Boot ----------

  // The HTML page is a thin loader; it has NO embedded Mathdown source.
  // The .mathdown file lives next to the HTML and shares the same stem
  // (foo.html → foo.mathdown). The page may override this with
  // <link rel="mathdown-source" href="…">.
  //
  // Loading order:
  //   1. fetch external .mathdown — preferred
  //   2. embedded <script id="mathdown-source"> — fallback (e.g. for
  //      portable/exported single-file pages or for file:// without a server)

  function inferSourceUrl() {
    const linkEl = document.querySelector('link[rel="mathdown-source"]');
    if (linkEl && linkEl.href) return linkEl.href;
    const path = location.pathname;
    if (/\.html?$/.test(path)) return path.replace(/\.html?$/, '.mathdown');
    return null;
  }

  function enginePath(file) {
    // Resolve a sibling engine file relative to mathdown.js
    const me = document.currentScript || Array.from(document.scripts).find(s => /\bmathdown\.js(\?|$)/.test(s.src));
    if (!me) return file;
    return me.src.replace(/[^/]+$/, '') + file;
  }

  function boot() {
    const target = document.getElementById('mathdown-root') || ensureRoot();
    const sourceUrl = inferSourceUrl();
    const embedded = document.getElementById('mathdown-source');

    const fetchExternal = sourceUrl
      ? fetch(sourceUrl).then(r => r.ok ? r.text() : Promise.reject(new Error('HTTP ' + r.status)))
      : Promise.reject(new Error('no source URL'));

    fetchExternal
      .catch((err) => {
        if (embedded) return embedded.textContent;
        throw err;
      })
      .then(source => doRender(source, target))
      .catch(err => showSourceError(target, sourceUrl, err));
  }

  function doRender(source, target) {
    const { fm, html } = render(source);
    target.innerHTML = html;
    const docTitle = fmGet(fm, 'titre', 'title');
    if (docTitle) document.title = docTitle;
    // Stash the loaded source on the public API so the editor can pick it up
    // without re-fetching.
    global.Mathdown.currentSource = source;
    global.Mathdown.sourceUrl = inferSourceUrl();
    return typesetMath(target).then(() => {
      paginate(target);
      if (new URLSearchParams(location.search).has('edit')) {
        loadStyle(enginePath('mathdown-editor.css'));
        loadScript(enginePath('mathdown-editor.js'));
      }
    });
  }

  // ---------- Pagination (pseudo-paper A4) ----------
  //
  // Walk each .page in the rendered tree; whenever a child's bottom edge
  // would extend beyond the A4 height (minus bottom padding), move that
  // child and its successors into a freshly created sibling .page. Repeat
  // until no .page overflows.
  //
  // Runs after MathJax typesetting so heights account for rendered math.
  // No-op when content fits on one page.

  const PX_PER_MM = 96 / 25.4;
  const A4_HEIGHT_MM = 297;

  function paginate(target) {
    if (!target) return;
    const limitPx = A4_HEIGHT_MM * PX_PER_MM;

    // Pass 1: hard breaks — unconditional splits at every .page-break-hard.
    // Done first so subsequent overflow checks operate on already-split pages.
    splitAtHardBreaks(target);

    // Pass 2: overflow-driven splits, with soft hints preferred when a
    // split is needed.
    const queue = Array.from(target.querySelectorAll('.page'));
    for (let i = 0; i < queue.length; i++) {
      splitOverflowingPage(queue[i], limitPx, queue);
    }
  }

  function splitAtHardBreaks(target) {
    // Repeatedly find a hard break inside any .page and split there.
    while (true) {
      const pages = target.querySelectorAll('.page');
      let didSplit = false;
      for (const page of pages) {
        const children = Array.from(page.children);
        for (let i = 0; i < children.length; i++) {
          const c = children[i];
          if (c.classList && c.classList.contains('page-break-hard')) {
            // Split right after the marker. The marker stays on the
            // current page (invisibly).
            if (i === children.length - 1) break; // nothing after; nothing to split
            const newPage = document.createElement('div');
            newPage.className = 'page';
            for (let j = i + 1; j < children.length; j++) newPage.appendChild(children[j]);
            page.parentNode.insertBefore(newPage, page.nextSibling);
            didSplit = true;
            break;
          }
        }
        if (didSplit) break;
      }
      if (!didSplit) return;
    }
  }

  function splitOverflowingPage(page, pageHeightPx, queue) {
    const padBot = parseFloat(getComputedStyle(page).paddingBottom) || 0;
    const limit = pageHeightPx - padBot;

    const pageTop = page.getBoundingClientRect().top;
    const children = Array.from(page.children);

    // Find the first child that overflows the page.
    let overflowAt = -1;
    for (let i = 0; i < children.length; i++) {
      const cBottomRel = children[i].getBoundingClientRect().bottom - pageTop;
      if (cBottomRel > limit) { overflowAt = i; break; }
    }
    if (overflowAt === -1) return;       // no overflow — nothing to do
    if (overflowAt === 0) return;        // single child taller than a page

    // Soft hint: prefer the LAST .page-break-hint whose bottom still fits
    // on this page over the natural overflow point. Only top-level hints
    // (direct children of .page) are honoured for now.
    let splitAt = overflowAt;
    for (let i = overflowAt - 1; i >= 0; i--) {
      const c = children[i];
      if (c.classList && c.classList.contains('page-break-hint')) {
        // Split right AFTER the hint — content above the hint stays here.
        splitAt = i + 1;
        break;
      }
    }

    if (splitAt === 0 || splitAt >= children.length) return;

    const newPage = document.createElement('div');
    newPage.className = 'page';
    for (let j = splitAt; j < children.length; j++) newPage.appendChild(children[j]);
    page.parentNode.insertBefore(newPage, page.nextSibling);
    queue.push(newPage);
  }

  function showSourceError(target, url, err) {
    const onFile = location.protocol === 'file:';
    target.innerHTML = `
<div style="max-width:48em;margin:6em auto;padding:2em;font-family:system-ui,-apple-system,sans-serif;background:#fff;border-radius:6px;box-shadow:0 2px 12px rgba(0,0,0,.15);line-height:1.5">
  <h1 style="color:#8e2424;margin-top:0">Source non chargée</h1>
  <p>Impossible de charger <code>${url || '(aucune URL)'}</code>${err && err.message ? ' : <code>' + escapeHtml(err.message) + '</code>' : ''}.</p>
  ${onFile ? `
  <p>Tu as ouvert le fichier directement (<code>file://</code>). Le navigateur bloque la lecture du <code>.mathdown</code> à côté pour des raisons de sécurité. Solution la plus simple :</p>
  <ol>
    <li>Dans le Finder, double-clique <code>serve.command</code> à la racine du dépôt. Une fenêtre Terminal s'ouvre et le navigateur revient à la bonne URL.</li>
    <li>Laisse le Terminal ouvert pendant la session. Ctrl-C l'arrête.</li>
  </ol>
  <p>Alternative manuelle&nbsp;:</p>
  <pre style="background:#f4eddc;padding:10px 12px;border-radius:4px">cd Galion-2.0
python3 -m http.server 8000</pre>
  ` : `
  <p>Vérifie que le fichier <code>.mathdown</code> existe à côté du <code>.html</code> et que le serveur le sert.</p>
  `}
</div>`;
  }

  function ensureRoot() {
    const root = document.createElement('div');
    root.id = 'mathdown-root';
    document.body.appendChild(root);
    return root;
  }

  function typesetMath(el) {
    if (window.MathJax && MathJax.typesetPromise) return MathJax.typesetPromise([el]).catch(() => {});
    return Promise.resolve();
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.defer = true;
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  function loadStyle(href) {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href;
    document.head.appendChild(l);
  }

  // ---------- Helpers ----------

  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  function escapeAttr(s) { return String(s).replace(/"/g, '&quot;'); }

  // ---------- Expose ----------

  global.Mathdown = {
    render, parseBlocks, renderBlocks, renderInline, typesetMath, paginate, boot,
    // typography is a separate, lang-keyed layer; expose it so callers
    // can register their own rules without touching the parser.
    typography: TYPOGRAPHY,
    applyTypography
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);
