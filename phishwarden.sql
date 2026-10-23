-- MÓDULO PREVIO: ESTRUCTURA MULTIEMPRESA

CREATE TABLE empresas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    codigo_acceso VARCHAR(20) UNIQUE NOT NULL, -- El "Código de Sala / Empresa" que usará la App Móvil
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE administradores (
    id SERIAL PRIMARY KEY,
    empresa_id INT REFERENCES empresas(id) ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);


-- 1. MÓDULO DE GESTIÓN DE USUARIOS Y OBJETIVOS

CREATE TABLE departamentos (
    id SERIAL PRIMARY KEY,
    empresa_id INT REFERENCES empresas(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    departamento_id INT REFERENCES departamentos(id) ON DELETE SET NULL,
    nombre VARCHAR(150) NOT NULL,
    correo_corporativo VARCHAR(150) UNIQUE NOT NULL,
    numero_telefonico VARCHAR(20),
    token_notificacion_push TEXT, -- Para Firebase Cloud Messaging (FCM)
    score_riesgo INT DEFAULT 100 CHECK (score_riesgo BETWEEN 0 AND 100),
    racha_dias_seguros INT DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'activo',
    fecha_registro TIMESTAMPTZ DEFAULT NOW(),
    empresa_id INT REFERENCES empresas(id) ON DELETE CASCADE,

);

-- 2. MÓDULO DE SIMULACIÓN DE ATAQUES

CREATE TABLE plantillas (
    id SERIAL PRIMARY KEY,
    empresa_id INT REFERENCES empresas(id) ON DELETE CASCADE,
    titulo VARCHAR(150) NOT NULL,
    metodo_ataque VARCHAR(50) CHECK (metodo_ataque IN ('phishing', 'smishing')) NOT NULL,
    asunto VARCHAR(200),
    cuerpo_html TEXT NOT NULL,
    indicador_dificultad VARCHAR(20) CHECK (indicador_dificultad IN ('baja', 'media', 'alta')),
    etiquetas_categoria VARCHAR(100),
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE campanas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plantilla_id INT REFERENCES plantillas(id) ON DELETE RESTRICT,
    nombre VARCHAR(150) NOT NULL,
    fecha_programada TIMESTAMPTZ NOT NULL,
    modalidad_envio VARCHAR(50) CHECK (modalidad_envio IN ('masivo', 'escalonado')) DEFAULT 'masivo',
    estado VARCHAR(20) CHECK (estado IN ('programada', 'en_curso', 'finalizada', 'cancelada')) DEFAULT 'programada',
    creado_el TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla intermedia para saber a quién se le envía qué campaña y generar su token único
CREATE TABLE campana_usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campana_id UUID REFERENCES campanas(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    token_rastreo UUID DEFAULT uuid_generate_v4() UNIQUE, -- Token en la URL cifrada
    UNIQUE(campana_id, usuario_id)
);

-- 3. MÓDULO DE RASTREO Y ALERTAS (ZERO-CREDENTIAL)

CREATE TABLE eventos_simulacion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    campana_id UUID REFERENCES campanas(id) ON DELETE CASCADE,
    tipo_evento VARCHAR(50) CHECK (tipo_evento IN ('enviado', 'abierto', 'click', 'formulario_enviado', 'descarga_adjunto')) NOT NULL,
    ip_anonimizada VARCHAR(45),
    user_agent TEXT,
    fecha_hora TIMESTAMPTZ DEFAULT NOW()
    -- NOTA DE SEGURIDAD: Estrictamente prohibido agregar columnas para contraseñas o payloads (Cumplimiento Zero-Credential)
);

-- 4. MÓDULO DE CAPACITACIÓN Y GAMIFICACIÓN

CREATE TABLE microlecciones (
    id SERIAL PRIMARY KEY,
    metodo_ataque VARCHAR(50) NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    contenido_multimedia TEXT, -- URL a videos o imágenes
    duracion_minutos INT DEFAULT 2,
    puntos_recompensa INT DEFAULT 10
);

CREATE TABLE preguntas_evaluacion (
    id SERIAL PRIMARY KEY,
    microleccion_id INT REFERENCES microlecciones(id) ON DELETE CASCADE,
    enunciado TEXT NOT NULL,
    opcion_a TEXT NOT NULL,
    opcion_b TEXT NOT NULL,
    opcion_c TEXT NOT NULL,
    opcion_d TEXT NOT NULL,
    respuesta_correcta CHAR(1) CHECK (respuesta_correcta IN ('A', 'B', 'C', 'D')) NOT NULL
);

CREATE TABLE logros_usuarios (
    id SERIAL PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    microleccion_id INT REFERENCES microlecciones(id) ON DELETE CASCADE,
    estado VARCHAR(20) CHECK (estado IN ('completada', 'reprobada')),
    puntos_obtenidos INT DEFAULT 0,
    fecha_completado TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(usuario_id, microleccion_id)
);

CREATE TABLE insignias_medallas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    icono_url TEXT,
    puntos_requeridos INT NOT NULL
);

CREATE TABLE medallas_usuarios (
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    insignia_id INT REFERENCES insignias_medallas(id) ON DELETE CASCADE,
    fecha_obtencion TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (usuario_id, insignia_id)
);