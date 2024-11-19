import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePoolsTable1731772561799 implements MigrationInterface {
  name = 'CreatePoolsTable1731772561799';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS \`pools\` (\`id\` int NOT NULL AUTO_INCREMENT, \`address\` varchar(255) NOT NULL, \`chain_id\` int NOT NULL, \`current_block\` bigint NOT NULL DEFAULT '0', UNIQUE INDEX \`uq_pools_address_chain\` (\`address\`, \`chain_id\`), INDEX \`idx_address\` (\`address\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`idx_address\` ON \`pools\``);
    await queryRunner.query(
      `DROP INDEX \`uq_pools_address_chain\` ON \`pools\``,
    );
    await queryRunner.query(`DROP TABLE \`pools\``);
  }
}
