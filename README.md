# Galion 2.0

Fiches d'apprentissage de mathématiques pour la 6<sup>e</sup>/5<sup>e</sup>, inspirées des fiches Galion (équipe lyonnaise, 1968). Le projet est en deux couches&nbsp;: un **contenu** (les fiches) et une **chaîne d'outils** (Mathdown) pour l'écrire, le rendre et l'éditer.

**[→ Voir le site](https://ahdxb.github.io/Galion-2.0/)**

## 1. Objectifs

**Contenu** — 36 fiches en six blocs (théorie des ensembles, applications, ordre, cardinaux). Une fiche = 2 pages A4 imprimables, ≈ 1 heure de travail effectif. Tri des exercices par difficulté ★ / ★★ / ★★★. Voir [`curriculum-galion-plan.md`](curriculum-galion-plan.md) pour le plan complet et l'esprit pédagogique.

**Outils** — découpler **forme** (mise en page, typographie, couleurs) et **substance** (le texte de la fiche, les notations, les exercices). Permettre&nbsp;:

- d'éditer la substance vite, dans un éditeur texte ou dans un éditeur dédié, sans toucher au HTML&nbsp;;
- de retravailler la forme une fois pour toutes, sans modifier les fiches&nbsp;;
- de garder un format source lisible, versionnable, diffable.

## 2. Structure du dépôt

```
Galion-2.0/
├── README.md                        ce fichier
├── curriculum-galion-plan.md        plan pédagogique des 36 fiches
├── index.html                       page d'accueil (liste des fiches)
├── engine/                          la chaîne Mathdown (forme + outils)
│   ├── mathdown.js                  parser + renderer + boot
│   ├── mathdown.css                 forme des pages — modifiable par un designer
│   ├── mathdown-editor.js           éditeur côte-à-côte (chargé sur ?edit=1)
│   ├── mathdown-editor.css          chrome de l'éditeur
│   └── mathjax-config.js            macros LaTeX projet (\NN, \set, \setof, …)
├── fiches/                          contenu, une paire par fiche
│   ├── fiche1-ensembles-appartenance.mathdown   substance
│   └── fiche1-ensembles-appartenance.html       chargeur (pointe vers le .mathdown)
└── archive/                         ancienne génération (single-file HTML)
```

Chaque fiche est une paire `nom.mathdown` + `nom.html`. Le HTML est un chargeur léger&nbsp;: il importe l'engine, et l'engine va chercher le fichier `.mathdown` du même nom (convention par défaut). Pas de duplication.

### Pourquoi `.mathdown` ?

Distinct de `.md` pour éviter la confusion avec du Markdown standard (Mathdown ajoute des directives non standard). Les éditeurs modernes (VS Code, Sublime, Vim) acceptent un mapping `.mathdown` → markdown highlighting via une ligne de configuration.

## 3. Utilisation

### Pour lire ou éditer une fiche

Le `.mathdown` est canonique et le `.html` est un chargeur léger. Le navigateur ne peut pas charger un fichier voisin via `file://` (sécurité), donc un mini-serveur HTTP local est nécessaire — overhead minimal, démarré une fois par session&nbsp;:

**Mac (recommandé)** — double-clic sur **`serve.command`** à la racine du dépôt. Un Terminal s'ouvre, le serveur (`engine/serve.py`) démarre, le navigateur s'ouvre sur l'index. Laisser le Terminal ouvert ; Ctrl-C arrête.

`engine/serve.py` est un mini-serveur HTTP basé sur la `stdlib` Python, avec deux particularités&nbsp;:

- GET&nbsp;: comme `python3 -m http.server`.
- PUT sur `fiches/*.mathdown`&nbsp;: écrit le fichier sur disque. C'est ce qui permet au bouton **Enregistrer** de l'éditeur Mathdown (Cmd-S) de sauvegarder directement, sans copier-coller. Restreint à `fiches/` et à l'extension `.mathdown` ; pas de path traversal.

**Manuel sans PUT** (édition uniquement via éditeur texte)&nbsp;:

```bash
cd Galion-2.0
python3 -m http.server 8000
# ouvrir http://localhost:8000/
```

Avec ce serveur-là, l'éditeur Mathdown ne peut pas écrire&nbsp;: le bouton « Enregistrer » bascule alors sur un téléchargement.

Une fois le serveur lancé, **toute édition du `.mathdown` se voit au prochain `Cmd-R`** dans le navigateur — qu'elle vienne de l'éditeur texte ou de l'éditeur Mathdown (`?edit=1`).

### Pour éditer

Deux modes au choix, interchangeables&nbsp;:

| Mode | Comment | Quand |
|---|---|---|
| **Éditeur texte** | ouvrir le `.mathdown` dans VS Code, Sublime, Typora… | retouches rapides en local, recherche/remplacement, multi-fichiers |
| **Éditeur Mathdown** | ouvrir l'URL avec `?edit=1` | live preview, rendu MathJax, vue côte-à-côte, raccourcis LaTeX visibles |

Les deux travaillent sur le même `.mathdown`. L'éditeur Mathdown sait télécharger une version mise à jour du fichier (bouton **Télécharger .mathdown**).

## 4. Syntaxe Mathdown

Le source est du Markdown enrichi de **directives** au format CommonMark Generic Directives.

### Front-matter (en tête)

```yaml
---
fiche: 1
title: Fiche 1 — Ensembles et appartenance
theme: Théorie des ensembles
level: 6e/5e
brand: Galion 2.0
lang: fr
---
```

`lang: fr` active la couche typographique française&nbsp;:

- NBSP avant `:`, `;`, `?`, `!`, `»` et après `«`&nbsp;;
- guillemets droits `"…"` → `« … »` (avec NBSP)&nbsp;;
- apostrophe droite entre lettres `l'ensemble` → `l'ensemble` (`'`, U+2019).

Sans `lang`, aucune transformation typographique. Pour ajouter une autre langue, déclarer une fonction dans `TYPOGRAPHY` (engine/mathdown.js).

### Structure de document

| Élément | Markdown | Sémantique |
|---|---|---|
| Titre de fiche | `# Titre` | — |
| Section | `## Section` | — |
| Sous-section | `### Sous-section` | — |
| Saut de page (multi-pages) | — | `:::page\n…\n:::` |
| Suggestion de coupure (soft) | — | `::pagebreak` |

`::pagebreak` est une **recommandation** au paginateur, pas une commande. Si la page courante déborde, le paginateur préfère couper à cet endroit plutôt qu'au point de débordement naturel. Si la page tient sur un A4, le hint est ignoré (et invisible dans le rendu).

### Paragraphe

| Élément | Sémantique |
|---|---|
| Tête de paragraphe en gras | `:heading[Sets] suite du paragraphe…` |
| Note / remarque | `:::remarque\n…\n:::` |
| Attention | `:::attention\n…\n:::` |
| Aparté (callout) | `:::callout[Pour aller plus loin]\n…\n:::` |
| Méthode | `:::methode[Titre]\n…\n:::` |

### Environnements de cours

| Élément | Inline | Bloc |
|---|---|---|
| Terme défini | `:defined[Bob]` | `:::definition[terme]\n…\n:::` |
| Théorème | — | `:::theoreme[Titre]\n…\n:::` |
| Propriété | — | `:::propriete[Titre]\n…\n:::` |
| Lemme / Corollaire | — | `:::lemme[…]`, `:::corollaire[…]` |
| Démonstration | — | `:::demonstration\n…\n:::` |
| Exemple | `:exemple[bref]` | `:::exemple\n…\n:::` |
| Contre-exemple | — | `:::contre-exemple\n…\n:::` |
| Notation | `:notation[\NN]` | `:::notation\n…\n:::` |

### Exercices

| Élément | Sémantique |
|---|---|
| Bande de difficulté | `:::niveau[1]\n…\n:::` (1, 2, 3 = ★, ★★, ★★★) |
| Exercice | `:::exercice[8]\n…\n:::` (avec ancre/numéro) |
| Solution | `:::solution\n…\n:::` |
| Indication | `:::indication\n…\n:::` |
| Sous-questions multi-colonnes | `:::cols\n- …\n- …\n:::` (défaut 2 col, `:::cols[3]` pour 3) — à n'utiliser que si chaque item tient en moins d'une demi-largeur. **Variante mixte paire/seul** : indenter une sous-puce sous un item le marque comme partenaire à côté (mode 2 col) ; un item sans sous-puce occupe toute la ligne. |

### Commentaires (méta — pour l'auteur, pour Claude)

Les commentaires vivent dans le source `.mathdown`. Ils sont **cachés en mode lecture** et **visibles dans l'éditeur** (cadre jaune avec 💬). L'éditeur fournit deux boutons&nbsp;: **Exporter commentaires** (digest Markdown copié dans le presse-papiers, prêt à coller dans le chat) et **Effacer commentaires** (les retire tous d'un coup).

| Forme | Syntaxe |
|---|---|
| Bloc | `:::comment\n@claude: ajouter 2 exemples plus simples ici\n:::` |
| Bloc avec étiquette | `:::comment[urgent]\n…\n:::` |
| Inline | `She said :comment[trop long ?] and left.` |

### Listes

| Élément | Markdown | Sémantique |
|---|---|---|
| Puce | `- item` | — |
| Numéroté | `1. item` | — |
| Étiquette en tête d'item | — | `- :label[Formes] item` (italique + `:` automatique) |

### Inline

| Élément | Markdown brut | Sémantique préférée |
|---|---|---|
| Gras | `**texte**` | `:strong[texte]` |
| Italique | `*texte*` | `:emph[texte]` |
| Souligné | `_texte_` | `:underline[texte]` |
| Math inline | `$x^2$` | — |
| Math display | `$$ x^2 $$` | `::math[x^2]` |
| Lien | `[texte](url)` | — |
| Référence croisée | — | `:ref[ex8]` |
| Note de bas de page | `[^1]` … `[^1]: …` | — |

**Règle&nbsp;:** privilégier la forme sémantique (`:emph`, `:defined`, `:heading`…) à la forme brute (`*`, `**`, `_`). Les marqueurs Markdown bruts existent comme filet de sécurité — ils restent disponibles mais doivent rester rares dans une fiche bien écrite, pour que la forme reste pilotable depuis le CSS sans toucher aux sources.

### Niveaux de directive

```
:role[texte]{attrs}        directive inline (span)
::role[texte]{attrs}       bloc-feuille (un bloc, contenu inline seulement)
:::role[label]{attrs}      bloc-conteneur (peut imbriquer paragraphes, listes…)
…
:::
```

`{attrs}` accepte `.classe`, `#id`, et `clé=valeur`.

### Macros LaTeX

Définies dans [`engine/mathjax-config.js`](engine/mathjax-config.js) — utilisables dans tout `$…$`.

| Raccourci | Équivalent | Raccourci | Équivalent |
|---|---|---|---|
| `\NN` | $\mathbb{N}$ | `\set{1,2,3}` | $\{1,2,3\}$ |
| `\ZZ` | $\mathbb{Z}$ | `\setof{x \in E}{P(x)}` | $\{x \in E \mid P(x)\}$ |
| `\QQ` | $\mathbb{Q}$ | `\Pwr{E}` | $\mathcal{P}(E)$ |
| `\RR` | $\mathbb{R}$ | `\abs{x}` / `\card{E}` | $\lvert x \rvert$ |
| `\Nstar` | $\mathbb{N}^*$ | `\le` / `\ge` | $\leqslant$ / $\geqslant$ |

L'éditeur Mathdown affiche la liste complète à jour via le bouton **Raccourcis LaTeX**.

**Convention** d'écriture des ensembles dans les fiches&nbsp;:

- toujours `\set{1, 2, 3}` plutôt que `\{1, 2, 3\}`. L'espacement cosmétique `\,` est inclus dans le macro&nbsp;: ne pas l'écrire dans la source.
- toujours `\setof{x \in E}{P(x)}` plutôt que `\{x \in E \mid P(x)\}`&nbsp;;
- éléments textuels en `\text{…}` pour qu'ils ne soient pas rendus en italique math&nbsp;: `\set{\text{Alice}, \text{Bob}, \text{Carla}}`.

## 5. Hébergement

Pages statiques HTML + MathJax (CDN). Aucune dépendance serveur en production. En développement, un mini-serveur HTTP local est nécessaire pour que les `.mathdown` soient récupérés par `fetch()`.

GitHub Pages&nbsp;: pousser sur `main`, activer Pages avec root `/`. Le site est servi à `https://ahdxb.github.io/Galion-2.0/`.

## 6. Licence

À définir.

## 7. Crédits

Refonte 2026, inspirée des fiches Galion (acronyme « gars de Lyon ») fondées le 8 novembre 1968 sous l'impulsion de Maurice Glaymann (originaux édités par OCDL, programmes 1969–1975).
