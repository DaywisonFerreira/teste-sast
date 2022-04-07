import { seeder } from 'nestjs-seeder';
import { MongooseModule } from '@nestjs/mongoose';
import {
  StatusCodeEntity,
  StatusCodeSchema,
} from 'src/status-code/schemas/status-code.schema';
import { StatusCodeSeeder } from 'src/status-code/seeder';
import { Env } from '../environment/env';

seeder({
  imports: [
    MongooseModule.forRoot(Env.DATABASE_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    }),
    MongooseModule.forFeature([
      { name: StatusCodeEntity.name, schema: StatusCodeSchema },
    ]),
  ],
}).run([StatusCodeSeeder]);
