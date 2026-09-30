import { HttpException, HttpStatus } from '@nestjs/common';

export const BUSINESS_TEAM_DISABLED_CODE = 'BUSINESS_TEAM_DISABLED';

export class BusinessTeamDisabledException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        code: BUSINESS_TEAM_DISABLED_CODE,
        message: 'Business team management is temporarily disabled',
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
