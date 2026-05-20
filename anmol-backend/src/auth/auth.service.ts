import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

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
      const record = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!record) return null;
      return this.sanitize(record);
    } catch {
      return null;
    }
  }

  async bootstrapAdmin(input: {
    email: string;
    name: string;
    password: string;
  }): Promise<{ token: string; user: AuthUser }> {
    const count = await this.prisma.user.count();
    if (count > 0) {
      throw new UnauthorizedException('Admin already exists. Use login.');
    }

    const passwordHash = await this.hashPassword(input.password);
    const record = await this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        password: passwordHash,
        role: UserRole.ADMIN,
      },
    });

    const user = this.sanitize(record);
    const token = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
    } satisfies JwtPayload);

    return { token, user };
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
