import { initializeTestDatabase } from './helpers/database-setup';
import { config } from 'dotenv';

config({ path: '.env' });

beforeAll(async () => {
  await initializeTestDatabase();
});
