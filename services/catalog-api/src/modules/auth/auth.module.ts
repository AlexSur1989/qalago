import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CommonAccessModule } from '../../common/common-access.module';
import { AuthController } from './auth.controller';
import { AuthIdentityService } from './auth-identity.service';
import { AuthService } from './auth.service';

@Module({
  imports: [
    CommonAccessModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('app.jwtSecret'),
        signOptions: {
          expiresIn: (config.get<string>('app.jwtExpiresIn') ?? '7d') as `${number}d`,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthIdentityService],
  exports: [JwtModule, AuthService, AuthIdentityService],
})
export class AuthModule {}
