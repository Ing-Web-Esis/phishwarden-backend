export class DepartmentEntity {
  constructor(
    public readonly id: number,
    public readonly companyId: number,
    public readonly name: string,
    public readonly createdAt?: Date,
  ) {}
}