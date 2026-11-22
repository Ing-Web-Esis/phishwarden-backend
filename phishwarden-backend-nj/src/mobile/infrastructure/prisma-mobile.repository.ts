import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  MobileRepositoryPort,
  CompanyAccessInfo,
  CreateReportInput,
  ReportCreatedResult,
  LessonEvaluationParams,
  EmployeeMetricsResult,
} from '../application/mobile.repository.port';
import { MobileUserEntity } from '../domain/mobile-user.entity';
import {
  LessonSummaryEntity,
  LessonDetailEntity,
  EvaluationQuestionEntity,
} from '../domain/mobile-lesson.entity';
import { MobileBadgeEntity } from '../domain/mobile-badge.entity';
import {
  MobileRankingItemEntity,
  EvaluationResultEntity,
} from '../domain/mobile-ranking.entity';

@Injectable()
export class PrismaMobileRepository implements MobileRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findCompanyByAccessCode(accessCode: string): Promise<CompanyAccessInfo | null> {
    const company = await this.prisma.empresas.findUnique({
      where: { codigo_acceso: accessCode },
      select: {
        id: true,
        nombre: true,
        codigo_acceso: true,
      },
    });

    if (!company) return null;

    return {
      id: company.id,
      nombre: company.nombre,
      codigoAcceso: company.codigo_acceso,
    };
  }

  async findActiveUserByEmailAndCompany(
    email: string,
    companyId: number,
  ): Promise<MobileUserEntity | null> {
    const user = await this.prisma.usuarios.findFirst({
      where: {
        correo_corporativo: email,
        empresa_id: companyId,
        estado: 'activo',
      },
      include: {
        departamentos: true,
        empresas: true,
      },
    });

    if (!user) return null;

    return new MobileUserEntity(
      user.id,
      user.empresa_id || companyId,
      user.nombre,
      user.correo_corporativo,
      user.numero_telefonico,
      user.score_riesgo ?? 0,
      user.racha_dias_seguros ?? 0,
      user.token_notificacion_push,
      user.estado || 'activo',
      user.departamentos?.nombre || null,
      user.empresas?.nombre || undefined,
    );
  }

  async findUserById(id: string): Promise<MobileUserEntity | null> {
    const user = await this.prisma.usuarios.findUnique({
      where: { id },
      include: {
        departamentos: true,
        empresas: true,
      },
    });

    if (!user) return null;

    return new MobileUserEntity(
      user.id,
      user.empresa_id || 0,
      user.nombre,
      user.correo_corporativo,
      user.numero_telefonico,
      user.score_riesgo ?? 0,
      user.racha_dias_seguros ?? 0,
      user.token_notificacion_push,
      user.estado || 'activo',
      user.departamentos?.nombre || null,
      user.empresas?.nombre || undefined,
    );
  }

  async updatePushToken(userId: string, token: string | null): Promise<boolean> {
    const result = await this.prisma.usuarios.updateMany({
      where: { id: userId },
      data: {
        token_notificacion_push: token,
      },
    });

    return result.count > 0;
  }

  async clearInvalidPushToken(token: string): Promise<void> {
    await this.prisma.usuarios.updateMany({
      where: { token_notificacion_push: token },
      data: {
        token_notificacion_push: null,
      },
    });
  }

  async createReportAndUpdateRisk(
    userId: string,
    input: CreateReportInput,
  ): Promise<ReportCreatedResult> {
    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.usuarios.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('Colaborador no encontrado en el sistema.');
      }

      const currentScore = user.score_riesgo ?? 0;
      const currentStreak = user.racha_dias_seguros ?? 0;
      const newScore = Math.max(0, currentScore - 5);
      const newStreak = currentStreak + 1;

      const report = await tx.reportes_sospechosos.create({
        data: {
          usuario_id: userId,
          canal: input.canal,
          remitente: input.remitente,
          asunto: input.asunto || null,
          descripcion: input.descripcion || null,
          url_sospechosa: input.urlSospechosa || null,
        },
      });

      await tx.usuarios.update({
        where: { id: userId },
        data: {
          score_riesgo: newScore,
          racha_dias_seguros: newStreak,
        },
      });

      return {
        reporteId: report.id,
        scoreRiesgo: newScore,
        rachaDiasSeguros: newStreak,
        puntosDisminuidos: currentScore - newScore,
      };
    });
  }

  // --------------------------------------------------------------------------
  // FASE 4: CAPACITACIÓN Y GAMIFICACIÓN
  // --------------------------------------------------------------------------

  async findAllLessonsWithUserStatus(userId: string): Promise<LessonSummaryEntity[]> {
    const lessons = await this.prisma.microlecciones.findMany({
      orderBy: { id: 'asc' },
    });

    const userAchievements = await this.prisma.logros_usuarios.findMany({
      where: { usuario_id: userId },
    });

    const achievementsMap = new Map<number, { estado: string | null; puntos: number; fecha: Date | null }>();
    for (const a of userAchievements) {
      if (a.microleccion_id) {
        achievementsMap.set(a.microleccion_id, {
          estado: a.estado,
          puntos: a.puntos_obtenidos ?? 0,
          fecha: a.fecha_completado,
        });
      }
    }

    return lessons.map((l) => {
      const achievement = achievementsMap.get(l.id);
      let estado: 'disponible' | 'pendiente' | 'reprobada' | 'completada' = 'disponible';
      let puntosObtenidos: number | undefined;
      let fechaCompletado: Date | null | undefined;

      if (achievement) {
        if (achievement.estado === 'completada') {
          estado = 'completada';
          puntosObtenidos = achievement.puntos;
          fechaCompletado = achievement.fecha;
        } else if (achievement.estado === 'pendiente') {
          estado = 'pendiente';
        } else if (achievement.estado === 'reprobada') {
          estado = 'reprobada';
        }
      }

      return new LessonSummaryEntity(
        l.id,
        l.titulo,
        l.metodo_ataque,
        l.contenido_multimedia,
        l.duracion_minutos ?? 2,
        l.puntos_recompensa ?? 10,
        estado,
        puntosObtenidos,
        fechaCompletado,
      );
    });
  }

  async findLessonDetailById(lessonId: number, userId: string): Promise<LessonDetailEntity | null> {
    const lesson = await this.prisma.microlecciones.findUnique({
      where: { id: lessonId },
      include: {
        preguntas_evaluacion: {
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!lesson) return null;

    const achievement = await this.prisma.logros_usuarios.findUnique({
      where: {
        usuario_id_microleccion_id: {
          usuario_id: userId,
          microleccion_id: lessonId,
        },
      },
    });

    let estadoUsuario: 'disponible' | 'pendiente' | 'reprobada' | 'completada' = 'disponible';
    if (achievement) {
      if (achievement.estado === 'completada') {
        estadoUsuario = 'completada';
      } else if (achievement.estado === 'pendiente') {
        estadoUsuario = 'pendiente';
      } else if (achievement.estado === 'reprobada') {
        estadoUsuario = 'reprobada';
      }
    }

    // Ocultar estrictamente respuesta_correcta
    const questions = lesson.preguntas_evaluacion.map(
      (q) =>
        new EvaluationQuestionEntity(
          q.id,
          q.enunciado,
          q.opcion_a,
          q.opcion_b,
          q.opcion_c,
          q.opcion_d,
        ),
    );

    return new LessonDetailEntity(
      lesson.id,
      lesson.titulo,
      lesson.metodo_ataque,
      lesson.contenido_multimedia,
      lesson.duracion_minutos ?? 2,
      lesson.puntos_recompensa ?? 10,
      estadoUsuario,
      questions,
    );
  }

  async findLessonQuestionsForEvaluation(
    lessonId: number,
  ): Promise<Array<{ id: number; respuestaCorrecta: string }> | null> {
    const lesson = await this.prisma.microlecciones.findUnique({
      where: { id: lessonId },
      include: {
        preguntas_evaluacion: {
          select: {
            id: true,
            respuesta_correcta: true,
          },
        },
      },
    });

    if (!lesson) return null;

    return lesson.preguntas_evaluacion.map((q) => ({
      id: q.id,
      respuestaCorrecta: q.respuesta_correcta,
    }));
  }

  async findUserLessonAchievement(
    userId: string,
    lessonId: number,
  ): Promise<{ estado: string; puntosObtenidos: number } | null> {
    const achievement = await this.prisma.logros_usuarios.findUnique({
      where: {
        usuario_id_microleccion_id: {
          usuario_id: userId,
          microleccion_id: lessonId,
        },
      },
    });

    if (!achievement) return null;

    return {
      estado: achievement.estado || '',
      puntosObtenidos: achievement.puntos_obtenidos ?? 0,
    };
  }

  async evaluateAndRecordLesson(params: LessonEvaluationParams): Promise<EvaluationResultEntity> {
    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.usuarios.findUnique({
        where: { id: params.userId },
      });

      if (!user) {
        throw new NotFoundException('Colaborador no encontrado.');
      }

      let currentRisk = user.score_riesgo ?? 0;

      if (params.aprobado) {
        // Registrar lección como completada
        await tx.logros_usuarios.upsert({
          where: {
            usuario_id_microleccion_id: {
              usuario_id: params.userId,
              microleccion_id: params.lessonId,
            },
          },
          create: {
            usuario_id: params.userId,
            microleccion_id: params.lessonId,
            estado: 'completada',
            puntos_obtenidos: params.puntosRecompensa,
            fecha_completado: new Date(),
          },
          update: {
            estado: 'completada',
            puntos_obtenidos: params.puntosRecompensa,
            fecha_completado: new Date(),
          },
        });

        // Anti-farming: solo si no estaba completada previamente se descuenta riesgo
        let puntosGanados = 0;
        if (!params.wasAlreadyCompleted) {
          puntosGanados = params.puntosRecompensa;
          currentRisk = Math.max(0, currentRisk - 10);
          await tx.usuarios.update({
            where: { id: params.userId },
            data: { score_riesgo: currentRisk },
          });
        }

        // Calcular puntos totales acumulados
        const allCompleted = await tx.logros_usuarios.findMany({
          where: {
            usuario_id: params.userId,
            estado: 'completada',
          },
          select: { puntos_obtenidos: true },
        });

        const puntosTotales = allCompleted.reduce(
          (acc, item) => acc + (item.puntos_obtenidos ?? 0),
          0,
        );

        // Desbloqueo automático de medallas según puntos requeridos
        const eligibleBadges = await tx.insignias_medallas.findMany({
          where: { puntos_requeridos: { lte: puntosTotales } },
          orderBy: { puntos_requeridos: 'asc' },
        });

        const userExistingBadges = await tx.medallas_usuarios.findMany({
          where: { usuario_id: params.userId },
          select: { insignia_id: true },
        });

        const existingBadgeIds = new Set(userExistingBadges.map((b) => b.insignia_id));
        const newBadgesToUnlock = eligibleBadges.filter((b) => !existingBadgeIds.has(b.id));

        for (const badge of newBadgesToUnlock) {
          await tx.medallas_usuarios.create({
            data: {
              usuario_id: params.userId,
              insignia_id: badge.id,
              fecha_obtencion: new Date(),
            },
          });
        }

        const nuevasMedallas = newBadgesToUnlock.map((b) => ({
          id: b.id,
          nombre: b.nombre,
          descripcion: b.descripcion,
          iconoUrl: b.icono_url,
          puntosRequeridos: b.puntos_requeridos,
        }));

        return new EvaluationResultEntity(
          true,
          params.porcentajeAciertos,
          params.correctas,
          params.totalPreguntas,
          puntosGanados,
          puntosTotales,
          currentRisk,
          nuevasMedallas,
        );
      } else {
        // Reprobada: si no estaba ya completada, registramos como reprobada para permitir reintentos
        if (!params.wasAlreadyCompleted) {
          await tx.logros_usuarios.upsert({
            where: {
              usuario_id_microleccion_id: {
                usuario_id: params.userId,
                microleccion_id: params.lessonId,
              },
            },
            create: {
              usuario_id: params.userId,
              microleccion_id: params.lessonId,
              estado: 'reprobada',
              puntos_obtenidos: 0,
              fecha_completado: null,
            },
            update: {
              estado: 'reprobada',
              puntos_obtenidos: 0,
              fecha_completado: null,
            },
          });
        }

        // Puntos totales actuales
        const allCompleted = await tx.logros_usuarios.findMany({
          where: {
            usuario_id: params.userId,
            estado: 'completada',
          },
          select: { puntos_obtenidos: true },
        });

        const puntosTotales = allCompleted.reduce(
          (acc, item) => acc + (item.puntos_obtenidos ?? 0),
          0,
        );

        return new EvaluationResultEntity(
          false,
          params.porcentajeAciertos,
          params.correctas,
          params.totalPreguntas,
          0,
          puntosTotales,
          currentRisk,
          [],
        );
      }
    });
  }

  async findUserBadgesWithCatalog(
    userId: string,
  ): Promise<{ puntosTotales: number; medallas: MobileBadgeEntity[] }> {
    const badges = await this.prisma.insignias_medallas.findMany({
      orderBy: { puntos_requeridos: 'asc' },
    });

    const userBadges = await this.prisma.medallas_usuarios.findMany({
      where: { usuario_id: userId },
    });

    const userBadgesMap = new Map<number, Date | null>();
    for (const ub of userBadges) {
      userBadgesMap.set(ub.insignia_id, ub.fecha_obtencion);
    }

    const completedAchievements = await this.prisma.logros_usuarios.findMany({
      where: {
        usuario_id: userId,
        estado: 'completada',
      },
      select: { puntos_obtenidos: true },
    });

    const puntosTotales = completedAchievements.reduce(
      (acc, a) => acc + (a.puntos_obtenidos ?? 0),
      0,
    );

    const medallas = badges.map((b) => {
      const fecha = userBadgesMap.get(b.id);
      return new MobileBadgeEntity(
        b.id,
        b.nombre,
        b.descripcion,
        b.icono_url,
        b.puntos_requeridos,
        userBadgesMap.has(b.id),
        fecha || null,
      );
    });

    return { puntosTotales, medallas };
  }

  async getCompanyRanking(
    companyId: number,
    currentUserId: string,
  ): Promise<{ miPosicion: number; ranking: MobileRankingItemEntity[] }> {
    const employees = await this.prisma.usuarios.findMany({
      where: {
        empresa_id: companyId,
        estado: 'activo',
      },
      include: {
        departamentos: true,
        logros_usuarios: {
          where: { estado: 'completada' },
          select: { puntos_obtenidos: true },
        },
        medallas_usuarios: {
          select: { insignia_id: true },
        },
      },
    });

    const candidates = employees.map((emp) => {
      const puntosTotales = emp.logros_usuarios.reduce(
        (acc, logro) => acc + (logro.puntos_obtenidos ?? 0),
        0,
      );
      const medallasCount = emp.medallas_usuarios.length;
      const rachaDiasSeguros = emp.racha_dias_seguros ?? 0;
      const scoreRiesgo = emp.score_riesgo ?? 0;

      return {
        usuarioId: emp.id,
        nombre: emp.nombre,
        departamento: emp.departamentos?.nombre || null,
        puntosTotales,
        medallasCount,
        rachaDiasSeguros,
        scoreRiesgo,
        esUsuarioActual: emp.id === currentUserId,
      };
    });

    // Criterio de ordenamiento:
    // 1. puntosTotales DESC
    // 2. rachaDiasSeguros DESC
    // 3. scoreRiesgo ASC (menor riesgo es mejor)
    // 4. nombre ASC
    candidates.sort((a, b) => {
      if (b.puntosTotales !== a.puntosTotales) {
        return b.puntosTotales - a.puntosTotales;
      }
      if (b.rachaDiasSeguros !== a.rachaDiasSeguros) {
        return b.rachaDiasSeguros - a.rachaDiasSeguros;
      }
      if (a.scoreRiesgo !== b.scoreRiesgo) {
        return a.scoreRiesgo - b.scoreRiesgo;
      }
      return a.nombre.localeCompare(b.nombre);
    });

    let miPosicion = 1;
    const ranking: MobileRankingItemEntity[] = candidates.map((item, index) => {
      const pos = index + 1;
      if (item.esUsuarioActual) {
        miPosicion = pos;
      }
      return new MobileRankingItemEntity(
        pos,
        item.usuarioId,
        item.nombre,
        item.departamento,
        item.puntosTotales,
        item.medallasCount,
        item.rachaDiasSeguros,
        item.scoreRiesgo,
        item.esUsuarioActual,
      );
    });

    return { miPosicion, ranking };
  }

  async assignReactiveLessonIfEligible(userId: string, metodoAtaque: string): Promise<number | null> {
    const completed = await this.prisma.logros_usuarios.findMany({
      where: {
        usuario_id: userId,
        estado: 'completada',
      },
      select: { microleccion_id: true },
    });

    const completedIds = new Set(completed.map((c) => c.microleccion_id).filter(Boolean) as number[]);

    const normalizedAttack = (metodoAtaque || '').toLowerCase().trim();

    // Buscar lección del vector que no haya completado
    let targetLesson = await this.prisma.microlecciones.findFirst({
      where: {
        metodo_ataque: normalizedAttack,
        id: { notIn: Array.from(completedIds) },
      },
      orderBy: { id: 'asc' },
    });

    // Si ya completó todas de ese vector, buscar una general sin completar
    if (!targetLesson) {
      targetLesson = await this.prisma.microlecciones.findFirst({
        where: {
          metodo_ataque: 'general',
          id: { notIn: Array.from(completedIds) },
        },
        orderBy: { id: 'asc' },
      });
    }

    if (!targetLesson) return null;

    // Asignar lección en estado 'pendiente' si no estaba completada
    await this.prisma.logros_usuarios.upsert({
      where: {
        usuario_id_microleccion_id: {
          usuario_id: userId,
          microleccion_id: targetLesson.id,
        },
      },
      create: {
        usuario_id: userId,
        microleccion_id: targetLesson.id,
        estado: 'pendiente',
        puntos_obtenidos: 0,
        fecha_completado: null,
      },
      update: {
        estado: 'pendiente',
        puntos_obtenidos: 0,
        fecha_completado: null,
      },
    });

    return targetLesson.id;
  }

  async getEmployeeMetrics(userId: string, companyId: number): Promise<EmployeeMetricsResult> {
    const achievements = await this.prisma.logros_usuarios.findMany({
      where: { usuario_id: userId },
    });

    let puntosTotales = 0;
    let leccionesCompletadas = 0;
    let leccionesPendientes = 0;

    for (const a of achievements) {
      if (a.estado === 'completada') {
        puntosTotales += a.puntos_obtenidos ?? 0;
        leccionesCompletadas++;
      } else if (a.estado === 'pendiente' || a.estado === 'reprobada') {
        leccionesPendientes++;
      }
    }

    const medallasCount = await this.prisma.medallas_usuarios.count({
      where: { usuario_id: userId },
    });

    const rankingData = await this.getCompanyRanking(companyId, userId);

    return {
      puntosTotales,
      leccionesCompletadas,
      leccionesPendientes,
      medallasObtenidas: medallasCount,
      posicionRanking: rankingData.miPosicion,
    };
  }
}
