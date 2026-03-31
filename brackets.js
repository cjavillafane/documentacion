// backend/routes/brackets.js
import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { getTemplateByCount } from '../bracket_templates.js';
import { requireOlimpiada } from '../middleware/olimpiada.js';

const router = Router();



// ====== reemplazar TODA esta función en backend/routes/brackets.js ======
/* async function createBracketFromTemplate({ client, disciplina_id, nombre, equipoIds }) {
  const { rows: br } = await client.query(
    `INSERT INTO public.brackets (disciplina_id, nombre, creado_en)
     VALUES ($1,$2,NOW()) RETURNING id`,
    [disciplina_id, nombre]
  );
  const bracketId = br[0].id;

  const n = equipoIds.length;
  const ids = equipoIds.slice();

  const mk = async (round, orden, equipo1_id, equipo2_id, next_match_id = null) => {
    const { rows } = await client.query(
      `INSERT INTO public.partidos
         (bracket_id, disciplina_id, round, orden, equipo1_id, equipo2_id, estado, next_match_id)
       VALUES ($1,$2,$3,$4,$5,$6,'pendiente',$7)
       RETURNING id`,
      [bracketId, disciplina_id, round, orden, equipo1_id || null, equipo2_id || null, next_match_id]
    );
    return rows[0].id;
  };

  const makeRound = async (round, pares) => {
    const current = [];
    for (let i = 0; i < pares.length; i++) {
      const [a, b] = pares[i];
      if (a == null && b == null) continue;
      const idp = await mk(round, i + 1, a, b, null);
      current.push({ id: idp, round, orden: i + 1, a, b });
    }
    return current;
  };

  function firstRoundPairs(list) {
    if (list.length === 3) {
      return { pairs: [[list[0], list[1]]], byes: [list[2]] };
    }
    if (list.length === 4) {
      return { pairs: [[list[0], list[1]], [list[2], list[3]]], byes: [] };
    }
    if (list.length === 5) {
      return { pairs: [[list[0], list[1]], [list[2], list[3]]], byes: [list[4]] };
    }
    const pow2 = 1 << Math.ceil(Math.log2(list.length));
    const byesN = pow2 - list.length;
    const all = list.concat(Array(byesN).fill(null));
    const pairs = [];
    for (let i = 0; i < all.length; i += 2) {
      const a = all[i];
      const b = all[i + 1] ?? null;
      if (a == null && b == null) continue;
      pairs.push([a, b]);
    }
    return { pairs, byes: [] };
  }

  const chainNext = async (prevRound, roundNum) => {
    const next = [];
    for (let i = 0; i < Math.ceil(prevRound.length / 2); i++) {
      const nextId = await mk(roundNum, i + 1, null, null, null);
      next.push({ id: nextId, round: roundNum, orden: i + 1 });
    }
    for (let i = 0; i < prevRound.length; i++) {
      const bucket = Math.floor(i / 2);
      const side   = (i % 2 === 0) ? 'left' : 'right';
      const child  = prevRound[i];
      const target = next[bucket];

      await client.query(
        `UPDATE public.partidos SET next_match_id=$1 WHERE id=$2`,
        [target.id, child.id]
      );

      const hadBye = (child.a == null) ^ (child.b == null);
      if (hadBye) {
        const adv = (child.a != null) ? child.a : child.b;
        const col = (side === 'left') ? 'equipo1_id' : 'equipo2_id';
        await client.query(
          `UPDATE public.partidos SET ${col} = COALESCE(${col}, $1) WHERE id=$2`,
          [adv, target.id]
        );
      }
    }
    return next;
  };

  const { pairs, byes } = firstRoundPairs(ids);
  const r1 = await makeRound(1, pairs);

  if (n === 3) {
    // R2 final: ganador(1–2) vs bye
    const finalId = await mk(2, 1, null, byes[0], null);
    await client.query(`UPDATE public.partidos SET next_match_id=$1 WHERE id=$2`, [finalId, r1[0].id]);
    return bracketId;
  }

  if (n === 5) {
    // R3 final y R2 semi: (ganador(3–4) vs 5). Ganador(1–2) va directo a final
    const finalId = await mk(3, 1, null, null, null);
    const semiId  = await mk(2, 1, null, byes[0], finalId);
    await client.query(`UPDATE public.partidos SET next_match_id=$1 WHERE id=$2`, [finalId, r1[0].id]); // (1–2) -> final
    await client.query(`UPDATE public.partidos SET next_match_id=$1 WHERE id=$2`, [semiId,  r1[1].id]); // (3–4) -> semi
    return bracketId;
  }

  // ===== FIX ESPECÍFICO: 6 equipos (R1 tiene 3 partidos) =====
  if (r1.length === 3) {
    // R3 final
    const finalId = await mk(3, 1, null, null, null);
    // R2 una sola semi (entre los dos primeros matches)
    const semiId  = await mk(2, 1, null, null, finalId);

    // (1–2) -> semi
    await client.query(`UPDATE public.partidos SET next_match_id=$1 WHERE id=$2`, [semiId, r1[0].id]);
    // (3–4) -> semi
    await client.query(`UPDATE public.partidos SET next_match_id=$1 WHERE id=$2`, [semiId, r1[1].id]);
    // (5–6) -> final directo
    await client.query(`UPDATE public.partidos SET next_match_id=$1 WHERE id=$2`, [finalId, r1[2].id]);

    return bracketId;
  }

  // General (≥7 y potencia de 2 completa)
  let prev = r1;
  let round = 2;
  while (prev.length > 1) {
    prev = await chainNext(prev, round++);
  }

  return bracketId;
} */

async function createBracketFromTemplate({ client, disciplina_id, nombre, equipoIds }) {
  const tpl = getTemplateByCount(equipoIds.length);

  if (!tpl) {
    // Si no hay plantilla definida para esa N, usa tu versión anterior (opcional).
    // return createBracketLegacy({ client, disciplina_id, nombre, equipoIds });
    throw new Error('No hay plantilla para esa cantidad de equipos');
  }

  // 1) Crear bracket
  const { rows: br } = await client.query(
    `INSERT INTO public.brackets (disciplina_id, nombre, creado_en)
     VALUES ($1,$2,NOW()) RETURNING id`,
    [disciplina_id, nombre || 'Llave']
  );
  const bracketId = br[0].id;

  // 2) Insertar TODOS los partidos según round/orden; mapear ids locales → DB
  const idMap = new Map(); // 'M1' -> partido.id
  for (const m of tpl) {
    const aId = (typeof m.a === 'number') ? equipoIds[m.a - 1] : null;
    const bId = (typeof m.b === 'number') ? equipoIds[m.b - 1] : null;

    const { rows: pr } = await client.query(
      `INSERT INTO public.partidos
         (bracket_id, disciplina_id, round, orden, equipo1_id, equipo2_id, estado, next_match_id, next_match_side)
       VALUES ($1,$2,$3,$4,$5,$6,'pendiente',NULL,NULL)
       RETURNING id`,
      [bracketId, disciplina_id, m.round, m.orden, aId, bId]
    );
    idMap.set(m.id, pr[0].id);
  }

  // 3) Enlazar next + side
  for (const m of tpl) {
    if (!m.next) continue;
    await client.query(
      `UPDATE public.partidos
          SET next_match_id=$1,
              next_match_side=$2
        WHERE id=$3`,
      [ idMap.get(m.next), m.nextSide ?? 1, idMap.get(m.id) ]
    );
  }

  return bracketId;
}


/* ------------------------------------------------------------------
   RUTAS
------------------------------------------------------------------- */


router.post('/generate', requireAuth, async (req, res) => {
  const { disciplina_id, nombre, equipo_ids_en_orden } = req.body || {};
  if (!disciplina_id || !Array.isArray(equipo_ids_en_orden) || equipo_ids_en_orden.length < 3) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  try {
    // 1) Traer nombre de la disciplina
    const { rows: dRows } = await pool.query(
      'SELECT id, nombre FROM public.disciplinas WHERE id = $1 LIMIT 1',
      [disciplina_id]
    );
    if (!dRows.length) return res.status(404).json({ error: 'Disciplina no encontrada' });

    const discName = (dRows[0].nombre || '').trim();

    // 2) Disciplinas que van por PODIO MANUAL (sin llaves)
    const MANUAL_PODIUM = new Set([
      'Atletismo Femenino 100m',
      'Atletismo Femenino 400m',
      'Atletismo Masculino 100m',
      'Atletismo Masculino 400m',
      'Pesca',
      'Loba Masculino',
      'Loba Femenino',
    ]);

    if (MANUAL_PODIUM.has(discName)) {
      // Listado de equipos asignados a la disciplina (para poblar los 3 selects)
      const { rows: eqRows } = await pool.query(
        `
        SELECT e.id, e.nombre, e.sucursal
          FROM public.equipos e
          JOIN public.equipos_disciplinas ed ON ed.equipo_id = e.id
         WHERE ed.disciplina_id = $1
         ORDER BY e.nombre
        `,
        [disciplina_id]
      );

      // 409 a propósito: conflicto porque NO se generan llaves
      return res.status(409).json({
        error: 'Esta disciplina se define por podio manual (sin llaves).',
        manual_podium: true,
        disciplina: discName,
        disciplina_id,
        equipos: eqRows,
      });
    }

    // 3) Flujo normal: generar llaves
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Validar que todos los equipos estén realmente asignados a la disciplina
      const { rows: asign } = await client.query(
        `
        SELECT equipo_id
          FROM public.equipos_disciplinas
         WHERE disciplina_id = $1
           AND equipo_id = ANY($2::int[])
        `,
        [disciplina_id, equipo_ids_en_orden]
      );

      const okIds = new Set(asign.map(r => r.equipo_id));
      const notAssigned = equipo_ids_en_orden.filter(id => !okIds.has(id));
      if (notAssigned.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'Equipos no asignados a la disciplina',
          detalle: { notAssigned },
        });
      }

      // Crear bracket con tu helper existente
      const bracket_id = await createBracketFromTemplate({
        client,
        disciplina_id,
        nombre: nombre || 'Llave',
        equipoIds: equipo_ids_en_orden,
      });

      await client.query('COMMIT');
      return res.json({ bracket_id });
    } catch (e) {
      try { await client.query('ROLLBACK'); } catch {}
      console.error('POST /brackets/generate (tx) error:', e);
      return res.status(500).json({ error: 'Error generando bracket' });
    } finally {
      // @ts-ignore
      if (client) client.release();
    }
  } catch (e) {
    console.error('POST /brackets/generate error:', e);
    return res.status(500).json({ error: 'Error generando bracket' });
  }
});




// Programar una ronda (igual que antes)
router.post('/schedule', requireAuth, async (req, res) => {
  const { bracket_id, round, start_datetime, interval_minutes } = req.body || {};
  if (!bracket_id || !round || !start_datetime || !interval_minutes) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }
  try {
    const { rows } = await pool.query(
      `SELECT id FROM public.partidos
        WHERE bracket_id=$1 AND round=$2
        ORDER BY orden`,
      [bracket_id, round]
    );
    let t = new Date(start_datetime);
    for (const r of rows) {
      await pool.query(
        `UPDATE public.partidos SET fecha=$1 WHERE id=$2`,
        [t.toISOString(), r.id]
      );
      t = new Date(t.getTime() + interval_minutes * 60000);
    }
    res.json({ ok: true, count: rows.length });
  } catch (e) {
    console.error('POST /brackets/schedule', e);
    res.status(500).json({ error: 'Error programando ronda' });
  }
});

// Rondas de un bracket
router.get('/:id/rounds', requireAuth, async (req, res) => {
  const id = Number(req.params.id || 0);
  if (!id) return res.json({});
  try {
    /* const { rows } = await pool.query(
      `SELECT p.id, p.round, p.orden, p.fecha, p.estado,
              p.equipo1_id, p.equipo2_id,
              r.puntaje_equipo1 AS s1, r.puntaje_equipo2 AS s2,
              p.parcial_equipo1, p.parcial_equipo2,
              e1.nombre AS n1, e2.nombre AS n2,
              p.next_match_id
       FROM public.partidos p
       LEFT JOIN public.resultados r ON r.partido_id = p.id
       LEFT JOIN public.equipos e1 ON e1.id = p.equipo1_id
       LEFT JOIN public.equipos e2 ON e2.id = p.equipo2_id
       WHERE p.bracket_id = $1
       ORDER BY p.round, p.orden`,
      [id]
    ); */
    const { rows } = await pool.query(
  `SELECT p.id, p.round, p.orden, p.fecha, p.estado,
          p.equipo1_id, p.equipo2_id,
          r.puntaje_equipo1 AS s1, r.puntaje_equipo2 AS s2,
          p.parcial_equipo1, p.parcial_equipo2,
          /* ==== NUEVO: penales ==== */
          p.pen_parcial1, p.pen_parcial2,
          r.penales_equipo1, r.penales_equipo2, r.definido_por_penales,
          /* ========================= */
          e1.nombre AS n1, e2.nombre AS n2,
          p.next_match_id
     FROM public.partidos p
     LEFT JOIN public.resultados r ON r.partido_id = p.id
     LEFT JOIN public.equipos e1 ON e1.id = p.equipo1_id
     LEFT JOIN public.equipos e2 ON e2.id = p.equipo2_id
    WHERE p.bracket_id = $1
    ORDER BY p.round, p.orden`,
  [id]
  );

    const out = {};
    for (const m of rows) {
      if (!out[m.round]) out[m.round] = [];
      out[m.round].push(m);
    }
    res.json(out);
  } catch (e) {
    console.error('GET /brackets/:id/rounds', e);
    res.status(500).json({ error: 'Error leyendo rounds' });
  }
});

// Último bracket por disciplina (para el visor)
router.get('/byDisciplina/:disciplinaId', requireAuth, async (req, res) => {
  const disciplinaId = Number(req.params.disciplinaId || 0);
  if (!disciplinaId) return res.json({ bracket_id: null, rounds: {} });
  try {
    const { rows: br } = await pool.query(
      `SELECT id FROM public.brackets
       WHERE disciplina_id=$1
       ORDER BY id DESC
       LIMIT 1`,
      [disciplinaId]
    );
    if (!br.length) return res.json({ bracket_id: null, rounds: {} });

    const bracketId = br[0].id;
    /* const { rows } = await pool.query(
      `SELECT p.id, p.round, p.orden, p.fecha, p.estado,
              p.equipo1_id, p.equipo2_id,
              r.puntaje_equipo1 AS s1, r.puntaje_equipo2 AS s2,
              p.parcial_equipo1, p.parcial_equipo2,
              e1.nombre AS n1, e2.nombre AS n2,
              p.next_match_id
       FROM public.partidos p
       LEFT JOIN public.resultados r ON r.partido_id = p.id
       LEFT JOIN public.equipos e1 ON e1.id = p.equipo1_id
       LEFT JOIN public.equipos e2 ON e2.id = p.equipo2_id
       WHERE p.bracket_id = $1
       ORDER BY p.round, p.orden`,
      [bracketId]
    ); */
    const { rows } = await pool.query(
  `SELECT p.id, p.round, p.orden, p.fecha, p.estado,
          p.equipo1_id, p.equipo2_id,
          r.puntaje_equipo1 AS s1, r.puntaje_equipo2 AS s2,
          p.parcial_equipo1, p.parcial_equipo2,
          /* ==== NUEVO: penales ==== */
          p.pen_parcial1, p.pen_parcial2,
          r.penales_equipo1, r.penales_equipo2, r.definido_por_penales,
          /* ========================= */
          e1.nombre AS n1, e2.nombre AS n2,
          p.next_match_id
     FROM public.partidos p
     LEFT JOIN public.resultados r ON r.partido_id = p.id
     LEFT JOIN public.equipos e1 ON e1.id = p.equipo1_id
     LEFT JOIN public.equipos e2 ON e2.id = p.equipo2_id
    WHERE p.bracket_id = $1
    ORDER BY p.round, p.orden`,
  [bracketId]
  );

    const rounds = {};
    for (const m of rows) {
      if (!rounds[m.round]) rounds[m.round] = [];
      rounds[m.round].push(m);
    }
    res.json({ bracket_id: bracketId, rounds });
  } catch (e) {
    console.error('GET /brackets/byDisciplina/:id', e);
    res.status(500).json({ error: 'Error buscando bracket por disciplina' });
  }
});

router.get('/api/brackets', requireAuth, requireOlimpiada, async (req,res)=>{
  const { olimpiada_id } = req;
  const rows = await db.any(
    'SELECT * FROM brackets WHERE olimpiada_id=$1 ORDER BY id DESC',
    [olimpiada_id]
  );
  res.json(rows);
});

router.post('/api/brackets/generate', requireAuth, requireOlimpiada, async (req,res)=>{
  const { olimpiada_id } = req;
  const { disciplina_id, nombre, equipo_ids_en_orden } = req.body;
  // ... generar todo igual que antes, pero guardando olimpiada_id
  const br = await db.one(
    'INSERT INTO brackets (nombre, disciplina_id, olimpiada_id) VALUES ($1,$2,$3) RETURNING id',
    [nombre, disciplina_id, olimpiada_id]
  );
  // al crear partidos:
  // INSERT INTO partidos (..., olimpiada_id) VALUES (..., $olimpiada_id)
  res.json({ bracket_id: br.id });
});

// GET provincias
router.get('/api/provincias', requireAuth, async (req,res)=>{
  const rows = await db.any('SELECT id, nombre FROM provincias ORDER BY nombre');
  res.json(rows);
});

// CRUD ediciones
router.get('/api/olimpiadas', requireAuth, async (req,res)=>{
  const rows = await db.any(`
    SELECT o.id, o.anio, o.nombre, p.nombre AS sede
    FROM olimpiadas o
    LEFT JOIN provincias p ON p.id = o.sede_provincia_id
    ORDER BY o.anio DESC, o.id DESC
  `);
  res.json(rows);
});

router.post('/api/olimpiadas', requireAuth, async (req,res)=>{
  const { anio, sede_provincia_id, nombre, fecha_inicio, fecha_fin } = req.body;
  const row = await db.one(`
    INSERT INTO olimpiadas (anio, sede_provincia_id, nombre, fecha_inicio, fecha_fin)
    VALUES ($1,$2,$3,$4,$5) RETURNING *
  `,[anio, sede_provincia_id || null, nombre || null, fecha_inicio || null, fecha_fin || null]);
  res.json(row);
});

export default router;
