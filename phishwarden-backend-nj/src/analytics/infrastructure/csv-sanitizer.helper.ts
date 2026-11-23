/**
 * Sanitiza un valor de celda para CSV conforme a RFC 4180 y previene
 * ataques de Inyección de Fórmulas (CSV Injection / Formula Injection).
 * Si un valor de texto inicia con =, +, -, @, \t o \r, se antepone un apóstrofe (').
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }

  let text: string;

  if (typeof value === 'number') {
    return String(value);
  }

  text = String(value);

  // Protección anti-CSV Injection (Formula Injection)
  const DANGEROUS_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];
  if (text.length > 0 && DANGEROUS_PREFIXES.includes(text[0])) {
    text = `'${text}`;
  }

  // Escape de comillas dobles según RFC 4180
  const escaped = text.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Genera el contenido de un archivo CSV con cabeceras, filas sanitizadas
 * y el marcador Byte Order Mark UTF-8 (\uFEFF) para visualización correcta en Excel.
 */
export function generateCsv(
  headers: string[],
  rows: (unknown)[][],
): string {
  const BOM = '\uFEFF';
  const headerLine = headers.map(sanitizeCsvCell).join(',');
  const rowLines = rows.map((row) => row.map(sanitizeCsvCell).join(','));

  return [BOM + headerLine, ...rowLines].join('\r\n');
}
