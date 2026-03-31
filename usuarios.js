import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
const router = express.Router();

router.get('/', requireAuth, requireRole('admin'), async (_req, res) => {
  const { rows } = await pool.query('SELECT id, usuario, rol FROM usuarios ORDER BY id');
  res.json(rows);
});

router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const { usuario, clave, rol } = req.body;
  if (!usuario || !clave || !rol) return res.status(400).json({ error: 'usuario, clave y rol requeridos' });
  if (!['admin','arbitro','visor'].includes(rol)) return res.status(400).json({ error: 'rol inválido' });
  const hash = await bcrypt.hash(clave, 10);
  try {
    await pool.query('INSERT INTO usuarios (usuario, clave_hash, rol) VALUES ($1,$2,$3)', [usuario, hash, rol]);
    res.json({ message: 'Usuario creado' });
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ error: 'Usuario ya existe' });
    res.status(500).json({ error: 'Error creando usuario' });
  }
});

export default router;
