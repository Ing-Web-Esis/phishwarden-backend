import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { EMPLOYEE_REPOSITORY } from './employee.repository.port';
import type {
  EmployeeRepositoryPort,
  RawEmployeeCsvRow,
  BulkImportResult,
} from './employee.repository.port';

@Injectable()
export class BulkImportEmployeesUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employeeRepository: EmployeeRepositoryPort,
  ) {}

  async execute(
    companyId: number,
    fileBuffer: Buffer,
  ): Promise<BulkImportResult> {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new BadRequestException('El archivo CSV provisto está vacío.');
    }

    const content = fileBuffer.toString('utf-8');
    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length <= 1) {
      throw new BadRequestException(
        'El archivo debe contener al menos una fila de encabezado y un registro.',
      );
    }

    const headerLine = lines[0].toLowerCase();
    const delimiter = headerLine.includes(';') ? ';' : ',';

    const rows: RawEmployeeCsvRow[] = [];
    const errors: Array<{ line: number; email: string; reason: string }> = [];

    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(delimiter).map((col) => col.trim());
      const nombre = columns[0] || '';
      const correo = (columns[1] || '').toLowerCase();
      const departamento = columns[2] || 'General';
      const telefono = columns[3] || undefined;

      if (!nombre || !correo) {
        errors.push({
          line: i + 1,
          email: correo || 'N/A',
          reason: 'Nombre o correo ausente en la fila.',
        });
        continue;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correo)) {
        errors.push({
          line: i + 1,
          email: correo,
          reason: 'Formato de correo electrónico inválido.',
        });
        continue;
      }

      rows.push({ nombre, correo, departamento, telefono });
    }

    if (rows.length === 0) {
      return {
        totalProcessed: lines.length - 1,
        importedCount: 0,
        skippedCount: errors.length,
        errors,
      };
    }

    // Consulta global de correos existentes en la plataforma
    const uniqueEmailsInCsv = Array.from(new Set(rows.map((r) => r.correo)));
    const existingEmails =
      await this.employeeRepository.findExistingEmails(uniqueEmailsInCsv);

    const validToInsert: Array<{
      name: string;
      email: string;
      departmentId?: number;
      phone?: string;
    }> = [];

    const departmentMap = new Map<string, number>();

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const lineNumber = index + 2;

      if (existingEmails.has(row.correo)) {
        errors.push({
          line: lineNumber,
          email: row.correo,
          reason: 'El correo corporativo ya está registrado en el sistema.',
        });
        continue;
      }

      const deptName = row.departamento || 'General';

      let deptId = departmentMap.get(deptName);
      if (!deptId) {
        const dept = await this.employeeRepository.findOrCreateDepartment(
          companyId,
          deptName,
        );
        deptId = dept.id;
        departmentMap.set(deptName, deptId);
      }

      validToInsert.push({
        name: row.nombre,
        email: row.correo,
        departmentId: deptId,
        phone: row.telefono,
      });

      existingEmails.add(row.correo);
    }

    let importedCount = 0;
    if (validToInsert.length > 0) {
      importedCount = await this.employeeRepository.bulkCreateEmployees(
        companyId,
        validToInsert,
      );
    }

    return {
      totalProcessed: lines.length - 1,
      importedCount,
      skippedCount: errors.length,
      errors,
    };
  }
}