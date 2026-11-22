import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function loadEnv(): void {
  const candidatePaths = [
    resolve(process.cwd(), '.env'),
    resolve(__dirname, '../.env'),
    resolve(__dirname, '.env'),
    resolve(process.cwd(), 'phishwarden-backend/phishwarden-backend-nj/.env'),
    resolve(process.cwd(), 'phishwarden-backend-nj/.env'),
  ];

  for (const envPath of candidatePaths) {
    if (existsSync(envPath)) {
      if (typeof process.loadEnvFile === 'function') {
        try {
          process.loadEnvFile(envPath);
          if (process.env.DATABASE_URL) {
            return;
          }
        } catch {
          // Si falla el cargador nativo, continuamos con el parser manual
        }
      }

      try {
        const content = readFileSync(envPath, 'utf8');
        for (const line of content.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const separatorIndex = trimmed.indexOf('=');
          if (separatorIndex !== -1) {
            const key = trimmed.slice(0, separatorIndex).trim();
            let val = trimmed.slice(separatorIndex + 1).trim();
            if (
              (val.startsWith('"') && val.endsWith('"')) ||
              (val.startsWith("'") && val.endsWith("'"))
            ) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
        if (process.env.DATABASE_URL) {
          return;
        }
      } catch {
        // Continuar buscando en otras rutas candidatas
      }
    }
  }
}

// Ejecutar inmediatamente al ser importado
loadEnv();
