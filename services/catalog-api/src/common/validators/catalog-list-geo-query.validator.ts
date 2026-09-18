import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isOptionalUserGeoCoordinatePairValid } from '../utils/catalog-geo-query.util';

@ValidatorConstraint({ name: 'catalogListGeoQuery', async: false })
export class CatalogListGeoQueryConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const obj = args.object as { latitude?: number; longitude?: number };
    return isOptionalUserGeoCoordinatePairValid(obj.latitude, obj.longitude);
  }

  defaultMessage(): string {
    return 'latitude and longitude must be provided together and be finite numbers within valid ranges';
  }
}
