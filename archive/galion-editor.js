/* ============================================================
 * galion-editor.js — Galion 2.0 Universal Editor
 *
 * Activates only when ?edit=1 is in the URL of a Galion fiche.
 * Scans [data-anchor] elements, builds an annotation panel,
 * supports comments and Markdown-flavored rewrites with live preview.
 *
 * Galion-flavored Markdown (in rewrite textareas):
 *   **bold**     → <strong>bold</strong>
 *   _underline_  → <u>underline</u>      (Galion convention, non-standard MD)
 *   /italic/     → <em>italic</em>       (Galion convention, non-standard MD)
 *   $math$       → passed through to MathJax
 *
 * Combinables : `**_/X/_**` → <strong><u><em>X</em></u></strong>.
 *
 * Storage:
 *   galion-{ficheId}-comments-v2  = { anchorId: text }
 *   galion-{ficheId}-rewrites-v2  = { anchorId: markdownText }
 * ============================================================ */

(function() {
  'use strict';

  const params = new URLSearchParams(location.search);
  if (!params.has('edit')) return;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    document.body.classList.add('galion-edit');

    const ficheId = inferFicheId();
    const CK = `galion-${ficheId}-comments-v2`;
    const RK = `galion-${ficheId}-rewrites-v2`;

    const ORIG = {};
    document.querySelectorAll('[data-anchor]').forEach(el => {
      ORIG[el.dataset.anchor] = el.innerHTML;
    });

    buildToolbar(ficheId, CK, RK, ORIG);
    buildPanel(ORIG, CK, RK);
    applyAllSavedRewrites(ORIG, RK);
    wireClicks();
  }

  function inferFicheId() {
    if (document.body.dataset.galionFiche) return document.body.dataset.galionFiche;
    const file = location.pathname.split('/').pop().replace(/\.html$/, '');
    return file || 'unknown';
  }

  function inferLabel(el) {
    if (/^H[1-6]$/.test(el.tagName)) {
      return el.textContent.trim().slice(0, 60);
    }
    const firstChild = el.firstElementChild;
    if (firstChild && firstChild.tagName === 'STRONG') {
      const t = firstChild.textContent.trim().replace(/[.:,]\s*$/, '');
      if (t.length > 0 && t.length < 50) return t;
    }
    if (el.tagName === 'DIV' || el.tagName === 'SECTION') {
      const heading = el.querySelector('h1, h2, h3, h4');
      if (heading) return heading.textContent.trim().slice(0, 60);
      const strong = el.querySelector('strong');
      if (strong) {
        const t = strong.textContent.trim().replace(/[.:,]\s*$/, '');
        if (t.length > 0 && t.length < 50) return t;
      }
    }
    if (el.tagName === 'OL' || el.tagName === 'UL') {
      const li = el.querySelector('li');
      if (li) {
        const t = li.textContent.trim().replace(/\s+/g, ' ');
        return '(liste) ' + (t.length > 40 ? t.slice(0, 37) + '…' : t);
      }
      return '(liste vide)';
    }
    let text = el.textContent.trim().replace(/\s+/g, ' ');
    if (!text) text = `[${el.tagName.toLowerCase()}]`;
    return text.length > 60 ? text.slice(0, 57) + '…' : text;
  }

  function buildToolbar(ficheId, CK, RK, ORIG) {
    const tb = document.createElement('div');
    tb.className = 'galion-edit-toolbar';
    tb.innerHTML = `
      <span class="ge-title">Éditeur — ${escapeHtml(ficheId)}</span>
      <span class="ge-status" id="ge-status">Sauvegarde automatique</span>
      <button class="ge-btn ge-export">Exporter</button>
      <button class="ge-btn ge-newround" style="background:#4b6e2c">Nouveau tour</button>
      <button class="ge-btn ge-clear" style="background:#8e2424">Tout effacer</button>
    `;
    document.body.appendChild(tb);
    tb.querySelector('.ge-export').addEventListener('click', () => exportComments(ficheId, CK, RK));
    tb.querySelector('.ge-newround').addEventListener('click', () => {
      if (!confirm('Marquer ce tour comme intégré (efface commentaires et réécritures) ?')) return;
      doClearAll(CK, RK, ORIG);
    });
    tb.querySelector('.ge-clear').addEventListener('click', () => {
      if (!confirm('Effacer tous les commentaires ET toutes les réécritures ?')) return;
      doClearAll(CK, RK, ORIG);
    });
  }

  function buildPanel(ORIG, CK, RK) {
    const panel = document.createElement('aside');
    panel.className = 'galion-edit-panel';
    panel.innerHTML = `
      <h2>Commentaires et réécriture</h2>
      <p class="ge-help">
        Cliquer un bloc à gauche pour le focaliser. Réécriture en Markdown&nbsp;:
        <strong>**gras**</strong>, <u>_souligné_</u>, <em>/italique/</em>, $math$.
      </p>
      <div id="ge-anno-list"></div>
      <div class="ge-anno" data-for="general">
        <div class="ge-anno-label">
          Remarques générales
          <span class="ge-badges"><span class="ge-badge empty" data-has-c="general">C</span></span>
        </div>
        <span class="ge-field-label">Commentaire</span>
        <textarea data-id="general" data-kind="comment" placeholder="Tone, équilibre…"></textarea>
      </div>
    `;
    document.body.appendChild(panel);

    const list = panel.querySelector('#ge-anno-list');
    const anchors = collectAnchors();

    anchors.forEach(({id, label}) => {
      const card = document.createElement('div');
      card.className = 'ge-anno';
      card.dataset.for = id;
      card.innerHTML = `
        <div class="ge-anno-label">
          ${escapeHtml(label)}
          <span class="ge-badges">
            <span class="ge-badge empty" data-has-c="${id}">C</span>
            <span class="ge-badge empty" data-has-r="${id}">R</span>
          </span>
        </div>
        <span class="ge-field-label">Commentaire</span>
        <textarea data-id="${id}" data-kind="comment" placeholder="Ton commentaire…"></textarea>
        <span class="ge-field-label">Réécriture (Markdown — vide = inchangé)</span>
        <textarea data-id="${id}" data-kind="rewrite" placeholder="**gras**, _souligné_, /italique/, $math$"></textarea>
        <div class="ge-row-actions">
          <button class="ge-btn-mini" data-action="prefill" data-id="${id}">Pré-remplir</button>
          <button class="ge-btn-mini" data-action="reset" data-id="${id}">Annuler</button>
        </div>
      `;
      list.appendChild(card);
    });

    const savedC = loadJSON(CK);
    const savedR = loadJSON(RK);
    panel.querySelectorAll('textarea[data-id]').forEach(ta => {
      const id = ta.dataset.id;
      const kind = ta.dataset.kind;
      if (kind === 'comment' && savedC[id]) ta.value = savedC[id];
      if (kind === 'rewrite' && savedR[id]) ta.value = savedR[id];
      updateBadges(id, CK, RK);
      ta.addEventListener('input', () => onTextareaInput(ta, ORIG, CK, RK));
      ta.addEventListener('focus', () => focusAnchor(id));
    });

    panel.querySelectorAll('.ge-btn-mini').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        const ta = panel.querySelector(`textarea[data-id="${id}"][data-kind="rewrite"]`);
        if (!ta) return;
        if (action === 'prefill') {
          ta.value = ORIG[id] || '';
          onTextareaInput(ta, ORIG, CK, RK);
          ta.focus();
        } else if (action === 'reset') {
          ta.value = '';
          onTextareaInput(ta, ORIG, CK, RK);
        }
      });
    });
  }

  function collectAnchors() {
    const items = [];
    document.querySelectorAll('[data-anchor]').forEach(el => {
      items.push({ id: el.dataset.anchor, label: inferLabel(el) });
    });
    return items;
  }

  function onTextareaInput(ta, ORIG, CK, RK) {
    const id = ta.dataset.id;
    const kind = ta.dataset.kind;
    if (kind === 'comment') {
      const all = loadJSON(CK);
      all[id] = ta.value;
      saveJSON(CK, all);
    } else if (kind === 'rewrite') {
      const all = loadJSON(RK);
      if (ta.value.trim()) all[id] = ta.value; else delete all[id];
      saveJSON(RK, all);
      applyRewrite(id, ta.value, ORIG);
    }
    updateBadges(id, CK, RK);
    flashStatus();
  }

  function applyAllSavedRewrites(ORIG, RK) {
    const all = loadJSON(RK);
    for (const [id, md] of Object.entries(all)) {
      applyRewrite(id, md, ORIG);
    }
  }

  function applyRewrite(id, md, ORIG) {
    const el = document.querySelector(`[data-anchor="${id}"]`);
    if (!el) return;
    if (md && md.trim()) {
      el.innerHTML = mdToHtml(md);
      el.classList.add('galion-rewritten');
    } else {
      el.innerHTML = ORIG[id];
      el.classList.remove('galion-rewritten');
    }
    if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([el]).catch(() => {});
  }

  /* Galion-flavored Markdown → HTML.
   * Approche : pass-through HTML + 3 substitutions inline. Pas de parsing
   * de blocs MD (listes, titres, tables) — l'utilisateur travaille sur des
   * structures HTML existantes et fait des modifs inline.
   */
  function mdToHtml(input) {
    const math = [];
    let s = input.replace(/\$[^\$\n]+\$/g, m => {
      math.push(m);
      return ` M${math.length - 1} `;
    });
    // **X** → <strong>X</strong>  (en premier, pour gérer les combinaisons)
    s = s.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
    // /X/ → <em>X</em>
    s = s.replace(/(^|[\s>(\[])\/([^\/\n]+?)\/(?=$|[\s.,;:!?<)\]])/g, '$1<em>$2</em>');
    // _X_ → <u>X</u>
    s = s.replace(/(^|[\s>(\[])_([^_\n]+?)_(?=$|[\s.,;:!?<)\]])/g, '$1<u>$2</u>');
    // Restaurer le math
    s = s.replace(/ M(\d+) /g, (_, i) => math[+i]);
    return s;
  }

  function wireClicks() {
    document.querySelectorAll('[data-anchor]').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('a, button, textarea, input, select')) return;
        e.stopPropagation();
        const id = el.dataset.anchor;
        focusAnchor(id);
      });
    });
    // Click outside any anchor or panel: deselect
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-anchor], .galion-edit-panel, .galion-edit-toolbar, .ge-modal-bg')) return;
      deselectAll();
    });
  }

  function deselectAll() {
    document.querySelectorAll('[data-anchor].galion-active').forEach(el => el.classList.remove('galion-active'));
    document.querySelectorAll('.ge-anno').forEach(c => {
      c.classList.remove('active');
      c.classList.remove('collapsed');
    });
  }

  function focusAnchor(id) {
    document.querySelectorAll('[data-anchor].galion-active').forEach(el => el.classList.remove('galion-active'));
    document.querySelectorAll('.ge-anno').forEach(c => {
      const isThis = c.dataset.for === id;
      c.classList.toggle('collapsed', !isThis);
      c.classList.toggle('active', isThis);
    });
    const el = document.querySelector(`[data-anchor="${id}"]`);
    if (el) el.classList.add('galion-active');
    const card = document.querySelector(`.ge-anno[data-for="${id}"]`);
    if (panel() && card && el) {
      const blockTop = el.getBoundingClientRect().top;
      const cardTopBefore = card.getBoundingClientRect().top;
      panel().scrollTop += (cardTopBefore - blockTop);
    }
  }

  function panel() { return document.querySelector('.galion-edit-panel'); }

  function updateBadges(id, CK, RK) {
    const cBadge = document.querySelector(`[data-has-c="${id}"]`);
    const rBadge = document.querySelector(`[data-has-r="${id}"]`);
    const all_c = loadJSON(CK);
    const all_r = loadJSON(RK);
    if (cBadge) {
      const has = all_c[id] && all_c[id].trim();
      cBadge.classList.toggle('empty', !has);
      cBadge.classList.toggle('has-c', !!has);
      cBadge.textContent = has ? 'C✓' : 'C';
    }
    if (rBadge) {
      const has = all_r[id] && all_r[id].trim();
      rBadge.classList.toggle('empty', !has);
      rBadge.classList.toggle('has-r', !!has);
      rBadge.textContent = has ? 'R✓' : 'R';
    }
  }

  let statusTimer;
  function flashStatus() {
    const s = document.getElementById('ge-status');
    if (!s) return;
    s.textContent = '✓ sauvegardé';
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { s.textContent = 'Sauvegarde automatique'; }, 1200);
  }

  function exportComments(ficheId, CK, RK) {
    const all_c = loadJSON(CK);
    const all_r = loadJSON(RK);
    const anchors = collectAnchors();
    const lines = [`# Commentaires sur ${ficheId}`, ''];
    let any = false;
    const ids = [...anchors.map(a => a.id), 'general'];
    const labels = Object.fromEntries(anchors.map(a => [a.id, a.label]));
    labels['general'] = 'Remarques générales';
    for (const id of ids) {
      const c = (all_c[id] || '').trim();
      const r = (all_r[id] || '').trim();
      if (!c && !r) continue;
      any = true;
      lines.push(`## ${labels[id] || id}`);
      if (c) lines.push(`**Commentaire :** ${c}`);
      if (r) {
        lines.push('**Réécriture proposée (Markdown) :**');
        lines.push('```');
        lines.push(r);
        lines.push('```');
      }
      lines.push('');
    }
    if (!any) lines.push('_(aucun commentaire ni réécriture)_');
    showExportModal(lines.join('\n'));
  }

  function showExportModal(text) {
    let modal = document.getElementById('ge-modal');
    if (modal) modal.remove();
    modal = document.createElement('div');
    modal.id = 'ge-modal';
    modal.className = 'ge-modal-bg';
    modal.innerHTML = `
      <div class="ge-modal">
        <h2>Commentaires et réécritures (Markdown)</h2>
        <p>Copie ce texte dans le chat.</p>
        <textarea id="ge-export-text" readonly></textarea>
        <div class="ge-modal-actions">
          <button class="ge-btn ge-copy">Copier</button>
          <button class="ge-btn ge-modal-close" style="background:#888">Fermer</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#ge-export-text').value = text;
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    modal.querySelector('.ge-modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('.ge-copy').addEventListener('click', (e) => {
      const ta = modal.querySelector('#ge-export-text');
      ta.select();
      try {
        document.execCommand('copy');
        e.target.textContent = 'Copié ✓';
        setTimeout(() => { e.target.textContent = 'Copier'; }, 1500);
      } catch (err) {
        alert('Copie échouée. Sélectionne et copie manuellement.');
      }
    });
  }

  function doClearAll(CK, RK, ORIG) {
    localStorage.removeItem(CK);
    localStorage.removeItem(RK);
    document.querySelectorAll('textarea[data-id]').forEach(ta => {
      ta.value = '';
      if (ta.dataset.kind === 'rewrite') applyRewrite(ta.dataset.id, '', ORIG);
      updateBadges(ta.dataset.id, CK, RK);
    });
    flashStatus();
  }

  function loadJSON(k) { try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch { return {}; } }
  function saveJSON(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c])); }

})();
