import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AnalyticsRepositoryPort,
  ParsedDateRange,
} from '../application/analytics.repository.port';
import {
  ExecutiveSummaryEntity,
  RiskPostureEntity,
  MobileAdoptionEntity,
  SimulationMetricsEntity,
  TrainingMetricsEntity,
  RiskLevel,
} from '../domain/executive-summary.entity';
import { DepartmentMetricEntity } from '../domain/department-metrics.entity';
import { AttackVectorMetricEntity } from '../domain/attack-vector-metrics.entity';
import { EvolutionMetricEntity } from '../domain/evolution-metrics.entity';
import {
  FeaturedUsersEntity,
  HighRiskUserEntity,
  TopDefenderUserEntity,
} from '../domain/featured-users.entity';
import { ExportUserRowEntity } from '../domain/export-user-row.entity';

function calculateRate(numerator: number, denominator: number): number {
  if (!denominator || denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function resolveRiskLevel(score: number): RiskLevel {
  if (score <= 30) return 'bajo';
  if (score <= 69) return 'medio';
  return 'critico';
}

function buildDateFilter(dateRange?: ParsedDateRange) {
  if (!dateRange || (!dateRange.desde && !dateRange.hasta)) {
    return undefined;
  }
  const filter: { gte?: Date; lte?: Date } = {};
  if (dateRange.desde) filter.gte = dateRange.desde;
  if (dateRange.hasta) filter.lte = dateRange.hasta;
  return filter;
}

@Injectable()
export class PrismaAnalyticsRepository implements AnalyticsRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async getExecutiveSummary(
    empresaId: number,
    dateRange?: ParsedDateRange,
  ): Promise<ExecutiveSummaryEntity> {
    const eventDateFilter = buildDateFilter(dateRange);

    const [
      activeUsers,
      totalCampanas,
      eventosGroup,
      totalReportes,
      totalLeccionesCompletadas,
      totalLeccionesPendientes,
      totalLeccionesReprobadas,
    ] = await Promise.all([
      this.prisma.usuarios.findMany({
        where: { empresa_id: empresaId, estado: 'activo' },
        select: { id: true, score_riesgo: true, token_notificacion_push: true },
      }),
      this.prisma.campanas.count({
        where: {
          campana_usuarios: {
            some: { usuarios: { empresa_id: empresaId } },
          },
          ...(eventDateFilter ? { creado_el: eventDateFilter } : {}),
        },
      }),
      (this.prisma.eventos_simulacion as any).groupBy({
        by: ['tipo_evento'],
        where: {
          usuarios: { empresa_id: empresaId },
          ...(eventDateFilter ? { fecha_hora: eventDateFilter } : {}),
        },
        _count: { _all: true },
      }),
      this.prisma.reportes_sospechosos.count({
        where: {
          usuarios: { empresa_id: empresaId },
          ...(eventDateFilter ? { fecha_reporte: eventDateFilter } : {}),
        },
      }),
      this.prisma.logros_usuarios.count({
        where: {
          usuarios: { empresa_id: empresaId },
          estado: 'completada',
          ...(eventDateFilter ? { fecha_completado: eventDateFilter } : {}),
        },
      }),
      this.prisma.logros_usuarios.count({
        where: {
          usuarios: { empresa_id: empresaId },
          estado: 'pendiente',
        },
      }),
      this.prisma.logros_usuarios.count({
        where: {
          usuarios: { empresa_id: empresaId },
          estado: 'reprobada',
          ...(eventDateFilter ? { fecha_completado: eventDateFilter } : {}),
        },
      }),
    ]);

    let totalEnvios = 0;
    let totalAperturas = 0;
    let totalClics = 0;
    let totalEnviosCredenciales = 0;

    for (const eg of (eventosGroup as any[])) {
      const count = eg._count?._all ?? 0;
      if (eg.tipo_evento === 'enviado') totalEnvios = count;
      else if (eg.tipo_evento === 'abierto') totalAperturas = count;
      else if (eg.tipo_evento === 'click') totalClics = count;
      else if (eg.tipo_evento === 'formulario_enviado') totalEnviosCredenciales = count;
    }

    const totalColaboradores = activeUsers.length;
    const scoreRiesgoPromedio =
      totalColaboradores > 0
        ? Math.round(
            (activeUsers.reduce(
              (acc, u) => acc + (u.score_riesgo ?? 0),
              0,
            ) /
              totalColaboradores) *
              10,
          ) / 10
        : 0;

    const nivelRiesgoGlobal = resolveRiskLevel(scoreRiesgoPromedio);

    const distribucion = {
      bajo: activeUsers.filter((u) => (u.score_riesgo ?? 0) <= 30).length,
      medio: activeUsers.filter(
        (u) => (u.score_riesgo ?? 0) >= 31 && (u.score_riesgo ?? 0) <= 69,
      ).length,
      critico: activeUsers.filter((u) => (u.score_riesgo ?? 0) >= 70).length,
    };

    const colaboradoresVinculados = activeUsers.filter((u) =>
      Boolean(u.token_notificacion_push),
    ).length;
    const tasaAdopcion = calculateRate(
      colaboradoresVinculados,
      totalColaboradores,
    );

    const tasaApertura = calculateRate(totalAperturas, totalEnvios);
    const tasaClic = calculateRate(totalClics, totalEnvios);
    const tasaCompromisoCredenciales = calculateRate(
      totalEnviosCredenciales,
      totalEnvios,
    );
    const tasaReporteTemprano = calculateRate(totalReportes, totalEnvios);

    const tasaAprobacion = calculateRate(
      totalLeccionesCompletadas,
      totalLeccionesCompletadas + totalLeccionesReprobadas,
    );

    return new ExecutiveSummaryEntity(
      new RiskPostureEntity(
        scoreRiesgoPromedio,
        nivelRiesgoGlobal,
        distribucion,
      ),
      new MobileAdoptionEntity(
        totalColaboradores,
        colaboradoresVinculados,
        tasaAdopcion,
      ),
      new SimulationMetricsEntity(
        totalCampanas,
        totalEnvios,
        totalAperturas,
        totalClics,
        totalEnviosCredenciales,
        totalReportes,
        tasaApertura,
        tasaClic,
        tasaCompromisoCredenciales,
        tasaReporteTemprano,
      ),
      new TrainingMetricsEntity(
        totalLeccionesCompletadas,
        totalLeccionesPendientes,
        totalLeccionesReprobadas,
        tasaAprobacion,
      ),
    );
  }

  async getDepartmentMetrics(
    empresaId: number,
    dateRange?: ParsedDateRange,
  ): Promise<DepartmentMetricEntity[]> {
    const eventDateFilter = buildDateFilter(dateRange);

    const [departments, activeUsers] = await Promise.all([
      this.prisma.departamentos.findMany({
        where: { empresa_id: empresaId },
        orderBy: { nombre: 'asc' },
      }),
      this.prisma.usuarios.findMany({
        where: { empresa_id: empresaId, estado: 'activo' },
        include: {
          departamentos: true,
          eventos_simulacion: {
            where: eventDateFilter ? { fecha_hora: eventDateFilter } : {},
            select: { tipo_evento: true },
          },
          reportes_sospechosos: {
            where: eventDateFilter ? { fecha_reporte: eventDateFilter } : {},
            select: { id: true },
          },
          logros_usuarios: {
            where: {
              estado: 'completada',
              ...(eventDateFilter
                ? { fecha_completado: eventDateFilter }
                : {}),
            },
            select: { id: true },
          },
        },
      }),
    ]);

    // Agrupar usuarios por departamento
    const deptMap = new Map<number | null, {
      departamentoId: number | null;
      departamento: string;
      usuarios: typeof activeUsers;
    }>();

    // Inicializar todos los departamentos registrados
    for (const d of departments) {
      deptMap.set(d.id, {
        departamentoId: d.id,
        departamento: d.nombre,
        usuarios: [],
      });
    }

    // Inicializar grupo "Sin departamento"
    deptMap.set(null, {
      departamentoId: null,
      departamento: 'Sin departamento',
      usuarios: [],
    });

    for (const u of activeUsers) {
      const key = u.departamento_id ?? null;
      if (!deptMap.has(key)) {
        deptMap.set(key, {
          departamentoId: key,
          departamento: u.departamentos?.nombre || 'Sin departamento',
          usuarios: [],
        });
      }
      deptMap.get(key)!.usuarios.push(u);
    }

    const result: DepartmentMetricEntity[] = [];

    for (const group of deptMap.values()) {
      // Si "Sin departamento" no tiene usuarios, se omite para no ensuciar la salida
      if (group.departamentoId === null && group.usuarios.length === 0) {
        continue;
      }

      const totalColaboradores = group.usuarios.length;
      const scoreRiesgoPromedio =
        totalColaboradores > 0
          ? Math.round(
              (group.usuarios.reduce(
                (acc, u) => acc + (u.score_riesgo ?? 0),
                0,
              ) /
                totalColaboradores) *
                10,
            ) / 10
          : 0;

      const nivelRiesgo = resolveRiskLevel(scoreRiesgoPromedio);

      let simulacionesRecibidas = 0;
      let clicsEnSimulacion = 0;
      let credencialesComprometidas = 0;
      let reportesRealizados = 0;
      let leccionesCompletadas = 0;

      for (const u of group.usuarios) {
        for (const e of u.eventos_simulacion) {
          if (e.tipo_evento === 'enviado') simulacionesRecibidas++;
          else if (e.tipo_evento === 'click') clicsEnSimulacion++;
          else if (e.tipo_evento === 'formulario_enviado')
            credencialesComprometidas++;
        }
        reportesRealizados += u.reportes_sospechosos.length;
        leccionesCompletadas += u.logros_usuarios.length;
      }

      const tasaVulnerabilidad = calculateRate(
        clicsEnSimulacion + credencialesComprometidas,
        simulacionesRecibidas,
      );

      result.push(
        new DepartmentMetricEntity(
          group.departamentoId,
          group.departamento,
          totalColaboradores,
          scoreRiesgoPromedio,
          nivelRiesgo,
          simulacionesRecibidas,
          clicsEnSimulacion,
          credencialesComprometidas,
          tasaVulnerabilidad,
          reportesRealizados,
          leccionesCompletadas,
        ),
      );
    }

    // Regla técnica 3: Ordenar por scoreRiesgoPromedio DESC, totalColaboradores DESC, nombre ASC
    result.sort((a, b) => {
      if (b.scoreRiesgoPromedio !== a.scoreRiesgoPromedio) {
        return b.scoreRiesgoPromedio - a.scoreRiesgoPromedio;
      }
      if (b.totalColaboradores !== a.totalColaboradores) {
        return b.totalColaboradores - a.totalColaboradores;
      }
      return a.departamento.localeCompare(b.departamento);
    });

    return result;
  }

  async getAttackVectorMetrics(
    empresaId: number,
    dateRange?: ParsedDateRange,
  ): Promise<AttackVectorMetricEntity[]> {
    const eventDateFilter = buildDateFilter(dateRange);

    const events = await this.prisma.eventos_simulacion.findMany({
      where: {
        usuarios: { empresa_id: empresaId },
        ...(eventDateFilter ? { fecha_hora: eventDateFilter } : {}),
      },
      select: {
        tipo_evento: true,
        campanas: {
          select: {
            plantillas: {
              select: { metodo_ataque: true },
            },
          },
        },
      },
    });

    const vectorCounters: Record<
      string,
      { envios: number; clics: number; credenciales: number }
    > = {
      phishing: { envios: 0, clics: 0, credenciales: 0 },
      smishing: { envios: 0, clics: 0, credenciales: 0 },
      vishing: { envios: 0, clics: 0, credenciales: 0 },
      ingenieria_social: { envios: 0, clics: 0, credenciales: 0 },
    };

    for (const ev of events) {
      const rawVector =
        ev.campanas?.plantillas?.metodo_ataque?.toLowerCase().trim() ||
        'phishing';
      const vector = vectorCounters[rawVector] ? rawVector : 'phishing';

      if (ev.tipo_evento === 'enviado') {
        vectorCounters[vector].envios++;
      } else if (ev.tipo_evento === 'click') {
        vectorCounters[vector].clics++;
      } else if (ev.tipo_evento === 'formulario_enviado') {
        vectorCounters[vector].credenciales++;
      }
    }

    const VECTORS = ['phishing', 'smishing', 'vishing', 'ingenieria_social'];

    return VECTORS.map((vec) => {
      const counts = vectorCounters[vec];
      const tasaClic = calculateRate(counts.clics, counts.envios);
      const tasaCompromiso = calculateRate(counts.credenciales, counts.envios);

      return new AttackVectorMetricEntity(
        vec,
        counts.envios,
        counts.clics,
        counts.credenciales,
        tasaClic,
        tasaCompromiso,
      );
    });
  }

  async getEvolutionMetrics(
    empresaId: number,
    dateRange?: ParsedDateRange,
  ): Promise<EvolutionMetricEntity[]> {
    // Generar lista de periodos YYYY-MM
    const periodos: string[] = [];

    if (dateRange?.desde && dateRange?.hasta) {
      const current = new Date(dateRange.desde.getTime());
      const end = new Date(dateRange.hasta.getTime());
      while (
        current.getFullYear() < end.getFullYear() ||
        (current.getFullYear() === end.getFullYear() &&
          current.getMonth() <= end.getMonth())
      ) {
        const yyyy = current.getFullYear();
        const mm = String(current.getMonth() + 1).padStart(2, '0');
        periodos.push(`${yyyy}-${mm}`);
        current.setMonth(current.getMonth() + 1);
      }
    } else {
      // Últimos 6 meses por defecto
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        periodos.push(`${yyyy}-${mm}`);
      }
    }

    const firstPeriod = periodos[0];
    const lastPeriod = periodos[periodos.length - 1];
    const [startYear, startMonth] = firstPeriod.split('-').map(Number);
    const [endYear, endMonth] = lastPeriod.split('-').map(Number);

    const windowStart = new Date(Date.UTC(startYear, startMonth - 1, 1, 0, 0, 0, 0));
    const windowEnd = new Date(Date.UTC(endYear, endMonth, 0, 23, 59, 59, 999));

    const [events, reports, achievements] = await Promise.all([
      this.prisma.eventos_simulacion.findMany({
        where: {
          usuarios: { empresa_id: empresaId },
          fecha_hora: { gte: windowStart, lte: windowEnd },
        },
        select: { tipo_evento: true, fecha_hora: true },
      }),
      this.prisma.reportes_sospechosos.findMany({
        where: {
          usuarios: { empresa_id: empresaId },
          fecha_reporte: { gte: windowStart, lte: windowEnd },
        },
        select: { fecha_reporte: true },
      }),
      this.prisma.logros_usuarios.findMany({
        where: {
          usuarios: { empresa_id: empresaId },
          estado: 'completada',
          fecha_completado: { gte: windowStart, lte: windowEnd },
        },
        select: { fecha_completado: true },
      }),
    ]);

    const periodMap = new Map<
      string,
      {
        simulacionesEnviadas: number;
        incidentesSimulacion: number;
        reportesSospechosos: number;
        leccionesCompletadas: number;
      }
    >();

    for (const p of periodos) {
      periodMap.set(p, {
        simulacionesEnviadas: 0,
        incidentesSimulacion: 0,
        reportesSospechosos: 0,
        leccionesCompletadas: 0,
      });
    }

    const getPeriodStr = (d: Date | null | undefined): string | null => {
      if (!d) return null;
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      return `${yyyy}-${mm}`;
    };

    for (const ev of events) {
      const p = getPeriodStr(ev.fecha_hora);
      if (p && periodMap.has(p)) {
        const item = periodMap.get(p)!;
        if (ev.tipo_evento === 'enviado') {
          item.simulacionesEnviadas++;
        } else if (
          ev.tipo_evento === 'click' ||
          ev.tipo_evento === 'formulario_enviado'
        ) {
          item.incidentesSimulacion++;
        }
      }
    }

    for (const rep of reports) {
      const p = getPeriodStr(rep.fecha_reporte);
      if (p && periodMap.has(p)) {
        periodMap.get(p)!.reportesSospechosos++;
      }
    }

    for (const ach of achievements) {
      const p = getPeriodStr(ach.fecha_completado);
      if (p && periodMap.has(p)) {
        periodMap.get(p)!.leccionesCompletadas++;
      }
    }

    return periodos.map((p) => {
      const data = periodMap.get(p)!;
      return new EvolutionMetricEntity(
        p,
        data.simulacionesEnviadas,
        data.incidentesSimulacion,
        data.reportesSospechosos,
        data.leccionesCompletadas,
      );
    });
  }

  async getFeaturedUsers(
    empresaId: number,
    dateRange?: ParsedDateRange,
  ): Promise<FeaturedUsersEntity> {
    const eventDateFilter = buildDateFilter(dateRange);

    const activeUsers = await this.prisma.usuarios.findMany({
      where: { empresa_id: empresaId, estado: 'activo' },
      include: {
        departamentos: true,
        eventos_simulacion: {
          where: {
            tipo_evento: { in: ['click', 'formulario_enviado'] },
            ...(eventDateFilter ? { fecha_hora: eventDateFilter } : {}),
          },
          select: { id: true },
        },
        reportes_sospechosos: {
          where: eventDateFilter ? { fecha_reporte: eventDateFilter } : {},
          select: { id: true },
        },
        logros_usuarios: {
          where: {
            estado: 'completada',
            ...(eventDateFilter
              ? { fecha_completado: eventDateFilter }
              : {}),
          },
          select: { puntos_obtenidos: true },
        },
      },
    });

    // 1. Mayor Riesgo (Top 5): scoreRiesgo DESC, simulacionesFallidas DESC, nombre ASC
    const highRiskCandidates = activeUsers.map((u) => {
      const score = u.score_riesgo ?? 0;
      const fallidas = u.eventos_simulacion.length;
      return {
        id: u.id,
        nombre: u.nombre,
        correo: u.correo_corporativo,
        departamento: u.departamentos?.nombre || 'Sin departamento',
        scoreRiesgo: score,
        nivelRiesgo: resolveRiskLevel(score),
        simulacionesFallidas: fallidas,
      };
    });

    highRiskCandidates.sort((a, b) => {
      if (b.scoreRiesgo !== a.scoreRiesgo) {
        return b.scoreRiesgo - a.scoreRiesgo;
      }
      if (b.simulacionesFallidas !== a.simulacionesFallidas) {
        return b.simulacionesFallidas - a.simulacionesFallidas;
      }
      return a.nombre.localeCompare(b.nombre);
    });

    const mayorRiesgo = highRiskCandidates
      .slice(0, 5)
      .map(
        (u) =>
          new HighRiskUserEntity(
            u.id,
            u.nombre,
            u.correo,
            u.departamento,
            u.scoreRiesgo,
            u.nivelRiesgo,
            u.simulacionesFallidas,
          ),
      );

    // 2. Mejores Defensores (Top 5): puntosCapacitacion DESC, reportes DESC, scoreRiesgo ASC, nombre ASC
    const topDefenderCandidates = activeUsers.map((u) => {
      const puntos = u.logros_usuarios.reduce(
        (acc, l) => acc + (l.puntos_obtenidos ?? 0),
        0,
      );
      const reportes = u.reportes_sospechosos.length;
      const score = u.score_riesgo ?? 0;
      const racha = u.racha_dias_seguros ?? 0;

      return {
        id: u.id,
        nombre: u.nombre,
        correo: u.correo_corporativo,
        departamento: u.departamentos?.nombre || 'Sin departamento',
        puntosCapacitacion: puntos,
        reportesRealizados: reportes,
        scoreRiesgo: score,
        rachaDiasSeguros: racha,
      };
    });

    topDefenderCandidates.sort((a, b) => {
      if (b.puntosCapacitacion !== a.puntosCapacitacion) {
        return b.puntosCapacitacion - a.puntosCapacitacion;
      }
      if (b.reportesRealizados !== a.reportesRealizados) {
        return b.reportesRealizados - a.reportesRealizados;
      }
      if (a.scoreRiesgo !== b.scoreRiesgo) {
        return a.scoreRiesgo - b.scoreRiesgo;
      }
      return a.nombre.localeCompare(b.nombre);
    });

    const mejoresDefensores = topDefenderCandidates
      .slice(0, 5)
      .map(
        (u) =>
          new TopDefenderUserEntity(
            u.id,
            u.nombre,
            u.correo,
            u.departamento,
            u.puntosCapacitacion,
            u.reportesRealizados,
            u.scoreRiesgo,
            u.rachaDiasSeguros,
          ),
      );

    return new FeaturedUsersEntity(mayorRiesgo, mejoresDefensores);
  }

  async getExportData(
    empresaId: number,
    dateRange?: ParsedDateRange,
  ): Promise<ExportUserRowEntity[]> {
    const eventDateFilter = buildDateFilter(dateRange);

    const activeUsers = await this.prisma.usuarios.findMany({
      where: { empresa_id: empresaId, estado: 'activo' },
      include: {
        departamentos: true,
        eventos_simulacion: {
          where: eventDateFilter ? { fecha_hora: eventDateFilter } : {},
          select: { tipo_evento: true },
        },
        reportes_sospechosos: {
          where: eventDateFilter ? { fecha_reporte: eventDateFilter } : {},
          select: { id: true },
        },
        logros_usuarios: {
          where: {
            estado: 'completada',
            ...(eventDateFilter
              ? { fecha_completado: eventDateFilter }
              : {}),
          },
          select: { puntos_obtenidos: true },
        },
      },
      orderBy: [{ score_riesgo: 'desc' }, { nombre: 'asc' }],
    });

    return activeUsers.map((u) => {
      const score = u.score_riesgo ?? 0;
      let simulacionesRecibidas = 0;
      let clicsEnlace = 0;
      let credencialesComprometidas = 0;

      for (const ev of u.eventos_simulacion) {
        if (ev.tipo_evento === 'enviado') simulacionesRecibidas++;
        else if (ev.tipo_evento === 'click') clicsEnlace++;
        else if (ev.tipo_evento === 'formulario_enviado')
          credencialesComprometidas++;
      }

      const reportesSospechosos = u.reportes_sospechosos.length;
      const leccionesCompletadas = u.logros_usuarios.length;
      const puntosAcumulados = u.logros_usuarios.reduce(
        (acc, l) => acc + (l.puntos_obtenidos ?? 0),
        0,
      );

      const estadoAppMovil: 'Vinculado' | 'No vinculado' =
        u.token_notificacion_push ? 'Vinculado' : 'No vinculado';

      return new ExportUserRowEntity(
        u.id,
        u.nombre,
        u.correo_corporativo,
        u.departamentos?.nombre || 'Sin departamento',
        score,
        resolveRiskLevel(score),
        simulacionesRecibidas,
        clicsEnlace,
        credencialesComprometidas,
        reportesSospechosos,
        leccionesCompletadas,
        puntosAcumulados,
        estadoAppMovil,
      );
    });
  }
}
