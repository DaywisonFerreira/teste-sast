import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { JWT } from '../utils/jwt.utils';

@Injectable()
export class JWTGuard implements CanActivate {
  private readonly jwtUtils: JWT;

  constructor() {
    this.jwtUtils = new JWT();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    const token: string = request.headers.authorization;

    if (!token) {
      throw new HttpException(
        'Missing Header Authorization',
        HttpStatus.BAD_REQUEST,
      );
    }

    const jwtPayload = this.jwtUtils.decode(token);

    if (jwtPayload.hasError) {
      throw new HttpException(jwtPayload.error, HttpStatus.BAD_REQUEST);
    }

    const { tenants, email, sub, name } = jwtPayload.data;

    request.tenants = tenants;
    request.email = email;
    request.userId = sub;
    request.userName = name;

    return true;
  }
}
