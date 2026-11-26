-- ==============================================================================
-- Migración Fase 4: Capacitación Predefinida, Evaluaciones, Gamificación y Ranking
-- ==============================================================================

-- 1. Actualización de restricciones CHECK en logros_usuarios
ALTER TABLE logros_usuarios DROP CONSTRAINT IF EXISTS logros_usuarios_estado_check;
ALTER TABLE logros_usuarios ADD CONSTRAINT logros_usuarios_estado_check CHECK (estado IN ('pendiente', 'completada', 'reprobada'));
ALTER TABLE logros_usuarios ALTER COLUMN fecha_completado DROP DEFAULT;

-- 2. Seed Idempotente de Microlecciones Predefinidas (4 reactivas por vector + 2 generales)
INSERT INTO microlecciones (metodo_ataque, titulo, contenido_multimedia, duracion_minutos, puntos_recompensa)
SELECT 'phishing', 'Identificación de Phishing por Correo Electrónico', 'https://images.unsplash.com/photo-1563986768609-322da13575f3', 2, 10
WHERE NOT EXISTS (SELECT 1 FROM microlecciones WHERE titulo = 'Identificación de Phishing por Correo Electrónico');

INSERT INTO microlecciones (metodo_ataque, titulo, contenido_multimedia, duracion_minutos, puntos_recompensa)
SELECT 'smishing', 'Protección contra Smishing y Mensajería SMS Fraudulenta', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5', 2, 10
WHERE NOT EXISTS (SELECT 1 FROM microlecciones WHERE titulo = 'Protección contra Smishing y Mensajería SMS Fraudulenta');

INSERT INTO microlecciones (metodo_ataque, titulo, contenido_multimedia, duracion_minutos, puntos_recompensa)
SELECT 'vishing', 'Ingeniería Social Telefónica y Vishing', 'https://images.unsplash.com/photo-1520607164024-05b9994514a8', 3, 15
WHERE NOT EXISTS (SELECT 1 FROM microlecciones WHERE titulo = 'Ingeniería Social Telefónica y Vishing');

INSERT INTO microlecciones (metodo_ataque, titulo, contenido_multimedia, duracion_minutos, puntos_recompensa)
SELECT 'ingenieria_social', 'Pretexting y Manipulación Psicológica en el Trabajo', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b', 3, 15
WHERE NOT EXISTS (SELECT 1 FROM microlecciones WHERE titulo = 'Pretexting y Manipulación Psicológica en el Trabajo');

INSERT INTO microlecciones (metodo_ataque, titulo, contenido_multimedia, duracion_minutos, puntos_recompensa)
SELECT 'general', 'Fundamentos de Ciberseguridad y Enlaces Maliciosos', 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7', 2, 10
WHERE NOT EXISTS (SELECT 1 FROM microlecciones WHERE titulo = 'Fundamentos de Ciberseguridad y Enlaces Maliciosos');

INSERT INTO microlecciones (metodo_ataque, titulo, contenido_multimedia, duracion_minutos, puntos_recompensa)
SELECT 'general', 'Gestión Segura de Contraseñas y Doble Factor (2FA)', 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb', 2, 10
WHERE NOT EXISTS (SELECT 1 FROM microlecciones WHERE titulo = 'Gestión Segura de Contraseñas y Doble Factor (2FA)');

INSERT INTO microlecciones (metodo_ataque, titulo, contenido_multimedia, duracion_minutos, puntos_recompensa)
SELECT 'general', 'Detección de Archivos Adjuntos Maliciosos y Malware', 'https://images.unsplash.com/photo-1563089145-599997674d42', 2, 10
WHERE NOT EXISTS (SELECT 1 FROM microlecciones WHERE titulo = 'Detección de Archivos Adjuntos Maliciosos y Malware');

INSERT INTO microlecciones (metodo_ataque, titulo, contenido_multimedia, duracion_minutos, puntos_recompensa)
SELECT 'general', 'Suplantación de Identidad de Ejecutivos (BEC) y Facturas Falsas', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab', 3, 15
WHERE NOT EXISTS (SELECT 1 FROM microlecciones WHERE titulo = 'Suplantación de Identidad de Ejecutivos (BEC) y Facturas Falsas');

INSERT INTO microlecciones (metodo_ataque, titulo, contenido_multimedia, duracion_minutos, puntos_recompensa)
SELECT 'general', 'Protocolo de Respuesta y Reporte de Incidentes de Phishing', 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d', 2, 10
WHERE NOT EXISTS (SELECT 1 FROM microlecciones WHERE titulo = 'Protocolo de Respuesta y Reporte de Incidentes de Phishing');

-- 3. Seed Idempotente de Preguntas de Evaluación (3 por microlección, microleccion_id resuelto dinámicamente)

-- Microlección 1: Identificación de Phishing por Correo Electrónico
INSERT INTO preguntas_evaluacion (microleccion_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta)
SELECT 
    (SELECT id FROM microlecciones WHERE titulo = 'Identificación de Phishing por Correo Electrónico' LIMIT 1),
    '¿Cuál es la señal más clara de que un correo entrante puede ser un intento de phishing?',
    'Urgencia extrema exigiendo ingresar credenciales y discrepancia en el dominio del remitente',
    'El correo fue enviado durante el horario habitual de oficina',
    'El remitente incluye el logotipo oficial de la empresa en la cabecera',
    'El correo no contiene ningún archivo adjunto ni hipervínculo',
    'A'
WHERE NOT EXISTS (
    SELECT 1 FROM preguntas_evaluacion 
    WHERE microleccion_id = (SELECT id FROM microlecciones WHERE titulo = 'Identificación de Phishing por Correo Electrónico' LIMIT 1)
      AND enunciado = '¿Cuál es la señal más clara de que un correo entrante puede ser un intento de phishing?'
);

INSERT INTO preguntas_evaluacion (microleccion_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta)
SELECT 
    (SELECT id FROM microlecciones WHERE titulo = 'Identificación de Phishing por Correo Electrónico' LIMIT 1),
    'Si recibes un enlace en un correo que parece ser de Recursos Humanos pidiendo actualizar tus datos, ¿qué debes hacer primero?',
    'Hacer clic de inmediato para evitar que tu cuenta sea suspendida',
    'Inspeccionar la URL real pasando el cursor sobre el enlace o verificar por un canal oficial interno',
    'Reenviar el correo a todos tus compañeros de departamento para advertirles',
    'Ingresar tus datos pero usar una contraseña temporal inventada',
    'B'
WHERE NOT EXISTS (
    SELECT 1 FROM preguntas_evaluacion 
    WHERE microleccion_id = (SELECT id FROM microlecciones WHERE titulo = 'Identificación de Phishing por Correo Electrónico' LIMIT 1)
      AND enunciado = 'Si recibes un enlace en un correo que parece ser de Recursos Humanos pidiendo actualizar tus datos, ¿qué debes hacer primero?'
);

INSERT INTO preguntas_evaluacion (microleccion_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta)
SELECT 
    (SELECT id FROM microlecciones WHERE titulo = 'Identificación de Phishing por Correo Electrónico' LIMIT 1),
    '¿Qué técnica utilizan los atacantes para engañar visualmente con nombres de dominio similares (ej. micr0soft.com)?',
    'Cifrado asimétrico de correo',
    'Typosquatting y suplantación de identidad de marca (spoofing)',
    'Inyección SQL mediante cabeceras SMTP',
    'Autenticación federada SSO',
    'B'
WHERE NOT EXISTS (
    SELECT 1 FROM preguntas_evaluacion 
    WHERE microleccion_id = (SELECT id FROM microlecciones WHERE titulo = 'Identificación de Phishing por Correo Electrónico' LIMIT 1)
      AND enunciado = '¿Qué técnica utilizan los atacantes para engañar visualmente con nombres de dominio similares (ej. micr0soft.com)?'
);

-- Microlección 2: Protección contra Smishing y Mensajería SMS Fraudulenta
INSERT INTO preguntas_evaluacion (microleccion_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta)
SELECT 
    (SELECT id FROM microlecciones WHERE titulo = 'Protección contra Smishing y Mensajería SMS Fraudulenta' LIMIT 1),
    'Recibes un SMS: "Tu cuenta bancaria ha sido bloqueada. Desbloquea aquí: bit.ly/3xXyZ". ¿Cómo debes actuar?',
    'Hacer clic en el enlace corto y verificar con tu clave de internet',
    'Ignorar el enlace, no responder y acceder a tu banco únicamente desde la app oficial o su web legítima',
    'Responder al SMS con la palabra "CANCELAR"',
    'Llamar al número desde el cual se originó el mensaje SMS',
    'B'
WHERE NOT EXISTS (
    SELECT 1 FROM preguntas_evaluacion 
    WHERE microleccion_id = (SELECT id FROM microlecciones WHERE titulo = 'Protección contra Smishing y Mensajería SMS Fraudulenta' LIMIT 1)
      AND enunciado = 'Recibes un SMS: "Tu cuenta bancaria ha sido bloqueada. Desbloquea aquí: bit.ly/3xXyZ". ¿Cómo debes actuar?'
);

INSERT INTO preguntas_evaluacion (microleccion_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta)
SELECT 
    (SELECT id FROM microlecciones WHERE titulo = 'Protección contra Smishing y Mensajería SMS Fraudulenta' LIMIT 1),
    '¿Por qué los ciberdelincuentes usan comúnmente acortadores de URL en ataques de smishing?',
    'Porque ahorran ancho de banda en la red de telecomunicaciones',
    'Para ocultar el dominio malicioso real y evadir la sospecha del usuario',
    'Porque es un requisito técnico obligatorio del protocolo SMS',
    'Para que el enlace caduque en menos de 24 horas',
    'B'
WHERE NOT EXISTS (
    SELECT 1 FROM preguntas_evaluacion 
    WHERE microleccion_id = (SELECT id FROM microlecciones WHERE titulo = 'Protección contra Smishing y Mensajería SMS Fraudulenta' LIMIT 1)
      AND enunciado = '¿Por qué los ciberdelincuentes usan comúnmente acortadores de URL en ataques de smishing?'
);

INSERT INTO preguntas_evaluacion (microleccion_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta)
SELECT 
    (SELECT id FROM microlecciones WHERE titulo = 'Protección contra Smishing y Mensajería SMS Fraudulenta' LIMIT 1),
    '¿Cuál de los siguientes datos NUNCA solicitará tu organización ni tu entidad financiera por SMS?',
    'El número de ticket de atención al cliente',
    'Tu contraseña de acceso, token digital o código de seguridad SMS recibido',
    'La fecha de vencimiento de tu póliza de seguro',
    'El nombre de la sucursal más cercana a tu domicilio',
    'B'
WHERE NOT EXISTS (
    SELECT 1 FROM preguntas_evaluacion 
    WHERE microleccion_id = (SELECT id FROM microlecciones WHERE titulo = 'Protección contra Smishing y Mensajería SMS Fraudulenta' LIMIT 1)
      AND enunciado = '¿Cuál de los siguientes datos NUNCA solicitará tu organización ni tu entidad financiera por SMS?'
);

-- Microlección 3: Ingeniería Social Telefónica y Vishing
INSERT INTO preguntas_evaluacion (microleccion_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta)
SELECT 
    (SELECT id FROM microlecciones WHERE titulo = 'Ingeniería Social Telefónica y Vishing' LIMIT 1),
    'Una persona llama diciendo ser del área de Soporte TI y te pide tu contraseña para una "actualización crítica". ¿Qué haces?',
    'Entregar la contraseña rápidamente para no entorpecer el mantenimiento',
    'Negarte rotundamente, colgar y validar el incidente directamente con el equipo de TI mediante el canal formal',
    'Darle una contraseña incorrecta para probar si realmente es de TI',
    'Pedirle que llame más tarde cuando termine tu jornada laboral',
    'B'
WHERE NOT EXISTS (
    SELECT 1 FROM preguntas_evaluacion 
    WHERE microleccion_id = (SELECT id FROM microlecciones WHERE titulo = 'Ingeniería Social Telefónica y Vishing' LIMIT 1)
      AND enunciado = 'Una persona llama diciendo ser del área de Soporte TI y te pide tu contraseña para una "actualización crítica". ¿Qué haces?'
);

INSERT INTO preguntas_evaluacion (microleccion_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta)
SELECT 
    (SELECT id FROM microlecciones WHERE titulo = 'Ingeniería Social Telefónica y Vishing' LIMIT 1),
    '¿Qué técnica psicológica es más empleada en un ataque de vishing para forzar a la víctima a colaborar?',
    'Apelar al aburrimiento y rutina de la persona',
    'Sensación de falsa urgencia, presión jerárquica y consecuencias graves inmediatas',
    'Ofrecer descuentos comerciales en productos de oficina',
    'Solicitar feedback sobre el clima laboral corporativo',
    'B'
WHERE NOT EXISTS (
    SELECT 1 FROM preguntas_evaluacion 
    WHERE microleccion_id = (SELECT id FROM microlecciones WHERE titulo = 'Ingeniería Social Telefónica y Vishing' LIMIT 1)
      AND enunciado = '¿Qué técnica psicológica es más empleada en un ataque de vishing para forzar a la víctima a colaborar?'
);

INSERT INTO preguntas_evaluacion (microleccion_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta)
SELECT 
    (SELECT id FROM microlecciones WHERE titulo = 'Ingeniería Social Telefónica y Vishing' LIMIT 1),
    '¿Cómo pueden los atacantes hacer que en tu identificador de llamadas aparezca el número real de tu empresa?',
    'Interviniendo físicamente los cables de telefonía de tu edificio',
    'Utilizando servicios de suplantación de identificador de llamadas (Caller ID Spoofing)',
    'Hackeando la antena de telefonía celular más próxima',
    'Activando el modo de roaming internacional en su teléfono',
    'B'
WHERE NOT EXISTS (
    SELECT 1 FROM preguntas_evaluacion 
    WHERE microleccion_id = (SELECT id FROM microlecciones WHERE titulo = 'Ingeniería Social Telefónica y Vishing' LIMIT 1)
      AND enunciado = '¿Cómo pueden los atacantes hacer que en tu identificador de llamadas aparezca el número real de tu empresa?'
);

-- Microlección 4: Pretexting y Manipulación Psicológica en el Trabajo
INSERT INTO preguntas_evaluacion (microleccion_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta)
SELECT 
    (SELECT id FROM microlecciones WHERE titulo = 'Pretexting y Manipulación Psicológica en el Trabajo' LIMIT 1),
    '¿En qué consiste la técnica de Pretexting en ingeniería social?',
    'Crear un escenario o historia inventada convincente para ganarse la confianza y extraer información confidencial',
    'Instalar un troyano en la memoria RAM mediante un archivo adjunto corrupto',
    'Enviar miles de peticiones HTTP para denegar el servicio web de la empresa',
    'Descifrar contraseñas por fuerza bruta mediante diccionarios informáticos',
    'A'
WHERE NOT EXISTS (
    SELECT 1 FROM preguntas_evaluacion 
    WHERE microleccion_id = (SELECT id FROM microlecciones WHERE titulo = 'Pretexting y Manipulación Psicológica en el Trabajo' LIMIT 1)
      AND enunciado = '¿En qué consiste la técnica de Pretexting en ingeniería social?'
);

INSERT INTO preguntas_evaluacion (microleccion_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta)
SELECT 
    (SELECT id FROM microlecciones WHERE titulo = 'Pretexting y Manipulación Psicológica en el Trabajo' LIMIT 1),
    'Un visitante sin gafete te pide sostener la puerta de acceso seguro porque "olvidó su tarjeta". ¿Cómo debes reaccionar?',
    'Dejarlo pasar por cortesía para no hacerlo esperar en la recepción',
    'Indicarle amablemente que debe registrarse en la recepción para obtener su pase de ingreso autorizado',
    'Prestarle tu propia tarjeta de acceso para que pase rápidamente',
    'Acompañarlo directamente hasta la oficina del director general',
    'B'
WHERE NOT EXISTS (
    SELECT 1 FROM preguntas_evaluacion 
    WHERE microleccion_id = (SELECT id FROM microlecciones WHERE titulo = 'Pretexting y Manipulación Psicológica en el Trabajo' LIMIT 1)
      AND enunciado = 'Un visitante sin gafete te pide sostener la puerta de acceso seguro porque "olvidó su tarjeta". ¿Cómo debes reaccionar?'
);

INSERT INTO preguntas_evaluacion (microleccion_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta)
SELECT 
    (SELECT id FROM microlecciones WHERE titulo = 'Pretexting y Manipulación Psicológica en el Trabajo' LIMIT 1),
    '¿Qué principio de seguridad ayuda a neutralizar los ataques de pretexting dirigidos a transferencias financieras?',
    'Procedimiento de verificación en dos pasos por canal alterno y doble autorización',
    'Confiar en el tono de voz del remitente si suena seguro de sí mismo',
    'Acelerar el proceso si el correo lleva la etiqueta de "Alta Prioridad"',
    'Realizar transferencias bancarias únicamente a través de redes Wi-Fi públicas',
    'A'
WHERE NOT EXISTS (
    SELECT 1 FROM preguntas_evaluacion 
    WHERE microleccion_id = (SELECT id FROM microlecciones WHERE titulo = 'Pretexting y Manipulación Psicológica en el Trabajo' LIMIT 1)
      AND enunciado = '¿Qué principio de seguridad ayuda a neutralizar los ataques de pretexting dirigidos a transferencias financieras?'
);

-- Microlección 5: Fundamentos de Ciberseguridad y Enlaces Maliciosos
INSERT INTO preguntas_evaluacion (microleccion_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta)
SELECT 
    (SELECT id FROM microlecciones WHERE titulo = 'Fundamentos de Ciberseguridad y Enlaces Maliciosos' LIMIT 1),
    '¿Cuál de las siguientes URLs pertenece con certeza al dominio legítimo de google.com?',
    'https://google.com.login-seguridad.net/auth',
    'https://accounts.google.com/signin',
    'https://google-soporte-cuenta.com/recuperar',
    'http://www.google.com.verificacion-peru.org',
    'B'
WHERE NOT EXISTS (
    SELECT 1 FROM preguntas_evaluacion 
    WHERE microleccion_id = (SELECT id FROM microlecciones WHERE titulo = 'Fundamentos de Ciberseguridad y Enlaces Maliciosos' LIMIT 1)
      AND enunciado = '¿Cuál de las siguientes URLs pertenece con certeza al dominio legítimo de google.com?'
);

INSERT INTO preguntas_evaluacion (microleccion_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta)
SELECT 
    (SELECT id FROM microlecciones WHERE titulo = 'Fundamentos de Ciberseguridad y Enlaces Maliciosos' LIMIT 1),
    'El protocolo HTTPS garantiza que la comunicación está cifrada, pero ¿significa automáticamente que el sitio es 100% legítimo y seguro?',
    'Sí, los sitios con candado HTTPS nunca pueden ser usados por estafadores',
    'No, los atacantes también pueden obtener certificados SSL gratuitos para alojar páginas falsas',
    'Sí, porque el navegador bloquea cualquier certificado emitido después de 2024',
    'Solo si el sitio web termina en .gob o .edu',
    'B'
WHERE NOT EXISTS (
    SELECT 1 FROM preguntas_evaluacion 
    WHERE microleccion_id = (SELECT id FROM microlecciones WHERE titulo = 'Fundamentos de Ciberseguridad y Enlaces Maliciosos' LIMIT 1)
      AND enunciado = 'El protocolo HTTPS garantiza que la comunicación está cifrada, pero ¿significa automáticamente que el sitio es 100% legítimo y seguro?'
);

INSERT INTO preguntas_evaluacion (microleccion_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta)
SELECT 
    (SELECT id FROM microlecciones WHERE titulo = 'Fundamentos de Ciberseguridad y Enlaces Maliciosos' LIMIT 1),
    '¿Qué debes hacer si sospechas que hiciste clic en un enlace malicioso desde tu computadora corporativa?',
    'Apagar el monitor y esperar al día siguiente',
    'Desconectar la red, cambiar tus contraseñas desde otro dispositivo y reportar inmediatamente a Seguridad/TI',
    'Borrar el historial de navegación para eliminar cualquier virus descargado',
    'Intentar iniciar sesión varias veces para comprobar si tus cuentas siguen activas',
    'B'
WHERE NOT EXISTS (
    SELECT 1 FROM preguntas_evaluacion 
    WHERE microleccion_id = (SELECT id FROM microlecciones WHERE titulo = 'Fundamentos de Ciberseguridad y Enlaces Maliciosos' LIMIT 1)
      AND enunciado = '¿Qué debes hacer si sospechas que hiciste clic en un enlace malicioso desde tu computadora corporativa?'
);

-- Microlección 6: Gestión Segura de Contraseñas y Doble Factor (2FA)
INSERT INTO preguntas_evaluacion (microleccion_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta)
SELECT 
    (SELECT id FROM microlecciones WHERE titulo = 'Gestión Segura de Contraseñas y Doble Factor (2FA)' LIMIT 1),
    '¿Cuál es la mejor práctica para crear una contraseña corporativa robusta?',
    'Usar tu fecha de nacimiento combinada con el nombre de tu mascota',
    'Utilizar una frase de contraseña (passphrase) extensa, combinando palabras aleatorias, números y símbolos',
    'Reutilizar la misma contraseña compleja en todos tus servicios para no olvidarla',
    'Escribir la contraseña en una nota adhesiva colocada en la base de tu pantalla',
    'B'
WHERE NOT EXISTS (
    SELECT 1 FROM preguntas_evaluacion 
    WHERE microleccion_id = (SELECT id FROM microlecciones WHERE titulo = 'Gestión Segura de Contraseñas y Doble Factor (2FA)' LIMIT 1)
      AND enunciado = '¿Cuál es la mejor práctica para crear una contraseña corporativa robusta?'
);

INSERT INTO preguntas_evaluacion (microleccion_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta)
SELECT 
    (SELECT id FROM microlecciones WHERE titulo = 'Gestión Segura de Contraseñas y Doble Factor (2FA)' LIMIT 1),
    '¿Qué ventaja principal ofrece activar la Autenticación de Doble Factor (2FA / MFA)?',
    'Permite recuperar la contraseña sin necesidad de ingresar el correo electrónico',
    'Añade una capa extra de defensa: aunque un atacante robe tu contraseña, no podrá acceder sin el segundo factor',
    'Aumenta la velocidad de inicio de sesión en aplicaciones corporativas',
    'Elimina la necesidad de cambiar contraseñas de por vida',
    'B'
WHERE NOT EXISTS (
    SELECT 1 FROM preguntas_evaluacion 
    WHERE microleccion_id = (SELECT id FROM microlecciones WHERE titulo = 'Gestión Segura de Contraseñas y Doble Factor (2FA)' LIMIT 1)
      AND enunciado = '¿Qué ventaja principal ofrece activar la Autenticación de Doble Factor (2FA / MFA)?'
);

INSERT INTO preguntas_evaluacion (microleccion_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta)
SELECT 
    (SELECT id FROM microlecciones WHERE titulo = 'Gestión Segura de Contraseñas y Doble Factor (2FA)' LIMIT 1),
    'Recibes una notificación de solicitud de inicio de sesión 2FA en tu móvil que tú NO iniciaste. ¿Qué debes hacer?',
    'Aprobar la solicitud para que la notificación desaparezca de tu pantalla',
    'Rechazar la solicitud de inmediato y cambiar de inmediato tu contraseña corporativa reportando el incidente',
    'Esperar a ver si se aprueba sola en los próximos minutos',
    'Desinstalar la aplicación de autenticación de tu teléfono',
    'B'
WHERE NOT EXISTS (
    SELECT 1 FROM preguntas_evaluacion 
    WHERE microleccion_id = (SELECT id FROM microlecciones WHERE titulo = 'Gestión Segura de Contraseñas y Doble Factor (2FA)' LIMIT 1)
      AND enunciado = 'Recibes una notificación de solicitud de inicio de sesión 2FA en tu móvil que tú NO iniciaste. ¿Qué debes hacer?'
);

-- Microlección 7: Detección de Archivos Adjuntos Maliciosos y Malware
INSERT INTO preguntas_evaluacion (microleccion_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta)
SELECT 
    (SELECT id FROM microlecciones WHERE titulo = 'Detección de Archivos Adjuntos Maliciosos y Malware' LIMIT 1),
    '¿Qué tipo de archivo adjunto representa un mayor riesgo potencial de ejecución de malware al abrirse en tu equipo?',
    'Archivos ejecutables o scripts (.exe, .scr, .vbs, .bat) o documentos ofimáticos con macros (.xlsm, .docm)',
    'Archivos de texto plano (.txt) sin formato ni enlaces externos',
    'Archivos de imagen estática en formato estándar (.png, .jpg)',
    'Documentos de solo lectura en formato PDF firmado digitalmente por una entidad de certificación',
    'A'
WHERE NOT EXISTS (
    SELECT 1 FROM preguntas_evaluacion 
    WHERE microleccion_id = (SELECT id FROM microlecciones WHERE titulo = 'Detección de Archivos Adjuntos Maliciosos y Malware' LIMIT 1)
      AND enunciado = '¿Qué tipo de archivo adjunto representa un mayor riesgo potencial de ejecución de malware al abrirse en tu equipo?'
);

INSERT INTO preguntas_evaluacion (microleccion_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta)
SELECT 
    (SELECT id FROM microlecciones WHERE titulo = 'Detección de Archivos Adjuntos Maliciosos y Malware' LIMIT 1),
    'Un correo de un remitente externo te pide habilitar macros en una hoja de cálculo para "ver contenido confidencial". ¿Qué debes hacer?',
    'Habilitar el contenido dinámico y macros inmediatamente para revisar los datos solicitados',
    'No habilitar macros ni ejecutar contenido dinámico, y reportar el correo al equipo de ciberseguridad',
    'Reenviar la hoja de cálculo a tu correo personal para abrirla desde tu dispositivo móvil',
    'Renombrar la extensión del archivo a .csv y abrirlo directamente en un editor de texto',
    'B'
WHERE NOT EXISTS (
    SELECT 1 FROM preguntas_evaluacion 
    WHERE microleccion_id = (SELECT id FROM microlecciones WHERE titulo = 'Detección de Archivos Adjuntos Maliciosos y Malware' LIMIT 1)
      AND enunciado = 'Un correo de un remitente externo te pide habilitar macros en una hoja de cálculo para "ver contenido confidencial". ¿Qué debes hacer?'
);

INSERT INTO preguntas_evaluacion (microleccion_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta)
SELECT 
    (SELECT id FROM microlecciones WHERE titulo = 'Detección de Archivos Adjuntos Maliciosos y Malware' LIMIT 1),
    '¿Por qué los ciberdelincuentes suelen enviar archivos comprimidos (.zip o .rar) protegidos con contraseña?',
    'Para optimizar el espacio de almacenamiento y acelerar la descarga en el servidor de correo',
    'Para evadir y dificultar la inspección automática de los antivirus perimetrales en las pasarelas de correo',
    'Para asegurar que el correo cumpla de forma transparente con los estándares de cifrado ISO 27001',
    'Porque el protocolo de correo corporativo obliga a cifrar cualquier documento adjunto',
    'B'
WHERE NOT EXISTS (
    SELECT 1 FROM preguntas_evaluacion 
    WHERE microleccion_id = (SELECT id FROM microlecciones WHERE titulo = 'Detección de Archivos Adjuntos Maliciosos y Malware' LIMIT 1)
      AND enunciado = '¿Por qué los ciberdelincuentes suelen enviar archivos comprimidos (.zip o .rar) protegidos con contraseña?'
);

-- Microlección 8: Suplantación de Identidad de Ejecutivos (BEC) y Facturas Falsas
INSERT INTO preguntas_evaluacion (microleccion_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta)
SELECT 
    (SELECT id FROM microlecciones WHERE titulo = 'Suplantación de Identidad de Ejecutivos (BEC) y Facturas Falsas' LIMIT 1),
    '¿En qué consiste fundamentalmente el ataque de compromiso de correo corporativo (Business Email Compromise - BEC)?',
    'En saturar los servidores de la empresa con tráfico DDoS hasta interrumpir las operaciones comerciales',
    'En suplantar a directivos o proveedores para engañar a empleados y desviar transferencias o fondos financieros',
    'En infectar terminales locales con programas de minería de criptomonedas en segundo plano',
    'En robar físicamente discos duros o dispositivos portátiles de la sede corporativa',
    'B'
WHERE NOT EXISTS (
    SELECT 1 FROM preguntas_evaluacion 
    WHERE microleccion_id = (SELECT id FROM microlecciones WHERE titulo = 'Suplantación de Identidad de Ejecutivos (BEC) y Facturas Falsas' LIMIT 1)
      AND enunciado = '¿En qué consiste fundamentalmente el ataque de compromiso de correo corporativo (Business Email Compromise - BEC)?'
);

INSERT INTO preguntas_evaluacion (microleccion_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta)
SELECT 
    (SELECT id FROM microlecciones WHERE titulo = 'Suplantación de Identidad de Ejecutivos (BEC) y Facturas Falsas' LIMIT 1),
    'Recibes un correo supuestamente del Gerente General pidiendo una transferencia urgente y secreta sin las firmas habituales. ¿Cómo procedes?',
    'Ejecutar la transferencia inmediatamente para cumplir con la orden ejecutiva con la máxima celeridad',
    'Responder al mismo correo solicitando confirmación escrita de los números de cuenta receptores',
    'Validar la solicitud por un canal telefónico o presencial previamente verificado y exigir el flujo regular de aprobaciones',
    'Publicar la comunicación en redes sociales corporativas para consultar con otros directivos',
    'C'
WHERE NOT EXISTS (
    SELECT 1 FROM preguntas_evaluacion 
    WHERE microleccion_id = (SELECT id FROM microlecciones WHERE titulo = 'Suplantación de Identidad de Ejecutivos (BEC) y Facturas Falsas' LIMIT 1)
      AND enunciado = 'Recibes un correo supuestamente del Gerente General pidiendo una transferencia urgente y secreta sin las firmas habituales. ¿Cómo procedes?'
);

INSERT INTO preguntas_evaluacion (microleccion_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta)
SELECT 
    (SELECT id FROM microlecciones WHERE titulo = 'Suplantación de Identidad de Ejecutivos (BEC) y Facturas Falsas' LIMIT 1),
    '¿Cuál es un indicio recurrente en correos fraudulentos que buscan desviar pagos de facturas a proveedores legítimos?',
    'Una notificación urgente solicitando abonar a una nueva cuenta bancaria debido a supuestos bloqueos o auditorías',
    'La presentación de la factura en los formatos digitales autorizados en la orden de compra original',
    'El envío de la factura con los sellos y certificados tributarios validados electrónicamente ante el ente regulador',
    'La solicitud del proveedor para coordinar una reunión de trabajo sobre entregables pendientes',
    'A'
WHERE NOT EXISTS (
    SELECT 1 FROM preguntas_evaluacion 
    WHERE microleccion_id = (SELECT id FROM microlecciones WHERE titulo = 'Suplantación de Identidad de Ejecutivos (BEC) y Facturas Falsas' LIMIT 1)
      AND enunciado = '¿Cuál es un indicio recurrente en correos fraudulentos que buscan desviar pagos de facturas a proveedores legítimos?'
);

-- Microlección 9: Protocolo de Respuesta y Reporte de Incidentes de Phishing
INSERT INTO preguntas_evaluacion (microleccion_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta)
SELECT 
    (SELECT id FROM microlecciones WHERE titulo = 'Protocolo de Respuesta y Reporte de Incidentes de Phishing' LIMIT 1),
    'Si sospechas que ingresaste tus credenciales corporativas en una página de phishing simulada o real, ¿cuál es tu primera medida?',
    'Esperar a finalizar la jornada laboral para ver si se presentan accesos extraños a tu correo',
    'Cambiar de inmediato tu contraseña corporativa desde otro equipo seguro y notificar con urgencia al equipo de seguridad',
    'Reiniciar el ordenador y borrar el historial de navegación para eliminar las cookies de sesión',
    'Desconectar el cable de red y no informar a nadie para no comprometer tu evaluación de desempeño',
    'B'
WHERE NOT EXISTS (
    SELECT 1 FROM preguntas_evaluacion 
    WHERE microleccion_id = (SELECT id FROM microlecciones WHERE titulo = 'Protocolo de Respuesta y Reporte de Incidentes de Phishing' LIMIT 1)
      AND enunciado = 'Si sospechas que ingresaste tus credenciales corporativas en una página de phishing simulada o real, ¿cuál es tu primera medida?'
);

INSERT INTO preguntas_evaluacion (microleccion_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta)
SELECT 
    (SELECT id FROM microlecciones WHERE titulo = 'Protocolo de Respuesta y Reporte de Incidentes de Phishing' LIMIT 1),
    '¿Cuál es la importancia de reportar un intento de phishing aunque tú hayas sabido identificarlo y no hayas caído?',
    'Permite al equipo de ciberseguridad bloquear los dominios o remitentes a nivel corporativo protegiendo a otros colaboradores',
    'Tiene únicamente el propósito de obtener puntos adicionales en las estadísticas de capacitación',
    'Permite que el área de Recursos Humanos abra un expediente sancionador contra el remitente externo',
    'No reviste mayor importancia porque al no haber caído no se produjo un incidente real',
    'A'
WHERE NOT EXISTS (
    SELECT 1 FROM preguntas_evaluacion 
    WHERE microleccion_id = (SELECT id FROM microlecciones WHERE titulo = 'Protocolo de Respuesta y Reporte de Incidentes de Phishing' LIMIT 1)
      AND enunciado = '¿Cuál es la importancia de reportar un intento de phishing aunque tú hayas sabido identificarlo y no hayas caído?'
);

INSERT INTO preguntas_evaluacion (microleccion_id, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta)
SELECT 
    (SELECT id FROM microlecciones WHERE titulo = 'Protocolo de Respuesta y Reporte de Incidentes de Phishing' LIMIT 1),
    'Al reportar un correo de phishing al equipo de seguridad, ¿cuál es la mejor práctica recomendada?',
    'Copiar y pegar solo algunas líneas del mensaje en un correo nuevo',
    'Reenviar el correo malicioso como archivo adjunto (.eml o .msg) para preservar intactas las cabeceras técnicas',
    'Tomar una fotografía con el celular a la pantalla y enviarla por mensajería instantánea no corporativa',
    'Eliminar el correo de la bandeja de entrada inmediatamente sin conservar ninguna copia',
    'B'
WHERE NOT EXISTS (
    SELECT 1 FROM preguntas_evaluacion 
    WHERE microleccion_id = (SELECT id FROM microlecciones WHERE titulo = 'Protocolo de Respuesta y Reporte de Incidentes de Phishing' LIMIT 1)
      AND enunciado = 'Al reportar un correo de phishing al equipo de seguridad, ¿cuál es la mejor práctica recomendada?'
);

-- 4. Seed Idempotente de Insignias y Medallas Progresivas (5 insignias)
INSERT INTO insignias_medallas (nombre, descripcion, icono_url, puntos_requeridos)
SELECT 'Novato Consciente', 'Completa tu primera microlección de ciberseguridad.', 'shield-alert', 10
WHERE NOT EXISTS (SELECT 1 FROM insignias_medallas WHERE nombre = 'Novato Consciente');

INSERT INTO insignias_medallas (nombre, descripcion, icono_url, puntos_requeridos)
SELECT 'Guardián Digital', 'Alcanza 30 puntos en entrenamientos defensivos.', 'shield-check', 30
WHERE NOT EXISTS (SELECT 1 FROM insignias_medallas WHERE nombre = 'Guardián Digital');

INSERT INTO insignias_medallas (nombre, descripcion, icono_url, puntos_requeridos)
SELECT 'Ojo Crítico', 'Alcanza 60 puntos dominando la detección de fraudes.', 'eye', 60
WHERE NOT EXISTS (SELECT 1 FROM insignias_medallas WHERE nombre = 'Ojo Crítico');

INSERT INTO insignias_medallas (nombre, descripcion, icono_url, puntos_requeridos)
SELECT 'Especialista Antifraude', 'Alcanza 100 puntos y conviértete en un referente de seguridad.', 'award', 100
WHERE NOT EXISTS (SELECT 1 FROM insignias_medallas WHERE nombre = 'Especialista Antifraude');

INSERT INTO insignias_medallas (nombre, descripcion, icono_url, puntos_requeridos)
SELECT 'Centinela PhishWarden', 'Maestría total: 150 puntos en defensa contra amenazas cibernéticas.', 'crown', 150
WHERE NOT EXISTS (SELECT 1 FROM insignias_medallas WHERE nombre = 'Centinela PhishWarden');
