-- ==============================================================================
-- Migración Adicional: 3 Microlecciones Generales de Phishing y Evaluaciones
-- ==============================================================================

-- 1. Inserción Idempotente de 3 Microlecciones Generales de Phishing
INSERT INTO microlecciones (metodo_ataque, titulo, contenido_multimedia, duracion_minutos, puntos_recompensa)
SELECT 'general', 'Detección de Archivos Adjuntos Maliciosos y Malware', 'https://images.unsplash.com/photo-1563089145-599997674d42', 2, 10
WHERE NOT EXISTS (SELECT 1 FROM microlecciones WHERE titulo = 'Detección de Archivos Adjuntos Maliciosos y Malware');

INSERT INTO microlecciones (metodo_ataque, titulo, contenido_multimedia, duracion_minutos, puntos_recompensa)
SELECT 'general', 'Suplantación de Identidad de Ejecutivos (BEC) y Facturas Falsas', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab', 3, 15
WHERE NOT EXISTS (SELECT 1 FROM microlecciones WHERE titulo = 'Suplantación de Identidad de Ejecutivos (BEC) y Facturas Falsas');

INSERT INTO microlecciones (metodo_ataque, titulo, contenido_multimedia, duracion_minutos, puntos_recompensa)
SELECT 'general', 'Protocolo de Respuesta y Reporte de Incidentes de Phishing', 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d', 2, 10
WHERE NOT EXISTS (SELECT 1 FROM microlecciones WHERE titulo = 'Protocolo de Respuesta y Reporte de Incidentes de Phishing');

-- 2. Preguntas de Evaluación (3 preguntas por cada microlección)

-- Microlección: Detección de Archivos Adjuntos Maliciosos y Malware
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

-- Microlección: Suplantación de Identidad de Ejecutivos (BEC) y Facturas Falsas
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

-- Microlección: Protocolo de Respuesta y Reporte de Incidentes de Phishing
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
