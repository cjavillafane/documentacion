// backend/routes/olimpiadas.js
import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/* ========= Provincias (para combo) ========= */
router.get('/provincias', requireAuth, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nombre FROM provincias ORDER BY nombre'
    );
    res.json(rows);
  } catch (e) {
    console.error('GET /api/olimpiadas/provincias', e);
    res.status(500).json({ error: 'Error cargando provincias' });
  }
});

/* ========= Listar ediciones ========= */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { anio, provincia_id } = req.query;
    const conds = [];
    const params = [];

    if (anio) {
      params.push(Number(anio));
      conds.push(`o.anio = $${params.length}`);
    }
    if (provincia_id) {
      params.push(Number(provincia_id));
      conds.push(`o.sede_provincia_id = $${params.length}`);
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `
      SELECT
        o.id,
        o.anio,
        o.nombre,
        o.sede_provincia_id AS provincia_id,
        p.nombre AS provincia,
        o.fecha_inicio,
        o.fecha_fin,
        o.estado
      FROM olimpiadas o
      LEFT JOIN provincias p ON p.id = o.sede_provincia_id
      ${where}
      ORDER BY o.anio DESC, o.id DESC
      `,
      params
    );
    res.json(rows);
  } catch (e) {
    console.error('GET /api/olimpiadas', e);
    res.status(500).json({ error: 'Error listando olimpiadas' });
  }
});

/* ========= Crear nueva edición ========= */
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      anio,
      nombre,          // opcional
      provincia_id,    // requerido
      fecha_inicio = null,
      fecha_fin = null,
    } = req.body || {};

    if (!anio || !provincia_id) {
      return res.status(400).json({ error: 'Faltan datos (anio, provincia_id)' });
    }

    const nombreFinal = String(nombre?.trim() || `Olimpiadas ${anio}`);

    const { rows } = await pool.query(
      `
      INSERT INTO olimpiadas (anio, nombre, sede_provincia_id, fecha_inicio, fecha_fin, estado)
      VALUES ($1, $2, $3, $4, $5, 'abierta')
      RETURNING id, anio, nombre, sede_provincia_id AS provincia_id, estado
      `,
      [Number(anio), nombreFinal, Number(provincia_id), fecha_inicio, fecha_fin]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error('POST /api/olimpiadas', e);
    res.status(500).json({ error: 'Error creando olimpiada' });
  }
});

/* ========= Actualizar edición (opcional) ========= */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { nombre, provincia_id, fecha_inicio, fecha_fin, estado } = req.body || {};
    if (!id) return res.status(400).json({ error: 'ID inválido' });

    const { rows } = await pool.query(
      `
      UPDATE olimpiadas
         SET nombre = COALESCE($2, nombre),
             sede_provincia_id = COALESCE($3, sede_provincia_id),
             fecha_inicio = COALESCE($4, fecha_inicio),
             fecha_fin = COALESCE($5, fecha_fin),
             estado = COALESCE($6, estado)
       WHERE id = $1
      RETURNING id, anio, nombre, sede_provincia_id AS provincia_id, estado
      `,
      [id, nombre ?? null, provincia_id ?? null, fecha_inicio ?? null, fecha_fin ?? null, estado ?? null]
    );
    res.json(rows[0] || {});
  } catch (e) {
    console.error('PUT /api/olimpiadas/:id', e);
    res.status(500).json({ error: 'Error actualizando olimpiada' });
  }
});

export default router;
