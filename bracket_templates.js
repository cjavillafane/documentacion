// backend/bracket_templates.js
//
// Motor de plantillas de llaves (3–11 equipos) según los diagramas que enviaste.
// Cada plantilla es una lista de "definiciones de partido":
//  - id:       identificador interno del match dentro de la plantilla (p.ej. "M1")
//  - round:    número de ronda (1 = primera ronda, final es la última)
//  - orden:    orden dentro de la ronda
//  - a / b:    participante:
//        * número -> posición de sembrado (1..N) según el orden que mandás desde el admin
//        * 'W:Mx' -> ganador del match con id 'Mx'
//  - next / nextSide: a qué match alimenta el ganador (1 o 2).
//
// Nota: las plantillas “colocan” los BYE como en tus láminas.
// Si alguno lo querés ajustar, es solo retocar el JSON aquí.

export function getTemplateByCount(n) {
  const T = {};

  // ===== 3 equipos =====
  // R1: (1) vs (2)  -> Final lado 1
  // Final: W(R1) vs (3)
  T[3] = [
    { id: 'M1', round: 1, orden: 1, a: 1,    b: 2,    next: 'M2', nextSide: 1 },
    { id: 'M2', round: 2, orden: 1, a: 'W:M1', b: 3 }
  ];

  // ===== 4 equipos (estándar) =====
  T[4] = [
    { id: 'M1', round: 1, orden: 1, a: 1, b: 2, next: 'M3', nextSide: 1 },
    { id: 'M2', round: 1, orden: 2, a: 3, b: 4, next: 'M3', nextSide: 2 },
    { id: 'M3', round: 2, orden: 1, a: 'W:M1', b: 'W:M2' } // Final
  ];

  // ===== 5 equipos (tal cual tu foto) =====
  // R1: (1 vs 2), (3 vs 4), (5) libre
  // R2: Semi-2: W(3vs4) vs (5)
  // Final: W(1vs2) vs W(Semi-2)
  T[5] = [
    { id: 'M1', round: 1, orden: 1, a: 1,    b: 2,    next: 'M4', nextSide: 1 }, // su ganador pasa DIRECTO a la final (lado 1)
    { id: 'M2', round: 1, orden: 2, a: 3,    b: 4,    next: 'M3', nextSide: 1 },
    { id: 'M3', round: 2, orden: 1, a: 'W:M2', b: 5,   next: 'M4', nextSide: 2 }, // semi 2
    { id: 'M4', round: 3, orden: 1, a: 'W:M1', b: 'W:M3' }                       // final
  ];

  // ===== 6 equipos (según lámina: ganador del 3er partido va directo a la final) =====
  // R1: (1 vs 2), (3 vs 4), (5 vs 6)
  // R2: Semi: W(1vs2) vs W(3vs4)
  // Final: W(Semi) vs W(5vs6)
  T[6] = [
    { id: 'M1', round: 1, orden: 1, a: 1, b: 2, next: 'M4', nextSide: 1 },
    { id: 'M2', round: 1, orden: 2, a: 3, b: 4, next: 'M4', nextSide: 2 },
    { id: 'M3', round: 1, orden: 3, a: 5, b: 6, next: 'M5', nextSide: 2 },
    { id: 'M4', round: 2, orden: 1, a: 'W:M1', b: 'W:M2', next: 'M5', nextSide: 1 },
    { id: 'M5', round: 3, orden: 1, a: 'W:M4', b: 'W:M3' } // final
  ];

  // ===== 7 equipos =====
  // R1: (1 vs 2), (3 vs 4), (5 vs 6), (7 libre)
  // R2: Semi-1: W(1vs2) vs W(3vs4)
  //     Semi-2: W(5vs6) vs 7
  // Final: W(S1) vs W(S2)
  T[7] = [
    { id: 'M1', round: 1, orden: 1, a: 1, b: 2, next: 'M4', nextSide: 1 },
    { id: 'M2', round: 1, orden: 2, a: 3, b: 4, next: 'M4', nextSide: 2 },
    { id: 'M3', round: 1, orden: 3, a: 5, b: 6, next: 'M5', nextSide: 1 },
    { id: 'M4', round: 2, orden: 1, a: 'W:M1', b: 'W:M2', next: 'M6', nextSide: 1 },
    { id: 'M5', round: 2, orden: 2, a: 'W:M3', b: 7,       next: 'M6', nextSide: 2 },
    { id: 'M6', round: 3, orden: 1, a: 'W:M4', b: 'W:M5' } // final
  ];

  // ===== 8 equipos (estándar 4-2-1) =====
  T[8] = [
    { id: 'M1', round: 1, orden: 1, a: 1, b: 2, next: 'M5', nextSide: 1 },
    { id: 'M2', round: 1, orden: 2, a: 3, b: 4, next: 'M5', nextSide: 2 },
    { id: 'M3', round: 1, orden: 3, a: 5, b: 6, next: 'M6', nextSide: 1 },
    { id: 'M4', round: 1, orden: 4, a: 7, b: 8, next: 'M6', nextSide: 2 },
    { id: 'M5', round: 2, orden: 1, a: 'W:M1', b: 'W:M2', next: 'M7', nextSide: 1 },
    { id: 'M6', round: 2, orden: 2, a: 'W:M3', b: 'W:M4', next: 'M7', nextSide: 2 },
    { id: 'M7', round: 3, orden: 1, a: 'W:M5', b: 'W:M6' } // final
  ];

 // ===== 9 equipos (flujo pedido)
// R1: (1 vs 2), (3 vs 4), (5 vs 6), (7 vs 8)  —  (9 entra en R2)
// R2: M5: W(1vs2) vs W(3vs4)
//     M6: W(7vs8) vs 9
//     M7: W(M6)   vs W(5vs6)
// Final (R3): M8: W(M5) vs W(M7)
T[9] = [
  // R1
  { id: 'M1', round: 1, orden: 1, a: 1, b: 2, next: 'M5', nextSide: 1 },
  { id: 'M2', round: 1, orden: 2, a: 3, b: 4, next: 'M5', nextSide: 2 },
  { id: 'M3', round: 1, orden: 3, a: 5, b: 6, next: 'M7', nextSide: 2 },
  { id: 'M4', round: 1, orden: 4, a: 7, b: 8, next: 'M6', nextSide: 1 },

  // R2
  { id: 'M5', round: 2, orden: 1, a: 'W:M1', b: 'W:M2', next: 'M8', nextSide: 1 },
  { id: 'M6', round: 2, orden: 2, a: 'W:M4', b: 9,        next: 'M7', nextSide: 1 },
  { id: 'M7', round: 3, orden: 1, a: 'W:M6', b: 'W:M3',   next: 'M8', nextSide: 2 },

  // Final
  { id: 'M8', round: 4, orden: 1, a: 'W:M5', b: 'W:M7' }
];




  // ===== 10 equipos (generaliza el de 9: 9 vs 10 reemplaza al bye)
// R1: (1 vs 2), (3 vs 4), (5 vs 6), (7 vs 8), (9 vs 10)
// R2: M6: W(1vs2) vs W(3vs4)
//     M7: W(7vs8) vs W(9vs10)
// R3: M8: W(M7)   vs W(5vs6)
// Final (R4): M9: W(M6) vs W(M8)
T[10] = [
  // R1
  { id: 'M1', round: 1, orden: 1, a: 1, b: 2,  next: 'M6', nextSide: 1 },
  { id: 'M2', round: 1, orden: 2, a: 3, b: 4,  next: 'M6', nextSide: 2 },
  { id: 'M3', round: 1, orden: 3, a: 5, b: 6,  next: 'M8', nextSide: 2 },
  { id: 'M4', round: 1, orden: 4, a: 7, b: 8,  next: 'M7', nextSide: 1 },
  { id: 'M5', round: 1, orden: 5, a: 9, b: 10, next: 'M7', nextSide: 2 },

  // R2
  { id: 'M6', round: 2, orden: 1, a: 'W:M1', b: 'W:M2', next: 'M9', nextSide: 1 },
  { id: 'M7', round: 2, orden: 2, a: 'W:M4', b: 'W:M5', next: 'M8', nextSide: 1 },

  // R3
  { id: 'M8', round: 3, orden: 1, a: 'W:M7', b: 'W:M3', next: 'M9', nextSide: 2 },

  // Final
  { id: 'M9', round: 4, orden: 1, a: 'W:M6', b: 'W:M8' }
];


  // ===== 11 equipos =====
  // R1: (1 vs 2), (3 vs 4), (5 vs 6), (7 vs 8), (9 vs 10), (11 libre)
  // R2: QF1: W(1vs2) vs W(3vs4)
  //     QF2: W(5vs6) vs W(7vs8)
  //     QF3: W(9vs10) vs 11
  // R3: SF1: W(QF1) vs W(QF2)
  //     SF2: W(QF3) vs BYE -> modelado con contenedor hacia final
  // Final: W(SF1) vs W(QF3)
  T[11] = [
    { id: 'M1', round: 1, orden: 1, a: 1,  b: 2,  next: 'M7', nextSide: 1 },
    { id: 'M2', round: 1, orden: 2, a: 3,  b: 4,  next: 'M7', nextSide: 2 },
    { id: 'M3', round: 1, orden: 3, a: 5,  b: 6,  next: 'M8', nextSide: 1 },
    { id: 'M4', round: 1, orden: 4, a: 7,  b: 8,  next: 'M8', nextSide: 2 },
    { id: 'M5', round: 1, orden: 5, a: 9,  b: 10, next: 'M9', nextSide: 2 },
    // 11 “libre” entra al QF3 como rival de W(M5)
    { id: 'M6', round: 1, orden: 6, a: 11, b: null, next: null, nextSide: null }, // placeholder (no se inserta partido real)

    { id: 'M7', round: 2, orden: 1, a: 'W:M1', b: 'W:M2', next: 'M10', nextSide: 1 },
    { id: 'M8', round: 2, orden: 2, a: 'W:M3', b: 'W:M4', next: 'M10', nextSide: 2 },
    { id: 'M9', round: 2, orden: 3, a: 'W:M5', b: 11,       next: 'M11', nextSide: 2 },

    { id: 'M10', round: 3, orden: 1, a: 'W:M7', b: 'W:M8', next: 'M11', nextSide: 1 }, // SF1
    { id: 'M11', round: 4, orden: 1, a: 'W:M10', b: 'W:M9' }                           // Final
  ];

  return T[n] || null;
}
