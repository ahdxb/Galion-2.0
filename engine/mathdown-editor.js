/* ============================================================
 * mathdown-editor.js — Galion 2.0
 *
 * Loaded only when ?edit=1 is in the URL of a Mathdown page.
 * mathdown.js has already rendered the page into #mathdown-root;
 * this script wraps that root in a split-pane editor:
 *
 *   ┌────────────────────────┬──────────────────────────────┐
 *   │  rendered preview      │  Mathdown source (textarea)  │
 *   │  (live)                │  (live edit, debounced)      │
 *   └────────────────────────┴──────────────────────────────┘
 *
 * Toolbar: Save, Restore, View modes, LaTeX shortcuts.
 *
 * Persistence: edits autosave to localStorage under a key derived
 * from the URL pathname. "Save .mathdown" downloads the source.
 * "Save .html" downloads the rendered page (without editor chrome).
 * ============================================================ */

(function () {
  'use strict';

  if (!window.Mathdown) {
    console.error('[mathdown-editor] mathdown.js must be loaded first.');
    return;
  }

  const STORAGE_KEY = 'mathdown-edit-' + location.pathname.replace(/[^\w]+/g, '_');
  const RENDER_DEBOUNCE_MS = 150;

  // ---- DOM bootstrap ---------------------------------------------------

  document.body.classList.add('mathdown-edit');

  const root  = document.getElementById('mathdown-root') || document.body;

  // Source is stashed on window.Mathdown by mathdown.js after fetch.
  // Fallback: legacy <script id="mathdown-source"> embed.
  const embeddedEl = document.getElementById('mathdown-source');
  // `let` so a successful direct-save can rebase the baseline (otherwise
  // the next reload would think the disk drifted and warn unnecessarily).
  let originalSource = window.Mathdown.currentSource
                    || (embeddedEl && embeddedEl.textContent)
                    || '';
  if (!originalSource) {
    console.error('[mathdown-editor] no source available — page must be served, not opened from file://.');
    return;
  }

  // Decide whether to restore a draft or use the disk source.
  //
  // Stored shape: { draft, baseline } where `baseline` is the disk source
  // at the time the draft was last persisted. If `baseline` still matches
  // the freshly-loaded disk source, the draft is in-flight unsaved work →
  // restore it. If the disk source has changed since (someone edited the
  // .mathdown externally), the draft is stale → discard it and use the
  // disk version, with a notice in the toolbar.
  let stored = null;
  try { stored = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch {}

  let startSource = originalSource;
  let bootNotice = null;        // shown in toolbar after layout is up

  if (stored && typeof stored === 'object' && stored.draft != null) {
    if (stored.baseline === originalSource) {
      startSource = stored.draft;
      if (startSource !== originalSource) bootNotice = { msg: 'brouillon restauré', kind: 'info' };
    } else {
      // Stale draft — disk has changed since the draft was saved.
      localStorage.removeItem(STORAGE_KEY);
      bootNotice = { msg: 'fichier modifié — brouillon abandonné', kind: 'warn' };
    }
  } else if (typeof stored === 'string') {
    // Legacy format: just a string. Treat conservatively — assume baseline
    // unknown, so prefer disk and drop the legacy draft.
    localStorage.removeItem(STORAGE_KEY);
  }

  // Wrap layout
  const shell = document.createElement('div');
  shell.className = 'mdne-shell';
  shell.innerHTML = `
    <div class="mdne-toolbar">
      <span class="mdne-title">Mathdown — éditeur</span>
      <span class="mdne-status" id="mdne-status">prêt</span>
      <span class="mdne-spacer"></span>

      <div class="mdne-dropdown">
        <button class="mdne-btn mdne-dropdown-toggle" data-menu="view">Vue ▾</button>
        <div class="mdne-dropdown-menu" data-menu-of="view" hidden>
          <button class="mdne-menu-item" data-act="view-split">Côte à côte</button>
          <button class="mdne-menu-item" data-act="view-preview">Aperçu</button>
          <button class="mdne-menu-item" data-act="view-source">Source</button>
        </div>
      </div>

      <button class="mdne-btn" data-act="shortcuts">Aide-mémoire</button>

      <div class="mdne-dropdown">
        <button class="mdne-btn mdne-dropdown-toggle" data-menu="comments">Commentaires ▾</button>
        <div class="mdne-dropdown-menu" data-menu-of="comments" hidden>
          <button class="mdne-menu-item" data-act="export-comments">Exporter</button>
          <button class="mdne-menu-item" data-act="clear-comments">Effacer</button>
        </div>
      </div>

      <div class="mdne-dropdown">
        <button class="mdne-btn mdne-dropdown-toggle" data-menu="source">Source ▾</button>
        <div class="mdne-dropdown-menu" data-menu-of="source" hidden>
          <button class="mdne-menu-item mdne-menu-primary" data-act="save-disk">Enregistrer</button>
          <button class="mdne-menu-item" data-act="save-mathdown">Télécharger .mathdown</button>
          <button class="mdne-menu-item mdne-menu-danger" data-act="restore">Restaurer l'original</button>
        </div>
      </div>
    </div>
    <div class="mdne-panes" data-mode="split">
      <div class="mdne-preview" id="mdne-preview"></div>
      <div class="mdne-divider" id="mdne-divider"></div>
      <div class="mdne-editor">
        <textarea id="mdne-source" spellcheck="false"></textarea>
      </div>
    </div>
    <div class="mdne-modal" id="mdne-modal" hidden>
      <div class="mdne-modal-inner">
        <header><h2 id="mdne-modal-title">Titre</h2><button class="mdne-btn" data-act="modal-close">Fermer</button></header>
        <div class="mdne-modal-body" id="mdne-modal-body"></div>
      </div>
    </div>
  `;

  // Move the existing rendered tree into the preview pane
  const preview = shell.querySelector('#mdne-preview');
  // The page render lives inside <div id="mathdown-root">. Move it.
  if (root.parentNode === document.body) {
    preview.appendChild(root);
  } else {
    preview.appendChild(root);
  }

  // The source textarea
  const ta = shell.querySelector('#mdne-source');
  ta.value = startSource;

  document.body.appendChild(shell);

  // Status helper
  const statusEl = shell.querySelector('#mdne-status');
  let statusTimer = null;
  function flashStatus(msg, ms = 1200) {
    statusEl.textContent = msg;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { statusEl.textContent = 'prêt'; }, ms);
  }

  // ---- Live render -----------------------------------------------------

  let renderTimer = null;
  function scheduleRender() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(doRender, RENDER_DEBOUNCE_MS);
  }

  function doRender() {
    const src = ta.value;
    try {
      const { fm, html } = window.Mathdown.render(src);
      // The preview pane contains the moved root; replace its contents.
      root.innerHTML = html;
      const t = fm.titre || fm.title;
      if (t) document.title = t;
      window.Mathdown.typesetMath(root).then(() => window.Mathdown.paginate(root));
      // Persist the draft together with the disk baseline it forks from.
      // On the next load, baseline-vs-disk tells us whether the draft is
      // still in-flight work or has been outpaced by an external edit.
      if (src === originalSource) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          draft: src,
          baseline: originalSource
        }));
      }
      flashStatus('rendu ✓');
    } catch (err) {
      console.error(err);
      flashStatus('erreur de rendu');
    }
  }

  ta.addEventListener('input', scheduleRender);
  // Initial render (start source may differ from what mathdown.js rendered,
  // because we may have loaded a draft from localStorage)
  if (startSource !== originalSource) doRender();

  // ---- Tab key inserts spaces in textarea ------------------------------
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = ta.selectionStart, end = ta.selectionEnd;
      ta.setRangeText('  ', start, end, 'end');
      scheduleRender();
    }
  });

  // ---- Toolbar actions -------------------------------------------------

  const panes = shell.querySelector('.mdne-panes');
  // Dropdowns: click toggle to open (closing other open menus); click outside
  // or click an item to close. Items dispatch their data-act through the
  // same handleAction path used by direct buttons.
  function closeAllMenus() {
    shell.querySelectorAll('.mdne-dropdown-menu').forEach(m => { m.hidden = true; });
    shell.querySelectorAll('.mdne-dropdown-toggle').forEach(t => t.classList.remove('open'));
  }
  shell.querySelectorAll('.mdne-dropdown-toggle').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const name = toggle.dataset.menu;
      const menu = shell.querySelector(`.mdne-dropdown-menu[data-menu-of="${name}"]`);
      const wasOpen = !menu.hidden;
      closeAllMenus();
      if (!wasOpen) {
        menu.hidden = false;
        toggle.classList.add('open');
      }
    });
  });
  shell.querySelectorAll('.mdne-menu-item').forEach(item => {
    item.addEventListener('click', () => {
      handleAction(item.dataset.act);
      closeAllMenus();
    });
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.mdne-dropdown')) closeAllMenus();
  });
  // Direct (non-dropdown) buttons keep their old behaviour.
  shell.querySelectorAll('.mdne-btn[data-act]').forEach(btn => {
    btn.addEventListener('click', () => handleAction(btn.dataset.act));
  });

  function handleAction(act) {
    switch (act) {
      case 'view-split':
      case 'view-preview':
      case 'view-source': {
        // Set both the data attribute (for the display:none rules on the
        // hidden panes) AND the inline grid-template-columns (so a stale
        // value from a divider drag can't shadow the per-mode default).
        const mode = act.slice('view-'.length);
        panes.dataset.mode = mode;
        if (mode === 'split')        panes.style.gridTemplateColumns = '1fr 6px 1fr';
        else if (mode === 'preview') panes.style.gridTemplateColumns = '1fr 0 0';
        else                         panes.style.gridTemplateColumns = '0 0 1fr';
        break;
      }
      case 'shortcuts':    showShortcuts(); break;
      case 'export-comments': exportComments(); break;
      case 'clear-comments':  clearComments(); break;
      case 'save-disk':    saveToDisk(); break;
      case 'save-mathdown':downloadFile(filenameStem() + '.mathdown', ta.value, 'text/markdown'); break;
      case 'restore':
        if (confirm("Restaurer la source d'origine ? Les modifications non téléchargées seront perdues.")) {
          ta.value = originalSource;
          localStorage.removeItem(STORAGE_KEY);
          doRender();
        }
        break;
      case 'modal-close':  hideModal(); break;
    }
  }

  function filenameStem() {
    const name = location.pathname.split('/').pop().replace(/\.[^.]+$/, '');
    return name || 'mathdown';
  }

  function downloadFile(name, content, mime) {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    flashStatus('téléchargé : ' + name, 2000);
  }

  // ---- Direct save to disk (PUT to engine/serve.py) --------------------
  //
  // The dev server (engine/serve.py) accepts PUT on .mathdown files under
  // fiches/ and writes them to disk. If the user is running plain
  // `python3 -m http.server` (or anything else without PUT), the request
  // fails — we fall back to a plain download so the workflow still works.

  async function saveToDisk() {
    const url = window.Mathdown.sourceUrl;
    if (!url) {
      flashStatus('pas d\'URL source — téléchargement', 2500);
      downloadFile(filenameStem() + '.mathdown', ta.value, 'text/markdown');
      return;
    }
    try {
      const resp = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
        body: ta.value
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      // Rebase: this version is now the disk version. Drop the draft.
      originalSource = ta.value;
      window.Mathdown.currentSource = ta.value;
      localStorage.removeItem(STORAGE_KEY);
      flashStatus('enregistré sur disque ✓', 2000);
    } catch (err) {
      console.warn('[mathdown-editor] PUT failed:', err.message);
      flashStatus('serveur sans PUT — téléchargement', 3000);
      downloadFile(filenameStem() + '.mathdown', ta.value, 'text/markdown');
    }
  }

  // ---- Comments ---------------------------------------------------------
  //
  // Comments live in the source as :::comment blocks or :comment[…] inline
  // directives. They are CSS-hidden in view mode and visible in edit mode.
  // Two operations:
  //   - export: collect all comments with their location/context, copy a
  //             Markdown digest to the clipboard for pasting into chat
  //   - clear:  strip all comment directives from the source

  // Match a :::comment block, with optional [label], up to its closing :::
  const RX_COMMENT_BLOCK  = /(^|\n):::comment(?:\[([^\]]*)\])?[ \t]*\n([\s\S]*?)\n:::[ \t]*(?=\n|$)/g;
  // Match an inline :comment[…]. Negative lookbehind: NOT preceded by a colon
  // (which would make it part of a ::comment[…] leaf or :::comment[…] block).
  const RX_COMMENT_INLINE = /(?<!:):comment\[([^\]]*)\]/g;
  // Headings used as context anchors
  const RX_ANY_HEADING    = /(^#{1,6}\s+(.+)$)|(:heading\[([^\]]*)\])/gm;

  function lineOf(src, idx) {
    let n = 1;
    for (let i = 0; i < idx && i < src.length; i++) if (src[i] === '\n') n++;
    return n;
  }

  function nearestHeading(src, idx) {
    RX_ANY_HEADING.lastIndex = 0;
    let m, last = null;
    while ((m = RX_ANY_HEADING.exec(src)) !== null) {
      if (m.index > idx) break;
      last = m[2] || m[4] || null;
    }
    return last || '(début)';
  }

  function collectComments(src) {
    const out = [];
    let m;

    RX_COMMENT_BLOCK.lastIndex = 0;
    while ((m = RX_COMMENT_BLOCK.exec(src)) !== null) {
      const startIdx = m.index + (m[1] ? m[1].length : 0);
      out.push({
        kind: 'block',
        label: m[2] || null,
        text: m[3].trim(),
        line: lineOf(src, startIdx),
        section: nearestHeading(src, startIdx)
      });
    }
    RX_COMMENT_INLINE.lastIndex = 0;
    while ((m = RX_COMMENT_INLINE.exec(src)) !== null) {
      out.push({
        kind: 'inline',
        text: m[1].trim(),
        line: lineOf(src, m.index),
        section: nearestHeading(src, m.index)
      });
    }
    out.sort((a, b) => a.line - b.line);
    return out;
  }

  function formatCommentsMd(comments, stem) {
    if (!comments.length) return `# Commentaires sur ${stem}\n\n_(aucun commentaire dans la source)_\n`;
    const lines = [`# Commentaires sur ${stem}`, ''];
    let lastSection = null;
    for (const c of comments) {
      if (c.section !== lastSection) {
        lines.push(`## ${c.section}`);
        lines.push('');
        lastSection = c.section;
      }
      const head = c.kind === 'block'
        ? `**[ligne ${c.line}${c.label ? ', ' + c.label : ''}]**`
        : `**[ligne ${c.line}, inline]**`;
      lines.push(head);
      lines.push(c.text);
      lines.push('');
    }
    return lines.join('\n');
  }

  function exportComments() {
    const md = formatCommentsMd(collectComments(ta.value), filenameStem());
    showCommentsExport(md);
  }

  function clearComments() {
    const comments = collectComments(ta.value);
    if (!comments.length) { flashStatus('aucun commentaire à effacer'); return; }
    if (!confirm(`Effacer ${comments.length} commentaire${comments.length > 1 ? 's' : ''} de la source ?`)) return;
    let src = ta.value;
    src = src.replace(RX_COMMENT_BLOCK, (_, prefix) => prefix || '');
    src = src.replace(RX_COMMENT_INLINE, '');
    // Tidy up consecutive blank lines that may have appeared
    src = src.replace(/\n{3,}/g, '\n\n');
    ta.value = src;
    scheduleRender();
    flashStatus('commentaires effacés');
  }

  function showCommentsExport(text) {
    modalTitle.textContent = 'Commentaires à coller dans le chat';
    modalBody.innerHTML = `
      <p class="mdne-help">Bouton « Copier » ci-dessous, puis coller dans Claude.</p>
      <textarea class="mdne-export-area" id="mdne-export-text" readonly></textarea>
      <div class="mdne-modal-actions">
        <button class="mdne-btn" id="mdne-copy">Copier</button>
        <button class="mdne-btn mdne-btn-danger" id="mdne-copy-clear">Copier puis effacer</button>
      </div>
    `;
    modalBody.querySelector('#mdne-export-text').value = text;
    modalBody.querySelector('#mdne-copy').addEventListener('click', (e) => copyExport(e.target, false));
    modalBody.querySelector('#mdne-copy-clear').addEventListener('click', (e) => copyExport(e.target, true));
    showModal();
  }

  function copyExport(btn, alsoClear) {
    const ta2 = modalBody.querySelector('#mdne-export-text');
    ta2.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch {}
    btn.textContent = ok ? 'Copié ✓' : 'Échec — copie manuelle';
    setTimeout(() => { btn.textContent = alsoClear ? 'Copier puis effacer' : 'Copier'; }, 1500);
    if (ok && alsoClear) {
      hideModal();
      clearComments();
    }
  }

  // ---- Divider drag ----------------------------------------------------

  const divider = shell.querySelector('#mdne-divider');
  let dragX = null;
  divider.addEventListener('mousedown', (e) => {
    dragX = e.clientX;
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if (dragX === null) return;
    const total = panes.getBoundingClientRect().width;
    const left  = Math.max(200, Math.min(total - 200, e.clientX - panes.getBoundingClientRect().left));
    panes.style.gridTemplateColumns = `${left}px 6px 1fr`;
  });
  document.addEventListener('mouseup', () => {
    if (dragX !== null) { dragX = null; document.body.style.cursor = ''; }
  });

  // ---- Modal (LaTeX shortcuts) ----------------------------------------

  const modal     = shell.querySelector('#mdne-modal');
  const modalBody = shell.querySelector('#mdne-modal-body');
  const modalTitle= shell.querySelector('#mdne-modal-title');
  modal.addEventListener('click', (e) => { if (e.target === modal) hideModal(); });

  function showShortcuts() {
    const shortcuts = collectMathjaxShortcuts();
    modalTitle.textContent = 'Aide-mémoire';
    modalBody.innerHTML = `
      <h3 style="margin-top:0">Raccourcis LaTeX</h3>
      <p class="mdne-help">Définis dans <code>engine/mathjax-config.js</code>. Utiliser à l'intérieur d'un <code>$…$</code>.</p>
      <table class="mdne-shortcuts">
        <thead><tr><th>Raccourci</th><th>Équivalent</th><th>Aperçu</th></tr></thead>
        <tbody>
          ${shortcuts.map(([name, expansion, args]) => {
            const usage = args ? `\\${name}{${'…'.repeat(args).split('').join(',').replace(/^,/,'')}}` : `\\${name}`;
            return `<tr>
              <td><code>\\${name}</code></td>
              <td><code>${escapeHtml(expansion)}</code></td>
              <td>$${usage}$</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      <h3>Syntaxe Mathdown rapide</h3>
      <pre class="mdne-help">
# Titre de fiche       → banner
## Section
### Sous-section

**gras**, *italique*, _souligné_, $math$

- bullet
1. numéroté

:role[texte]{attrs}    → directive inline   (ex. :defined[Bob])
::role[texte]          → directive bloc-feuille
:::role[label]         → directive bloc-conteneur
…contenu…
:::
</pre>
    `;
    showModal();
    if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([modalBody]);
  }

  function collectMathjaxShortcuts() {
    // Read from the side-stashed window.GalionMacros, which survives MathJax
    // taking over window.MathJax with its public API after the CDN loads.
    const macros = window.GalionMacros
      || (window.MathJax && window.MathJax.tex && window.MathJax.tex.macros)
      || {};
    return Object.entries(macros).map(([name, def]) => {
      if (Array.isArray(def)) return [name, def[0], def[1] || 0];
      return [name, def, 0];
    });
  }

  function showModal() { modal.hidden = false; }
  function hideModal() { modal.hidden = true; }

  // ---- Helpers ---------------------------------------------------------

  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  // Cmd/Ctrl-S → direct save to disk (falls back to download if no server)
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      handleAction('save-disk');
    }
  });

  flashStatus(bootNotice ? bootNotice.msg : 'éditeur chargé', bootNotice ? 4000 : 1500);
})();
