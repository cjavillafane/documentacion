// backend/seed_admin.js
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import pool from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

async function seed(){
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const initSQL = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
    await pool.query(initSQL);

    const user = 'admin';
    const pass = 'admin123';
    const role = 'admin';
    const exists = await pool.query('SELECT 1 FROM usuarios WHERE usuario=$1', [user]);
    if (!exists.rows.length){
      const hash = await bcrypt.hash(pass, 10);
      await pool.query('INSERT INTO usuarios(usuario, clave_hash, rol) VALUES ($1,$2,$3)', [user, hash, role]);
      console.log('Usuario admin creado: admin / admin123');
    } else {
      console.log('Usuario admin ya existe');
    }

    const d = await pool.query('SELECT 1 FROM disciplinas LIMIT 1');
    if (!d.rows.length){
      await pool.query("INSERT INTO disciplinas(nombre) VALUES ('Futbol Primera'),('Futbol Veteranos'),('Futbol Senior'),('Futbol Femenino'),('Voley Mixto'),('Sapo Masculino'),('Sapo Femenino'),('Truco Masculino'),('Truco Femenino'),('Basquet'),('Loba Masculino'),('Loba Femenino'),('Ajedrez Masculino'),('Ajedrez Femenino'),('Pesca'),('Newcom'),('Atletismo Masculino 100m'),('Atletismo Femenino 100m'),('Atletismo Masculino 400m'),('Atletismo Femenino 400m')");
    }
    const e = await pool.query('SELECT 1 FROM equipos LIMIT 1');
    if (!e.rows.length){
      await pool.query(`
        INSERT INTO equipos(nombre, sucursal) VALUES
        ('Tucuman','Tucuman'),
        ('Salta','Salta'),
        ('Cordoba','Cordoba'),
        ('La Rioja','La Rioja'),
        ('Catamarca','Catamarca'),
        ('San Juan','San Juan'),
        ('Santiago del Estero','Sgo. del Estero'),
        ('Jujuy','Jujuy')
      `);
    }

     const disciplinas = await pool.query(`
      SELECT nombre
      FROM disciplinas
      ORDER BY id
    `);

    for (const d of disciplinas.rows) {
      const base = d.nombre
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');

      const usuario = `arbitro_${base}`;
      const password = `${base}123`;
      const rol = 'arbitro';

      const ex = await pool.query(
        'SELECT 1 FROM usuarios WHERE usuario=$1',
        [usuario]
      );

      if (!ex.rows.length){
        const hash = await bcrypt.hash(password, 10);
        await pool.query(
          'INSERT INTO usuarios(usuario, clave_hash, rol) VALUES ($1,$2,$3)',
          [usuario, hash, rol]
        );

        console.log(`Árbitro creado: ${usuario} / ${password}`);
      }
    }

    console.log('Seed OK');
    process.exit(0);
  } catch (e) {
    console.error('Seed error', e);
    process.exit(1);
  }

  

}

seed();

  

