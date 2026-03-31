import pool from '../db.js';

export async function requireOlimpiada(req, res, next) {
  const p = req.path;

  const isOpen =
    p.startsWith('/auth') ||
    p.startsWith('/api/olimpiadas') ||
    p === '/api/provincias' ||
    p === '/favicon.ico' ||
    p.startsWith('/socket.io/') ||
    p.startsWith('/static') ||
    p.startsWith('/assets');

  if (isOpen) return next();

  const oid = req.get('X-Olimpiada-Id');
  if (!oid) return res.status(400).json({ error: 'Falta olimpiada_id' });

  try {
    const { rows } = await pool.query(
      'SELECT id, anio, nombre FROM olimpiadas WHERE id = $1',
      [Number(oid)]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Olimpiada inválida' });
    }

    // 🔴 ESTA LÍNEA ES LA CLAVE
    req.olimpiada = rows[0];

    return next();
  } catch (e) {
    console.error('requireOlimpiada', e);
    return res.status(500).json({ error: 'Error validando olimpiada' });
  }
}
