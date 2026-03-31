// backend/routes/medallero.js
import express from 'express';
import pool from '../db.js';
const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      WITH finales AS (
        SELECT p.*
        FROM partidos p
        JOIN (
          SELECT bracket_id, MAX(round) AS maxr
          FROM partidos
          WHERE bracket_id IS NOT NULL
          GROUP BY bracket_id
        ) mx ON mx.bracket_id = p.bracket_id AND p.round = mx.maxr
        WHERE p.estado = 'finalizado'
      ),
      conv AS (
        SELECT r.ganador_id AS equipo_id, 3 AS puntos
        FROM resultados r
        WHERE r.partido_id IN (SELECT id FROM finales)
        UNION ALL
        SELECT CASE WHEN r.ganador_id = p.equipo1_id THEN p.equipo2_id ELSE p.equipo1_id END AS equipo_id, 1 AS puntos
        FROM resultados r
        JOIN finales p ON p.id = r.partido_id
      )
      SELECT e.sucursal, SUM(puntos) AS puntos
      FROM conv c
      JOIN equipos e ON e.id = c.equipo_id
      GROUP BY e.sucursal
      ORDER BY puntos DESC, e.sucursal ASC
    `);
    res.json(rows);
  } catch (e) {
    console.error('GET /medallero', e);
    res.status(500).json({ error: 'Error medallero' });
  }
});

export default router;
