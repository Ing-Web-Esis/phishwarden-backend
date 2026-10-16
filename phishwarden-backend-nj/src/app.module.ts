import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EmpresasModule } from './empresas/empresas.module';
import { EmpleadosModule } from './empleados/empleados.module';
import {PlantillasModule} from './plantillas/plantillas.module';
import { CampanasModule } from './campanas/campanas.module';
import { DepartamentosModule } from './departamentos/departamentos.module';

@Module({
  imports: [PrismaModule, AuthModule, EmpresasModule, EmpleadosModule, PlantillasModule, CampanasModule, DepartamentosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
