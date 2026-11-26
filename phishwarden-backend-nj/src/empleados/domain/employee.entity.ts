export class EmployeeEntity {
  constructor(
    public readonly id: string,
    public readonly companyId: number,
    public readonly name: string,
    public readonly corporateEmail: string,
    public readonly departmentId?: number | null,
    public readonly phone?: string | null,
    public readonly createdAt?: Date,
  ) {}
}