export interface InterpolationVariables {
  nombre: string;
  correo: string;
  empresa: string;
  token: string;
  backendPublicUrl: string;
}

export class TemplateInterpolatorService {
  /**
   * Reemplaza todos los marcadores dinámicos de simulación dentro del cuerpo del mensaje.
   * Auto-inyecta el píxel de apertura si no está presente en el código HTML.
   */
  static interpolate(
    templateContent: string,
    vars: InterpolationVariables,
  ): string {
    const cleanBaseUrl = vars.backendPublicUrl.replace(/\/+$/, '');
    const simulationLink = `${cleanBaseUrl}/track/click/${vars.token}`;
    const trackingPixel = `<img src="${cleanBaseUrl}/track/open/${vars.token}" width="1" height="1" alt="" style="display:none" />`;

    let content = templateContent
      .replace(/{{\s*nombre\s*}}/gi, vars.nombre)
      .replace(/{{\s*correo\s*}}/gi, vars.correo)
      .replace(/{{\s*empresa\s*}}/gi, vars.empresa)
      .replace(/{{\s*enlace_simulacion\s*}}/gi, simulationLink);

    if (/{{\s*pixel_rastreo\s*}}/i.test(content)) {
      content = content.replace(/{{\s*pixel_rastreo\s*}}/gi, trackingPixel);
    } else {
      // Si es HTML y tiene etiqueta de cierre body, inyectarlo antes del cierre
      if (/<\/body>/i.test(content)) {
        content = content.replace(/<\/body>/i, `${trackingPixel}</body>`);
      } else {
        content = `${content}\n${trackingPixel}`;
      }
    }

    return content;
  }
}
