// backend/routes/finales.js
import express from 'express';
import pool from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
const router = express.Router();

router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  const { disciplina_id } = req.query;
  const params = [];
  const filter = disciplina_id ? ' AND b.disciplina_id = $1 ' : '';
  if (disciplina_id) params.push(disciplina_id);

  try {
    const { rows } = await pool.query(
      `WITH finales AS (
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
       ult AS (
         SELECT r.*, row_number() OVER (PARTITION BY r.partido_id ORDER BY r.id DESC) rn
         FROM resultados r
       )
       SELECT f.id AS partido_id, b.id AS bracket_id, b.nombre AS bracket_nombre,
              d.id AS disciplina_id, d.nombre AS disciplina,
              e1.nombre AS equipo1, e2.nombre AS equipo2,
              u.ganador_id,
              CASE WHEN u.ganador_id = e1.id THEN e1.nombre ELSE e2.nombre END AS campeon,
              CASE WHEN u.ganador_id = e1.id THEN e2.nombre ELSE e1.nombre END AS subcampeon,
              u.puntaje_equipo1, u.puntaje_equipo2, f.fecha
       FROM finales f
       JOIN ult u ON u.partido_id = f.id AND u.rn = 1
       JOIN brackets b ON b.id = f.bracket_id
       JOIN disciplinas d ON d.id = b.disciplina_id
       LEFT JOIN equipos e1 ON e1.id = f.equipo1_id
       LEFT JOIN equipos e2 ON e2.id = f.equipo2_id
       WHERE 1=1 ${filter}
       ORDER BY f.fecha DESC NULLS LAST, f.id DESC`,
       params
    );
    res.json(rows);
  } catch (e) {
    console.error('GET /finales', e);
    res.status(500).json({ error: 'Error listando finales' });
  }
});

export default router;
