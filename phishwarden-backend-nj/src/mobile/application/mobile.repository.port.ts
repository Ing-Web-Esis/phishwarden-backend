import type { MobileUserEntity } from '../domain/mobile-user.entity';
import type {
  LessonSummaryEntity,
  LessonDetailEntity,
} from '../domain/mobile-lesson.entity';
import type { MobileBadgeEntity } from '../domain/mobile-badge.entity';
import type {
  MobileRankingItemEntity,
  EvaluationResultEntity,
} from '../domain/mobile-ranking.entity';

export const MOBILE_REPOSITORY_PORT = 'MOBILE_REPOSITORY_PORT';

export interface CompanyAccessInfo {
  id: number;
  nombre: string;
  codigoAcceso: string;
}

export interface CreateReportInput {
  canal: string;
  remitente: string;
  asunto?: string;
  descripcion?: string;
  urlSospechosa?: string;
}

export interface ReportCreatedResult {
  reporteId: string;
  scoreRiesgo: number;
  rachaDiasSeguros: number;
  puntosDisminuidos: number;
}

export interface LessonEvaluationParams {
  userId: string;
  lessonId: number;
  aprobado: boolean;
  correctas: number;
  totalPreguntas: number;
  porcentajeAciertos: number;
  puntosRecompensa: number;
  wasAlreadyCompleted: boolean;
}

export interface EmployeeMetricsResult {
  puntosTotales: number;
  leccionesCompletadas: number;
  leccionesPendientes: number;
  medallasObtenidas: number;
  posicionRanking: number;
}

export interface MobileRepositoryPort {
  findCompanyByAccessCode(accessCode: string): Promise<CompanyAccessInfo | null>;
  findActiveUserByEmailAndCompany(email: string, companyId: number): Promise<MobileUserEntity | null>;
  findUserById(id: string): Promise<MobileUserEntity | null>;
  updatePushToken(userId: string, token: string | null): Promise<boolean>;
  clearInvalidPushToken(token: string): Promise<void>;
  createReportAndUpdateRisk(userId: string, input: CreateReportInput): Promise<ReportCreatedResult>;

  // Fase 4: Capacitación y Gamificación
  findAllLessonsWithUserStatus(userId: string): Promise<LessonSummaryEntity[]>;
  findLessonDetailById(lessonId: number, userId: string): Promise<LessonDetailEntity | null>;
  findLessonQuestionsForEvaluation(lessonId: number): Promise<Array<{ id: number; respuestaCorrecta: string }> | null>;
  findUserLessonAchievement(userId: string, lessonId: number): Promise<{ estado: string; puntosObtenidos: number } | null>;
  evaluateAndRecordLesson(params: LessonEvaluationParams): Promise<EvaluationResultEntity>;
  findUserBadgesWithCatalog(userId: string): Promise<{ puntosTotales: number; medallas: MobileBadgeEntity[] }>;
  getCompanyRanking(companyId: number, currentUserId: string): Promise<{ miPosicion: number; ranking: MobileRankingItemEntity[] }>;
  assignReactiveLessonIfEligible(userId: string, metodoAtaque: string): Promise<number | null>;
  getEmployeeMetrics(userId: string, companyId: number): Promise<EmployeeMetricsResult>;
}
