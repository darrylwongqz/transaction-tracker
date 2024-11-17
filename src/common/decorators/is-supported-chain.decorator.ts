import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { CHAIN_MAP } from '../constants';

export function IsSupportedChain(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSupportedChain',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: number, args: ValidationArguments) {
          const supportedChains = Object.values(CHAIN_MAP);
          return supportedChains.includes(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${
            args.property
          } must be one of the supported chain IDs: ${Object.values(
            CHAIN_MAP,
          ).join(', ')}`;
        },
      },
    });
  };
}
