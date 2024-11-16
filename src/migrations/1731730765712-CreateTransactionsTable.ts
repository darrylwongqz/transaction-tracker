import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTransactionsTable1731730765712
  implements MigrationInterface
{
  name = 'CreateTransactionsTable1731730765712';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`transactions\` (
        \`hash\` varchar(255) NOT NULL, 
        \`block_number\` int NOT NULL, 
        \`timestamp\` int NOT NULL, 
        \`pool\` varchar(255) NOT NULL, 
        \`gas_price\` varchar(255) NOT NULL, 
        \`gas_used\` varchar(255) NOT NULL, 
        \`transaction_fee_eth\` decimal(38,18) NOT NULL, 
        \`transaction_fee\` decimal(38,18) NOT NULL, 
        INDEX \`idx_pool\` (\`pool\`), 
        INDEX \`idx_timestamp\` (\`timestamp\`), 
        PRIMARY KEY (\`hash\`)
      ) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`idx_timestamp\` ON \`transactions\``);
    await queryRunner.query(`DROP INDEX \`idx_pool\` ON \`transactions\``);
    await queryRunner.query(`DROP TABLE \`transactions\``);
  }
}
