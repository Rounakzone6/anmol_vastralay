import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from '@backend/services/auth.service';
import { PrismaModule } from '@backend/modules/prisma.module';
import { EmailModule } from '@backend/modules/email.module';
import { OtpService } from '@backend/services/otp.service';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('FATAL: JWT_SECRET environment variable is missing.');
        }
        return {
          secret,
          signOptions: {
            expiresIn: config.get('JWT_EXPIRES_IN') ?? '7d',
          },
        };
      },
    }),
  ],
  providers: [AuthService, OtpService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
