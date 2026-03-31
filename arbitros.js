// routes/arbitros.js
router.get('/contexto', auth, async (req, res) => {
  if (req.user.role !== 'arbitro') {
    return res.status(403).json({ error: 'Solo árbitros' });
  }

  const row = await db.query(`
    SELECT o.id AS olimpiada_id
    FROM olimpiadas o
    WHERE o.activa = true
    ORDER BY o.id DESC
    LIMIT 1
  `);

  if (!row.rows.length) {
    return res.json({ olimpiada_id: null, disciplinas: [] });
  }

  const oid = row.rows[0].olimpiada_id;

  const dis = await db.query(`
    SELECT disciplina_id
    FROM arbitros_disciplinas
    WHERE usuario_id = $1 AND olimpiada_id = $2
  `, [req.user.id, oid]);

  res.json({
    olimpiada_id: oid,
    disciplinas: dis.rows.map(r => r.disciplina_id)
  });
});
