import { DataSource } from 'typeorm';

export class DbHelper {
  constructor(private dataSource: DataSource) {}

  async truncateTables(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    const tables = await queryRunner.getTables();

    for (const table of tables) {
      await queryRunner.query(
        `TRUNCATE TABLE "${table.name}" RESTART IDENTITY CASCADE`,
      );
    }

    await queryRunner.release();
  }
}
