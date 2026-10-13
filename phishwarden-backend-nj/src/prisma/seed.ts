import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando sembrado de plantillas base...');

  const plantillasGlobales = [
    {
      titulo: 'Restablecimiento de Contraseña Microsoft 365',
      asunto: 'Urgente: Solicitaron cambiar la contraseña de su cuenta corporativa',
      metodo_ataque: 'phishing',
      indicador_dificultad: 'baja',
      etiquetas_categoria: 'Credenciales, Corporativo, Microsoft',
      cuerpo_html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px;">
          <h2 style="color: #0078d4;">Microsoft Security Alert</h2>
          <p>Estimado/a <strong>{{nombre}}</strong>,</p>
          <p>Hemos recibido una solicitud para cambiar la contraseña de su cuenta corporativa <code>{{correo}}</code>.</p>
          <p>Si usted no realizó esta solicitud, su cuenta podría estar en riesgo. Verifique su sesión de inmediato haciendo clic en el siguiente botón:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{enlace_simulado}}" style="background-color: #0078d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Verificar Identidad Ahora</a>
          </div>
          <p style="font-size: 12px; color: #666;">Si omitió este mensaje, su cuenta se bloqueará por seguridad en 24 horas.</p>
        </div>
      `,
    },
    {
      titulo: 'Notificación de Envío Pendiente Shalom',
      asunto: 'Shalom Agencia: Su envío requiere confirmación de dirección',
      metodo_ataque: 'smishing',
      indicador_dificultad: 'media',
      etiquetas_categoria: 'Logística, SMS, Envíos',
      cuerpo_html: `
        Estimado/a {{nombre}}, su paquete asignado al correo {{correo}} no pudo ser entregado por dirección incompleta. Actualice los datos de entrega aquí para programar el reenvío: {{enlace_simulado}}
      `,
    },
  ];

  for (const plantilla of plantillasGlobales) {
    // Evitar duplicar si ya existen por título
    const existe = await prisma.plantillas.findFirst({
      where: { titulo: plantilla.titulo },
    });

    if (!existe) {
      await prisma.plantillas.create({ data: plantilla });
      console.log(`✅ Plantilla creada: "${plantilla.titulo}"`);
    } else {
      console.log(`ℹ️ La plantilla "${plantilla.titulo}" ya existía.`);
    }
  }

  console.log('✨ Sembrado finalizado con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });