// Galion 2.0 — Configuration MathJax partagée par toutes les fiches.
// À charger AVANT le script MathJax CDN.
//
// Convention: $...$ pour le math inline. Pas de \(...\) ni $$...$$.
//
// Macros définies ci-dessous : préférer la forme courte (\NN) à la forme
// longue (\mathbb{N}) dans les sources des fiches.

window.MathJax = {
  tex: {
    inlineMath: [['$', '$']],
    macros: {
      // ---- Ensembles de nombres ----
      NN: "{\\mathbb{N}}",
      ZZ: "{\\mathbb{Z}}",
      QQ: "{\\mathbb{Q}}",
      RR: "{\\mathbb{R}}",
      Nstar: "{\\mathbb{N}^*}",
      Zstar: "{\\mathbb{Z}^*}",
      Qstar: "{\\mathbb{Q}^*}",
      Rstar: "{\\mathbb{R}^*}",
      Rplus: "{\\mathbb{R}^+}",
      Rmoins: "{\\mathbb{R}^-}",

      // ---- Constructions ensemblistes ----
      Pwr: ["{\\mathcal{P}\\!\\left(#1\\right)}", 1],   // \Pwr{E} = P(E)
      set: ["{\\{#1\\}}", 1],                              // \set{1,2,3}
      setof: ["{\\{#1 \\mid #2\\}}", 2],                   // \setof{x \in E}{P(x)}

      // ---- Cardinal et valeur absolue ----
      abs: ["{\\left|#1\\right|}", 1],
      card: ["{\\left|#1\\right|}", 1],

      // ---- Logique (utiles à partir de F12) ----
      iff: "{\\Longleftrightarrow}",
      implies: "{\\Longrightarrow}",
      logand: "{\\wedge}",
      logor: "{\\vee}",
      lnot: "{\\neg}",

      // ---- Inégalités (alias pour la convention "slanted") ----
      le: "{\\leqslant}",
      ge: "{\\geqslant}",

      // ---- Divers ----
      pgcd: "{\\operatorname{pgcd}}",
      ppcm: "{\\operatorname{ppcm}}"
    }
  },
  chtml: { scale: 1.0 }
};
