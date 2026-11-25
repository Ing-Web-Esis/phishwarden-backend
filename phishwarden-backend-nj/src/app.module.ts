import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EmpresasModule } from './empresas/empresas.module';
import { EmpleadosModule } from './empleados/empleados.module';
import { PlantillasModule } from './plantillas/plantillas.module';
import { CampanasModule } from './campanas/campanas.module';
import { DepartamentosModule } from './departamentos/departamentos.module';
import { SimulacionesModule } from './simulaciones/simulaciones.module';
import { PortalesModule } from './portales/portales.module';
import { MobileModule } from './mobile/mobile.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    EmpresasModule,
    EmpleadosModule,
    PlantillasModule,
    CampanasModule,
    DepartamentosModule,
    SimulacionesModule,
    PortalesModule,
    MobileModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
