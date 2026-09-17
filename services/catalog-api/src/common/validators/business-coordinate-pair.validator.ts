import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isOptionalBusinessCoordinatePairValid } from '../utils/business-coordinates.util';

@ValidatorConstraint({ name: 'businessCoordinatePair', async: false })
export class BusinessCoordinatePairConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const obj = args.object as { latitude?: number; longitude?: number };
    return isOptionalBusinessCoordinatePairValid(obj.latitude, obj.longitude);
  }

  defaultMessage(): string {
    return 'latitude and longitude must be provided together and form a valid coordinate pair';
  }
}
