import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Validator constraint for checking valid Solana addresses.
 */
@ValidatorConstraint({ async: false })
export class IsSolanaAddressConstraint implements ValidatorConstraintInterface {
  validate(address: string): boolean {
    // Solana addresses are Base58 strings and typically 32-44 characters long.
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/; // Base58 regex
    return (
      base58Regex.test(address) && address.length >= 32 && address.length <= 44
    );
  }

  defaultMessage(): string {
    return 'The value ($value) is not a valid Solana address.';
  }
}

/**
 * Custom validator decorator to validate Solana addresses.
 * @param validationOptions Optional validation options
 */
export function IsSolanaAddress(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSolanaAddressConstraint,
    });
  };
}
