import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { BusinessStatus } from '@prisma/client';
import { isPublicCatalogBusinessStatusAllowed } from '../utils/public-catalog-business-status.util';

@ValidatorConstraint({ name: 'publicCatalogBusinessStatus', async: false })
export class PublicCatalogBusinessStatusConstraint
  implements ValidatorConstraintInterface
{
  validate(status: unknown, _args: ValidationArguments): boolean {
    if (status === undefined || status === null || status === '') {
      return true;
    }
    return isPublicCatalogBusinessStatusAllowed(status as BusinessStatus);
  }

  defaultMessage(): string {
    return 'Public catalog accepts only ACTIVE businesses; omit status or use status=ACTIVE';
  }
}
