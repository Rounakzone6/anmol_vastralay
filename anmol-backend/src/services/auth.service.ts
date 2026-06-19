import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from './prisma.service';

export type AuthUser = {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
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
  ) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    this.googleClient = new OAuth2Client(clientId);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async login(
    identifier: string,
    password: string,
  ): Promise<{ token: string; user: AuthUser }> {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminEmail && identifier === adminEmail) {
      if (password !== adminPassword) {
        throw new UnauthorizedException('Invalid credentials');
      }
      const user: AuthUser = {
        id: 'admin',
        email: adminEmail,
        phone: null,
        name: 'Admin',
        role: UserRole.ADMIN,
      };
      const token = await this.jwt.signAsync({
        sub: user.id,
        role: user.role,
      } satisfies JwtPayload);
      return { token, user };
    }

    const record = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier },
        ],
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

    const user = this.sanitize(record);
    const token = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
    } satisfies JwtPayload);

    return { token, user };
  }

  async register(input: { email?: string; phone?: string; name: string; password: string }) {
    if (!input.email && !input.phone) {
      throw new Error('BAD_REQUEST:Either email or phone number is required');
    }

    try {
      const hashedPassword = await this.hashPassword(input.password);
      const user = await this.prisma.user.create({
        data: {
          email: input.email || null,
          phone: input.phone || null,
          name: input.name,
          password: hashedPassword,
          role: 'CUSTOMER',
          cart: { create: {} },
        },
        select: { id: true, email: true, phone: true, name: true, role: true },
      });

      // Log them in using whichever identifier they provided
      const loginIdentifier = input.email || input.phone!;
      return await this.login(loginIdentifier, input.password);
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

  async googleAuth(credential: string): Promise<{ token: string; user: AuthUser }> {
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

    // Try to find existing user by googleId or email
    let record = await this.prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (record) {
      // Link Google ID if not already linked
      if (!record.googleId) {
        record = await this.prisma.user.update({
          where: { id: record.id },
          data: { googleId },
        });
      }
    } else {
      // Create new user
      record = await this.prisma.user.create({
        data: {
          googleId,
          email,
          name,
          role: 'CUSTOMER',
          cart: { create: {} },
        },
      });
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
          role: UserRole.ADMIN,
        };
      }

      const record = await this.prisma.user.findUnique({
        where: { id: payload.sub },
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
    role: UserRole;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      role: user.role,
    };
  }
}
