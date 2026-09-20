import 'reflect-metadata';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { ReviewsController } from './reviews.controller';

describe('ReviewsController reply authorization (Stage 6.11D.5)', () => {
  it('reply route does not require global BUSINESS role (membership gate in service)', () => {
    const roles =
      Reflect.getMetadata(ROLES_KEY, ReviewsController.prototype.reply) ?? [];
    expect(roles).toEqual([]);
  });
});
