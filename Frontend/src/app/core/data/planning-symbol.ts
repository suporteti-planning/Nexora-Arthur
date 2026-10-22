/**
 * Geometria do símbolo radial da Planning.
 * 
 * Cada entrada define um traço no símbolo:
 *   angle   — ângulo em graus (0 = topo, sentido horário)
 *   inner   — distância do centro ao início do traço (0–1, relativo ao raio total)
 *   outer   — distância do centro ao fim do traço  (0–1, relativo ao raio total)
 *   width   — espessura relativa do traço (0–1)
 *   color   — cor do traço no gradiente ciano→verde
 *
 * Extraído da imagem de referência: ~24 traços radiais distribuídos
 * de forma não-uniforme, mais longos no topo/direita e mais curtos
 * nas laterais/base, com lacunas entre grupos.
 */

export interface SymbolStroke {
  angle: number;   // graus, 0 = topo (12h), horário
  inner: number;   // 0–1
  outer: number;   // 0–1
  width: number;   // espessura relativa (1 = base)
  colorStop: number; // 0–1 no gradiente ciano→verde
}

// Os 24 traços do símbolo, medidos na imagem de referência
// Agrupados em 4 setores com lacunas entre eles
export const SYMBOL_STROKES: SymbolStroke[] = [
  // ── Setor topo (11h–1h) — traços mais longos ─────────────────────────────
  { angle: -20, inner: 0.18, outer: 0.95, width: 1.4, colorStop: 0.0 },  // 11h
  { angle: -12, inner: 0.15, outer: 0.98, width: 1.6, colorStop: 0.05 }, // ~11h30
  { angle:  -6, inner: 0.12, outer: 1.00, width: 1.8, colorStop: 0.1 },  // 12h menos
  { angle:   0, inner: 0.10, outer: 1.00, width: 2.0, colorStop: 0.15 }, // 12h (mais longo)
  { angle:   6, inner: 0.12, outer: 0.98, width: 1.8, colorStop: 0.2 },
  { angle:  12, inner: 0.14, outer: 0.95, width: 1.6, colorStop: 0.25 },
  { angle:  20, inner: 0.18, outer: 0.90, width: 1.4, colorStop: 0.3 },
  { angle:  28, inner: 0.20, outer: 0.85, width: 1.2, colorStop: 0.35 }, // 1h

  // ── Setor direita (2h–4h) — comprimento médio ────────────────────────────
  { angle:  42, inner: 0.22, outer: 0.80, width: 1.2, colorStop: 0.4 },
  { angle:  55, inner: 0.24, outer: 0.78, width: 1.1, colorStop: 0.45 },
  { angle:  68, inner: 0.25, outer: 0.75, width: 1.0, colorStop: 0.5 },  // 2h
  { angle:  82, inner: 0.26, outer: 0.72, width: 1.0, colorStop: 0.55 },
  { angle:  96, inner: 0.27, outer: 0.70, width: 0.9, colorStop: 0.6 },  // 3h
  { angle: 110, inner: 0.28, outer: 0.68, width: 0.9, colorStop: 0.65 },
  { angle: 124, inner: 0.28, outer: 0.65, width: 0.85, colorStop: 0.7 }, // 4h

  // ── Setor base (5h–7h) — traços mais curtos ──────────────────────────────
  { angle: 140, inner: 0.30, outer: 0.62, width: 0.8, colorStop: 0.72 },
  { angle: 155, inner: 0.30, outer: 0.58, width: 0.75, colorStop: 0.75 },
  { angle: 168, inner: 0.30, outer: 0.55, width: 0.7, colorStop: 0.78 }, // 5h30
  { angle: 180, inner: 0.28, outer: 0.52, width: 0.7, colorStop: 0.8 },  // 6h
  { angle: 192, inner: 0.28, outer: 0.50, width: 0.65, colorStop: 0.82 },

  // ── Setor esquerda (8h–10h) — comprimento crescente ─────────────────────
  { angle: 208, inner: 0.27, outer: 0.55, width: 0.75, colorStop: 0.84 },
  { angle: 224, inner: 0.26, outer: 0.60, width: 0.85, colorStop: 0.87 }, // 7h30
  { angle: 238, inner: 0.25, outer: 0.65, width: 0.9, colorStop: 0.9 },
  { angle: 252, inner: 0.24, outer: 0.70, width: 1.0, colorStop: 0.93 },  // 8h30
  { angle: 266, inner: 0.22, outer: 0.76, width: 1.1, colorStop: 0.95 },
  { angle: 280, inner: 0.20, outer: 0.82, width: 1.2, colorStop: 0.97 },  // 9h30
  { angle: 294, inner: 0.19, outer: 0.87, width: 1.3, colorStop: 0.98 },
  { angle: 307, inner: 0.18, outer: 0.90, width: 1.35, colorStop: 1.0 }, // 10h
];

/** Interpola a cor no gradiente ciano→verde da Planning */
export function strokeColor(stop: number): string {
  // #00E5B4 (ciano) → #00FF66 (verde neon)
  const r = 0;
  const g = Math.round(229 + (255 - 229) * stop);  // 229→255
  const b = Math.round(180 * (1 - stop));            // 180→0
  return `rgb(${r},${g},${b})`;
}
