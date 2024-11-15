import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ethers } from 'ethers';

@ValidatorConstraint({ async: false })
export class IsEthereumAddressConstraint
  implements ValidatorConstraintInterface
{
  validate(address: string): boolean {
    return ethers.isAddress(address);
  }

  defaultMessage(): string {
    return 'The value ($value) is not a valid Ethereum address.';
  }
}

/**
 * Custom validator decorator to validate Ethereum addresses.
 * @param validationOptions Optional validation options
 */
export function IsEthereumAddress(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsEthereumAddressConstraint,
    });
  };
}
