-- Agregar columna plan a la tabla empresas si no existe
ALTER TABLE empresas 
ADD COLUMN IF NOT EXISTS plan VARCHAR(30) DEFAULT 'professional';

-- Asegurar que los registros existentes cuenten con un plan por defecto
UPDATE empresas 
SET plan = 'professional' 
WHERE plan IS NULL;
