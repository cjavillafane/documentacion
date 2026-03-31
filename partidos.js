// /backend/routes/partidos.js
import express from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/* helpers */
async function emitir(io, evento, payload){
  try { io?.emit?.(evento, payload); } catch {}
}
function getIO(req){ return req.app.get('io'); }

/* -------------------- GUARDAR PARCIAL -------------------- */
router.post('/partidos/:id/parcial', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { parcial_equipo1 = 0, parcial_equipo2 = 0 } = req.body || {};
  try {
    const { rows } = await pool.query(
      `UPDATE partidos
         SET parcial_equipo1=$1,
             parcial_equipo2=$2,
             parcial_actualizado_en = NOW()
       WHERE id=$3
       RETURNING id, bracket_id`, [parcial_equipo1, parcial_equipo2, id]
    );
    const r = rows[0];
    await emitir(getIO(req), 'partido_updated', { partido_id: id, bracket_id: r?.bracket_id });
    res.json({ ok:true });
  } catch (e) {
    console.error('POST /partidos/:id/parcial', e);
    res.status(500).json({ error: 'Error guardando parcial' });
  }
});

/* -------------------- GUARDAR FINAL -------------------- */
router.post('/partidos/:id/final', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { puntaje_equipo1 = 0, puntaje_equipo2 = 0 } = req.body || {};
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1) Grabar en resultados (histórico)
    const { rows: pr } = await client.query(
      `SELECT p.id, p.bracket_id, p.round, p.equipo1_id, p.equipo2_id, p.next_match_id, p.next_match_side, p.disciplina_id
         FROM partidos p
        WHERE p.id=$1 FOR UPDATE`, [id]
    );
    if (!pr.length) throw new Error('partido_no_existe');
    const P = pr[0];

    const g = puntaje_equipo1 === puntaje_equipo2
      ? null
      : (puntaje_equipo1 > puntaje_equipo2 ? P.equipo1_id : P.equipo2_id);

    await client.query(
      `INSERT INTO resultados (partido_id, puntaje_equipo1, puntaje_equipo2, ganador_id)
       VALUES ($1,$2,$3,$4)`,
      [id, puntaje_equipo1, puntaje_equipo2, g]
    );

    // 2) Marcar el partido como finalizado
    await client.query(`UPDATE partidos SET estado='finalizado' WHERE id=$1`, [id]);

    // 3) Avanzar a siguiente partido si corresponde
    if (P.next_match_id && g){
      const sideCol = (P.next_match_side === 1) ? 'equipo1_id' : 'equipo2_id';
      await client.query(`UPDATE partidos SET ${sideCol}=$1 WHERE id=$2`, [g, P.next_match_id]);
    }

    // 4) Si no hay siguiente partido, es la final: sumar al medallero
    if (!P.next_match_id && g){
      // campeón = g, subcampeón = el otro (si hubo dos equipos)
      const sub = (g === P.equipo1_id) ? P.equipo2_id : P.equipo1_id;
      // sumar puntos: campeón 3, subcampeón 1
      // asumimos que "equipos" tiene "sucursal"; si tu esquema usa otra tabla para puntos, adaptá aquí
      await client.query(
        `INSERT INTO medallero(sucursal, puntos)
           SELECT e.nombre, 3 FROM equipos e WHERE e.id=$1
         ON CONFLICT (sucursal) DO UPDATE SET puntos=medallero.puntos+3`, [g]
      );
      if (sub){
        await client.query(
          `INSERT INTO medallero(sucursal, puntos)
             SELECT e.nombre, 1 FROM equipos e WHERE e.id=$1
           ON CONFLICT (sucursal) DO UPDATE SET puntos=medallero.puntos+1`, [sub]
        );
      }
      await emitir(getIO(req), 'medallero_changed', {});
    }

    await client.query('COMMIT');
    await emitir(getIO(req), 'partido_updated', { partido_id: id, bracket_id: P.bracket_id });
    res.json({ ok:true });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('POST /partidos/:id/final', e);
    res.status(500).json({ error: 'Error guardando final' });
  } finally {
    client.release();
  }
});

export default router;
