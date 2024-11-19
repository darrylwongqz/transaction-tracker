import { DataSource } from 'typeorm';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';

export const initializeTestDatabase = async () => {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const dataSource = moduleFixture.get<DataSource>(DataSource);

  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  const queryRunner = dataSource.createQueryRunner();

  // Drop all tables to avoid conflicts
  await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0;');
  const tables = await queryRunner.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = '${process.env.DATABASE_NAME_TEST}'
  `);
  for (const { table_name } of tables) {
    await queryRunner.query(`DROP TABLE IF EXISTS ${table_name}`);
  }
  await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1;');

  await queryRunner.release();

  // Run migrations on the test database
  await dataSource.runMigrations();
};
