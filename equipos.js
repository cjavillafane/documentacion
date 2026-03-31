// backend/routes/equipos.js
import express from 'express';
import pool from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/equipos
 *  - sin query: devuelve todos los equipos
 *  - ?disciplina_id=ID: devuelve los equipos asignados a esa disciplina
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const q = (req.query.disciplina_id ?? '').toString().trim();
    const discId = q === '' ? null : Number(q);

    if (discId && Number.isInteger(discId)) {
      // Equipos asignados a la disciplina
      const { rows } = await pool.query(
        `SELECT e.id, e.nombre, e.sucursal
           FROM equipos e
           JOIN equipos_disciplinas ed ON ed.equipo_id = e.id
          WHERE ed.disciplina_id = $1
          ORDER BY e.nombre`,
        [discId]
      );
      return res.json(rows);
    }

    // Todos los equipos (sin filtrar)
    const { rows } = await pool.query(
      `SELECT id, nombre, sucursal
         FROM equipos
         ORDER BY nombre`
    );
    return res.json(rows);
  } catch (e) {
    console.error('GET /equipos ERROR:', e);
    // Devolvemos [] para no romper el front si hay datos “raros”
    return res.status(200).json([]);
  }
});

/**
 * GET /api/equipos/asignados?disciplina_id=ID
 * Devuelve [1,2,3] con los IDs asignados
 */
router.get('/asignados', requireAuth, async (req, res) => {
  try {
    const discId = Number(req.query.disciplina_id);
    if (!Number.isInteger(discId)) return res.json([]);

    const { rows } = await pool.query(
      `SELECT equipo_id FROM equipos_disciplinas WHERE disciplina_id=$1 ORDER BY equipo_id`,
      [discId]
    );
    return res.json(rows.map(r => r.equipo_id));
  } catch (e) {
    console.error('GET /equipos/asignados ERROR:', e);
    return res.json([]);
  }
});

/**
 * POST /api/equipos/asignar { equipo_id, disciplina_id }
 * Asigna si no existía (idempotente)
 */
router.post('/asignar', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { equipo_id, disciplina_id } = req.body || {};
    const eid = Number(equipo_id);
    const did = Number(disciplina_id);
    if (!Number.isInteger(eid) || !Number.isInteger(did)) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    // Validamos existencia (opcional, pero ayuda a evitar 500)
    const chk = await pool.query(
      'SELECT 1 FROM equipos WHERE id=$1', [eid]
    );
    const chk2 = await pool.query(
      'SELECT 1 FROM disciplinas WHERE id=$1', [did]
    );
    if (!chk.rowCount || !chk2.rowCount) {
      return res.status(400).json({ error: 'Equipo o disciplina inexistente' });
    }

    await pool.query(
      `INSERT INTO equipos_disciplinas (equipo_id, disciplina_id)
       VALUES ($1, $2)
       ON CONFLICT (equipo_id, disciplina_id) DO NOTHING`,
      [eid, did]
    );
    return res.json({ ok: true });
  } catch (e) {
    console.error('POST /equipos/asignar ERROR:', e);
    return res.status(500).json({ error: 'Error asignando' });
  }
});

/**
 * DELETE /api/equipos/asignar { equipo_id, disciplina_id }
 * Quita la asignación
 */
router.delete('/asignar', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { equipo_id, disciplina_id } = req.body || {};
    const eid = Number(equipo_id);
    const did = Number(disciplina_id);
    if (!Number.isInteger(eid) || !Number.isInteger(did)) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }
    await pool.query(
      'DELETE FROM equipos_disciplinas WHERE equipo_id=$1 AND disciplina_id=$2',
      [eid, did]
    );
    return res.json({ ok: true });
  } catch (e) {
    console.error('DELETE /equipos/asignar ERROR:', e);
    return res.status(500).json({ error: 'Error desasignando' });
  }
});

export default router;
