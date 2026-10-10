import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole, OtpType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '@backend/services/prisma.service';
import { EmailService } from '@backend/services/email.service';
import { OtpService } from '@backend/services/otp.service';
import { redis } from '@backend/config/redis.config';

export type AuthUser = {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  profileImage: string | null;
  gender: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  role: UserRole;
};

type JwtPayload = {
  sub: string;
  role: UserRole;
};

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly emailService: EmailService,
    private readonly otpService: OtpService,
  ) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    this.googleClient = new OAuth2Client(clientId);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async login(
    identifier: string,
    password: string,
  ): Promise<{ success: boolean; message: string; email: string; type: string }> {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminEmail && identifier === adminEmail) {
      if (password !== adminPassword) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const rateLimitKey = `ratelimit:otp:${adminEmail}`;
      if (await redis.get(rateLimitKey)) {
        throw new UnauthorizedException('Please wait 60 seconds before requesting another OTP');
      }
      
      const code = this.generateOtp();
      
      // Store in Redis (expires in 10 minutes)
      await redis.set(`otp:${adminEmail}`, code, 'EX', 600);
      
      // Set rate limit (60 seconds)
      await redis.set(rateLimitKey, '1', 'EX', 60);

      const sent = await this.otpService.sendEmailOtp(adminEmail, code);
      if (!sent) {
        // Rollback redis keys on failure
        await redis.del(`otp:${adminEmail}`);
        await redis.del(rateLimitKey);
        throw new BadRequestException('Failed to send OTP email. Please try again.');
      }

      return { success: true, message: 'OTP sent to email', email: adminEmail, type: 'LOGIN' };
    }

    const record = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
      },
    });

    if (!record) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!record.password) {
      throw new UnauthorizedException(
        'This account uses Google Sign-In. Please use the Google button to log in.',
      );
    }

    if (!(await bcrypt.compare(password, record.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const targetEmail = record.email;
    if (!targetEmail) {
       throw new UnauthorizedException('Account has no email for OTP verification. Please contact support.');
    }

    const rateLimitKey = `ratelimit:otp:${targetEmail}`;
    if (await redis.get(rateLimitKey)) {
      throw new UnauthorizedException('Please wait 60 seconds before requesting another OTP');
    }

    const code = this.generateOtp();

    // Store in Redis (expires in 10 minutes)
    await redis.set(`otp:${targetEmail}`, code, 'EX', 600);

    // Set rate limit (60 seconds)
    await redis.set(rateLimitKey, '1', 'EX', 60);

      const sent = await this.otpService.sendEmailOtp(targetEmail, code);
      if (!sent) {
        // Rollback redis keys on failure
        await redis.del(`otp:${targetEmail}`);
        await redis.del(rateLimitKey);
        throw new BadRequestException('Failed to send OTP email. Please try again.');
      }

      return { success: true, message: 'OTP sent to email', email: targetEmail, type: 'LOGIN' };
  }

  async register(input: {
    email?: string;
    phone?: string;
    name: string;
    password: string;
  }): Promise<{ success: boolean; message: string; email: string; type: string }> {
    if (!input.email) {
      throw new Error('BAD_REQUEST:Email is required for MFA registration');
    }

    try {
      const hashedPassword = await this.hashPassword(input.password);
      const user = await this.prisma.user.create({
        data: {
          email: input.email,
          phone: input.phone || null,
          name: input.name,
          password: hashedPassword,
          role: 'CUSTOMER',
          emailVerified: false,
        },
      });

      this.emailService.sendWelcomeEmail(user.email!, user.name).catch((error) =>
        console.error('Failed to send welcome email', error),
      );

      const rateLimitKey = `ratelimit:otp:${user.email}`;
      if (await redis.get(rateLimitKey)) {
        throw new UnauthorizedException('Please wait 60 seconds before requesting another OTP');
      }

      const code = this.generateOtp();

      // Store in Redis (expires in 10 minutes)
      await redis.set(`otp:${user.email}`, code, 'EX', 600);

      // Set rate limit (60 seconds)
      await redis.set(rateLimitKey, '1', 'EX', 60);

      const sent = await this.otpService.sendEmailOtp(user.email!, code);
      if (!sent) {
        // Rollback redis keys on failure
        await redis.del(`otp:${user.email}`);
        await redis.del(rateLimitKey);
        throw new BadRequestException('Failed to send OTP email. Please try again.');
      }

      return { success: true, message: 'OTP sent to email', email: user.email!, type: 'REGISTER' };
    } catch (error: any) {
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0];
        if (field === 'email') {
          throw new Error('CONFLICT:Email already exists');
        } else if (field === 'phone') {
          throw new Error('CONFLICT:Phone number already exists');
        }
        throw new Error('CONFLICT:Account already exists');
      }
      throw new Error(`BAD_REQUEST:${error.message || 'Registration failed'}`);
    }
  }

  async verifyOtp(email: string, code: string, type: string): Promise<{ token: string; user: AuthUser }> {
    const storedCode = await redis.get(`otp:${email}`);

    if (!storedCode || storedCode !== code) {
       throw new UnauthorizedException('Invalid or expired OTP code');
    }

    // Delete the OTP after successful verification
    await redis.del(`otp:${email}`);

    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail && email === adminEmail) {
      await this.prisma.user.upsert({
        where: { id: 'admin' },
        update: {
          email: adminEmail,
          role: UserRole.ADMIN,
          emailVerified: true,
        },
        create: {
          id: 'admin',
          email: adminEmail,
          name: 'Admin',
          role: UserRole.ADMIN,
          emailVerified: true,
        },
      });

      const user: AuthUser = {
        id: 'admin',
        email: adminEmail,
        phone: null,
        name: 'Admin',
        profileImage: null,
        gender: null,
        emailVerified: true,
        phoneVerified: false,
        role: UserRole.ADMIN,
      };
      const token = await this.jwt.signAsync({
        sub: user.id,
        role: user.role,
      } satisfies JwtPayload);
      return { token, user };
    }

    const userRecord = await this.prisma.user.findFirst({
       where: { email }
    });

    if (!userRecord) {
        throw new UnauthorizedException('User not found');
    }

    if (!userRecord.emailVerified) {
        await this.prisma.user.update({
            where: { id: userRecord.id },
            data: { emailVerified: true }
        });
        userRecord.emailVerified = true;
    }

    const user = this.sanitize(userRecord);
    const token = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
    } satisfies JwtPayload);

    return { token, user };
  }

  async googleAuth(
    credential: string,
  ): Promise<{ token: string; user: AuthUser }> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error('BAD_REQUEST:Google Sign-In is not configured');
    }

    let payload;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }

    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid Google token');
    }

    const googleId = payload.sub;
    const email = payload.email || null;
    const name = payload.name || null;
    const picture = payload.picture || null; // Google profile image URL

    // Try to find existing user by googleId or email
    let record = await this.prisma.user.findFirst({
      where: {
        OR: [{ googleId }, ...(email ? [{ email }] : [])],
      },
    });

    if (record) {
      // Link Google ID and update profile image if not already linked
      const updateData: Record<string, unknown> = {};
      if (!record.googleId) updateData.googleId = googleId;
      if (picture && !record.profileImage) updateData.profileImage = picture;
      if (email && !record.emailVerified) updateData.emailVerified = true;

      if (Object.keys(updateData).length > 0) {
        record = await this.prisma.user.update({
          where: { id: record.id },
          data: updateData,
        });
      }
    } else {
      // Create new user with Google profile picture stored directly
      record = await this.prisma.user.create({
        data: {
          googleId,
          email,
          name,
          profileImage: picture, // Store Google image URL as-is
          emailVerified: !!email, // Google already verified the email
          role: 'CUSTOMER',
        },
      });
      this.emailService.sendWelcomeEmail(record.email!, record.name).catch((error) =>
        console.error('Failed to send Google welcome email', error),
      );
    }

    const user = this.sanitize(record);
    const jwtToken = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
    } satisfies JwtPayload);

    return { token: jwtToken, user };
  }

  async getUserFromToken(token: string | undefined): Promise<AuthUser | null> {
    if (!token) return null;

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);

      if (payload.sub === 'admin' && payload.role === UserRole.ADMIN) {
        return {
          id: 'admin',
          email: process.env.ADMIN_EMAIL || '',
          phone: null,
          name: 'Admin',
          profileImage: null,
          gender: null,
          emailVerified: true,
          phoneVerified: false,
          role: UserRole.ADMIN,
        };
      }

      const record = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
          profileImage: true,
          gender: true,
          emailVerified: true,
          phoneVerified: true,
          role: true,
        },
      });
      if (!record) return null;
      return this.sanitize(record);
    } catch {
      return null;
    }
  }

  private sanitize(user: {
    id: string;
    email: string | null;
    phone: string | null;
    name: string | null;
    profileImage?: string | null;
    gender?: string | null;
    emailVerified?: boolean;
    phoneVerified?: boolean;
    role: UserRole;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      profileImage: user.profileImage ?? null,
      gender: user.gender ?? null,
      emailVerified: user.emailVerified ?? false,
      phoneVerified: user.phoneVerified ?? false,
      role: user.role,
    };
  }
}
