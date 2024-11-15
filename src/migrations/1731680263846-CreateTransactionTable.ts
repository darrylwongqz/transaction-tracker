import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTransactionTable1731680263846 implements MigrationInterface {
  name = 'CreateTransactionTable1731680263846';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE \`transactions\` (
                \`hash\` varchar(255) NOT NULL,
                \`blockNumber\` int NOT NULL,
                \`timestamp\` int NOT NULL,
                \`pool\` varchar(255) NOT NULL,
                \`gasPrice\` varchar(255) NOT NULL,
                \`gasUsed\` varchar(255) NOT NULL,
                \`transactionFeeEth\` decimal(38,18) NOT NULL,
                \`transactionFee\` decimal(38,18) NOT NULL,
                INDEX \`IDX_transactions_timestamp\` (\`timestamp\`),
                INDEX \`IDX_transactions_pool\` (\`pool\`),
                PRIMARY KEY (\`hash\`)
            ) ENGINE=InnoDB
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_transactions_pool\` ON \`transactions\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_transactions_timestamp\` ON \`transactions\``,
    );
    await queryRunner.query(`DROP TABLE \`transactions\``);
  }
}
