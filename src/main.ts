import { Logger, ValidationPipe } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { NestFactory } from '@nestjs/core';
import { useContainer } from 'class-validator';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { contentParser } from 'fastify-multer';
import {
  DocumentBuilder,
  SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import compress from 'fastify-compress';
import helmet from 'fastify-helmet';
import { join, resolve } from 'path';

import { LoggingInterceptor } from './commons/interceptors/logging.interceptor';
import { AppModule } from './app.module';
import { Env } from './commons/environment/env';

const bootstrap = async (): Promise<void> => {
  const fastifyAdapter = new FastifyAdapter({
    logger: false,
    maxParamLength: 1000,
    bodyLimit: 12485760, // 10MB
  });

  fastifyAdapter.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`],
        imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
        scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
      },
    },
  });
  fastifyAdapter.register(compress);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
  );
  app.register(contentParser);
  app.useStaticAssets({ root: join(__dirname, '../../ifc.freight.api.admin') });

  const corsOptions: CorsOptions = {
    origin: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    preflightContinue: false,
    optionsSuccessStatus: 200,
  };
  app.enableCors(corsOptions);

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  app.useGlobalInterceptors(new LoggingInterceptor());

  app.setViewEngine({
    engine: {
      // eslint-disable-next-line global-require
      handlebars: require('handlebars'),
    },
    templates: join(resolve(__dirname, '..', 'views')),
  });

  const swaggerDocumentBuilder = new DocumentBuilder()
    .addBearerAuth()
    .setTitle(Env.SWAGGER_TITLE)
    .setDescription(Env.SWAGGER_DESCRIPTION)
    .setVersion(Env.APPLICATION_VERSION)
    .addServer(Env.SWAGGER_SERVER)
    .setContact(
      'Infracommerce',
      'http://www.infracommerce.com.br',
      'arquiteturasolucao@infracommerce.com.br',
    )
    .build();

  const swaggerDocumentOptions: SwaggerDocumentOptions = {
    operationIdFactory: (_controllerKey: string, methodKey: string) =>
      methodKey,
  };

  const swaggerDocument = SwaggerModule.createDocument(
    app,
    swaggerDocumentBuilder,
    swaggerDocumentOptions,
  );

  SwaggerModule.setup(Env.SWAGGER_DOCS, app, swaggerDocument);

  const port = Env.APPLICATION_PORT;

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  await app
    .listen(parseInt(port.toString(), 10), '0.0.0.0')
    .then(() => {
      Logger.log(`API Listen on ${port}`);
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .catch((error: any) => Logger.error(error));
};

bootstrap();
