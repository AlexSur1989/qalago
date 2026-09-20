import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProductionExceptionFilter } from './production-exception.filter';

describe('ProductionExceptionFilter', () => {
  it('preserves error code on HttpException object responses', () => {
    const config = { get: jest.fn().mockReturnValue('development') } as unknown as ConfigService;
    const filter = new ProductionExceptionFilter(config);
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
      }),
    };

    filter.catch(
      new ConflictException({
        message: 'Report already submitted',
        code: 'REPORT_ALREADY_SUBMITTED',
      }),
      host as never,
    );

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 409,
        message: 'Report already submitted',
        code: 'REPORT_ALREADY_SUBMITTED',
      }),
    );
  });
});
