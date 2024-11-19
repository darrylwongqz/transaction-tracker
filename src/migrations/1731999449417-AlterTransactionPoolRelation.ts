import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTransactionPoolRelation1731999449417
  implements MigrationInterface
{
  name = 'AlterTransactionPoolRelation1731999449417';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the foreign key constraint already exists
    const constraints = await queryRunner.query(
      `SELECT CONSTRAINT_NAME 
       FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
       WHERE TABLE_NAME = 'transactions' 
       AND COLUMN_NAME = 'pool' 
       AND TABLE_SCHEMA = DATABASE()`,
    );

    const exists = constraints.some(
      (c: { CONSTRAINT_NAME: string }) =>
        c.CONSTRAINT_NAME === 'FK_3e277d1c85134649d9a741f223c',
    );

    if (!exists) {
      console.log(
        'Adding foreign key constraint FK_3e277d1c85134649d9a741f223c',
      );
      await queryRunner.query(
        `ALTER TABLE \`transactions\` 
         ADD CONSTRAINT \`FK_3e277d1c85134649d9a741f223c\` 
         FOREIGN KEY (\`pool\`) REFERENCES \`pools\`(\`address\`) 
         ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
    } else {
      console.log(
        'Foreign key constraint FK_3e277d1c85134649d9a741f223c already exists',
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if the foreign key constraint exists before attempting to drop it
    const constraints = await queryRunner.query(
      `SELECT CONSTRAINT_NAME 
       FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
       WHERE TABLE_NAME = 'transactions' 
       AND COLUMN_NAME = 'pool' 
       AND TABLE_SCHEMA = DATABASE()`,
    );

    const exists = constraints.some(
      (c: { CONSTRAINT_NAME: string }) =>
        c.CONSTRAINT_NAME === 'FK_3e277d1c85134649d9a741f223c',
    );

    if (exists) {
      console.log(
        'Dropping foreign key constraint FK_3e277d1c85134649d9a741f223c',
      );
      await queryRunner.query(
        `ALTER TABLE \`transactions\` 
         DROP FOREIGN KEY \`FK_3e277d1c85134649d9a741f223c\``,
      );
    } else {
      console.log(
        'Foreign key constraint FK_3e277d1c85134649d9a741f223c does not exist',
      );
    }
  }
}
