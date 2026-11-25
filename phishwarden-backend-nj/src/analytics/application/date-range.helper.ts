import { BadRequestException } from '@nestjs/common';
import type { AnalyticsDateRangeDto } from '../infrastructure/analytics-date-range.dto';
import type { ParsedDateRange } from './analytics.repository.port';

export function parseAnalyticsDateRange(
  query?: AnalyticsDateRangeDto,
): ParsedDateRange {
  if (!query) return {};

  let desde: Date | undefined;
  let hasta: Date | undefined;

  if (query.desde) {
    const d = new Date(`${query.desde}T00:00:00.000Z`);
    if (isNaN(d.getTime())) {
      throw new BadRequestException(
        'El parámetro "desde" contiene una fecha inválida',
      );
    }
    desde = d;
  }

  if (query.hasta) {
    const h = new Date(`${query.hasta}T23:59:59.999Z`);
    if (isNaN(h.getTime())) {
      throw new BadRequestException(
        'El parámetro "hasta" contiene una fecha inválida',
      );
    }
    hasta = h;
  }

  if (desde && hasta && desde > hasta) {
    throw new BadRequestException(
      'La fecha "desde" no puede ser posterior a la fecha "hasta"',
    );
  }

  return { desde, hasta };
}
