// backend/routes/disciplinas.js
import express from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/disciplinas
 * Devuelve todas las disciplinas (id, nombre) ordenadas por nombre.
 * No requiere auth para que el admin.html pueda levantar siempre.
 */
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nombre FROM disciplinas ORDER BY nombre'
    );
    return res.json(rows);
  } catch (e) {
    console.error('GET /disciplinas ERROR:', e);
    // Nunca romper el front: devolvemos lista vacía si algo sale mal
    return res.status(200).json([]);
  }
});

// ====== NUEVO: devolver el último bracket de una disciplina con sus rounds ======
router.get('/byDisciplina/:id', requireAuth, async (req, res) => {
  try {
    const disciplinaId = Number(req.params.id || 0);
    if (!disciplinaId) return res.status(400).json({ error: 'disciplina_id inválido' });

    // último bracket de esa disciplina (si prefieres por fecha, cambia ORDER BY)
    const { rows: bRows } = await pool.query(
      `SELECT id
         FROM public.brackets
        WHERE disciplina_id = $1
        ORDER BY id DESC
        LIMIT 1`,
      [disciplinaId]
    );
    if (bRows.length === 0) return res.status(404).json({ error: 'Sin bracket para esta disciplina' });

    const bracketId = bRows[0].id;

    // mismos datos que usas para pintar el árbol
    const { rows: mRows } = await pool.query(`
      SELECT
        p.id, p.bracket_id, p.disciplina_id, p.round, p.orden,
        p.equipo1_id, p.equipo2_id, p.next_match_id,
        p.estado, p.fecha,
        p.parcial_equipo1, p.parcial_equipo2,
        e1.nombre AS n1, e2.nombre AS n2,
        r.puntaje_equipo1 AS s1, r.puntaje_equipo2 AS s2
      FROM public.partidos p
      LEFT JOIN public.equipos e1 ON e1.id = p.equipo1_id
      LEFT JOIN public.equipos e2 ON e2.id = p.equipo2_id
      LEFT JOIN public.resultados r ON r.partido_id = p.id
      WHERE p.bracket_id = $1
      ORDER BY p.round, p.orden, p.id
    `, [bracketId]);

    // agrupar por ronda como espera el frontend
    const rounds = {};
    for (const m of mRows) {
      if (!rounds[m.round]) rounds[m.round] = [];
      rounds[m.round].push(m);
    }

    res.json({ bracket_id: bracketId, rounds });
  } catch (err) {
    console.error('GET /api/brackets/byDisciplina/:id error:', err);
    res.status(500).json({ error: 'Error cargando bracket por disciplina' });
  }
});

export default router;
