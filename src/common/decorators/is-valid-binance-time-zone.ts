import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class BinanceTimeZoneConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    const regex = /^([+-]?\d{1,2}(:[0-5][0-9])?)$/;
    if (!value) return false;

    // Match the regex for valid formats
    if (!regex.test(value)) return false;

    // Parse the hours and minutes
    const [hours, minutes] = value.split(':').map(Number);

    // Validate hours and minutes range
    if (hours < -12 || hours > 14) return false;
    if (minutes !== undefined && (minutes < 0 || minutes >= 60)) return false;

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be in the format +/-HH:mm or a valid hour offset between -12:00 and +14:00. Received: ${args.value}`;
  }
}

export function IsValidBinanceTimeZone(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: BinanceTimeZoneConstraint,
    });
  };
}
