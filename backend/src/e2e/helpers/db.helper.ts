import { DataSource } from 'typeorm'
import { getDatabase } from '../../database/database.factory'

export class DbHelper {
  private dataSource: DataSource

  async init(): Promise<void> {
    this.dataSource = await getDatabase()
  }

  async truncateTables(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner()
    const tables = await queryRunner.getTables()
    
    for (const table of tables) {
      await queryRunner.query(`TRUNCATE TABLE "${table.name}" RESTART IDENTITY CASCADE`)
    }
    
    await queryRunner.release()
  }

  async close(): Promise<void> {
    if (this.dataSource?.isInitialized) {
      await this.dataSource.destroy()
    }
  }
}
