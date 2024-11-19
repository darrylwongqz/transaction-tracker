import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);

  constructor(private readonly dataSource: DataSource) {}

  async ensureMigrationsRun() {
    this.logger.log('Running database migrations...');
    try {
      await this.dataSource.runMigrations();
      this.logger.log('Database migrations executed successfully.');
    } catch (error) {
      this.logger.error('Failed to run database migrations:', error.message);
      throw error;
    }
  }
}
