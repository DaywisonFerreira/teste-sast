/* eslint-disable no-prototype-builtins */
import { Injectable } from '@nestjs/common';
import { decode, JwtPayload } from 'jsonwebtoken';

interface IJWTPayload {
  hasError: boolean;
  data?: JwtPayload;
  error?: string;
}

interface IValidation {
  isValid: boolean;
  data?: JwtPayload;
  error?: string;
}

@Injectable()
export class JWT {
  decode(tokenJWT: string): IJWTPayload {
    if (!tokenJWT) {
      return {
        hasError: true,
        error:
          "It wasn't possible to decode the specified token because it's null",
      };
    }

    const validation = this.isValid(tokenJWT);

    if (!validation.isValid) {
      return { hasError: true, error: validation.error };
    }

    return { hasError: false, data: validation.data };
  }

  private isValid(token: string): IValidation {
    const [prefix, value] = token.split(' ');

    if (prefix !== 'Bearer') {
      return {
        isValid: false,
        error:
          "It wasn't possible to decode the specified token because out of format",
      };
    }

    const decoded = decode(value, { json: true });

    if (!decoded) {
      return {
        isValid: false,
        error:
          "It wasn't possible to decode the specified token because out of format",
      };
    }

    if (
      !decoded.hasOwnProperty('email') ||
      !decoded.hasOwnProperty('tenants') ||
      !decoded.hasOwnProperty('sub') ||
      !decoded.hasOwnProperty('exp')
    ) {
      return {
        isValid: false,
        error:
          "It wasn't possible to decode the specified token because out of format",
      };
    }

    return { isValid: true, data: decoded };
  }
}
