import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server as IOServer } from 'socket.io';
import dotenv from 'dotenv';

import pool from './db.js';
import authRouter from './routes/auth.js';
import bracketsRouter from './routes/brackets.js';
import { requireAuth } from './middleware/auth.js';
import olimpiadasRouter from './routes/olimpiadas.js';
import { requireOlimpiada } from './middleware/olimpiada.js';
import { canEditDisciplina } from './src/permits.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT   = process.env.PORT || 3000;
const ORIGIN = process.env.CORS_ORIGIN || '*';

const app = express();
const server = http.createServer(app);
const io = new IOServer(server, {
  cors: { origin: ORIGIN, methods: ['GET','POST','PUT','DELETE','OPTIONS'] },
  path: '/socket.io/'
});

// dejar io disponible en handlers
app.set('io', io);

// middlewares
app.use(cors({ origin: ORIGIN }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// servir frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// rutas base
app.use('/auth', authRouter);
app.use('/api/auth', authRouter);
//app.use('/api/brackets', bracketsRouter);

// Rutas públicas de ediciones/provincias (se usan antes de elegir edición)
//app.use('/api/olimpiadas', olimpiadasRouter);

// LISTAR ARBITROS
app.get('/api/arbitros', requireAuth, async (req, res) => {
  try {
    // solo admin puede ver árbitros
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Solo admin' });
    }

    const { rows } = await pool.query(`
      SELECT id, usuario
      FROM usuarios
      WHERE rol = 'arbitro'
      ORDER BY usuario
    `);

    res.json(rows);
  } catch (e) {
    console.error('GET /api/arbitros', e);
    res.status(500).json({ error: 'Error listando árbitros' });
  }
});

// A partir de acá, SOLO lo que montemos con el middleware pedirá x-olimpiada-id
app.use('/api/brackets', requireAuth, requireOlimpiada, bracketsRouter);



// ===== helpers socket =====
function emitPartidoUpdated(bracket_id){ try{ io.emit('partido_updated',{bracket_id}) }catch{} }
function emitMedalleroChanged(){ try{ io.emit('medallero_changed') }catch{} }

// ====================== Endpoints usados por admin.html ======================

// Disciplinas
app.get('/api/disciplinas', requireAuth, async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, nombre FROM disciplinas ORDER BY nombre');
    res.json(rows);
  } catch (e) {
    console.error('GET /api/disciplinas', e);
    res.status(500).json({ error: 'Error cargando disciplinas' });
  }
});

// Equipos (todos o por disciplina)
app.get('/api/equipos', requireAuth, async (req, res) => {
  try {
    const did = Number(req.query.disciplina_id || 0);
    if (did) {
      const { rows } = await pool.query(
        `SELECT e.id, e.nombre
           FROM equipos e
           JOIN equipos_disciplinas ed ON ed.equipo_id = e.id
          WHERE ed.disciplina_id = $1
          ORDER BY e.nombre`,
        [did]
      );
      return res.json(rows);
    }
    const { rows } = await pool.query('SELECT id, nombre FROM equipos ORDER BY nombre');
    res.json(rows);
  } catch (e) {
    console.error('GET /api/equipos', e);
    res.status(500).json({ error: 'Error cargando equipos' });
  }
});

// IDs asignados a una disciplina
app.get('/api/asignados', requireAuth, async (req, res) => {
  try {
    const did = Number(req.query.disciplina_id || 0);
    if (!did) return res.json([]);
    const { rows } = await pool.query(
      'SELECT equipo_id FROM equipos_disciplinas WHERE disciplina_id=$1 ORDER BY equipo_id',
      [did]
    );
    res.json(rows);
  } catch (e) {
    console.error('GET /api/asignados', e);
    res.status(500).json({ error: 'Error cargando asignaciones' });
  }
});

// Guardar asignaciones (reemplaza todas)
app.post('/api/asignar_equipos', requireAuth, async (req, res) => {
  const { disciplina_id, equipo_ids } = req.body || {};
  if (!disciplina_id || !Array.isArray(equipo_ids)) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM equipos_disciplinas WHERE disciplina_id=$1', [disciplina_id]);
    if (equipo_ids.length) {
      const values = equipo_ids.map((_, i) => `($1,$${i+2})`).join(',');
      await client.query(
        `INSERT INTO equipos_disciplinas (disciplina_id, equipo_id) VALUES ${values}`,
        [disciplina_id, ...equipo_ids]
      );
    }
    await client.query('COMMIT');
    res.json({ ok:true });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('POST /api/asignar_equipos', e);
    res.status(500).json({ error: 'Error guardando asignaciones' });
  } finally {
    client.release();
  }
});

// ====== Parcial tiempo regular
/*app.post('/api/partidos/:id/parcial', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { parcial_equipo1 = 0, parcial_equipo2 = 0 } = req.body || {};
  try {
    const { rows } = await pool.query(
      `UPDATE public.partidos
          SET parcial_equipo1=$1,
              parcial_equipo2=$2,
              parcial_actualizado_en=NOW()
        WHERE id=$3
        RETURNING bracket_id`,
      [parcial_equipo1, parcial_equipo2, id]
    );
    const bid = rows[0]?.bracket_id ?? null;
    if (bid) emitPartidoUpdated(bid);
    res.json({ ok:true });
  } catch (e) {
    console.error('POST /api/partidos/:id/parcial', e);
    res.status(500).json({ error: 'Error guardando parcial' });
  }
});*/

// ====== Parcial tiempo regular
app.post('/api/partidos/:id/parcial', requireAuth, requireOlimpiada, async (req, res) => {
  const id = Number(req.params.id);
  const { parcial_equipo1 = 0, parcial_equipo2 = 0 } = req.body || {};
  const olimpiadaId = req.olimpiada?.id;         // asumiendo que requireOlimpiada coloca esto
  const user        = req.user;                  // asumiendo que requireAuth coloca esto

  try {
    // Traigo meta del partido para validar edición y disciplina
    const { rows: meta } = await pool.query(`
      SELECT p.id, p.disciplina_id, b.olimpiada_id
        FROM public.partidos p
        JOIN public.brackets b ON b.id = p.bracket_id
       WHERE p.id = $1
       LIMIT 1
    `, [id]);
    if (!meta.length) return res.status(404).json({ error: 'Partido no encontrado' });

    const { disciplina_id, olimpiada_id } = meta[0];
    if (Number(olimpiada_id) !== Number(olimpiadaId)) {
      return res.status(403).json({ error: 'Partido no pertenece a la edición activa' });
    }

    const ok = await canEditDisciplina(user, olimpiadaId, disciplina_id);
    if (!ok) return res.status(403).json({ error: 'Sin permiso para esta disciplina' });

    // … tu update original:
    const { rows } = await pool.query(
      `UPDATE public.partidos
          SET parcial_equipo1=$1,
              parcial_equipo2=$2,
              parcial_actualizado_en=NOW()
        WHERE id=$3
        RETURNING bracket_id`,
      [parcial_equipo1, parcial_equipo2, id]
    );
    const bid = rows[0]?.bracket_id ?? null;
    if (bid) emitPartidoUpdated(bid);
    res.json({ ok:true });
  } catch (e) {
    console.error('POST /api/partidos/:id/parcial', e);
    res.status(500).json({ error: 'Error guardando parcial' });
  }
});

// ====== PENALIDADES ======
// Parcial de penales (pone estado='penales')
/*app.post('/api/partidos/:id/penales/parcial', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { p1, p2 } = req.body || {};
    const { rows } = await pool.query(
      `UPDATE public.partidos
          SET pen_parcial1=$1,
              pen_parcial2=$2,
              estado='penales'
        WHERE id=$3
        RETURNING bracket_id`,
      [p1 ?? null, p2 ?? null, id]
    );
    const bid = rows[0]?.bracket_id ?? null;
    if (bid) emitPartidoUpdated(bid);
    res.json({ ok:true });
  } catch (e) {
    console.error('POST /api/partidos/:id/penales/parcial', e);
    res.status(500).json({ error: 'Error guardando penales (parcial)' });
  }
});*/

app.post('/api/partidos/:id/penales/parcial', requireAuth, requireOlimpiada, async (req, res) => {
  try {
    const olimpiadaId = req.olimpiada.id;
    const user = req.user;
    const id = Number(req.params.id);
    const { p1, p2 } = req.body || {};

    // validar partido pertenece a edición
    const { rows: pr } = await pool.query(`
      SELECT p.disciplina_id, b.olimpiada_id
      FROM public.partidos p
      JOIN public.brackets b ON b.id = p.bracket_id
      WHERE p.id=$1
    `, [id]);

    if (!pr.length)
      return res.status(404).json({ error:'Partido no encontrado' });

    if (Number(pr[0].olimpiada_id) !== Number(olimpiadaId))
      return res.status(403).json({ error:'Partido no pertenece a la edición' });

    const permitido = await canEditDisciplina(user, olimpiadaId, pr[0].disciplina_id);
    if (!permitido)
      return res.status(403).json({ error:'Sin permiso para editar penales' });

    const { rows } = await pool.query(`
      UPDATE public.partidos
      SET pen_parcial1=$1, pen_parcial2=$2, estado='penales'
      WHERE id=$3
      RETURNING bracket_id
    `, [p1 ?? null, p2 ?? null, id]);

    const bid = rows[0]?.bracket_id || null;

    if (bid) emitPartidoUpdated(bid);

    res.json({ ok:true });

  } catch (e) {
    console.error('/api/partidos/:id/penales/parcial', e);
    res.status(500).json({ error: 'Error guardando penales (parcial)' });
  }
});



// Final de penales (define ganador y avanza)
// Final por penales: define ganador, NO pisa al rival ya cargado y avanza con tolerancia de side

// --- Helper común para avanzar sin pisar al ya cargado ---
async function placeWinnerSafe(client, nextMatchId, nextMatchSide, ganadorId) {
  if (!nextMatchId) return;

  const col = (Number(nextMatchSide) === 2) ? 'equipo2_id' : 'equipo1_id';
  const opp = (Number(nextMatchSide) === 2) ? 'equipo1_id' : 'equipo2_id';

  // Bloqueamos la fila del partido destino para evitar condiciones de carrera
  const { rows } = await client.query(
    `SELECT id, equipo1_id, equipo2_id
       FROM public.partidos
      WHERE id = $1
      FOR UPDATE`,
    [nextMatchId]
  );
  if (!rows.length) throw new Error('Siguiente partido no encontrado');
  const N = rows[0];

  // Si el lado "correcto" está libre, colocamos allí
  if (!N[col]) {
    await client.query(`UPDATE public.partidos SET ${col} = $1 WHERE id = $2`, [ganadorId, nextMatchId]);
  }
  // Si el lado "correcto" ya tiene otro equipo y el contrario está libre, usamos el contrario
  else if (N[col] !== ganadorId && !N[opp]) {
    await client.query(`UPDATE public.partidos SET ${opp} = $1 WHERE id = $2`, [ganadorId, nextMatchId]);
  }
  // Si ambos lados ya están ocupados, no tocamos nada (ya estaba armada la llave)

  // Si ya están ambos lados, dejamos en 'pendiente'
  await client.query(`
    UPDATE public.partidos
       SET estado = CASE
                      WHEN equipo1_id IS NOT NULL AND equipo2_id IS NOT NULL THEN 'pendiente'
                      ELSE estado
                    END
     WHERE id = $1
  `, [nextMatchId]);
}

// ====== FINAL TIEMPO REGULAR (permite NO empate; para empates usas penales) ======
// ====== FINAL TIEMPO REGULAR (sin penales aquí) ======
/*app.post('/api/partidos/:id/final', requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const partidoId = Number(req.params.id);
    const { puntaje_equipo1, puntaje_equipo2 } = req.body || {};

    // 1) Traer partido (lo mínimo necesario)
    const { rows: pRows } = await client.query(
      `SELECT id, bracket_id, disciplina_id, round, orden,
              equipo1_id, equipo2_id,
              next_match_id, next_match_side
         FROM public.partidos
        WHERE id = $1
        LIMIT 1`,
      [partidoId]
    );
    if (!pRows.length) return res.status(404).json({ error: 'Partido no encontrado' });

    const P = pRows[0];
    if (!P.equipo1_id || !P.equipo2_id) {
      return res.status(400).json({ error: 'Partido incompleto' });
    }

    // 2) Parseo de marcadores (enteros)
    const s1 = Number.isFinite(+puntaje_equipo1) ? +puntaje_equipo1 : 0;
    const s2 = Number.isFinite(+puntaje_equipo2) ? +puntaje_equipo2 : 0;
    if (s1 === s2) {
      return res.status(400).json({ error: 'El partido no puede terminar empatado' });
    }

    const ganadorId    = s1 > s2 ? P.equipo1_id : P.equipo2_id;
    const subcampeonId = s1 > s2 ? P.equipo2_id : P.equipo1_id;

    await client.query('BEGIN');

    // 3) Upsert resultado (SIN valores indeterminados)
    await client.query(
      `INSERT INTO public.resultados
         (partido_id, puntaje_equipo1, puntaje_equipo2, ganador_id,
          penales_equipo1, penales_equipo2, definido_por_penales)
       VALUES ($1, $2, $3, $4, NULL, NULL, false)
       ON CONFLICT (partido_id) DO UPDATE
         SET puntaje_equipo1 = EXCLUDED.puntaje_equipo1,
             puntaje_equipo2 = EXCLUDED.puntaje_equipo2,
             ganador_id      = EXCLUDED.ganador_id,
             penales_equipo1 = NULL,
             penales_equipo2 = NULL,
             definido_por_penales = false`,
      [partidoId, s1, s2, ganadorId]
    );

    // 4) Cerrar el partido
    await client.query(`UPDATE public.partidos SET estado='finalizado' WHERE id=$1`, [partidoId]);

    const esFinal = (P.next_match_id === null);

    if (!esFinal) {
      // 5) Avanzar ganador respetando la llave (nunca pisar al que ya está)
      const lado   = Number(P.next_match_side) === 2 ? 'equipo2_id' : 'equipo1_id';
      const opLado = Number(P.next_match_side) === 2 ? 'equipo1_id' : 'equipo2_id';

      // Bloqueo fila del siguiente partido para decidir correctamente
      const { rows: nx } = await client.query(
        `SELECT id, equipo1_id, equipo2_id
           FROM public.partidos
          WHERE id=$1
          FOR UPDATE`,
        [P.next_match_id]
      );
      if (!nx.length) throw new Error('Siguiente partido no encontrado');
      const N = nx[0];

      if (N[lado] == null) {
        // Coloco en el lado que corresponde por la llave
        await client.query(`UPDATE public.partidos SET ${lado} = $1 WHERE id = $2`, [ganadorId, N.id]);
      } else if (N[lado] !== ganadorId && N[opLado] == null) {
        // Si ese lado ya está ocupado (por el que debía), NO piso: uso el opuesto si está libre
        await client.query(`UPDATE public.partidos SET ${opLado} = $1 WHERE id = $2`, [ganadorId, N.id]);
      }
      // Si ambos lados ya tienen equipo, no hago nada (ya estaba armado)

      // Si el siguiente ya quedó con ambos equipos, ponerlo 'pendiente'
      await client.query(
        `UPDATE public.partidos
            SET estado = CASE
                           WHEN equipo1_id IS NOT NULL AND equipo2_id IS NOT NULL THEN 'pendiente'
                           ELSE estado
                         END
          WHERE id = $1`,
        [N.id]
      );

    } else {
      // 6) FINAL – medallero: 3 pts campeón, 2 pts subcampeón (sin tipos indeterminados)
      const { rows: eqRows } = await client.query(
        `SELECT id, sucursal
           FROM public.equipos
          WHERE id = ANY($1::int[])`,
        [[ganadorId, subcampeonId]]
      );
      const map = new Map(eqRows.map(r => [r.id, r.sucursal]));
      const sucGan = map.get(ganadorId)    ?? 'DESCONOCIDA';
      const sucSub = map.get(subcampeonId) ?? 'DESCONOCIDA';

      // Campeón
      await client.query(
        `INSERT INTO public.medallero
           (sucursal, puntos, disciplina_id, bracket_id, partido_final_id)
         VALUES ($1, 3, $2, $3, $4)
         ON CONFLICT (partido_final_id, sucursal) DO NOTHING`,
        [sucGan, P.disciplina_id, P.bracket_id, partidoId]
      );

      // Subcampeón
      await client.query(
        `INSERT INTO public.medallero
           (sucursal, puntos, disciplina_id, bracket_id, partido_final_id)
         VALUES ($1, 2, $2, $3, $4)
         ON CONFLICT (partido_final_id, sucursal) DO NOTHING`,
        [sucSub, P.disciplina_id, P.bracket_id, partidoId]
      );

      try { app.get('io')?.emit('medallero_changed'); } catch {}
    }

    await client.query('COMMIT');

    try { app.get('io')?.emit('partido_updated', { partido_id: partidoId, bracket_id: P.bracket_id }); } catch {}
    res.json({ ok:true, esFinal });

  } catch (err) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error('POST /api/partidos/:id/final error:', err);
    res.status(500).json({ error: 'Error guardando final' });
  } finally {
    client.release();
  }
});*/

app.post('/api/partidos/:id/final', requireAuth, requireOlimpiada, async (req, res) => {
  const client = await pool.connect();

  try {
    const olimpiadaId = req.olimpiada.id;
    const user = req.user;

    const partidoId = Number(req.params.id);
    const { puntaje_equipo1, puntaje_equipo2 } = req.body || {};

    // traer partido con validación extra
    const { rows: pRows } = await client.query(`
      SELECT p.*, b.olimpiada_id
      FROM public.partidos p
      JOIN public.brackets b ON b.id = p.bracket_id
      WHERE p.id = $1
      LIMIT 1
    `, [partidoId]);

    if (!pRows.length)
      return res.status(404).json({ error: 'Partido no encontrado' });

    const P = pRows[0];

    // edición correcta
    if (Number(P.olimpiada_id) !== Number(olimpiadaId))
      return res.status(403).json({ error: 'Partido no pertenece a la edición activa' });

    // permisos
    const permitido = await canEditDisciplina(user, olimpiadaId, P.disciplina_id);
    if (!permitido)
      return res.status(403).json({ error: 'Sin permiso para esta disciplina' });

    if (!P.equipo1_id || !P.equipo2_id)
      return res.status(400).json({ error: 'Partido incompleto' });

    // marcador
    const s1 = Number.isFinite(+puntaje_equipo1) ? +puntaje_equipo1 : 0;
    const s2 = Number.isFinite(+puntaje_equipo2) ? +puntaje_equipo2 : 0;

    if (s1 === s2)
      return res.status(400).json({ error: 'El partido no puede terminar empatado' });

    const ganadorId    = s1 > s2 ? P.equipo1_id : P.equipo2_id;
    const subcampeonId = s1 > s2 ? P.equipo2_id : P.equipo1_id;

    await client.query("BEGIN");

    // insertar resultado
    await client.query(`
      INSERT INTO public.resultados
      (partido_id, puntaje_equipo1, puntaje_equipo2, ganador_id,
       penales_equipo1, penales_equipo2, definido_por_penales)
      VALUES ($1, $2, $3, $4, NULL, NULL, false)
      ON CONFLICT (partido_id) DO UPDATE SET
        puntaje_equipo1 = EXCLUDED.puntaje_equipo1,
        puntaje_equipo2 = EXCLUDED.puntaje_equipo2,
        ganador_id = EXCLUDED.ganador_id,
        penales_equipo1 = NULL,
        penales_equipo2 = NULL,
        definido_por_penales = false
    `, [partidoId, s1, s2, ganadorId]);

    await client.query(`
      UPDATE public.partidos SET estado='finalizado' WHERE id=$1
    `, [partidoId]);

    const esFinal = (P.next_match_id === null);

    if (!esFinal) {
      // avanzar en llave (MISMO CÓDIGO TUYO)
      const lado = Number(P.next_match_side) === 2 ? 'equipo2_id' : 'equipo1_id';
      const op   = Number(P.next_match_side) === 2 ? 'equipo1_id' : 'equipo2_id';

      const { rows: nx } = await client.query(`
        SELECT id, equipo1_id, equipo2_id
        FROM public.partidos
        WHERE id=$1
        FOR UPDATE
      `, [P.next_match_id]);

      if (!nx.length) throw new Error("Siguiente partido no encontrado");

      const N = nx[0];

      if (N[lado] == null) {
        await client.query(`UPDATE public.partidos SET ${lado}=$1 WHERE id=$2`, [ganadorId, N.id]);
      } else if (N[lado] !== ganadorId && N[op] == null) {
        await client.query(`UPDATE public.partidos SET ${op}=$1 WHERE id=$2`, [ganadorId, N.id]);
      }

      await client.query(`
        UPDATE public.partidos
        SET estado = CASE
                       WHEN equipo1_id IS NOT NULL AND equipo2_id IS NOT NULL THEN 'pendiente'
                       ELSE estado
                     END
        WHERE id=$1
      `, [N.id]);

    } else {
      // medallero (MISMO CÓDIGO TUYO)
      const { rows: eqRows } = await client.query(`
        SELECT id, sucursal FROM public.equipos
        WHERE id = ANY($1::int[])
      `, [[ganadorId, subcampeonId]]);

      const map = new Map(eqRows.map(r => [r.id, r.sucursal]));

      const sucGan = map.get(ganadorId) || "DESCONOCIDA";
      const sucSub = map.get(subcampeonId) || "DESCONOCIDA";

      await client.query(`
        INSERT INTO public.medallero
        (sucursal, puntos, disciplina_id, bracket_id, partido_final_id)
        VALUES ($1,3,$2,$3,$4)
        ON CONFLICT (partido_final_id, sucursal) DO NOTHING
      `, [sucGan, P.disciplina_id, P.bracket_id, partidoId]);

      await client.query(`
        INSERT INTO public.medallero
        (sucursal, puntos, disciplina_id, bracket_id, partido_final_id)
        VALUES ($1,2,$2,$3,$4)
        ON CONFLICT (partido_final_id, sucursal) DO NOTHING
      `, [sucSub, P.disciplina_id, P.bracket_id, partidoId]);

      app.get("io")?.emit("medallero_changed");
    }

    await client.query("COMMIT");

    app.get("io")?.emit("partido_updated", {
      partido_id: partidoId,
      bracket_id: P.bracket_id
    });

    res.json({ ok: true, esFinal });

  } catch (err) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("POST /api/partidos/:id/final error:", err);
    res.status(500).json({ error: "Error guardando final" });
  } finally {
    client.release();
  }
});


// ====== FINAL POR PENALES (empate en tiempo regular, define y avanza sin pisar) ======
/*app.post('/api/partidos/:id/penales/final', requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const id = Number(req.params.id);
    const { p1, p2 } = req.body || {};
    const pen1 = Number(p1 ?? 0);
    const pen2 = Number(p2 ?? 0);
    if (pen1 === pen2) return res.status(400).json({ error: 'Los penales no pueden terminar empatados' });

    const { rows: pr } = await client.query(`
      SELECT id, bracket_id, disciplina_id, round, orden,
             equipo1_id, equipo2_id,
             next_match_id, next_match_side,
             parcial_equipo1, parcial_equipo2
        FROM public.partidos
       WHERE id=$1
       LIMIT 1
    `, [id]);
    if (!pr.length) return res.status(404).json({ error:'Partido no encontrado' });
    const P = pr[0];
    if (!P.equipo1_id || !P.equipo2_id) return res.status(400).json({ error:'Partido incompleto' });

    const ganadorId  = pen1 > pen2 ? P.equipo1_id : P.equipo2_id;
    const perdedorId = ganadorId === P.equipo1_id ? P.equipo2_id : P.equipo1_id;

    await client.query('BEGIN');

    // Guardamos resultado con bandera de penales
    await client.query(`
      INSERT INTO public.resultados
        (partido_id, puntaje_equipo1, puntaje_equipo2, ganador_id,
         penales_equipo1, penales_equipo2, definido_por_penales)
      VALUES ($1,$2,$3,$4,$5,$6,true)
      ON CONFLICT (partido_id) DO UPDATE
        SET ganador_id=EXCLUDED.ganador_id,
            penales_equipo1=EXCLUDED.penales_equipo1,
            penales_equipo2=EXCLUDED.penales_equipo2,
            definido_por_penales=true,
            puntaje_equipo1=COALESCE(public.resultados.puntaje_equipo1, EXCLUDED.puntaje_equipo1),
            puntaje_equipo2=COALESCE(public.resultados.puntaje_equipo2, EXCLUDED.puntaje_equipo2)
    `, [ id, P.parcial_equipo1 ?? 0, P.parcial_equipo2 ?? 0, ganadorId, pen1, pen2 ]);

    await client.query(`UPDATE public.partidos SET estado='finalizado' WHERE id=$1`, [id]);

    if (P.next_match_id) {
      await placeWinnerSafe(client, P.next_match_id, P.next_match_side, ganadorId);
    } else {
      // Era final real: campeón 3, subcampeón 2
      const { rows: eqRows } = await client.query(
        `SELECT id, sucursal FROM public.equipos WHERE id = ANY($1::int[])`,
        [[ganadorId, perdedorId]]
      );
      const byId = new Map(eqRows.map(r => [r.id, r.sucursal]));
      const sucGan = byId.get(ganadorId)  || 'DESCONOCIDA';
      const sucSub = byId.get(perdedorId) || 'DESCONOCIDA';

      await client.query(`
        INSERT INTO public.medallero
          (sucursal, puntos, disciplina_id, bracket_id, partido_final_id)
        VALUES ($1,3,$3,$4,$5)
        ON CONFLICT (partido_final_id, sucursal) DO NOTHING
      `, [sucGan, 3, P.disciplina_id, P.bracket_id, id]);

      await client.query(`
        INSERT INTO public.medallero
          (sucursal, puntos, disciplina_id, bracket_id, partido_final_id)
        VALUES ($1,2,$3,$4,$5)
        ON CONFLICT (partido_final_id, sucursal) DO NOTHING
      `, [sucSub, 2, P.disciplina_id, P.bracket_id, id]);

      try { io.emit('medallero_changed'); } catch {}
    }

    await client.query('COMMIT');
    try { io.emit('partido_updated', { partido_id:id, bracket_id:P.bracket_id }); } catch {}
    res.json({ ok:true });

  } catch (e) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error('POST /api/partidos/:id/penales/final', e);
    res.status(500).json({ error:'Error guardando penales (final)' });
  } finally {
    client.release();
  }
});*/

app.post('/api/partidos/:id/penales/final', requireAuth, requireOlimpiada, async (req, res) => {
  const client = await pool.connect();

  try {
    const olimpiadaId = req.olimpiada.id;
    const user = req.user;

    const id = Number(req.params.id);
    const { p1, p2 } = req.body || {};
    const pen1 = Number(p1 ?? 0);
    const pen2 = Number(p2 ?? 0);

    if (pen1 === pen2)
      return res.status(400).json({ error: 'Los penales no pueden terminar empatados' });

    // partido + edición
    const { rows: pr } = await client.query(`
      SELECT p.*, b.olimpiada_id
      FROM public.partidos p
      JOIN public.brackets b ON b.id = p.bracket_id
      WHERE p.id=$1
    `, [id]);

    if (!pr.length)
      return res.status(404).json({ error:'Partido no encontrado' });

    const P = pr[0];

    if (Number(P.olimpiada_id) !== Number(olimpiadaId))
      return res.status(403).json({ error: "Partido no pertenece a la edición activa" });

    const permitido = await canEditDisciplina(user, olimpiadaId, P.disciplina_id);
    if (!permitido)
      return res.status(403).json({ error: "Sin permiso para esta disciplina" });

    if (!P.equipo1_id || !P.equipo2_id)
      return res.status(400).json({ error:'Partido incompleto' });

    const ganadorId  = pen1 > pen2 ? P.equipo1_id : P.equipo2_id;
    const perdedorId = ganadorId === P.equipo1_id ? P.equipo2_id : P.equipo1_id;

    await client.query("BEGIN");

    // Insertar resultado (misma lógica tuya)
    await client.query(`
      INSERT INTO public.resultados
        (partido_id, puntaje_equipo1, puntaje_equipo2, ganador_id,
         penales_equipo1, penales_equipo2, definido_por_penales)
      VALUES ($1,$2,$3,$4,$5,$6,true)
      ON CONFLICT (partido_id) DO UPDATE
        SET ganador_id=EXCLUDED.ganador_id,
            penales_equipo1=EXCLUDED.penales_equipo1,
            penales_equipo2=EXCLUDED.penales_equipo2,
            definido_por_penales=true,
            puntaje_equipo1=COALESCE(public.resultados.puntaje_equipo1, EXCLUDED.puntaje_equipo1),
            puntaje_equipo2=COALESCE(public.resultados.puntaje_equipo2, EXCLUDED.puntaje_equipo2)
    `, [
      id, P.parcial_equipo1 ?? 0, P.parcial_equipo2 ?? 0,
      ganadorId, pen1, pen2
    ]);

    await client.query(`UPDATE public.partidos SET estado='finalizado' WHERE id=$1`, [id]);

    if (P.next_match_id) {
      await placeWinnerSafe(client, P.next_match_id, P.next_match_side, ganadorId);

    } else {
      // Final real → medallero
      const { rows: eqRows } = await client.query(`
        SELECT id, sucursal FROM public.equipos
        WHERE id = ANY($1::int[])
      `, [[ganadorId, perdedorId]]);

      const map = new Map(eqRows.map(r => [r.id, r.sucursal]));

      const sucGan = map.get(ganadorId)  || 'DESCONOCIDA';
      const sucSub = map.get(perdedorId) || 'DESCONOCIDA';

      await client.query(`
        INSERT INTO public.medallero
          (sucursal,puntos,disciplina_id,bracket_id,partido_final_id)
        VALUES ($1,3,$2,$3,$4)
        ON CONFLICT (partido_final_id, sucursal) DO NOTHING
      `, [sucGan, P.disciplina_id, P.bracket_id, id]);

      await client.query(`
        INSERT INTO public.medallero
          (sucursal,puntos,disciplina_id,bracket_id,partido_final_id)
        VALUES ($1,2,$2,$3,$4)
        ON CONFLICT (partido_final_id, sucursal) DO NOTHING
      `, [sucSub, P.disciplina_id, P.bracket_id, id]);

      app.get("io")?.emit("medallero_changed");
    }

    await client.query("COMMIT");

    app.get("io")?.emit("partido_updated", {
      partido_id: id,
      bracket_id: P.bracket_id
    });

    res.json({ ok:true });

  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error('/api/partidos/:id/penales/final', e);
    res.status(500).json({ error:'Error guardando penales (final)' });
  } finally {
    client.release();
  }
});


// ====== FINAL TIEMPO REGULAR: permite empate → pasa a estado "penales"


// Medallero
/*app.get('/api/medallero', requireAuth, async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT sucursal, SUM(puntos)::int AS puntos
        FROM public.medallero
       GROUP BY sucursal
       ORDER BY SUM(puntos) DESC, sucursal ASC
    `);
    res.json(rows);
  } catch (e) {
    console.error('GET /api/medallero', e);
    res.status(500).json({ error:'Error cargando medallero' });
  }
});*/

// GET /api/medallero  (compatible: agrega campo 'detalle')
// GET /api/medallero
app.get('/api/medallero', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      WITH total AS (
        SELECT m.sucursal, SUM(m.puntos) AS puntos
        FROM public.medallero m
        GROUP BY m.sucursal
      ),
      por_disc AS (
        SELECT m.sucursal,
               d.nombre AS disciplina,
               SUM(m.puntos) AS pts
        FROM public.medallero m
        LEFT JOIN public.disciplinas d ON d.id = m.disciplina_id
        GROUP BY m.sucursal, d.nombre
      )
      SELECT
        t.sucursal,
        t.puntos,
        COALESCE(
          STRING_AGG(
            (por_disc.pts::text || ' ' ||
             CASE WHEN por_disc.pts = 1 THEN 'punto' ELSE 'puntos' END ||
             ' ' || por_disc.disciplina),
            ', ' ORDER BY por_disc.disciplina
          ),
          ''
        ) AS detalle
      FROM total t
      LEFT JOIN por_disc ON por_disc.sucursal = t.sucursal
      GROUP BY t.sucursal, t.puntos
      ORDER BY t.puntos DESC, t.sucursal ASC
    `);

    res.json(rows.map(r => ({
      sucursal: r.sucursal,
      puntos: Number(r.puntos),
      detalle: r.detalle || ''
    })));
  } catch (e) {
    console.error('GET /api/medallero error:', e);
    res.status(500).json({ error: 'Error leyendo medallero' });
  }
});



// Equipos participantes de un bracket (para llenar el select del 3º)


// Asignar/actualizar 3º puesto (suma 1 punto)
// Si ya había un tercero para ese bracket, lo reemplaza.
// === Equipos participantes de un bracket (para el select) ===
app.get('/api/brackets/:id/equipos', requireAuth, async (req, res)=>{
  try{
    const id = Number(req.params.id);
    const { rows } = await pool.query(`
      SELECT DISTINCT e.id, e.nombre
        FROM public.partidos p
        JOIN public.equipos e
          ON e.id = ANY(ARRAY[p.equipo1_id, p.equipo2_id])
       WHERE p.bracket_id = $1
       ORDER BY e.nombre
    `,[id]);
    res.json(rows);
  }catch(e){
    console.error('GET /api/brackets/:id/equipos', e);
    res.status(500).json({ error:'Error listando equipos del bracket' });
  }
});

// === Guardar tercer puesto: suma 1 punto a la sucursal del equipo elegido ===
// === Guardar tercer puesto: suma 1 punto a la sucursal del equipo elegido ===
// ====== TERCER PUESTO (MANUAL) ======
/*app.post('/api/brackets/:id/tercero', requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const bracketId = Number(req.params.id || 0);
    const { equipo_id } = req.body || {};
    const equipoId = Number(equipo_id || 0);

    if (!bracketId || !equipoId) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    // 1) Buscar FINAL del bracket (partido que no tiene next_match_id)
    const { rows: finRows } = await client.query(`
      SELECT p.id AS final_id, p.disciplina_id
        FROM public.partidos p
       WHERE p.bracket_id = $1
         AND p.next_match_id IS NULL
       ORDER BY p.round DESC
       LIMIT 1
    `, [bracketId]);

    if (!finRows.length) {
      return res.status(400).json({ error: 'No se encontró el partido final del bracket' });
    }
    const finalId = finRows[0].final_id;
    const disciplinaId = finRows[0].disciplina_id;

    // 2) Sucursal del equipo elegido
    const { rows: eqRows } = await client.query(`
      SELECT sucursal FROM public.equipos WHERE id = $1
    `, [equipoId]);
    if (!eqRows.length) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    const sucursal = eqRows[0].sucursal;

    await client.query('BEGIN');

    // 3) Eliminar cualquier “tercer puesto” anterior de este mismo bracket/final
    //    (asumimos que el 3º siempre suma 1 punto)
    await client.query(`
      DELETE FROM public.medallero
       WHERE bracket_id = $1
         AND partido_final_id = $2
         AND puntos = 1
    `, [bracketId, finalId]);

    // 4) Insertar el nuevo tercero: 1 punto
    await client.query(`
      INSERT INTO public.medallero
        (sucursal, puntos, disciplina_id, bracket_id, partido_final_id)
      VALUES
        ($1, 1, $2, $3, $4)
      ON CONFLICT (partido_final_id, sucursal) DO NOTHING
    `, [sucursal, disciplinaId, bracketId, finalId]);

    await client.query('COMMIT');

    // avisos en vivo
    try { app.get('io')?.emit('medallero_changed'); } catch {}

    return res.json({ ok: true });

  } catch (e) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error('POST /api/brackets/:id/tercero error:', e);
    return res.status(500).json({ error: 'Error guardando tercer puesto' });
  } finally {
    client.release();
  }
});*/


app.post('/api/brackets/:id/tercero', requireAuth, requireOlimpiada, async (req, res) => {
  const id = Number(req.params.id);
  const { tercero_equipo1 = 0, tercero_equipo2 = 0 } = req.body || {};
  const olimpiadaId = req.olimpiada.id;
  const user = req.user;

  try {
    // === Cargar datos del bracket ===
    const { rows: meta } = await pool.query(`
      SELECT id, disciplina_id, olimpiada_id
      FROM brackets
      WHERE id = $1
      LIMIT 1
    `, [id]);

    if (!meta.length)
      return res.status(404).json({ error: "Bracket no encontrado" });

    const { disciplina_id, olimpiada_id } = meta[0];

    // === Validar que pertenece a la edición del usuario ===
    if (Number(olimpiada_id) !== Number(olimpiadaId))
      return res.status(403).json({ error: "Bracket no pertenece a la edición activa" });

    // === Validar permisos ===
    const permitido = await canEditDisciplina(user, olimpiadaId, disciplina_id);
    if (!permitido)
      return res.status(403).json({ error: "Sin permiso para esta disciplina" });

    // === Actualizar ===
    const { rows } = await pool.query(`
      UPDATE brackets
      SET tercero_equipo1 = $1,
          tercero_equipo2 = $2,
          tercero_actualizado_en = NOW()
      WHERE id = $3
      RETURNING id
    `, [tercero_equipo1, tercero_equipo2, id]);

    emitPartidoUpdated(id);
    res.json({ ok: true });

  } catch (e) {
    console.error("POST /api/brackets/:id/tercero", e);
    res.status(500).json({ error: "Error guardando 3er puesto" });
  }
});




// Último bracket por disciplina
app.get('/api/brackets/byDisciplina/:disciplina_id', requireAuth, async (req, res) => {
  try {
    const did = Number(req.params.disciplina_id || 0);
    if (!did) return res.status(400).json({ error:'disciplina_id inválido' });
    const { rows } = await pool.query(
      `SELECT id FROM public.brackets WHERE disciplina_id=$1 ORDER BY id DESC LIMIT 1`,
      [did]
    );
    if (!rows.length) return res.status(404).json({ error:'Sin brackets para la disciplina' });
    res.json({ bracket_id: rows[0].id });
  } catch (e) {
    console.error('GET /api/brackets/byDisciplina/:disciplina_id', e);
    res.status(500).json({ error:'Error obteniendo bracket' });
  }
});

// GET /api/disciplinas/:id/equipos
app.get('/api/disciplinas/:id/equipos', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id || 0);
    if (!id) return res.json([]);
    const { rows } = await pool.query(`
      SELECT e.id, e.nombre
      FROM public.equipos_disciplinas ed
      JOIN public.equipos e ON e.id = ed.equipo_id
      WHERE ed.disciplina_id = $1
      ORDER BY e.nombre
    `, [id]);
    res.json(rows);
  } catch (e) {
    console.error('GET /disciplinas/:id/equipos', e);
    res.status(500).json({ error: 'Error listando equipos' });
  }
});

// POST /api/disciplinas/:id/podio
// POST /api/disciplinas/:id/podio
// Guarda el podio manual como 3–2–1 puntos en medallero.
// Estrategia simple y segura: borramos las filas MANUALES previas de esa disciplina
// (solo las que tengan partido_final_id IS NULL) y reinsertamos 3 filas nuevas.
app.post('/api/disciplinas/:id/podio', requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const disciplina_id = Number(req.params.id || 0);
    const { primero_id, segundo_id, tercero_id } = req.body || {};

    if (!disciplina_id || !primero_id || !segundo_id || !tercero_id) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }
    if (new Set([primero_id, segundo_id, tercero_id]).size < 3) {
      return res.status(400).json({ error: 'Los 3 puestos deben ser distintos' });
    }

    // Traer sucursales de esos equipos
    const { rows: eqRows } = await client.query(
      `SELECT id, sucursal FROM public.equipos WHERE id = ANY($1::int[])`,
      [[primero_id, segundo_id, tercero_id]]
    );
    const byId = new Map(eqRows.map(r => [r.id, r.sucursal]));
    const suc1 = byId.get(primero_id);
    const suc2 = byId.get(segundo_id);
    const suc3 = byId.get(tercero_id);
    if (!suc1 || !suc2 || !suc3) {
      return res.status(400).json({ error: 'Equipos inválidos' });
    }

    await client.query('BEGIN');

    // Borrar previos MANUALES de esta disciplina (solo los que NO provienen de finales/partidos)
    await client.query(
      `DELETE FROM public.medallero
        WHERE disciplina_id = $1
          AND partido_final_id IS NULL`,
      [disciplina_id]
    );

    // Insertar 3–2–1 (bracket_id NULL, partido_final_id NULL)
    await client.query(
      `INSERT INTO public.medallero (sucursal, puntos, disciplina_id, bracket_id, partido_final_id)
       VALUES
         ($1, 3, $4, NULL, NULL),
         ($2, 2, $4, NULL, NULL),
         ($3, 1, $4, NULL, NULL)`,
      [suc1, suc2, suc3, disciplina_id]
    );

    await client.query('COMMIT');

    try { app.get('io')?.emit('medallero:changed'); } catch {}
    return res.json({ ok: true });
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error('POST /api/disciplinas/:id/podio error:', e);
    return res.status(500).json({ error: 'Error guardando podio' });
  } finally {
    client.release();
  }
});


// backend/index.js o router apropiado
app.post('/api/podio/manual', requireAuth, async (req, res) => {
  const { disciplina_id, primero_equipo_id, segundo_equipo_id, tercero_equipo_id } = req.body || {};
  if (!disciplina_id || !primero_equipo_id || !segundo_equipo_id || !tercero_equipo_id) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // traigo sucursales de los equipos
    const { rows: eq } = await client.query(`
      SELECT id, sucursal FROM public.equipos
      WHERE id = ANY($1::int[])
    `, [[primero_equipo_id, segundo_equipo_id, tercero_equipo_id]]);

    const byId = new Map(eq.map(r => [r.id, r.sucursal]));
    const s1 = byId.get(primero_equipo_id);
    const s2 = byId.get(segundo_equipo_id);
    const s3 = byId.get(tercero_equipo_id);
    if (!s1 || !s2 || !s3) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Equipo inválido' });
    }

    // id sintético y único para esta disciplina (sin llaves)
    const finalId = 1000000 + Number(disciplina_id);

    // insert/update puntos 3, 2, 1
    await client.query(`
      INSERT INTO public.medallero (sucursal, puntos, disciplina_id, bracket_id, partido_final_id)
      VALUES ($1,3,$3,NULL,$4)
      ON CONFLICT (partido_final_id, sucursal)
      DO UPDATE SET puntos = EXCLUDED.puntos
    `, [s1, 3, disciplina_id, finalId]);

    await client.query(`
      INSERT INTO public.medallero (sucursal, puntos, disciplina_id, bracket_id, partido_final_id)
      VALUES ($1,2,$3,NULL,$4)
      ON CONFLICT (partido_final_id, sucursal)
      DO UPDATE SET puntos = EXCLUDED.puntos
    `, [s2, 2, disciplina_id, finalId]);

    await client.query(`
      INSERT INTO public.medallero (sucursal, puntos, disciplina_id, bracket_id, partido_final_id)
      VALUES ($1,1,$3,NULL,$4)
      ON CONFLICT (partido_final_id, sucursal)
      DO UPDATE SET puntos = EXCLUDED.puntos
    `, [s3, 1, disciplina_id, finalId]);

    await client.query('COMMIT');

    try { app.get('io')?.emit('medallero:changed'); } catch {}
    return res.json({ ok: true });

  } catch (e) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error('POST /api/podio/manual', e);
    return res.status(500).json({ error: 'Error guardando podio' });
  } finally {
    client.release();
  }
});

// Campeón Copa Challenger
/* app.get('/api/olimpiada/campeon', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT finalizado, tops, puntos, updated_at
      FROM olimpiada_estado
      WHERE id = 1
      ORDER BY updated_at DESC
      LIMIT 1
    `);
    res.json(rows[0] || { finalizado:false, tops:[], puntos:0 });
  } catch (e) {
    console.error('GET /api/olimpiada/campeon', e);
    res.status(500).json({ error: 'Error obteniendo campeón' });
  }
}); */



// Ejemplo con pg (node-postgres)
// Finalizar Olimpiada: calcula y persiste campeón

// POST /api/olimpiada/finalizar
app.post('/api/olimpiada/finalizar', async (req, res) => {
  try {
    // Asegura que exista la fila id=1
    await pool.query(`
      INSERT INTO olimpiada_estado (id, finalizado, tops, puntos, updated_at)
      VALUES (1, FALSE, '{}'::text[], 0, NOW())
      ON CONFLICT (id) DO NOTHING;
    `);

    // Calcula el/los punteros desde medallero
    const { rows: calc } = await pool.query(`
      WITH sumas AS (
        SELECT sucursal, SUM(puntos)::int AS pts
        FROM medallero
        GROUP BY sucursal
      ),
      maxpts AS (
        SELECT COALESCE(MAX(pts), 0)::int AS top FROM sumas
      )
      SELECT
        COALESCE(
          (SELECT array_agg(s.sucursal ORDER BY s.sucursal)
             FROM sumas s JOIN maxpts m ON s.pts = m.top),
          '{}'::text[]
        ) AS tops,
        (SELECT top FROM maxpts) AS puntos
    `);

    const tops   = calc[0]?.tops   ?? [];
    const puntos = calc[0]?.puntos ?? 0;

    // Actualiza estado a finalizado
    const { rows } = await pool.query(`
      UPDATE olimpiada_estado
         SET finalizado = TRUE,
             tops       = $1::text[],
             puntos     = $2::int,
             updated_at = NOW()
       WHERE id = 1
      RETURNING finalizado, tops, puntos, updated_at;
    `, [tops, puntos]);

    const state = rows[0];
    try { io.emit('olimpiada_finalizada', state); } catch {}
    res.json(state);
  } catch (e) {
    console.error('POST /api/olimpiada/finalizar', e);
    res.status(500).json({ error: 'No se pudo finalizar' });
  }
});

// GET /api/olimpiada/campeon
app.get('/api/olimpiada/campeon', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT finalizado, tops, puntos, updated_at
        FROM olimpiada_estado
       WHERE id = 1
    `);
    res.json(rows[0] || { finalizado:false, tops:[], puntos:0 });
  } catch (e) {
    console.error('GET /api/olimpiada/campeon', e);
    res.status(500).json({ error: 'Error obteniendo campeón' });
  }
});

// Podio para disciplinas SIN llaves (lectura para el visor)
app.get('/api/disciplinas/:id/podio', async (req, res) => {
  try {
    const did = Number(req.params.id);

    // Leemos lo que guardó el admin: tres filas en medallero con puntos 3,2,1
    const { rows } = await pool.query(
      `SELECT sucursal, puntos
       FROM medallero
       WHERE disciplina_id = $1
       ORDER BY puntos DESC, sucursal ASC`,
      [did]
    );

    // armamos respuesta { primero, segundo, tercero }
    const out = { primero: null, segundo: null, tercero: null };
    for (const r of rows) {
      if (Number(r.puntos) === 3) out.primero  = r.sucursal;
      if (Number(r.puntos) === 2) out.segundo  = r.sucursal;
      if (Number(r.puntos) === 1) out.tercero  = r.sucursal;
    }
    return res.json(out);
  } catch (e) {
    console.error('GET /api/disciplinas/:id/podio', e);
    res.status(500).json({ error: 'No se pudo obtener el podio' });
  }
});

// ===== Ediciones / Provincias =====

// Lista de provincias (para el selector)
app.get('/api/olimpiadas/provincias', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre FROM provincias ORDER BY nombre`
    );
    res.json(rows);
  } catch (e) {
    console.error('GET /api/olimpiadas/provincias', e);
    res.status(500).json({ error: 'Error listando provincias' });
  }
});

// Crear una nueva edición (año + provincia opcional + nombre opcional)
 app.post('/api/olimpiadas', async (req, res) => {
  try {
    const { anio, provincia_id, nombre } = req.body || {};
    if (!anio) return res.status(400).json({ error: 'anio requerido' });

    const r = await pool.query(
      `INSERT INTO olimpiadas(anio, sede_provincia_id, nombre)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [anio, provincia_id || null, (nombre || '').trim() || null]
    );

    res.json({ id: r.rows[0].id });
  } catch (e) {
    console.error('POST /api/olimpiadas', e);
    res.status(500).json({ error: 'No se pudo crear la edición' });
  }
}); 

// Listar ediciones (para llenar el combo “Edición”)
app.get('/api/olimpiadas', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        o.id, 
        o.anio, 
        o.nombre, 
        o.estado, 
        o.fecha_inicio,
        o.fecha_fin,
        p.id   AS provincia_id,
        p.nombre AS provincia
      FROM olimpiadas o
      LEFT JOIN provincias p ON p.id = o.sede_provincia_id   -- << clave
      ORDER BY o.anio DESC, o.id DESC
    `);
    res.json(rows);
  } catch (e) {
    console.error('GET /api/olimpiadas', e);
    res.status(500).json({ error: 'Error listando ediciones' });
  }
});


// Listar ediciones (para llenar el combo “Edición”)
/*app.get('/api/olimpiadas', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT o.id, o.anio, o.nombre, o.finalizada, o.created_at,
             p.id AS id, p.nombre AS provincia
      FROM olimpiadas o
      LEFT JOIN provincias p ON p.id = o.id
      ORDER BY o.anio DESC, o.id DESC
    `);
    res.json(rows);
  } catch (e) {
    console.error('GET /api/olimpiadas', e);
    res.status(500).json({ error: 'Error listando ediciones' });
  }
});*/

app.get('/api/provincias', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nombre FROM provincias ORDER BY nombre'
    );
    res.json(rows);
  } catch (e) {
    console.error('GET /api/provincias', e);
    res.status(500).json({ error: 'Error cargando provincias' });
  }
});

// ==== ADMIN: listar árbitros y sus permisos en la edición activa
app.get('/api/arbitros/permisos', requireAuth, requireOlimpiada, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error:'Solo admin' });
  const olimpiadaId = req.olimpiada.id;

  try {
    const { rows } = await pool.query(`
      SELECT u.id AS usuario_id, u.usuario AS username, u.rol,
             d.id AS disciplina_id, d.nombre AS disciplina
        FROM usuarios u
        LEFT JOIN usuario_permisos up
               ON up.usuario_id = u.id AND up.olimpiada_id = $1
        LEFT JOIN disciplinas d
               ON d.id = up.disciplina_id
       WHERE u.rol = 'arbitro'
       ORDER BY u.usuario, d.nombre
    `, [olimpiadaId]);

    // agrupar por usuario
    const map = new Map();
    for (const r of rows) {
      if (!map.has(r.usuario_id)) {
        map.set(r.usuario_id, { usuario_id: r.usuario_id, username: r.username, disciplinas: [] });
      }
      if (r.disciplina_id) map.get(r.usuario_id).disciplinas.push({ id: r.disciplina_id, nombre: r.disciplina });
    }
    res.json([...map.values()]);
  } catch (e) {
    console.error('GET /api/arbitros/permisos', e);
    res.status(500).json({ error:'Error listando permisos' });
  }
});

// ==== ADMIN: sobrescribir permisos de un árbitro en la edición activa
app.post('/api/arbitros/permisos', requireAuth, requireOlimpiada, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error:'Solo admin' });

  const { usuario_id, disciplina_ids } = req.body || {};
  const uniqueDisciplinaIds = [...new Set(disciplina_ids.map(Number))];
  const olimpiadaId = req.olimpiada.id;

  if (!usuario_id || !Array.isArray(disciplina_ids)) {
    return res.status(400).json({ error:'Datos inválidos' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `DELETE FROM usuario_permisos WHERE usuario_id=$1 AND olimpiada_id=$2`,
      [usuario_id, olimpiadaId]
    );
    if (uniqueDisciplinaIds.length) {
      const values = uniqueDisciplinaIds.map((_, i) => `($1,$2,$${i+3})`).join(',');
      await client.query(
        `INSERT INTO usuario_permisos (usuario_id, olimpiada_id, disciplina_id) VALUES ${values}`,
        [usuario_id, olimpiadaId, ...uniqueDisciplinaIds.map(Number)]
      );
    }
    await client.query('COMMIT');
    res.json({ ok:true });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('POST /api/arbitros/permisos', e);
    res.status(500).json({ error:'Error guardando permisos' });
  } finally {
    client.release();
  }
});

// ==== ADMIN: lista de usuarios con rol 'arbitro' (para llenar el select)
app.get('/api/usuarios/arbitros', requireAuth, async (_req, res) => {
  if (_req.user.role !== 'admin') return res.status(403).json({ error:'Solo admin' });
  try {
    const { rows } = await pool.query(`SELECT id, usuario FROM usuarios WHERE rol='arbitro' ORDER BY usuario`);
    res.json(rows);
  } catch (e) {
    console.error('GET /api/usuarios/arbitros', e);
    res.status(500).json({ error:'Error listando árbitros' });
  }
});


/* // routes/arbitros.js
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
}); */

// routes/arbitros.js
// ==== ARBITRO: contexto propio (disciplinas permitidas en la edición activa)
app.get('/api/arbitros/mi-contexto', requireAuth, requireOlimpiada, async (req, res) => {
  if (req.user.role !== 'arbitro') {
    return res.status(403).json({ error: 'Solo árbitro' });
  }

  const olimpiadaId = req.olimpiada.id;

  try {
    const { rows } = await pool.query(`
      SELECT d.id, d.nombre
      FROM usuario_permisos up
      JOIN disciplinas d ON d.id = up.disciplina_id
      WHERE up.usuario_id = $1
        AND up.olimpiada_id = $2
      ORDER BY d.nombre
    `, [req.user.id, olimpiadaId]);

    res.json({
      usuario_id: req.user.id,
      olimpiada_id: olimpiadaId,
      disciplinas: rows
    });

  } catch (e) {
    console.error('GET /api/arbitros/mi-contexto', e);
    res.status(500).json({ error: 'Error obteniendo contexto del árbitro' });
  }
});



// Socket.IO
io.on('connection', () => {});

// Arranque
server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://0.0.0.0:${PORT}`);
});

// index.js (o donde importes las plantillas)
//import { getTemplateByCount } from './bracket_templates.js';

//console.log('[BRKT] plantilla cargada. 9eq=', getTemplateByCount(9)?.map(m=>`${m.id}:${m.a}vs${m.b}->${m.next}/${m.nextSide}`).join(' | '));
//console.log('[BRKT] plantilla cargada.10eq=', getTemplateByCount(10)?.map(m=>`${m.id}:${m.a}vs${m.b}->${m.next}/${m.nextSide}`).join(' | '));

