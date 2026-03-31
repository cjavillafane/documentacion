--
-- PostgreSQL database dump
--

-- Dumped from database version 14.1
-- Dumped by pg_dump version 14.1

-- Started on 2026-02-05 13:48:26

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 112990)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 3524 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 217 (class 1259 OID 104760)
-- Name: brackets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.brackets (
    id integer NOT NULL,
    disciplina_id integer NOT NULL,
    nombre text NOT NULL,
    creado_en timestamp without time zone DEFAULT now(),
    olimpiada_id integer
);


ALTER TABLE public.brackets OWNER TO postgres;

--
-- TOC entry 216 (class 1259 OID 104759)
-- Name: brackets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.brackets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.brackets_id_seq OWNER TO postgres;

--
-- TOC entry 3525 (class 0 OID 0)
-- Dependencies: 216
-- Name: brackets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.brackets_id_seq OWNED BY public.brackets.id;


--
-- TOC entry 213 (class 1259 OID 104742)
-- Name: disciplinas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.disciplinas (
    id integer NOT NULL,
    nombre text NOT NULL
);


ALTER TABLE public.disciplinas OWNER TO postgres;

--
-- TOC entry 212 (class 1259 OID 104741)
-- Name: disciplinas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.disciplinas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.disciplinas_id_seq OWNER TO postgres;

--
-- TOC entry 3526 (class 0 OID 0)
-- Dependencies: 212
-- Name: disciplinas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.disciplinas_id_seq OWNED BY public.disciplinas.id;


--
-- TOC entry 215 (class 1259 OID 104751)
-- Name: equipos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.equipos (
    id integer NOT NULL,
    nombre text NOT NULL,
    sucursal text NOT NULL,
    olimpiada_id integer
);


ALTER TABLE public.equipos OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 112920)
-- Name: equipos_disciplinas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.equipos_disciplinas (
    equipo_id integer NOT NULL,
    disciplina_id integer NOT NULL,
    olimpiada_id integer
);


ALTER TABLE public.equipos_disciplinas OWNER TO postgres;

--
-- TOC entry 214 (class 1259 OID 104750)
-- Name: equipos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.equipos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.equipos_id_seq OWNER TO postgres;

--
-- TOC entry 3527 (class 0 OID 0)
-- Dependencies: 214
-- Name: equipos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.equipos_id_seq OWNED BY public.equipos.id;


--
-- TOC entry 227 (class 1259 OID 112956)
-- Name: medallero; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medallero (
    id integer NOT NULL,
    sucursal text NOT NULL,
    puntos integer NOT NULL,
    disciplina_id integer NOT NULL,
    bracket_id integer,
    partido_final_id integer,
    registrado_en timestamp without time zone DEFAULT now() NOT NULL,
    olimpiada_id integer
);


ALTER TABLE public.medallero OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 112955)
-- Name: medallero_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.medallero_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.medallero_id_seq OWNER TO postgres;

--
-- TOC entry 3528 (class 0 OID 0)
-- Dependencies: 226
-- Name: medallero_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.medallero_id_seq OWNED BY public.medallero.id;


--
-- TOC entry 219 (class 1259 OID 104775)
-- Name: partidos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.partidos (
    id integer NOT NULL,
    disciplina_id integer NOT NULL,
    equipo1_id integer,
    equipo2_id integer,
    fecha timestamp without time zone,
    estado character varying(20) DEFAULT 'pendiente'::character varying,
    round integer,
    bracket_id integer,
    next_match_id integer,
    next_match_side smallint,
    parcial_equipo1 integer,
    parcial_equipo2 integer,
    parcial_actualizado_en timestamp without time zone,
    orden integer,
    pen_parcial1 integer,
    pen_parcial2 integer,
    olimpiada_id integer
);


ALTER TABLE public.partidos OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 104803)
-- Name: resultados; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resultados (
    id integer NOT NULL,
    partido_id integer NOT NULL,
    puntaje_equipo1 integer DEFAULT 0 NOT NULL,
    puntaje_equipo2 integer DEFAULT 0 NOT NULL,
    ganador_id integer,
    registrado_en timestamp without time zone DEFAULT now(),
    penales_equipo1 integer,
    penales_equipo2 integer,
    definido_por_penales boolean DEFAULT false
);


ALTER TABLE public.resultados OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 112950)
-- Name: medallero_view; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.medallero_view AS
 SELECT e.sucursal,
    d.nombre AS disciplina,
    sum(
        CASE
            WHEN (r.ganador_id = p.equipo1_id) THEN 3
            WHEN (r.ganador_id = p.equipo2_id) THEN 3
            ELSE 1
        END) AS puntos
   FROM (((public.resultados r
     JOIN public.partidos p ON ((r.partido_id = p.id)))
     JOIN public.equipos e ON (((e.id = r.ganador_id) OR (e.id =
        CASE
            WHEN (r.ganador_id = p.equipo1_id) THEN p.equipo2_id
            ELSE p.equipo1_id
        END))))
     JOIN public.disciplinas d ON ((p.disciplina_id = d.id)))
  WHERE (p.next_match_id IS NULL)
  GROUP BY e.sucursal, d.nombre
  ORDER BY (sum(
        CASE
            WHEN (r.ganador_id = p.equipo1_id) THEN 3
            WHEN (r.ganador_id = p.equipo2_id) THEN 3
            ELSE 1
        END)) DESC;


ALTER TABLE public.medallero_view OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 112982)
-- Name: medallero_vivo; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.medallero_vivo AS
 SELECT medallero.sucursal,
    (sum(medallero.puntos))::integer AS puntos
   FROM public.medallero
  GROUP BY medallero.sucursal
  ORDER BY (sum(medallero.puntos)) DESC;


ALTER TABLE public.medallero_vivo OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 113031)
-- Name: olimpiada_estado; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.olimpiada_estado (
    id integer NOT NULL,
    finalizado boolean DEFAULT false NOT NULL,
    tops text[] DEFAULT '{}'::text[] NOT NULL,
    puntos integer DEFAULT 0 NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.olimpiada_estado OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 121122)
-- Name: olimpiadas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.olimpiadas (
    id integer NOT NULL,
    anio integer NOT NULL,
    sede_provincia_id integer,
    nombre character varying(120),
    fecha_inicio date,
    fecha_fin date,
    estado character varying(20) DEFAULT 'activa'::character varying
);


ALTER TABLE public.olimpiadas OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 121121)
-- Name: olimpiadas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.olimpiadas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.olimpiadas_id_seq OWNER TO postgres;

--
-- TOC entry 3529 (class 0 OID 0)
-- Dependencies: 232
-- Name: olimpiadas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.olimpiadas_id_seq OWNED BY public.olimpiadas.id;


--
-- TOC entry 218 (class 1259 OID 104774)
-- Name: partidos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.partidos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.partidos_id_seq OWNER TO postgres;

--
-- TOC entry 3530 (class 0 OID 0)
-- Dependencies: 218
-- Name: partidos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.partidos_id_seq OWNED BY public.partidos.id;


--
-- TOC entry 231 (class 1259 OID 121113)
-- Name: provincias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.provincias (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL
);


ALTER TABLE public.provincias OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 121112)
-- Name: provincias_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.provincias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.provincias_id_seq OWNER TO postgres;

--
-- TOC entry 3531 (class 0 OID 0)
-- Dependencies: 230
-- Name: provincias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.provincias_id_seq OWNED BY public.provincias.id;


--
-- TOC entry 220 (class 1259 OID 104802)
-- Name: resultados_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.resultados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.resultados_id_seq OWNER TO postgres;

--
-- TOC entry 3532 (class 0 OID 0)
-- Dependencies: 220
-- Name: resultados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.resultados_id_seq OWNED BY public.resultados.id;


--
-- TOC entry 224 (class 1259 OID 112936)
-- Name: resultados_parciales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resultados_parciales (
    id integer NOT NULL,
    partido_id integer,
    equipo1_goles integer DEFAULT 0,
    equipo2_goles integer DEFAULT 0,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.resultados_parciales OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 112935)
-- Name: resultados_parciales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.resultados_parciales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.resultados_parciales_id_seq OWNER TO postgres;

--
-- TOC entry 3533 (class 0 OID 0)
-- Dependencies: 223
-- Name: resultados_parciales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.resultados_parciales_id_seq OWNED BY public.resultados_parciales.id;


--
-- TOC entry 234 (class 1259 OID 129304)
-- Name: usuario_permisos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuario_permisos (
    usuario_id integer NOT NULL,
    olimpiada_id integer NOT NULL,
    disciplina_id integer NOT NULL
);


ALTER TABLE public.usuario_permisos OWNER TO postgres;

--
-- TOC entry 211 (class 1259 OID 104730)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    usuario text NOT NULL,
    clave_hash text NOT NULL,
    rol text NOT NULL,
    CONSTRAINT usuarios_rol_check CHECK ((rol = ANY (ARRAY['admin'::text, 'arbitro'::text, 'visor'::text])))
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- TOC entry 210 (class 1259 OID 104729)
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.usuarios_id_seq OWNER TO postgres;

--
-- TOC entry 3534 (class 0 OID 0)
-- Dependencies: 210
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- TOC entry 3270 (class 2604 OID 104763)
-- Name: brackets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brackets ALTER COLUMN id SET DEFAULT nextval('public.brackets_id_seq'::regclass);


--
-- TOC entry 3268 (class 2604 OID 104745)
-- Name: disciplinas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disciplinas ALTER COLUMN id SET DEFAULT nextval('public.disciplinas_id_seq'::regclass);


--
-- TOC entry 3269 (class 2604 OID 104754)
-- Name: equipos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipos ALTER COLUMN id SET DEFAULT nextval('public.equipos_id_seq'::regclass);


--
-- TOC entry 3283 (class 2604 OID 112959)
-- Name: medallero id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medallero ALTER COLUMN id SET DEFAULT nextval('public.medallero_id_seq'::regclass);


--
-- TOC entry 3290 (class 2604 OID 121125)
-- Name: olimpiadas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.olimpiadas ALTER COLUMN id SET DEFAULT nextval('public.olimpiadas_id_seq'::regclass);


--
-- TOC entry 3272 (class 2604 OID 104778)
-- Name: partidos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partidos ALTER COLUMN id SET DEFAULT nextval('public.partidos_id_seq'::regclass);


--
-- TOC entry 3289 (class 2604 OID 121116)
-- Name: provincias id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provincias ALTER COLUMN id SET DEFAULT nextval('public.provincias_id_seq'::regclass);


--
-- TOC entry 3274 (class 2604 OID 104806)
-- Name: resultados id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultados ALTER COLUMN id SET DEFAULT nextval('public.resultados_id_seq'::regclass);


--
-- TOC entry 3279 (class 2604 OID 112939)
-- Name: resultados_parciales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultados_parciales ALTER COLUMN id SET DEFAULT nextval('public.resultados_parciales_id_seq'::regclass);


--
-- TOC entry 3266 (class 2604 OID 104733)
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- TOC entry 3503 (class 0 OID 104760)
-- Dependencies: 217
-- Data for Name: brackets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.brackets (id, disciplina_id, nombre, creado_en, olimpiada_id) FROM stdin;
155	14	Llave	2025-09-09 12:02:27.21189	\N
156	13	Llave	2025-09-09 12:04:24.290602	\N
157	10	Llave	2025-09-09 12:10:11.255736	\N
158	1	Llave	2025-09-09 12:11:23.495339	\N
159	4	Llave	2025-09-09 12:12:42.351732	\N
160	3	Llave	2025-09-09 12:13:36.747337	\N
161	2	Llave	2025-09-09 12:15:53.836447	\N
162	18	Llave	2025-09-09 12:28:00.701118	\N
163	7	Llave	2025-09-09 12:30:32.541313	\N
164	6	Llave	2025-09-09 12:32:11.451765	\N
165	9	Llave	2025-09-09 12:33:24.809424	\N
166	8	Llave	2025-09-09 12:35:21.204319	\N
167	5	Llave	2025-09-09 12:36:39.70727	\N
168	14	Llave	2025-09-12 09:26:16.696417	\N
169	8	Llave	2025-09-12 13:05:08.616705	\N
170	8	Llave	2025-09-12 13:14:38.639978	\N
171	2	Llave	2025-09-12 14:01:22.158739	\N
172	2	Llave	2025-09-12 14:55:48.933934	\N
173	8	Llave	2025-09-12 14:56:19.885663	\N
174	2	Llave	2025-09-12 14:59:06.446438	\N
175	2	Llave	2025-09-12 15:03:51.799128	\N
176	8	Llave	2025-09-12 15:04:26.983813	\N
177	2	Llave	2025-09-15 07:29:25.324652	\N
178	8	Llave	2025-09-15 07:33:11.607334	\N
179	2	Llave	2025-09-15 07:40:16.877636	\N
180	6	Llave	2025-09-15 07:49:13.242943	\N
181	8	Llave	2025-09-15 08:00:01.835743	\N
182	14	Llave	2025-09-15 08:54:02.458767	\N
183	14	Llave	2025-09-15 13:36:45.323182	\N
184	14	Llave	2025-11-07 13:11:41.412518	\N
185	14	Cuartos Final	2026-01-07 13:49:07.795003	\N
186	18	Llave	2026-01-08 11:22:40.766603	\N
187	18	Llave	2026-01-08 11:23:03.991229	\N
188	18	Llave	2026-01-20 13:47:29.444448	\N
189	18	Llave	2026-01-29 12:17:47.786866	\N
\.


--
-- TOC entry 3499 (class 0 OID 104742)
-- Dependencies: 213
-- Data for Name: disciplinas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.disciplinas (id, nombre) FROM stdin;
1	Futbol de Primera
2	Futbol Veteranos
3	Futbol Senior
4	Futbol Femenino
5	Voley Mixto
6	Sapo Masculino
7	Sapo Femenino
8	Truco Masculino
9	Truco Femenino
10	Basquetbol
11	Loba Masculino
12	Loba Femenino
13	Ajedrez Masculino
14	Ajedrez Femenino
17	Pesca
18	Newcom
15	Atletismo Masculino 100m
16	Atletismo Femenino 100m
19	Atletismo Masculino 400m
20	Atletismo Femenino 400m
\.


--
-- TOC entry 3501 (class 0 OID 104751)
-- Dependencies: 215
-- Data for Name: equipos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.equipos (id, nombre, sucursal, olimpiada_id) FROM stdin;
1	Tucuman	Tucuman	\N
2	San Juan	San Juan	\N
3	La Rioja	La Rioja	\N
4	San Luis	San Luis	\N
5	Jujuy	Jujuy	\N
6	Villa Mercedes	Villa Mercedes	\N
7	Salta	Salta	\N
8	Cordoba	Cordoba	\N
9	Santiago del Estero	Santiago del Estero	\N
10	Catamarca	Catamarca	\N
11	Corrientes	Corrientes	\N
12	Misiones	Misiones	\N
\.


--
-- TOC entry 3508 (class 0 OID 112920)
-- Dependencies: 222
-- Data for Name: equipos_disciplinas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.equipos_disciplinas (equipo_id, disciplina_id, olimpiada_id) FROM stdin;
10	1	\N
8	1	\N
5	1	\N
3	1	\N
7	1	\N
2	1	\N
9	1	\N
1	1	\N
10	2	\N
5	2	\N
3	2	\N
7	2	\N
2	2	\N
4	2	\N
9	2	\N
1	2	\N
6	2	\N
10	3	\N
5	3	\N
3	3	\N
7	3	\N
2	3	\N
9	3	\N
1	3	\N
10	14	\N
7	14	\N
9	14	\N
1	14	\N
10	13	\N
12	13	\N
7	13	\N
2	13	\N
9	13	\N
1	13	\N
10	10	\N
8	10	\N
10	15	\N
5	15	\N
3	15	\N
7	15	\N
9	15	\N
1	15	\N
10	19	\N
5	19	\N
3	19	\N
7	19	\N
9	19	\N
1	19	\N
5	10	\N
3	10	\N
7	10	\N
9	10	\N
1	10	\N
10	4	\N
8	4	\N
7	4	\N
9	4	\N
1	4	\N
10	12	\N
8	12	\N
5	12	\N
3	12	\N
12	12	\N
7	12	\N
2	12	\N
4	12	\N
9	12	\N
1	12	\N
6	12	\N
10	11	\N
8	11	\N
5	11	\N
3	11	\N
12	11	\N
7	11	\N
2	11	\N
10	20	\N
5	20	\N
3	20	\N
7	20	\N
9	20	\N
1	20	\N
4	11	\N
9	11	\N
1	11	\N
6	11	\N
7	18	\N
9	18	\N
1	18	\N
10	7	\N
8	7	\N
5	7	\N
3	7	\N
7	7	\N
2	7	\N
9	7	\N
1	7	\N
10	6	\N
8	6	\N
5	6	\N
3	6	\N
12	6	\N
7	6	\N
2	6	\N
9	6	\N
1	6	\N
10	9	\N
8	9	\N
5	9	\N
3	9	\N
7	9	\N
1	9	\N
10	8	\N
8	8	\N
5	8	\N
10	16	\N
5	16	\N
3	16	\N
7	16	\N
9	16	\N
1	16	\N
10	17	\N
5	17	\N
3	17	\N
12	17	\N
7	17	\N
9	17	\N
1	17	\N
3	8	\N
12	8	\N
7	8	\N
2	8	\N
9	8	\N
1	8	\N
6	8	\N
10	5	\N
8	5	\N
5	5	\N
3	5	\N
7	5	\N
2	5	\N
9	5	\N
1	5	\N
\.


--
-- TOC entry 3512 (class 0 OID 112956)
-- Dependencies: 227
-- Data for Name: medallero; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.medallero (id, sucursal, puntos, disciplina_id, bracket_id, partido_final_id, registrado_en, olimpiada_id) FROM stdin;
44	Tucuman	3	14	155	830	2025-09-12 09:04:03.667224	\N
45	Catamarca	2	14	155	830	2025-09-12 09:04:03.667224	\N
46	Santiago del Estero	1	14	155	830	2025-09-12 09:04:39.458558	\N
47	Tucuman	3	13	156	834	2025-09-12 09:10:09.802728	\N
48	Misiones	2	13	156	834	2025-09-12 09:10:09.802728	\N
49	Salta	1	13	156	834	2025-09-12 09:10:41.961116	\N
53	Tucuman	3	16	\N	\N	2025-09-12 09:26:35.744907	\N
54	Salta	2	16	\N	\N	2025-09-12 09:26:35.744907	\N
55	Santiago del Estero	1	16	\N	\N	2025-09-12 09:26:35.744907	\N
56	Tucuman	3	20	\N	\N	2025-09-12 09:27:07.672726	\N
57	La Rioja	2	20	\N	\N	2025-09-12 09:27:07.672726	\N
58	Jujuy	1	20	\N	\N	2025-09-12 09:27:07.672726	\N
59	Tucuman	3	15	\N	\N	2025-09-12 09:42:03.109209	\N
60	Jujuy	2	15	\N	\N	2025-09-12 09:42:03.109209	\N
61	La Rioja	1	15	\N	\N	2025-09-12 09:42:03.109209	\N
62	Tucuman	3	19	\N	\N	2025-09-12 09:52:05.721997	\N
63	Santiago del Estero	2	19	\N	\N	2025-09-12 09:52:05.721997	\N
64	Jujuy	1	19	\N	\N	2025-09-12 09:52:05.721997	\N
65	Tucuman	3	10	157	842	2025-09-12 10:43:27.541876	\N
66	La Rioja	2	10	157	842	2025-09-12 10:43:27.541876	\N
67	Jujuy	1	10	157	842	2025-09-12 10:43:39.934062	\N
68	Tucuman	3	1	158	849	2025-09-12 10:54:47.59811	\N
69	La Rioja	2	1	158	849	2025-09-12 10:54:47.59811	\N
70	Jujuy	1	1	158	849	2025-09-12 10:56:29.574511	\N
71	Tucuman	3	4	159	852	2025-09-12 10:59:52.752213	\N
72	Cordoba	2	4	159	852	2025-09-12 10:59:52.752213	\N
73	Santiago del Estero	1	4	159	852	2025-09-12 11:00:00.909624	\N
74	Santiago del Estero	3	3	160	860	2025-09-12 11:12:51.895119	\N
75	Salta	2	3	160	860	2025-09-12 11:12:51.895119	\N
76	Tucuman	1	3	160	860	2025-09-12 11:13:09.997074	\N
77	Tucuman	3	12	\N	\N	2025-09-12 11:47:35.797242	\N
78	Villa Mercedes	2	12	\N	\N	2025-09-12 11:47:35.797242	\N
79	San Luis	1	12	\N	\N	2025-09-12 11:47:35.797242	\N
80	Tucuman	3	11	\N	\N	2025-09-12 11:48:42.95633	\N
81	Villa Mercedes	2	11	\N	\N	2025-09-12 11:48:42.95633	\N
82	San Luis	1	11	\N	\N	2025-09-12 11:48:42.95633	\N
83	Santiago del Estero	3	18	162	873	2025-09-12 11:55:56.524852	\N
84	Tucuman	2	18	162	873	2025-09-12 11:55:56.524852	\N
85	Salta	1	18	162	873	2025-09-12 11:56:02.099646	\N
89	Tucuman	3	7	163	880	2025-09-12 12:06:27.515485	\N
90	La Rioja	2	7	163	880	2025-09-12 12:06:27.515485	\N
91	Cordoba	1	7	163	880	2025-09-12 12:06:44.891287	\N
92	Tucuman	3	9	165	895	2025-09-12 12:18:22.868036	\N
93	Cordoba	2	9	165	895	2025-09-12 12:18:22.868036	\N
94	Catamarca	1	9	165	895	2025-09-12 12:18:38.474692	\N
95	Tucuman	3	5	167	914	2025-09-12 12:33:21.026766	\N
96	Santiago del Estero	2	5	167	914	2025-09-12 12:33:21.026766	\N
97	Catamarca	1	5	167	914	2025-09-12 12:33:30.674476	\N
98	Tucuman	3	2	179	1017	2025-09-15 07:46:17.728093	\N
99	La Rioja	2	2	179	1017	2025-09-15 07:46:17.728093	\N
100	San Juan	1	2	179	1017	2025-09-15 07:46:29.588014	\N
101	Tucuman	3	6	180	1025	2025-09-15 07:56:03.740515	\N
102	Catamarca	2	6	180	1025	2025-09-15 07:56:03.740515	\N
103	Misiones	1	6	180	1025	2025-09-15 07:56:09.915267	\N
104	Tucuman	3	8	181	1034	2025-09-15 08:01:38.162498	\N
105	Cordoba	2	8	181	1034	2025-09-15 08:01:38.162498	\N
106	Salta	1	8	181	1034	2025-09-15 08:01:50.451354	\N
107	Tucuman	3	14	182	1037	2025-09-15 08:54:17.04248	\N
108	Salta	2	14	182	1037	2025-09-15 08:54:17.04248	\N
109	Tucuman	3	14	183	1040	2025-09-15 13:37:10.98909	\N
110	Catamarca	2	14	183	1040	2025-09-15 13:37:10.98909	\N
111	Santiago del Estero	1	14	183	1040	2025-09-15 13:37:20.280257	\N
112	Jujuy	3	17	\N	\N	2026-01-07 13:50:54.305236	\N
113	La Rioja	2	17	\N	\N	2026-01-07 13:50:54.305236	\N
114	Salta	1	17	\N	\N	2026-01-07 13:50:54.305236	\N
\.


--
-- TOC entry 3513 (class 0 OID 113031)
-- Dependencies: 229
-- Data for Name: olimpiada_estado; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.olimpiada_estado (id, finalizado, tops, puntos, updated_at) FROM stdin;
1	t	{Tucuman}	57	2025-09-15 08:02:33.032561
\.


--
-- TOC entry 3517 (class 0 OID 121122)
-- Dependencies: 233
-- Data for Name: olimpiadas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.olimpiadas (id, anio, sede_provincia_id, nombre, fecha_inicio, fecha_fin, estado) FROM stdin;
3	2026	11	dfgdfgdf	\N	\N	activa
4	2026	10	Catamarca 2026	\N	\N	activa
6	2027	11	fgsdfgfdg	\N	\N	activa
\.


--
-- TOC entry 3505 (class 0 OID 104775)
-- Dependencies: 219
-- Data for Name: partidos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.partidos (id, disciplina_id, equipo1_id, equipo2_id, fecha, estado, round, bracket_id, next_match_id, next_match_side, parcial_equipo1, parcial_equipo2, parcial_actualizado_en, orden, pen_parcial1, pen_parcial2, olimpiada_id) FROM stdin;
831	13	2	12	\N	finalizado	1	156	835	\N	0	1	2025-09-12 09:07:58.146072	1	\N	\N	\N
830	14	10	1	\N	finalizado	2	155	\N	\N	0	1	2025-09-12 09:04:01.785732	1	\N	\N	\N
833	13	10	1	\N	finalizado	1	156	834	\N	0	1	2025-09-12 09:09:12.402498	3	\N	\N	\N
835	13	12	7	\N	finalizado	2	156	834	\N	1	0	2025-09-12 09:09:24.360627	1	\N	\N	\N
836	10	8	1	\N	finalizado	1	157	840	\N	0	1	2025-09-12 10:39:09.727074	1	\N	\N	\N
837	10	9	10	\N	finalizado	1	157	840	\N	1	0	2025-09-12 10:40:59.630806	2	\N	\N	\N
838	10	5	7	\N	finalizado	1	157	841	\N	1	0	2025-09-12 10:41:07.510095	3	\N	\N	\N
839	10	3	\N	\N	pendiente	1	157	841	\N	\N	\N	\N	4	\N	\N	\N
892	9	7	1	\N	finalizado	1	165	896	\N	\N	\N	\N	1	\N	\N	\N
844	1	9	10	\N	finalizado	1	158	847	\N	1	0	2025-09-12 10:53:51.086543	2	\N	\N	\N
840	10	1	9	\N	finalizado	2	157	842	\N	1	0	2025-09-12 10:42:34.212759	1	\N	\N	\N
843	1	1	7	\N	finalizado	1	158	847	\N	1	0	2025-09-12 10:53:05.88572	1	\N	\N	\N
877	7	5	8	\N	finalizado	1	163	879	\N	0	1	2025-09-12 12:05:55.676408	4	\N	\N	\N
845	1	3	8	\N	finalizado	1	158	848	\N	1	0	2025-09-12 10:54:16.453189	3	\N	\N	\N
846	1	5	2	\N	finalizado	1	158	848	\N	1	0	2025-09-12 10:54:24.230771	4	\N	\N	\N
847	1	1	9	\N	finalizado	2	158	849	\N	1	0	2025-09-12 10:54:33.01418	1	\N	\N	\N
848	1	3	5	\N	finalizado	2	158	849	\N	1	0	2025-09-12 10:54:40.015158	2	\N	\N	\N
850	4	7	8	\N	finalizado	1	159	852	\N	0	1	2025-09-12 10:58:50.558971	1	\N	\N	\N
851	4	10	1	\N	finalizado	1	159	853	\N	0	1	2025-09-12 10:59:05.438252	2	\N	\N	\N
854	3	9	10	\N	finalizado	1	160	858	\N	1	0	2025-09-12 11:07:13.91717	1	\N	\N	\N
855	3	2	3	\N	finalizado	1	160	858	\N	1	0	2025-09-12 11:10:58.475223	2	\N	\N	\N
856	3	5	7	\N	finalizado	1	160	859	\N	0	1	2025-09-12 11:11:10.952939	3	\N	\N	\N
857	3	1	\N	\N	pendiente	1	160	859	\N	\N	\N	\N	4	\N	\N	\N
860	3	9	7	\N	finalizado	3	160	\N	\N	1	0	2025-09-12 11:12:50.994397	1	\N	\N	\N
861	2	6	10	\N	finalizado	1	161	866	\N	1	0	2025-09-12 11:23:23.853109	1	\N	\N	\N
1043	14	\N	\N	\N	pendiente	2	184	\N	\N	\N	\N	\N	1	\N	\N	\N
862	2	1	2	\N	finalizado	1	161	866	\N	1	0	2025-09-12 11:23:32.6688	2	\N	\N	\N
863	2	3	4	\N	finalizado	1	161	867	\N	0	1	2025-09-12 11:23:39.116397	3	\N	\N	\N
864	2	9	5	\N	finalizado	1	161	867	\N	1	0	2025-09-12 11:23:45.429147	4	\N	\N	\N
872	18	1	7	\N	finalizado	1	162	873	\N	1	0	2025-09-12 11:55:49.068149	1	\N	\N	\N
865	2	7	\N	\N	pendiente	1	161	868	\N	\N	\N	\N	5	\N	\N	\N
867	2	4	9	\N	finalizado	2	161	869	\N	1	0	2025-09-12 11:35:58.613741	2	\N	\N	\N
873	18	1	9	\N	finalizado	2	162	\N	\N	0	1	2025-09-12 11:55:55.460557	1	\N	\N	\N
868	2	7	\N	\N	pendiente	2	161	870	\N	\N	\N	\N	3	\N	\N	\N
871	2	\N	\N	\N	pendiente	4	161	\N	\N	\N	\N	\N	1	\N	\N	\N
869	2	1	4	\N	pendiente	3	161	871	\N	\N	\N	\N	1	\N	\N	\N
870	2	\N	\N	\N	pendiente	3	161	871	\N	\N	\N	\N	2	\N	\N	\N
874	7	10	2	\N	finalizado	1	163	878	\N	1	0	2025-09-12 12:05:32.339425	1	\N	\N	\N
1041	14	10	7	\N	pendiente	1	184	1043	1	\N	\N	\N	1	\N	\N	\N
875	7	9	3	\N	finalizado	1	163	878	\N	0	1	2025-09-12 12:05:38.915917	2	\N	\N	\N
876	7	7	1	\N	finalizado	1	163	879	\N	0	1	2025-09-12 12:05:46.907905	3	\N	\N	\N
880	7	3	1	\N	finalizado	3	163	\N	\N	0	1	2025-09-12 12:06:26.405451	1	\N	\N	\N
881	6	5	12	\N	finalizado	1	164	886	\N	1	0	2025-09-12 12:11:37.891013	1	\N	\N	\N
884	6	7	1	\N	finalizado	1	164	887	\N	0	1	2025-09-12 12:11:49.883215	4	\N	\N	\N
883	6	10	2	\N	finalizado	1	164	887	\N	1	0	2025-09-12 12:12:09.674727	3	\N	\N	\N
882	6	9	8	\N	finalizado	1	164	886	\N	1	0	2025-09-12 12:11:57.755559	2	\N	\N	\N
893	9	3	10	\N	finalizado	1	165	896	\N	\N	\N	\N	2	\N	\N	\N
885	6	3	\N	\N	pendiente	1	164	888	\N	\N	\N	\N	5	\N	\N	\N
897	8	1	7	\N	finalizado	1	166	902	\N	1	0	2025-09-12 12:27:20.741191	1	\N	\N	\N
886	6	5	9	\N	pendiente	2	164	889	\N	\N	\N	\N	1	\N	\N	\N
894	9	8	5	\N	finalizado	1	165	895	\N	1	0	2025-09-12 12:18:06.794922	3	\N	\N	\N
888	6	3	\N	\N	pendiente	2	164	890	\N	\N	\N	\N	3	\N	\N	\N
891	6	\N	\N	\N	pendiente	4	164	\N	\N	\N	\N	\N	1	\N	\N	\N
889	6	\N	\N	\N	pendiente	3	164	891	\N	\N	\N	\N	1	\N	\N	\N
890	6	\N	\N	\N	pendiente	3	164	891	\N	\N	\N	\N	2	\N	\N	\N
896	9	1	10	\N	finalizado	2	165	895	\N	1	0	2025-09-12 12:18:13.070595	1	\N	\N	\N
898	8	6	8	\N	finalizado	1	166	902	\N	1	0	2025-09-12 12:27:27.500226	2	\N	\N	\N
899	8	10	2	\N	finalizado	1	166	903	\N	1	0	2025-09-12 12:27:31.802935	3	\N	\N	\N
900	8	3	9	\N	finalizado	1	166	903	\N	1	0	2025-09-12 12:27:35.026568	4	\N	\N	\N
901	8	12	5	\N	finalizado	1	166	904	\N	1	0	2025-09-12 12:27:40.435142	5	\N	\N	\N
902	8	1	6	\N	finalizado	2	166	905	\N	1	0	2025-09-12 12:28:24.743991	1	\N	\N	\N
904	8	12	\N	\N	pendiente	2	166	906	\N	\N	\N	\N	3	\N	\N	\N
905	8	1	10	\N	pendiente	3	166	907	\N	\N	\N	\N	1	\N	\N	\N
908	5	9	7	\N	finalizado	1	167	912	\N	1	0	2025-09-12 12:32:23.250316	1	\N	\N	\N
909	5	8	5	\N	finalizado	1	167	912	\N	1	0	2025-09-12 12:32:54.370452	2	\N	\N	\N
907	8	\N	\N	\N	pendiente	4	166	\N	\N	\N	\N	\N	1	\N	\N	\N
910	5	10	3	\N	finalizado	1	167	913	\N	1	0	2025-09-12 12:33:02.059743	3	\N	\N	\N
906	8	\N	\N	\N	pendiente	3	166	907	\N	\N	\N	\N	2	\N	\N	\N
911	5	1	2	\N	finalizado	1	167	913	\N	1	0	2025-09-12 12:33:05.010313	4	\N	\N	\N
913	5	10	1	\N	finalizado	2	167	914	\N	0	1	2025-09-12 12:33:15.371239	2	\N	\N	\N
832	13	7	9	\N	finalizado	1	156	835	\N	1	0	2025-09-12 09:09:06.513972	2	\N	\N	\N
828	14	10	7	\N	finalizado	1	155	830	\N	1	0	2025-09-12 09:03:42.633265	1	\N	\N	\N
829	14	9	1	\N	finalizado	1	155	830	\N	0	1	2025-09-12 09:03:53.370021	2	\N	\N	\N
834	13	1	12	\N	finalizado	3	156	\N	\N	1	0	2025-09-12 09:10:08.842472	1	\N	\N	\N
917	14	\N	\N	\N	pendiente	2	168	\N	\N	\N	\N	\N	1	\N	\N	\N
915	14	10	7	\N	pendiente	1	168	917	\N	\N	\N	\N	1	\N	\N	\N
916	14	9	1	\N	pendiente	1	168	917	\N	\N	\N	\N	2	\N	\N	\N
841	10	5	3	\N	finalizado	2	157	842	\N	0	1	2025-09-12 10:43:14.985482	2	\N	\N	\N
842	10	1	3	\N	finalizado	3	157	\N	\N	1	0	2025-09-12 10:43:24.599893	1	\N	\N	\N
849	1	1	3	\N	finalizado	3	158	\N	\N	1	0	2025-09-12 10:54:46.701453	1	\N	\N	\N
853	4	1	9	\N	finalizado	2	159	852	\N	1	0	2025-09-12 10:59:41.350318	1	\N	\N	\N
852	4	8	1	\N	finalizado	3	159	\N	\N	0	1	2025-09-12 10:59:49.414	1	\N	\N	\N
933	8	1	6	\N	finalizado	1	170	936	\N	\N	\N	\N	5	1	0	\N
929	8	10	8	\N	finalizado	1	170	934	\N	0	0	2025-10-01 11:58:02.471311	1	1	0	\N
932	8	2	9	\N	penales	1	170	935	\N	\N	\N	\N	4	1	2	\N
858	3	9	2	\N	finalizado	2	160	860	\N	1	0	2025-09-12 11:12:31.569323	1	\N	\N	\N
859	3	7	1	\N	finalizado	2	160	860	\N	\N	\N	\N	2	\N	\N	\N
931	8	12	7	\N	finalizado	1	170	935	\N	\N	\N	\N	3	1	0	\N
866	2	6	1	\N	finalizado	2	161	869	\N	0	1	2025-09-12 11:35:52.808809	1	\N	\N	\N
934	8	10	5	\N	finalizado	2	170	937	\N	\N	\N	\N	1	1	0	\N
878	7	10	3	\N	finalizado	2	163	880	\N	0	1	2025-09-12 12:05:59.884257	1	\N	\N	\N
930	8	5	3	\N	finalizado	1	170	934	\N	\N	\N	\N	2	1	0	\N
935	8	12	9	\N	pendiente	2	170	937	\N	\N	\N	\N	2	\N	\N	\N
879	7	1	8	\N	finalizado	2	163	880	\N	1	0	2025-09-12 12:06:13.058983	2	\N	\N	\N
1042	14	9	1	\N	pendiente	1	184	1043	2	\N	\N	\N	2	\N	\N	\N
887	6	1	10	\N	pendiente	2	164	889	\N	\N	\N	\N	2	\N	\N	\N
939	8	\N	\N	\N	pendiente	4	170	\N	\N	\N	\N	\N	1	\N	\N	\N
895	9	8	1	\N	finalizado	3	165	\N	\N	0	1	2025-09-12 12:18:21.451787	1	\N	\N	\N
938	8	\N	\N	\N	pendiente	3	170	939	\N	\N	\N	\N	2	\N	\N	\N
903	8	10	3	\N	finalizado	2	166	905	\N	1	0	2025-09-12 12:28:35.967235	2	\N	\N	\N
912	5	9	8	\N	finalizado	2	167	914	\N	1	0	2025-09-12 12:33:12.220426	1	\N	\N	\N
914	5	9	1	\N	finalizado	3	167	\N	\N	0	1	2025-09-12 12:33:20.442549	1	\N	\N	\N
952	2	3	7	\N	pendiente	1	172	955	2	\N	\N	\N	2	\N	\N	\N
953	2	2	4	\N	pendiente	1	172	956	1	\N	\N	\N	3	\N	\N	\N
954	2	9	1	\N	pendiente	1	172	956	2	\N	\N	\N	4	\N	\N	\N
955	2	\N	\N	\N	pendiente	2	172	957	1	\N	\N	\N	1	\N	\N	\N
944	2	6	\N	\N	pendiente	1	171	947	\N	\N	\N	\N	5	\N	\N	\N
928	8	\N	\N	\N	pendiente	4	169	\N	\N	\N	\N	\N	1	\N	\N	\N
926	8	\N	\N	\N	pendiente	3	169	928	\N	\N	\N	\N	1	\N	\N	\N
927	8	\N	\N	\N	pendiente	3	169	928	\N	\N	\N	\N	2	\N	\N	\N
956	2	\N	\N	\N	pendiente	2	172	957	2	\N	\N	\N	2	\N	\N	\N
918	8	1	7	\N	finalizado	1	169	923	\N	1	0	2025-09-12 13:05:21.906324	1	\N	\N	\N
957	2	\N	\N	\N	pendiente	3	172	958	1	\N	\N	\N	1	\N	\N	\N
919	8	6	8	\N	finalizado	1	169	923	\N	1	0	2025-09-12 13:05:25.410144	2	\N	\N	\N
923	8	1	6	\N	pendiente	2	169	926	\N	\N	\N	\N	1	\N	\N	\N
947	2	6	\N	\N	pendiente	2	171	949	\N	\N	\N	\N	3	\N	\N	\N
920	8	10	2	\N	finalizado	1	169	924	\N	1	0	2025-09-12 13:05:38.650468	3	\N	\N	\N
950	2	\N	\N	\N	pendiente	4	171	\N	\N	\N	\N	\N	1	\N	\N	\N
948	2	\N	\N	\N	pendiente	3	171	950	\N	\N	\N	\N	1	\N	\N	\N
949	2	\N	\N	\N	pendiente	3	171	950	\N	\N	\N	\N	2	\N	\N	\N
922	8	12	5	\N	finalizado	1	169	925	\N	1	0	2025-09-12 13:05:47.994137	5	\N	\N	\N
925	8	12	\N	\N	pendiente	2	169	927	\N	\N	\N	\N	3	\N	\N	\N
940	2	10	5	\N	finalizado	1	171	945	\N	1	0	2025-09-12 14:01:39.280028	1	\N	\N	\N
921	8	3	9	\N	finalizado	1	169	924	\N	0	1	2025-09-12 13:06:10.217509	4	\N	\N	\N
924	8	10	9	\N	pendiente	2	169	926	\N	\N	\N	\N	2	\N	\N	\N
941	2	3	7	\N	finalizado	1	171	945	\N	1	0	2025-09-12 14:01:42.559903	2	\N	\N	\N
945	2	10	3	\N	pendiente	2	171	948	\N	\N	\N	\N	1	\N	\N	\N
942	2	2	4	\N	finalizado	1	171	946	\N	1	0	2025-09-12 14:01:45.087428	3	\N	\N	\N
967	8	\N	\N	\N	pendiente	4	173	\N	\N	\N	\N	\N	1	\N	\N	\N
943	2	9	1	\N	finalizado	1	171	946	\N	1	0	2025-09-12 14:01:48.207408	4	\N	\N	\N
946	2	2	9	\N	pendiente	2	171	948	\N	\N	\N	\N	2	\N	\N	\N
958	2	\N	6	\N	pendiente	4	172	\N	\N	\N	\N	\N	1	\N	\N	\N
951	2	10	5	\N	pendiente	1	172	955	1	\N	\N	\N	1	\N	\N	\N
963	8	1	6	\N	pendiente	1	173	967	2	\N	\N	\N	5	\N	\N	\N
966	8	\N	\N	\N	pendiente	3	173	967	1	\N	\N	\N	1	\N	\N	\N
959	8	10	8	\N	finalizado	1	173	964	1	\N	\N	\N	1	\N	\N	\N
975	2	\N	6	\N	pendiente	4	174	\N	\N	\N	\N	\N	1	\N	\N	\N
960	8	5	3	\N	finalizado	1	173	964	2	\N	\N	\N	2	\N	\N	\N
968	2	10	5	\N	pendiente	1	174	972	1	\N	\N	\N	1	\N	\N	\N
964	8	10	5	\N	pendiente	2	173	966	1	\N	\N	\N	1	\N	\N	\N
961	8	12	7	\N	finalizado	1	173	965	1	\N	\N	\N	3	\N	\N	\N
969	2	3	7	\N	pendiente	1	174	972	2	\N	\N	\N	2	\N	\N	\N
970	2	2	4	\N	pendiente	1	174	973	1	\N	\N	\N	3	\N	\N	\N
962	8	2	9	\N	finalizado	1	173	965	2	\N	\N	\N	4	\N	\N	\N
971	2	9	1	\N	pendiente	1	174	973	2	\N	\N	\N	4	\N	\N	\N
965	8	12	2	\N	pendiente	2	173	966	2	\N	\N	\N	2	\N	\N	\N
972	2	\N	\N	\N	pendiente	2	174	974	1	\N	\N	\N	1	\N	\N	\N
973	2	\N	\N	\N	pendiente	2	174	974	2	\N	\N	\N	2	\N	\N	\N
974	2	\N	\N	\N	pendiente	3	174	975	1	\N	\N	\N	1	\N	\N	\N
983	2	\N	\N	\N	pendiente	3	175	\N	\N	\N	\N	\N	1	\N	\N	\N
976	2	10	5	\N	pendiente	1	175	980	1	\N	\N	\N	1	\N	\N	\N
977	2	3	7	\N	pendiente	1	175	980	2	\N	\N	\N	2	\N	\N	\N
978	2	2	4	\N	pendiente	1	175	982	2	\N	\N	\N	3	\N	\N	\N
979	2	9	1	\N	pendiente	1	175	981	1	\N	\N	\N	4	\N	\N	\N
980	2	\N	\N	\N	pendiente	2	175	983	1	\N	\N	\N	1	\N	\N	\N
981	2	\N	6	\N	pendiente	2	175	982	1	\N	\N	\N	2	\N	\N	\N
982	2	\N	\N	\N	pendiente	2	175	983	2	\N	\N	\N	3	\N	\N	\N
992	8	\N	\N	\N	pendiente	4	176	\N	\N	\N	\N	\N	1	\N	\N	\N
984	8	10	8	\N	pendiente	1	176	989	1	\N	\N	\N	1	\N	\N	\N
985	8	5	3	\N	pendiente	1	176	989	2	\N	\N	\N	2	\N	\N	\N
986	8	12	7	\N	pendiente	1	176	991	2	\N	\N	\N	3	\N	\N	\N
987	8	2	9	\N	pendiente	1	176	990	1	\N	\N	\N	4	\N	\N	\N
988	8	1	6	\N	pendiente	1	176	990	2	\N	\N	\N	5	\N	\N	\N
989	8	\N	\N	\N	pendiente	2	176	992	1	\N	\N	\N	1	\N	\N	\N
990	8	\N	\N	\N	pendiente	2	176	991	1	\N	\N	\N	2	\N	\N	\N
991	8	\N	\N	\N	pendiente	3	176	992	2	\N	\N	\N	1	\N	\N	\N
1048	18	\N	1	\N	pendiente	2	186	\N	\N	\N	\N	\N	1	\N	\N	\N
1047	18	7	9	\N	pendiente	1	186	1048	1	\N	\N	\N	1	\N	\N	\N
993	2	10	5	\N	finalizado	1	177	997	1	1	0	2025-09-15 07:29:36.981082	1	\N	\N	\N
994	2	3	7	\N	finalizado	1	177	997	2	\N	\N	\N	2	\N	\N	\N
1000	2	10	\N	\N	pendiente	3	177	\N	\N	\N	\N	\N	1	\N	\N	\N
937	8	10	\N	\N	pendiente	3	170	939	\N	\N	\N	\N	1	\N	\N	\N
936	8	1	\N	\N	pendiente	2	170	938	\N	\N	\N	\N	3	\N	\N	\N
1017	2	3	1	\N	finalizado	4	179	\N	\N	\N	\N	\N	1	\N	\N	\N
995	2	2	4	\N	finalizado	1	177	999	2	1	0	2025-09-15 07:29:51.652596	3	\N	\N	\N
996	2	9	1	\N	finalizado	1	177	998	1	1	0	2025-09-15 07:30:04.668236	4	\N	\N	\N
997	2	10	3	\N	finalizado	2	177	1000	1	1	0	2025-09-15 07:30:28.585892	1	\N	\N	\N
1030	8	1	6	\N	finalizado	1	181	1032	2	\N	\N	\N	5	\N	\N	\N
998	2	9	6	\N	finalizado	2	177	999	1	0	1	2025-09-15 07:30:38.956293	2	\N	\N	\N
1046	14	\N	\N	\N	pendiente	2	185	\N	\N	\N	\N	\N	1	\N	\N	\N
999	2	6	2	\N	pendiente	2	177	1000	2	\N	\N	\N	3	\N	\N	\N
1009	8	\N	\N	\N	pendiente	4	178	\N	\N	\N	\N	\N	1	\N	\N	\N
1044	14	10	7	\N	pendiente	1	185	1046	1	\N	\N	\N	1	\N	\N	\N
1031	8	8	3	\N	finalizado	2	181	1034	1	\N	\N	\N	1	\N	\N	\N
1045	14	9	1	\N	pendiente	1	185	1046	2	\N	\N	\N	2	\N	\N	\N
1032	8	9	1	\N	finalizado	2	181	1033	1	\N	\N	\N	2	\N	\N	\N
1018	6	10	8	\N	finalizado	1	180	1022	1	\N	\N	\N	1	\N	\N	\N
1050	18	\N	1	\N	pendiente	2	187	\N	\N	\N	\N	\N	1	\N	\N	\N
1049	18	7	9	\N	pendiente	1	187	1050	1	\N	\N	\N	1	\N	\N	\N
1001	8	10	8	\N	finalizado	1	178	1006	1	\N	\N	\N	1	\N	\N	\N
1019	6	5	3	\N	finalizado	1	180	1022	2	\N	\N	\N	2	\N	\N	\N
1033	8	1	7	\N	finalizado	3	181	1034	2	\N	\N	\N	1	\N	\N	\N
1002	8	5	3	\N	finalizado	1	178	1006	2	\N	\N	\N	2	\N	\N	\N
1052	18	\N	1	\N	pendiente	2	188	\N	\N	\N	\N	\N	1	\N	\N	\N
1006	8	10	5	\N	pendiente	2	178	1009	1	\N	\N	\N	1	\N	\N	\N
1003	8	12	7	\N	finalizado	1	178	1008	2	\N	\N	\N	3	\N	\N	\N
1021	6	2	9	\N	finalizado	1	180	1023	1	\N	\N	\N	4	\N	\N	\N
1008	8	\N	12	\N	pendiente	3	178	1009	2	\N	\N	\N	1	\N	\N	\N
1004	8	2	9	\N	finalizado	1	178	1007	1	\N	\N	\N	4	\N	\N	\N
1051	18	7	9	\N	pendiente	1	188	1052	1	\N	\N	\N	1	\N	\N	\N
1034	8	8	1	\N	finalizado	4	181	\N	\N	\N	\N	\N	1	\N	\N	\N
1005	8	1	6	\N	finalizado	1	178	1007	2	\N	\N	\N	5	\N	\N	\N
1020	6	12	7	\N	finalizado	1	180	1024	2	\N	\N	\N	3	\N	\N	\N
1007	8	9	1	\N	pendiente	2	178	1008	1	\N	\N	\N	2	\N	\N	\N
1022	6	10	5	\N	finalizado	2	180	1025	1	\N	\N	\N	1	\N	\N	\N
1023	6	2	1	\N	finalizado	2	180	1024	1	\N	\N	\N	2	\N	\N	\N
1054	18	\N	1	\N	pendiente	2	189	\N	\N	\N	\N	\N	1	\N	\N	\N
1010	2	10	5	\N	finalizado	1	179	1014	1	\N	\N	\N	1	\N	\N	\N
1053	18	7	9	\N	pendiente	1	189	1054	1	\N	\N	\N	1	\N	\N	\N
1024	6	1	12	\N	finalizado	3	180	1025	2	\N	\N	\N	1	\N	\N	\N
1011	2	3	7	\N	finalizado	1	179	1014	2	\N	\N	\N	2	\N	\N	\N
1035	14	10	7	\N	finalizado	1	182	1037	1	0	1	2025-09-15 08:54:06.20401	1	\N	\N	\N
1012	2	2	4	\N	finalizado	1	179	1016	2	\N	\N	\N	3	\N	\N	\N
1025	6	10	1	\N	finalizado	4	180	\N	\N	\N	\N	\N	1	\N	\N	\N
1013	2	9	1	\N	finalizado	1	179	1015	1	\N	\N	\N	4	\N	\N	\N
1015	2	1	6	\N	finalizado	2	179	1016	1	\N	\N	\N	2	\N	\N	\N
1014	2	10	3	\N	finalizado	2	179	1017	1	\N	\N	\N	1	\N	\N	\N
1016	2	1	2	\N	finalizado	3	179	1017	2	\N	\N	\N	1	\N	\N	\N
1036	14	9	1	\N	finalizado	1	182	1037	2	0	1	2025-09-15 08:54:11.641511	2	\N	\N	\N
1037	14	7	1	\N	finalizado	2	182	\N	\N	0	1	2025-09-15 08:54:15.45265	1	\N	\N	\N
1026	8	10	8	\N	finalizado	1	181	1031	1	\N	\N	\N	1	\N	\N	\N
1027	8	5	3	\N	finalizado	1	181	1031	2	\N	\N	\N	2	\N	\N	\N
1028	8	12	7	\N	finalizado	1	181	1033	2	\N	\N	\N	3	\N	\N	\N
1029	8	2	9	\N	finalizado	1	181	1032	1	\N	\N	\N	4	\N	\N	\N
1038	14	10	7	\N	finalizado	1	183	1040	1	1	0	2025-09-15 13:36:58.035513	1	\N	\N	\N
1039	14	9	1	\N	finalizado	1	183	1040	2	0	1	2025-09-15 13:37:02.471818	2	\N	\N	\N
1040	14	10	1	\N	finalizado	2	183	\N	\N	0	1	2025-09-15 13:37:10.020187	1	\N	\N	\N
\.


--
-- TOC entry 3515 (class 0 OID 121113)
-- Dependencies: 231
-- Data for Name: provincias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.provincias (id, nombre) FROM stdin;
1	Tucuman
2	San Juan
3	La Rioja
4	San Luis
5	Jujuy
6	Villa Mercedes
7	Salta
8	Cordoba
9	Santiago del Estero
10	Catamarca
11	Corrientes
12	Misiones
\.


--
-- TOC entry 3507 (class 0 OID 104803)
-- Dependencies: 221
-- Data for Name: resultados; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resultados (id, partido_id, puntaje_equipo1, puntaje_equipo2, ganador_id, registrado_en, penales_equipo1, penales_equipo2, definido_por_penales) FROM stdin;
193	828	1	0	10	2025-09-12 09:03:45.819567	\N	\N	f
194	829	0	1	1	2025-09-12 09:03:54.32334	\N	\N	f
195	830	0	1	1	2025-09-12 09:04:03.667224	\N	\N	f
196	831	0	1	12	2025-09-12 09:08:00.922823	\N	\N	f
197	832	1	0	7	2025-09-12 09:09:08.083031	\N	\N	f
198	833	0	1	1	2025-09-12 09:09:13.260458	\N	\N	f
199	835	1	0	12	2025-09-12 09:09:56.979297	\N	\N	f
200	834	1	0	1	2025-09-12 09:10:09.802728	\N	\N	f
201	836	0	1	1	2025-09-12 10:39:12.220687	\N	\N	f
202	837	1	0	9	2025-09-12 10:41:00.243348	\N	\N	f
203	838	1	0	5	2025-09-12 10:41:08.127442	\N	\N	f
204	840	1	0	1	2025-09-12 10:42:34.990707	\N	\N	f
205	841	0	1	3	2025-09-12 10:43:15.638679	\N	\N	f
206	842	1	0	1	2025-09-12 10:43:27.541876	\N	\N	f
207	843	1	0	1	2025-09-12 10:53:06.790515	\N	\N	f
208	844	1	0	9	2025-09-12 10:53:52.670522	\N	\N	f
209	845	1	0	3	2025-09-12 10:54:18.310326	\N	\N	f
210	846	1	0	5	2025-09-12 10:54:24.926047	\N	\N	f
211	847	1	0	1	2025-09-12 10:54:33.622697	\N	\N	f
212	848	1	0	3	2025-09-12 10:54:40.598171	\N	\N	f
213	849	1	0	1	2025-09-12 10:54:47.59811	\N	\N	f
214	850	0	1	8	2025-09-12 10:58:52.822995	\N	\N	f
215	851	0	1	1	2025-09-12 10:59:09.087067	\N	\N	f
216	853	1	0	1	2025-09-12 10:59:42.966209	\N	\N	f
217	852	0	1	1	2025-09-12 10:59:52.752213	\N	\N	f
218	854	1	0	9	2025-09-12 11:07:14.62288	\N	\N	f
219	855	1	0	2	2025-09-12 11:10:59.368291	\N	\N	f
220	856	0	1	7	2025-09-12 11:11:11.591938	\N	\N	f
221	858	1	0	9	2025-09-12 11:12:32.200238	\N	\N	f
222	859	1	0	7	2025-09-12 11:12:38.62388	\N	\N	f
223	860	1	0	9	2025-09-12 11:12:51.895119	\N	\N	f
224	861	1	0	6	2025-09-12 11:23:25.197882	\N	\N	f
225	862	1	0	1	2025-09-12 11:23:33.26955	\N	\N	f
226	863	0	1	4	2025-09-12 11:23:39.750053	\N	\N	f
227	864	1	0	9	2025-09-12 11:23:45.997657	\N	\N	f
228	866	0	1	1	2025-09-12 11:35:53.780319	\N	\N	f
229	867	1	0	4	2025-09-12 11:35:59.301479	\N	\N	f
230	872	1	0	1	2025-09-12 11:55:50.205378	\N	\N	f
231	873	0	1	9	2025-09-12 11:55:56.524852	\N	\N	f
232	874	1	0	10	2025-09-12 12:05:34.172685	\N	\N	f
233	875	0	1	3	2025-09-12 12:05:42.020891	\N	\N	f
234	876	0	1	1	2025-09-12 12:05:47.516281	\N	\N	f
235	877	0	1	8	2025-09-12 12:05:56.77275	\N	\N	f
236	878	0	1	3	2025-09-12 12:06:00.564365	\N	\N	f
237	879	1	0	1	2025-09-12 12:06:13.916896	\N	\N	f
238	880	0	1	1	2025-09-12 12:06:27.515485	\N	\N	f
239	881	1	0	5	2025-09-12 12:11:39.115634	\N	\N	f
240	884	0	1	1	2025-09-12 12:11:50.563625	\N	\N	f
241	882	1	0	9	2025-09-12 12:11:58.283927	\N	\N	f
242	883	1	0	10	2025-09-12 12:12:10.276297	\N	\N	f
243	892	0	1	1	2025-09-12 12:17:47.180517	\N	\N	f
244	893	0	1	10	2025-09-12 12:17:58.667391	\N	\N	f
245	894	1	0	8	2025-09-12 12:18:07.419532	\N	\N	f
246	896	1	0	1	2025-09-12 12:18:13.708569	\N	\N	f
247	895	0	1	1	2025-09-12 12:18:22.868036	\N	\N	f
248	897	1	0	1	2025-09-12 12:27:23.891096	\N	\N	f
249	898	1	0	6	2025-09-12 12:27:28.347583	\N	\N	f
250	899	1	0	10	2025-09-12 12:27:32.371448	\N	\N	f
251	900	1	0	3	2025-09-12 12:27:35.644681	\N	\N	f
252	901	1	0	12	2025-09-12 12:27:40.995207	\N	\N	f
253	902	1	0	1	2025-09-12 12:28:25.37085	\N	\N	f
254	903	1	0	10	2025-09-12 12:28:36.491278	\N	\N	f
255	908	1	0	9	2025-09-12 12:32:23.81948	\N	\N	f
256	909	1	0	8	2025-09-12 12:32:54.954847	\N	\N	f
257	910	1	0	10	2025-09-12 12:33:02.698673	\N	\N	f
258	911	1	0	1	2025-09-12 12:33:05.562893	\N	\N	f
259	912	1	0	9	2025-09-12 12:33:13.026249	\N	\N	f
260	913	0	1	1	2025-09-12 12:33:15.929833	\N	\N	f
261	914	0	1	1	2025-09-12 12:33:21.026766	\N	\N	f
262	918	1	0	1	2025-09-12 13:05:23.171006	\N	\N	f
263	919	1	0	6	2025-09-12 13:05:25.987984	\N	\N	f
264	920	1	0	10	2025-09-12 13:05:39.154388	\N	\N	f
265	922	1	0	12	2025-09-12 13:05:48.530419	\N	\N	f
266	921	0	1	9	2025-09-12 13:06:11.018191	\N	\N	f
267	940	1	0	10	2025-09-12 14:01:40.091565	\N	\N	f
268	941	1	0	3	2025-09-12 14:01:43.143856	\N	\N	f
269	942	1	0	2	2025-09-12 14:01:45.656594	\N	\N	f
270	943	1	0	9	2025-09-12 14:01:49.248697	\N	\N	f
271	959	1	0	10	2025-09-12 14:58:03.219027	\N	\N	f
272	960	1	0	5	2025-09-12 14:58:05.296164	\N	\N	f
273	961	1	0	12	2025-09-12 14:58:07.182594	\N	\N	f
274	962	1	0	2	2025-09-12 14:58:09.406711	\N	\N	f
275	993	1	0	10	2025-09-15 07:29:39.413665	\N	\N	f
276	994	1	0	3	2025-09-15 07:29:44.649627	\N	\N	f
277	995	1	0	2	2025-09-15 07:29:52.356255	\N	\N	f
278	996	1	0	9	2025-09-15 07:30:05.388907	\N	\N	f
279	997	1	0	10	2025-09-15 07:30:29.355324	\N	\N	f
280	998	0	1	6	2025-09-15 07:30:39.749231	\N	\N	f
281	1001	1	0	10	2025-09-15 07:33:22.660219	\N	\N	f
282	1002	1	0	5	2025-09-15 07:33:27.628459	\N	\N	f
283	1003	1	0	12	2025-09-15 07:33:33.932347	\N	\N	f
284	1004	0	1	9	2025-09-15 07:33:43.484132	\N	\N	f
285	1005	1	0	1	2025-09-15 07:33:58.964387	\N	\N	f
286	1010	1	0	10	2025-09-15 07:41:23.183914	\N	\N	f
287	1011	1	0	3	2025-09-15 07:41:33.214482	\N	\N	f
288	1012	1	0	2	2025-09-15 07:41:38.926599	\N	\N	f
289	1013	0	1	1	2025-09-15 07:41:58.413223	\N	\N	f
290	1015	1	0	1	2025-09-15 07:43:21.228227	\N	\N	f
291	1014	0	1	3	2025-09-15 07:43:27.204975	\N	\N	f
292	1016	1	0	1	2025-09-15 07:44:07.646875	\N	\N	f
293	1017	0	1	1	2025-09-15 07:46:17.728093	\N	\N	f
294	1018	1	0	10	2025-09-15 07:49:25.164109	\N	\N	f
295	1019	1	0	5	2025-09-15 07:49:46.757082	\N	\N	f
296	1021	1	0	2	2025-09-15 07:49:58.453053	\N	\N	f
297	1020	1	0	12	2025-09-15 07:55:35.339933	\N	\N	f
298	1022	1	0	10	2025-09-15 07:55:45.676307	\N	\N	f
299	1023	0	1	1	2025-09-15 07:55:52.605941	\N	\N	f
300	1024	1	0	1	2025-09-15 07:56:00.277371	\N	\N	f
301	1025	0	1	1	2025-09-15 07:56:03.740515	\N	\N	f
302	1026	0	1	8	2025-09-15 08:00:10.874803	\N	\N	f
303	1027	0	1	3	2025-09-15 08:00:13.405264	\N	\N	f
304	1028	0	1	7	2025-09-15 08:00:24.484572	\N	\N	f
305	1029	0	1	9	2025-09-15 08:00:34.844959	\N	\N	f
306	1030	1	0	1	2025-09-15 08:00:40.364429	\N	\N	f
307	1031	1	0	8	2025-09-15 08:00:57.549126	\N	\N	f
308	1032	0	1	1	2025-09-15 08:01:06.237305	\N	\N	f
309	1033	1	0	1	2025-09-15 08:01:16.123846	\N	\N	f
310	1034	0	1	1	2025-09-15 08:01:38.162498	\N	\N	f
311	1035	0	1	7	2025-09-15 08:54:06.946013	\N	\N	f
312	1036	0	1	1	2025-09-15 08:54:12.460757	\N	\N	f
313	1037	0	1	1	2025-09-15 08:54:17.04248	\N	\N	f
314	1038	1	0	10	2025-09-15 13:36:58.771288	\N	\N	f
315	1039	0	1	1	2025-09-15 13:37:03.275602	\N	\N	f
316	1040	0	1	1	2025-09-15 13:37:10.98909	\N	\N	f
318	930	0	0	5	2025-10-02 13:01:23.294373	1	0	t
317	929	0	0	10	2025-10-02 10:07:05.043292	1	0	t
321	932	0	0	9	2025-10-03 10:02:34.344202	1	2	t
320	931	0	0	12	2025-10-02 14:01:43.562945	1	0	t
323	933	0	0	1	2025-10-03 12:52:53.620421	1	0	t
324	934	0	0	10	2025-10-03 14:10:15.198429	1	0	t
\.


--
-- TOC entry 3510 (class 0 OID 112936)
-- Dependencies: 224
-- Data for Name: resultados_parciales; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resultados_parciales (id, partido_id, equipo1_goles, equipo2_goles, updated_at) FROM stdin;
\.


--
-- TOC entry 3518 (class 0 OID 129304)
-- Dependencies: 234
-- Data for Name: usuario_permisos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuario_permisos (usuario_id, olimpiada_id, disciplina_id) FROM stdin;
23	4	14
22	4	13
25	4	16
29	4	20
24	4	15
28	4	19
19	4	10
10	4	1
13	4	4
12	4	3
11	4	2
21	4	12
20	4	11
26	4	17
16	4	7
15	4	6
18	4	9
17	4	8
14	4	5
\.


--
-- TOC entry 3497 (class 0 OID 104730)
-- Dependencies: 211
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, usuario, clave_hash, rol) FROM stdin;
6	admin	$2b$10$vHBjTvZAEFHta4oag9zZUO09f/kyj9MMCtd0esi.Pj2iqbqBkgmfS	admin
8	usuario	$2a$06$IfFb1x.fhQQ52k90R2yy3.Im0zmt3VS./rHFlKzoEEeSx4CMC/9ei	visor
10	arbitro_futbol_de_primera	$2b$10$XSH9cPvyI8T9sQEBYyTMtucj.C0K2UtgwO0vr1zB5G/UZkrvYo/qm	arbitro
11	arbitro_futbol_veteranos	$2b$10$nq22.GA1tCCVtNV7N4L8zuvEUOGbNGSJC.m3HsCT9kqGb.uOSg4dO	arbitro
12	arbitro_futbol_senior	$2b$10$JN9N2flojzsHF/CeWmlY9eaQ6inmVyTLYmn/2icnspm1xPtMoFXmm	arbitro
13	arbitro_futbol_femenino	$2b$10$8hs/p/yZJ8okU9tN3SxKteiLUavyd45c9J1kZdA27nw9bgEXFwNOa	arbitro
14	arbitro_voley_mixto	$2b$10$amftgqpWD8B5D36e5Z09/.pScAjGWlPbmXWk1a4hyQdborgKb7QE.	arbitro
15	arbitro_sapo_masculino	$2b$10$DB4cSi7nbF2LSjnoIRRPcedIi63sIGgX09Sk5z8Sjgq.u/kt/.tKC	arbitro
16	arbitro_sapo_femenino	$2b$10$EML7c7BEKESdaycCDI0rC.qHJY/n2abr2UAWBSH7EGf3v0lRty34K	arbitro
17	arbitro_truco_masculino	$2b$10$uasUHkS0YYp4ndvZkltadOLryXAMM2coK0aOv11rfSrvUqs1WONtm	arbitro
18	arbitro_truco_femenino	$2b$10$k/hGo70egaytKAKeuZ7VeebLB6vE3bZ6DhOHXBT1q0RK1Kr9xx7r6	arbitro
19	arbitro_basquetbol	$2b$10$ZvvgZYibF0WpYHBoAkpXA.uZRJdZGbxWQXchwmYvV9lwtRDvCqEvC	arbitro
20	arbitro_loba_masculino	$2b$10$ADCcJyYB.ar49j97Yde0T.fABfo9WSaBOpWxvGaZgpuLEj84v4g6K	arbitro
21	arbitro_loba_femenino	$2b$10$wmjhvsJT2myzVzTQuXv/eOMnCZvjdfruS/zfsqqhU6RBOJpajoeTG	arbitro
22	arbitro_ajedrez_masculino	$2b$10$SJQl6dRJwHyDIrSd4u7bL.FZki.K.ymYwTkRRH/T.ZLQ2Yskh9AAa	arbitro
23	arbitro_ajedrez_femenino	$2b$10$LwmEsM3.Mtl6IKvDB5CZFeOVhqlGD/rmymMwjpbZYKZ9/Ye/KgKP2	arbitro
24	arbitro_atletismo_masculino_100m	$2b$10$J3HJVJ0i6tKjxJiGCM0jUuPfocX5SCfpyZKWIQ//lU8mkglugyJFC	arbitro
25	arbitro_atletismo_femenino_100m	$2b$10$AzgkikmVJg8a8RB/gSzcm./GtEoSDRKRK1pLQBLEcZvi8mj4KdOeK	arbitro
26	arbitro_pesca	$2b$10$L1Qum9TW7lh8DK5BnkA5Vugs8pls3XMEqL0eUIDZTGc5UKiqoJF.a	arbitro
27	arbitro_newcom	$2b$10$9figIZqTjFYH7CZCtXBFI.8GsujhN5uRPoBZjpsi2q3g3k3sY8BiG	arbitro
28	arbitro_atletismo_masculino_400m	$2b$10$EL7qZuqhhQ4U/WJhVG9jSO7qvX9E0SX1rWHm9IjlIAzy5fGmbFdu2	arbitro
29	arbitro_atletismo_femenino_400m	$2b$10$HcV11Lp0XD8aCrUCZ2eATud6kNsE1tGCrlYtUfuWIZeEXJutxZXoy	arbitro
\.


--
-- TOC entry 3535 (class 0 OID 0)
-- Dependencies: 216
-- Name: brackets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.brackets_id_seq', 189, true);


--
-- TOC entry 3536 (class 0 OID 0)
-- Dependencies: 212
-- Name: disciplinas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.disciplinas_id_seq', 1, false);


--
-- TOC entry 3537 (class 0 OID 0)
-- Dependencies: 214
-- Name: equipos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.equipos_id_seq', 1, false);


--
-- TOC entry 3538 (class 0 OID 0)
-- Dependencies: 226
-- Name: medallero_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.medallero_id_seq', 114, true);


--
-- TOC entry 3539 (class 0 OID 0)
-- Dependencies: 232
-- Name: olimpiadas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.olimpiadas_id_seq', 6, true);


--
-- TOC entry 3540 (class 0 OID 0)
-- Dependencies: 218
-- Name: partidos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.partidos_id_seq', 1054, true);


--
-- TOC entry 3541 (class 0 OID 0)
-- Dependencies: 230
-- Name: provincias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.provincias_id_seq', 2, true);


--
-- TOC entry 3542 (class 0 OID 0)
-- Dependencies: 220
-- Name: resultados_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.resultados_id_seq', 324, true);


--
-- TOC entry 3543 (class 0 OID 0)
-- Dependencies: 223
-- Name: resultados_parciales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.resultados_parciales_id_seq', 1, false);


--
-- TOC entry 3544 (class 0 OID 0)
-- Dependencies: 210
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 29, true);


--
-- TOC entry 3302 (class 2606 OID 104768)
-- Name: brackets brackets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brackets
    ADD CONSTRAINT brackets_pkey PRIMARY KEY (id);


--
-- TOC entry 3297 (class 2606 OID 104749)
-- Name: disciplinas disciplinas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disciplinas
    ADD CONSTRAINT disciplinas_pkey PRIMARY KEY (id);


--
-- TOC entry 3312 (class 2606 OID 112924)
-- Name: equipos_disciplinas equipos_disciplinas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipos_disciplinas
    ADD CONSTRAINT equipos_disciplinas_pkey PRIMARY KEY (equipo_id, disciplina_id);


--
-- TOC entry 3299 (class 2606 OID 104758)
-- Name: equipos equipos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipos
    ADD CONSTRAINT equipos_pkey PRIMARY KEY (id);


--
-- TOC entry 3316 (class 2606 OID 112989)
-- Name: medallero medallero_final_sucursal_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medallero
    ADD CONSTRAINT medallero_final_sucursal_uniq UNIQUE (partido_final_id, sucursal);


--
-- TOC entry 3318 (class 2606 OID 112964)
-- Name: medallero medallero_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medallero
    ADD CONSTRAINT medallero_pkey PRIMARY KEY (id);


--
-- TOC entry 3320 (class 2606 OID 113041)
-- Name: olimpiada_estado olimpiada_estado_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.olimpiada_estado
    ADD CONSTRAINT olimpiada_estado_pkey PRIMARY KEY (id);


--
-- TOC entry 3326 (class 2606 OID 121130)
-- Name: olimpiadas olimpiadas_anio_sede_provincia_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.olimpiadas
    ADD CONSTRAINT olimpiadas_anio_sede_provincia_id_key UNIQUE (anio, sede_provincia_id);


--
-- TOC entry 3328 (class 2606 OID 121128)
-- Name: olimpiadas olimpiadas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.olimpiadas
    ADD CONSTRAINT olimpiadas_pkey PRIMARY KEY (id);


--
-- TOC entry 3306 (class 2606 OID 104781)
-- Name: partidos partidos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partidos
    ADD CONSTRAINT partidos_pkey PRIMARY KEY (id);


--
-- TOC entry 3322 (class 2606 OID 121120)
-- Name: provincias provincias_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provincias
    ADD CONSTRAINT provincias_nombre_key UNIQUE (nombre);


--
-- TOC entry 3324 (class 2606 OID 121118)
-- Name: provincias provincias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provincias
    ADD CONSTRAINT provincias_pkey PRIMARY KEY (id);


--
-- TOC entry 3314 (class 2606 OID 112944)
-- Name: resultados_parciales resultados_parciales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultados_parciales
    ADD CONSTRAINT resultados_parciales_pkey PRIMARY KEY (id);


--
-- TOC entry 3308 (class 2606 OID 113029)
-- Name: resultados resultados_partido_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultados
    ADD CONSTRAINT resultados_partido_id_key UNIQUE (partido_id);


--
-- TOC entry 3310 (class 2606 OID 104811)
-- Name: resultados resultados_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultados
    ADD CONSTRAINT resultados_pkey PRIMARY KEY (id);


--
-- TOC entry 3333 (class 2606 OID 129308)
-- Name: usuario_permisos usuario_permisos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario_permisos
    ADD CONSTRAINT usuario_permisos_pkey PRIMARY KEY (usuario_id, olimpiada_id, disciplina_id);


--
-- TOC entry 3293 (class 2606 OID 104738)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 3295 (class 2606 OID 104740)
-- Name: usuarios usuarios_usuario_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_usuario_key UNIQUE (usuario);


--
-- TOC entry 3329 (class 1259 OID 129326)
-- Name: idx_up_disciplina; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_up_disciplina ON public.usuario_permisos USING btree (disciplina_id);


--
-- TOC entry 3330 (class 1259 OID 129325)
-- Name: idx_up_olimpiada; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_up_olimpiada ON public.usuario_permisos USING btree (olimpiada_id);


--
-- TOC entry 3331 (class 1259 OID 129324)
-- Name: idx_up_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_up_usuario ON public.usuario_permisos USING btree (usuario_id);


--
-- TOC entry 3304 (class 1259 OID 121173)
-- Name: ix_partidos_olimpiada; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_partidos_olimpiada ON public.partidos USING btree (olimpiada_id);


--
-- TOC entry 3303 (class 1259 OID 121171)
-- Name: uq_brackets_nombre_edicion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_brackets_nombre_edicion ON public.brackets USING btree (olimpiada_id, nombre);


--
-- TOC entry 3300 (class 1259 OID 121172)
-- Name: uq_equipos_nombre_edicion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_equipos_nombre_edicion ON public.equipos USING btree (olimpiada_id, nombre);


--
-- TOC entry 3335 (class 2606 OID 104769)
-- Name: brackets brackets_disciplina_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brackets
    ADD CONSTRAINT brackets_disciplina_id_fkey FOREIGN KEY (disciplina_id) REFERENCES public.disciplinas(id) ON DELETE CASCADE;


--
-- TOC entry 3345 (class 2606 OID 112930)
-- Name: equipos_disciplinas equipos_disciplinas_disciplina_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipos_disciplinas
    ADD CONSTRAINT equipos_disciplinas_disciplina_id_fkey FOREIGN KEY (disciplina_id) REFERENCES public.disciplinas(id) ON DELETE CASCADE;


--
-- TOC entry 3344 (class 2606 OID 112925)
-- Name: equipos_disciplinas equipos_disciplinas_equipo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipos_disciplinas
    ADD CONSTRAINT equipos_disciplinas_equipo_id_fkey FOREIGN KEY (equipo_id) REFERENCES public.equipos(id) ON DELETE CASCADE;


--
-- TOC entry 3336 (class 2606 OID 121151)
-- Name: brackets fk_brackets_olimpiadas; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brackets
    ADD CONSTRAINT fk_brackets_olimpiadas FOREIGN KEY (olimpiada_id) REFERENCES public.olimpiadas(id);


--
-- TOC entry 3346 (class 2606 OID 121161)
-- Name: equipos_disciplinas fk_eqdisc_olimpiadas; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipos_disciplinas
    ADD CONSTRAINT fk_eqdisc_olimpiadas FOREIGN KEY (olimpiada_id) REFERENCES public.olimpiadas(id);


--
-- TOC entry 3334 (class 2606 OID 121166)
-- Name: equipos fk_equipos_olimpiadas; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipos
    ADD CONSTRAINT fk_equipos_olimpiadas FOREIGN KEY (olimpiada_id) REFERENCES public.olimpiadas(id);


--
-- TOC entry 3341 (class 2606 OID 121156)
-- Name: partidos fk_partidos_olimpiadas; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partidos
    ADD CONSTRAINT fk_partidos_olimpiadas FOREIGN KEY (olimpiada_id) REFERENCES public.olimpiadas(id);


--
-- TOC entry 3349 (class 2606 OID 112972)
-- Name: medallero medallero_bracket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medallero
    ADD CONSTRAINT medallero_bracket_id_fkey FOREIGN KEY (bracket_id) REFERENCES public.brackets(id) ON DELETE CASCADE;


--
-- TOC entry 3348 (class 2606 OID 112967)
-- Name: medallero medallero_disciplina_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medallero
    ADD CONSTRAINT medallero_disciplina_id_fkey FOREIGN KEY (disciplina_id) REFERENCES public.disciplinas(id) ON DELETE CASCADE;


--
-- TOC entry 3350 (class 2606 OID 112977)
-- Name: medallero medallero_partido_final_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medallero
    ADD CONSTRAINT medallero_partido_final_id_fkey FOREIGN KEY (partido_final_id) REFERENCES public.partidos(id) ON DELETE CASCADE;


--
-- TOC entry 3351 (class 2606 OID 121131)
-- Name: olimpiadas olimpiadas_sede_provincia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.olimpiadas
    ADD CONSTRAINT olimpiadas_sede_provincia_id_fkey FOREIGN KEY (sede_provincia_id) REFERENCES public.provincias(id);


--
-- TOC entry 3340 (class 2606 OID 104797)
-- Name: partidos partidos_bracket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partidos
    ADD CONSTRAINT partidos_bracket_id_fkey FOREIGN KEY (bracket_id) REFERENCES public.brackets(id);


--
-- TOC entry 3337 (class 2606 OID 104782)
-- Name: partidos partidos_disciplina_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partidos
    ADD CONSTRAINT partidos_disciplina_id_fkey FOREIGN KEY (disciplina_id) REFERENCES public.disciplinas(id) ON DELETE CASCADE;


--
-- TOC entry 3338 (class 2606 OID 104787)
-- Name: partidos partidos_equipo1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partidos
    ADD CONSTRAINT partidos_equipo1_id_fkey FOREIGN KEY (equipo1_id) REFERENCES public.equipos(id);


--
-- TOC entry 3339 (class 2606 OID 104792)
-- Name: partidos partidos_equipo2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partidos
    ADD CONSTRAINT partidos_equipo2_id_fkey FOREIGN KEY (equipo2_id) REFERENCES public.equipos(id);


--
-- TOC entry 3343 (class 2606 OID 104817)
-- Name: resultados resultados_ganador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultados
    ADD CONSTRAINT resultados_ganador_id_fkey FOREIGN KEY (ganador_id) REFERENCES public.equipos(id);


--
-- TOC entry 3347 (class 2606 OID 112945)
-- Name: resultados_parciales resultados_parciales_partido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultados_parciales
    ADD CONSTRAINT resultados_parciales_partido_id_fkey FOREIGN KEY (partido_id) REFERENCES public.partidos(id) ON DELETE CASCADE;


--
-- TOC entry 3342 (class 2606 OID 104812)
-- Name: resultados resultados_partido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resultados
    ADD CONSTRAINT resultados_partido_id_fkey FOREIGN KEY (partido_id) REFERENCES public.partidos(id) ON DELETE CASCADE;


--
-- TOC entry 3354 (class 2606 OID 129319)
-- Name: usuario_permisos usuario_permisos_disciplina_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario_permisos
    ADD CONSTRAINT usuario_permisos_disciplina_id_fkey FOREIGN KEY (disciplina_id) REFERENCES public.disciplinas(id) ON DELETE CASCADE;


--
-- TOC entry 3353 (class 2606 OID 129314)
-- Name: usuario_permisos usuario_permisos_olimpiada_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario_permisos
    ADD CONSTRAINT usuario_permisos_olimpiada_id_fkey FOREIGN KEY (olimpiada_id) REFERENCES public.olimpiadas(id) ON DELETE CASCADE;


--
-- TOC entry 3352 (class 2606 OID 129309)
-- Name: usuario_permisos usuario_permisos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario_permisos
    ADD CONSTRAINT usuario_permisos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


-- Completed on 2026-02-05 13:48:26

--
-- PostgreSQL database dump complete
--

