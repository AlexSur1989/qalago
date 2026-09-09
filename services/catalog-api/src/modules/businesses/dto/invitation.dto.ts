import { IsString, MinLength } from 'class-validator';

export class InvitationTokenDto {
  @IsString()
  @MinLength(16)
  token!: string;
}
