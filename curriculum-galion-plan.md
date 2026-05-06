# Plan curriculum — Mathématiques modernes, style Galion (collège)

## Cible

Curriculum de mathématiques modernes pour le collège (6<sup>e</sup>–3<sup>e</sup>), inspiré du programme Lichnerowicz (1969–1975) et de la pédagogie des fiches Galion (Lyon, 1968). La géométrie n'est volontairement pas couverte (les figures s'éditent mal en éditeur léger ; il existe d'excellents ouvrages dédiés).

## Format

- **1 fiche = 2 pages.**
  - Page 1 : *Découverte → Cours → Illustration → Exemples → Exercices d'apprentissage* (~ 30 min)
  - Page 2 : *Batterie d'exercices* triés en trois niveaux **1★ / 2★ / 3★** (~ 30 min)
- **Cible** : 1 h de travail effectif pour un bon élève.
- **Synthèses** : toutes les 5 fiches (ou 6 pour bloc A), 1 fiche de synthèse au même format, croisant les notions du bloc et les blocs précédents.

## Volume

8 blocs × ≈ (5 fiches + 1 synthèse) ≈ **49 fiches × 2 pages ≈ 98 pages** (~ 49 h). Le bloc H est *bonus*.

## Niveau cible par bloc (correspondance 70s)

| Bloc | Sujet | Niveau 70s |
|---|---|---|
| A | Décrire et comparer des ensembles | 6<sup>e</sup>/5<sup>e</sup> |
| B | Algèbre des ensembles | 5<sup>e</sup>/4<sup>e</sup> |
| C | Relations et équivalence | 4<sup>e</sup> |
| D | Ordre | 4<sup>e</sup>/3<sup>e</sup> |
| E | Applications | 3<sup>e</sup>/2<sup>nde</sup> |
| F | Arithmétique | parallèle 6<sup>e</sup>–3<sup>e</sup> |
| G | Structures algébriques | 4<sup>e</sup>/3<sup>e</sup> |
| H | Cardinaux et infini *(bonus)* | post-bac |

---

## Bloc A — Décrire et comparer des ensembles

*Plan révisé 2026-05-05 : 6 fiches + 1 synthèse (était 5 + 1). F1 a absorbé l'extension/compréhension de l'ancien F2 et a été allégée par la création d'un F2 dédié aux notations.*

| # | Titre | Concept central | Pré-requis |
|---|---|---|---|
| F1 | Ensembles et appartenance | $\in, \notin$, extension, compréhension (intro), exemples équivalents | aucun |
| F2 | Notations utiles | $\emptyset$, $\|E\|$ (cardinal), $\mathbb{N}$, $\mathbb{Z}$ ; mention de $\mathbb{Q}, \mathbb{R}$ | F1 |
| F3 | Décrire un ensemble — bien définir | conditions composées (et / ou), « bien défini » vs ambigu, égalité par équivalence des propriétés | F1, F2 |
| F4 | Inclusion et sous-ensembles | $\subset$, $\in$ vs $\subset$, réflexivité, transitivité, double inclusion, premiers diagrammes patate | F2, F3 |
| F5 | Parties d'un ensemble | $\mathcal{P}(E)$, $\|\mathcal{P}(E)\| = 2^{\|E\|}$, diagramme de Hasse | F4 |
| F6 | Ensembles de nombres | chaîne $\mathbb{N} \subsetneq \mathbb{Z} \subsetneq \mathbb{Q} \subsetneq \mathbb{R}$, irrationnels, preuve guidée que $\sqrt{2} \notin \mathbb{Q}$, teaser Cantor | F4 |
| **S1** | **Construire et décrire** | dialogue extension / compréhension / inclusion / parties / nombres ; problèmes enchaînés | bloc A |

## Bloc B — Algèbre des ensembles

*Note : la numérotation globale F1, F2, … est purement conceptuelle. Chaque bloc a sa propre séquence interne.*

| # | Titre | Concept central | Pré-requis |
|---|---|---|---|
| F7 | Réunion et intersection | $\cup, \cap$, commutativité, associativité | bloc A |
| F8 | Complémentaire, différence | $\overline{A}$, $A \setminus B$, $A \triangle B$ | F7 |
| F9 | De Morgan et distributivité | $\overline{A \cup B} = \overline{A} \cap \overline{B}$ ; $\cap$ distrib. sur $\cup$ | F7, F8 |
| F10 | Produit cartésien | $A \times B$, couples, $\mathbb{R}^2$ | F1 |
| F11 | Cardinal et crible | $|A \cup B|$, $|A \times B|$, principe additif | F4, F7 |
| **S2** | **L'algèbre des ensembles** | identités, démonstrations à 2-3 ensembles | bloc B + S1 |

## Bloc C — Relations et équivalence

| # | Titre | Concept central | Pré-requis |
|---|---|---|---|
| F11 | Relations binaires | $\mathcal{R} \subset E \times F$ ; sagittal, tableau, graphe | F9 |
| F12 | Propriétés des relations | réflexive, symétrique, antisymétrique, transitive | F11 |
| F13 | Relations d'équivalence | $\sim$ : R + S + T | F12 |
| F14 | Classes et partitions | classes disjointes, $E/\sim$ | F13 |
| F15 | Ensembles quotients célèbres | $\mathbb{Z}/n\mathbb{Z}$, fractions, vecteurs | F14 |
| **S3** | **Partitionner, c'est classer** | équivalences ↔ partitions | bloc C + S2 |

## Bloc D — Ordre

| # | Titre | Concept central | Pré-requis |
|---|---|---|---|
| F16 | Relations d'ordre | $\preccurlyeq$ : R + AS + T ; total vs partiel | F12 |
| F17 | Diagrammes de Hasse | tracer un ordre, lecture | F16 |
| F18 | Ordre lexicographique | composer deux ordres, mots, couples | F16, F9 |
| F19 | Bornes : max, min, majorant | vocabulaire ; existence vs unicité | F16 |
| F20 | Ordres usuels | $\leqslant$ sur $\mathbb{N},\mathbb{Z},\mathbb{Q}$ ; « divise » ; $\subset$ | F4, F16 |
| **S4** | **Comparer et ranger** | quand peut-on toujours comparer ? | bloc D + S2 |

## Bloc E — Applications

| # | Titre | Concept central | Pré-requis |
|---|---|---|---|
| F21 | Applications | $f : E \to F$, image, antécédent | F11 |
| F22 | Image directe / réciproque | $f(A)$, $f^{-1}(B)$ | F21 |
| F23 | Composition | $g \circ f$, identité, associativité | F21 |
| F24 | Injection et surjection | « au plus une » / « au moins une » | F21 |
| F25 | Bijection et réciproque | bij. ⟺ inj. + surj. ; $f^{-1}$ | F23, F24 |
| **S5** | **Aller et revenir** | $f$ et $f^{-1}$, cardinaux finis | bloc E + S3 |

## Bloc F — Arithmétique

*Bloc nouveau. En 70s, l'arithmétique était enseignée en parallèle de la théorie des ensembles, de la 6<sup>e</sup> à la 3<sup>e</sup>. Ici, regroupé en un bloc cohérent ; place à fixer après les blocs A et B (les fiches travaillent sur $\NN, \ZZ$).*

| # | Titre | Concept central | Pré-requis |
|---|---|---|---|
| F-F1 | Divisibilité dans $\mathbb{Z}$ | $a \mid b$, propriétés, multiples / diviseurs | A |
| F-F2 | Division euclidienne | $a = bq + r$, $0 \le r < |b|$, unicité | F-F1 |
| F-F3 | PGCD et PPCM | algorithme d'Euclide, identités, $a \mid b \cdot c \Rightarrow \ldots$ | F-F2 |
| F-F4 | Nombres premiers | définition, infinité, décomposition unique | F-F3 |
| F-F5 | Congruences modulo $n$ | $a \equiv b \pmod{n}$, classes, opérations | F-F1, C |
| **S-F** | **Arithmétique : structure cachée** | de la division euclidienne aux congruences | bloc F + S2 |

## Bloc G — Structures algébriques

*Bloc nouveau. En 70s, le groupe était introduit en 4<sup>e</sup> via les translations en géométrie. Ici, on l'introduit via $\mathbb{Z}/n\mathbb{Z}$ et la composition d'applications.*

| # | Titre | Concept central | Pré-requis |
|---|---|---|---|
| F-G1 | Lois de composition interne | $\star : E \times E \to E$, exemples, contre-exemples | F10, E |
| F-G2 | Élément neutre, symétrique | unicité, premiers exemples ($+$, $\times$, $\circ$) | F-G1 |
| F-G3 | Groupe | $(G, \star)$ : associativité + neutre + symétrique ; exemples ($\mathbb{Z}, +$), $(\mathbb{Z}/n\mathbb{Z}, +)$ | F-G2, F-F5 |
| F-G4 | Sous-groupe | définition, critère ; sous-groupes de $(\mathbb{Z}, +)$ | F-G3 |
| F-G5 | Anneau, corps (intro) | $(\mathbb{Z}, +, \times)$ anneau ; $(\mathbb{Q}, +, \times)$ corps ; teaser $\mathbb{Z}/p\mathbb{Z}$ corps | F-G3 |
| **S-G** | **Voir des groupes partout** | translations, $\mathbb{Z}/n\mathbb{Z}$, bijections d'un ensemble | bloc G + S5 |

## Bloc H — Cardinaux et infini *(bonus)*

| # | Titre | Concept central | Pré-requis |
|---|---|---|---|
| F-H1 | Cardinal fini, principe d'addition | $|A \sqcup B| = |A| + |B|$ | F11 |
| F-H2 | Principe multiplicatif | $|A \times B| = |A|\cdot|B|$, $n$-uplets | F-H1, F10 |
| F-H3 | Bijection et même cardinal | bij. ⟺ même taille (fini) | F25, F-H2 |
| F-H4 | Ensembles dénombrables | $\mathbb{N} \sim \mathbb{Z} \sim \mathbb{Q}$, énumérations | F-H3 |
| F-H5 | L'argument diagonal | $\mathbb{R}$ non dénombrable, $|\mathcal{P}(\mathbb{N})| > |\mathbb{N}|$ | F-H4 |
| **S-H** | **De Galilée à Cantor** | l'infini, paradoxes apparents | bloc H + S5 |

---

## Décisions arrêtées

1. **Logique** (∧, ∨, ¬, ⇒, ∀, ∃) : introduite **au fil de l'eau**, pas de fiche L0 préalable.
2. **Synthèses** : page 1 = récap des notions du bloc, page 2 = exercices **plus longs et dirigés** (problèmes en plusieurs questions enchaînées).
3. **Ordre des blocs** : équivalence (Bloc C) **avant** ordre (Bloc D).
4. **Pré-requis arithmétiques** (divisibilité, reste, etc.) : **acquis supposés** ; signalés par un drapeau ⚐ dans la fiche concernée pour repérage immédiat si rappel nécessaire.

5. **Bloc H** (cardinaux et infini) : **gardé en bonus** ; abordable après bloc E/F/G ou réservable pour plus tard.
6. **Géométrie** : volontairement absente. Trop coûteuse à éditer en éditeur léger (figures), mieux servie par des manuels dédiés.

## Progression sur le cycle collège

Le curriculum couvrant 6<sup>e</sup>–3<sup>e</sup>, le rythme est de ~1 fiche par semaine, étalé sur 4 ans en parallèle des cours scolaires. Ordre suggéré&nbsp;:

- **6<sup>e</sup>** : bloc A (ensembles fondamentaux) + premières fiches du bloc F (arithmétique : divisibilité, division euclidienne).
- **5<sup>e</sup>** : fin bloc A + bloc B (algèbre des ensembles) + suite bloc F (PGCD, premiers).
- **4<sup>e</sup>** : bloc C (relations, équivalence) + bloc D (ordre) + fin bloc F (congruences).
- **3<sup>e</sup>** : bloc E (applications) + bloc G (structures algébriques) + bloc H si motivé.

Rythme alternatif : 2 fiches/semaine pour boucler en 2 ans (élèves très avancés).
