/* eslint-disable no-plusplus */

import { registerDecorator, ValidationOptions } from 'class-validator';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export function IsCNPJ(validationOptions?: ValidationOptions) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'IsCNPJ',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: string) {
          let cnpj = value;
          if (!cnpj) return false;
          let numbers: string;
          let sum: number;
          let pos: number;
          let cnpjLength: number;
          const invalids = [
            '00000000000000',
            '11111111111111',
            '22222222222222',
            '33333333333333',
            '44444444444444',
            '55555555555555',
            '66666666666666',
            '77777777777777',
            '88888888888888',
            '99999999999999',
          ];
          cnpj = cnpj.replace(/[^\d]+/g, '');

          if (cnpj === '') return false;

          if (cnpj.length !== 14) return false;

          if (invalids.includes(cnpj)) return false;

          cnpjLength = cnpj.length - 2;
          numbers = cnpj.substring(0, cnpjLength);
          const digits = cnpj.substring(cnpjLength);
          sum = 0;
          pos = cnpjLength - 7;
          for (let i = cnpjLength; i >= 1; i--) {
            sum += Number(numbers.charAt(cnpjLength - i)) * pos--;
            if (pos < 2) pos = 9;
          }
          let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
          if (result !== Number(digits.charAt(0))) return false;

          cnpjLength += 1;
          numbers = cnpj.substring(0, cnpjLength);
          sum = 0;
          pos = cnpjLength - 7;
          for (let i = cnpjLength; i >= 1; i--) {
            sum += Number(numbers.charAt(cnpjLength - i)) * pos--;
            if (pos < 2) pos = 9;
          }

          result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
          if (result !== Number(digits.charAt(1))) return false;

          return true;
        },
      },
    });
  };
}

export function IsCEP(validationOptions?: ValidationOptions) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'IsCEP',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: string) {
          return /^[0-9]{5}-[0-9]{3}$/.test(value);
        },
      },
    });
  };
}

export const File = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const file = req.incomingFile;
    return file;
  },
);
