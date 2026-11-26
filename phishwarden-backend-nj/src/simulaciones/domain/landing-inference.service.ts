export class LandingInferenceService {
  /**
   * Resuelve el tipo de landing page simulada. Si la plantilla tiene un tipo
   * explícito distinto de 'generico', lo preserva. Si es 'generico' o indefinido,
   * infiere el tipo a partir del título y asunto de la plantilla.
   */
  static infer(
    explicitType?: string | null,
    title?: string | null,
    subject?: string | null,
  ): string {
    const rawType = (explicitType || '').trim().toLowerCase();
    if (rawType && rawType !== 'generico') {
      return rawType;
    }

    const textToAnalyze = `${title || ''} ${subject || ''}`.toLowerCase();

    if (/unjbg|basadre|aula virtual/i.test(textToAnalyze)) {
      return 'unjbg';
    }

    if (/outlook|microsoft|office|365|teams/i.test(textToAnalyze)) {
      return 'microsoft';
    }

    if (/google|gmail|drive|workspace/i.test(textToAnalyze)) {
      return 'google';
    }

    if (
      /banco|bcp|interbank|bbva|scotiabank|tarjeta|transferencia|clave|cuenta bancaria/i.test(
        textToAnalyze,
      )
    ) {
      return 'bancario';
    }

    return 'corporativo';
  }
}
