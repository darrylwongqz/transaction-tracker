import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ethers } from 'ethers';

@ValidatorConstraint({ async: false })
export class IsEthereumHashConstraint implements ValidatorConstraintInterface {
  validate(hash: string): boolean {
    // Use ethers to validate the hash as a hex string of length 66 (0x + 64 hex chars)
    return ethers.isHexString(hash, 32); // 32 bytes = 64 hex chars
  }

  defaultMessage(): string {
    return 'The value ($value) is not a valid Ethereum transaction hash.';
  }
}

export function IsEthereumHash(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsEthereumHashConstraint,
    });
  };
}
