import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { TransactionsModule } from './transactions/transactions.module';
import { SyncModule } from './sync/sync.module';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';
  const app = await NestFactory.create(AppModule, {
    logger: isProduction
      ? ['log', 'warn', 'error']
      : ['log', 'warn', 'error', 'debug', 'verbose'],
  });

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown fields
      transform: true, // Automatically transform payloads to DTOs
      transformOptions: { enableImplicitConversion: true },
      forbidUnknownValues: true,
    }),
  );

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector), {
      excludeExtraneousValues: true,
    }),
  );

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  const config = new DocumentBuilder()
    .setTitle('Blockchain Transactions Tracker - Uniswap Transactions API')
    .setDescription(
      'API for tracking Uniswap WETH-USDC transactions and related pricing',
    )
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    include: [TransactionsModule, SyncModule],
  });
  SwaggerModule.setup('documentation', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
