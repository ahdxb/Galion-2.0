# Plan curriculum — Théorie des ensembles, style Galion

## Format

- **1 fiche = 2 pages.**
  - Page 1 : *Découverte → Cours → Illustration → Exemples → Exercices d'apprentissage* (~ 30 min)
  - Page 2 : *Batterie d'exercices* triés en trois niveaux **1★ / 2★ / 3★** (~ 30 min)
- **Cible** : 1 h de travail effectif pour un bon élève.
- **Synthèses** : toutes les 5 fiches, 1 fiche de synthèse au même format, croisant les notions du bloc et les blocs précédents.

## Volume

6 blocs × (5 fiches + 1 synthèse) = **36 fiches** ; bloc A étendu à 6 + 1 depuis le 2026-05-05, soit **37 fiches × 2 pages = 74 pages** (~ 37 h). Le bloc F est *bonus*.

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

| # | Titre | Concept central | Pré-requis |
|---|---|---|---|
| F6 | Réunion et intersection | $\cup, \cap$, commutativité, associativité | F3 |
| F7 | Complémentaire, différence | $\overline{A}$, $A \setminus B$, $A \triangle B$ | F6 |
| F8 | De Morgan et distributivité | $\overline{A \cup B} = \overline{A} \cap \overline{B}$ ; $\cap$ distrib. sur $\cup$ | F6, F7 |
| F9 | Produit cartésien | $A \times B$, couples, $\mathbb{R}^2$ | F1 |
| F10 | Cardinal et crible | $|A \cup B|$, $|A \times B|$, principe additif | F4, F6 |
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

## Bloc F — Cardinaux et infini *(bonus)*

| # | Titre | Concept central | Pré-requis |
|---|---|---|---|
| F26 | Cardinal fini, principe d'addition | $|A \sqcup B| = |A| + |B|$ | F10 |
| F27 | Principe multiplicatif | $|A \times B| = |A|\cdot|B|$, $n$-uplets | F26, F9 |
| F28 | Bijection et même cardinal | bij. ⟺ même taille (fini) | F25, F27 |
| F29 | Ensembles dénombrables | $\mathbb{N} \sim \mathbb{Z} \sim \mathbb{Q}$, énumérations | F28 |
| F30 | L'argument diagonal | $\mathbb{R}$ non dénombrable, $|\mathcal{P}(\mathbb{N})| > |\mathbb{N}|$ | F29 |
| **S6** | **De Galilée à Cantor** | l'infini, paradoxes apparents | bloc F + S5 |

---

## Décisions arrêtées

1. **Logique** (∧, ∨, ¬, ⇒, ∀, ∃) : introduite **au fil de l'eau**, pas de fiche L0 préalable.
2. **Synthèses** : page 1 = récap des notions du bloc, page 2 = exercices **plus longs et dirigés** (problèmes en plusieurs questions enchaînées).
3. **Ordre des blocs** : équivalence (Bloc C) **avant** ordre (Bloc D).
4. **Pré-requis arithmétiques** (divisibilité, reste, etc.) : **acquis supposés** ; signalés par un drapeau ⚐ dans la fiche concernée pour repérage immédiat si rappel nécessaire.

5. **Bloc F** (cardinaux et infini, F26–F30 + S6) : **gardé en bonus** ; abordable après F25/S5 ou réservable pour plus tard.

## Progression-type sur l'année

- **Trimestre 1** : Blocs A + B (F1–F10 + S1 + S2) — fondations + algèbre.
- **Trimestre 2** : Blocs C + D (F11–F20 + S3 + S4) — relations.
- **Trimestre 3** : Bloc E + Bloc F bonus (F21–F30 + S5 + S6) — applications et infini.

Rythme : ~1 fiche/semaine sur 36 semaines, ou 2 fiches/semaine sur 18 semaines pour boucler en un semestre.
