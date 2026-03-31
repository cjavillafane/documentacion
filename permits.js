// src/permits.js
import pool from '../db.js';

/**
 * Devuelve true si:
 *   - el usuario es admin, o
 *   - el usuario tiene permiso (usuario_permisos) para esa disciplina en esa edición
 */
export async function canEditDisciplina(user, olimpiadaId, disciplinaId) {
  if (!user) return false;
  if (user.rol === 'admin') return true;

  const { rows } = await pool.query(
    `SELECT 1
       FROM usuario_permisos
      WHERE usuario_id   = $1
        AND olimpiada_id = $2
        AND disciplina_id= $3
      LIMIT 1`,
    [user.id, Number(olimpiadaId), Number(disciplinaId)]
  );
  return rows.length > 0;
}
