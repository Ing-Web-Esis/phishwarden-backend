# 🛡️ PhishWarden MJ - API RESTful Central (Backend)

Servidor central desarrollado bajo **Arquitectura Hexagonal** encargado de la lógica de negocio en ciberseguridad, orquestación de campañas de phishing/smishing, cálculo de puntuación de riesgo y procesamiento de eventos en tiempo real con política **Zero-Credential Storage**.

## 🚀 Tecnologías Utilizadas
* **Lenguaje & Framework:** Node.js + NestJS (TypeScript)
* **Base de Datos:** Supabase (PostgreSQL) + Row Level Security (RLS)
* **Envío de Correos (Phishing):** Resend / Brevo API
* **Envío de SMS (Smishing):** Twilio API
* **Notificaciones Push:** Firebase Cloud Messaging (FCM)
* **Despliegue & Contenedores:** Docker + Render / Koyeb
* **Documentación de API:** Swagger / OpenAPI

## 👥 Integrantes Responsables
* **Russell Jhean Paul Arratia Paz** - Backend & Ciberseguridad

## 🛠️ Instalación y Ejecución Local
```bash
# 1. Clonar el repositorio
git clone [https://github.com/TU-ORGANIZACION/phishwarden-backend.git](https://github.com/TU-ORGANIZACION/phishwarden-backend.git)
cd phishwarden-backend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno (.env)
cp .env.example .env

# 4. Iniciar en modo desarrollo
npm run start:dev


## 🔒 Políticas de Ramas y Contribución

* `main`: Solo recibe cambios desde `develop` mediante Pull Requests aprobados y probados.
* `develop`: Rama base de integración diaria.
* `feature/*`: Ramas individuales para cada tarea (ej. `feature/login-jwt`).
* **Regla de Oro:** Prohibido hacer `git push` directo a `main` o `develop`.