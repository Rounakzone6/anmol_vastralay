import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from './prisma.service';

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
};

type JwtPayload = {
  sub: string;
  role: UserRole;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ token: string; user: AuthUser }> {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminEmail && email === adminEmail) {
      if (password !== adminPassword) {
        throw new UnauthorizedException('Invalid email or password');
      }
      const user: AuthUser = {
        id: 'admin',
        email: adminEmail,
        name: 'Admin',
        role: UserRole.ADMIN,
      };
      const token = await this.jwt.signAsync({
        sub: user.id,
        role: user.role,
      } satisfies JwtPayload);
      return { token, user };
    }

    const record = await this.prisma.user.findUnique({ where: { email } });
    if (!record || !(await bcrypt.compare(password, record.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const user = this.sanitize(record);
    const token = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
    } satisfies JwtPayload);

    return { token, user };
  }

  async getUserFromToken(token: string | undefined): Promise<AuthUser | null> {
    if (!token) return null;

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);

      if (payload.sub === 'admin' && payload.role === UserRole.ADMIN) {
        return {
          id: 'admin',
          email: process.env.ADMIN_EMAIL || '',
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
    email: string;
    name: string | null;
    role: UserRole;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}
