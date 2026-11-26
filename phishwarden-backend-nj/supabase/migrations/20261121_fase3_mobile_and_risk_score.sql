-- Migración Fase 3: M3 Móvil, Ajuste de score_riesgo a 0 y Reportes Sospechosos

-- 1. Modificar valor por defecto de score_riesgo en la tabla usuarios a 0
ALTER TABLE usuarios ALTER COLUMN score_riesgo SET DEFAULT 0;

-- 2. Restablecer a 0 a los usuarios existentes en 100 que no tengan eventos de fallo (click o formulario_enviado)
UPDATE usuarios 
SET score_riesgo = 0 
WHERE (score_riesgo = 100 OR score_riesgo IS NULL)
  AND id NOT IN (
    SELECT DISTINCT usuario_id 
    FROM eventos_simulacion 
    WHERE usuario_id IS NOT NULL 
      AND tipo_evento IN ('click', 'formulario_enviado')
  );

-- 3. Crear tabla de reportes sospechosos de la app móvil
CREATE TABLE IF NOT EXISTS reportes_sospechosos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    canal VARCHAR(20) NOT NULL CHECK (canal IN ('email', 'sms', 'otro')),
    remitente VARCHAR(150) NOT NULL,
    asunto VARCHAR(200),
    descripcion TEXT,
    url_sospechosa VARCHAR(500),
    fecha_reporte TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reportes_usuario_id ON reportes_sospechosos(usuario_id);
