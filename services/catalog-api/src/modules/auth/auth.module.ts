import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CommonAccessModule } from '../../common/common-access.module';
import { AuthController } from './auth.controller';
import { AuthIdentityService } from './auth-identity.service';
import { AuthService } from './auth.service';
import { AuthSessionService } from './auth-session.service';
import { AppleAuthLoginService } from './social-auth/apple-auth-login.service';
import { AppleIdentityTokenVerifierService } from './social-auth/apple-identity-token-verifier.service';
import { GoogleAuthLoginService } from './social-auth/google-auth-login.service';
import { GoogleIdTokenVerifierService } from './social-auth/google-id-token-verifier.service';
import { SocialAuthLoginService } from './social-auth/social-auth-login.service';

@Module({
  imports: [
    CommonAccessModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('app.jwtSecret'),
        signOptions: {
          expiresIn: (config.get<string>('app.jwtExpiresIn') ?? '20m') as `${number}m`,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthSessionService,
    AuthService,
    AuthIdentityService,
    SocialAuthLoginService,
    GoogleIdTokenVerifierService,
    GoogleAuthLoginService,
    AppleIdentityTokenVerifierService,
    AppleAuthLoginService,
  ],
  exports: [
    JwtModule,
    AuthSessionService,
    AuthService,
    AuthIdentityService,
    GoogleAuthLoginService,
    AppleAuthLoginService,
  ],
})
export class AuthModule {}
