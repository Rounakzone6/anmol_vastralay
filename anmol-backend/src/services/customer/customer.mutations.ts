import { PrismaService } from '@backend/services/prisma.service';
import { CloudinaryService } from '@backend/services/cloudinary.service';
import { AuthService } from '@backend/services/auth.service';
import { OtpService } from '@backend/services/otp.service';
import { z } from 'zod';
import * as bcrypt from 'bcryptjs';
import {
  UpdateProfileSchema,
  AddAddressSchema,
  UpdateAddressSchema,
  SendOtpSchema,
  VerifyOtpSchema,
  ChangePasswordSchema,
  DeleteAccountSchema,
} from '@backend/models/customer.model';
import { badRequest, notFound } from '@backend/config/trpc.config';

export class CustomerMutations {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly auth: AuthService,
    private readonly otp: OtpService,
  ) {}

  async updateProfile(
    userId: string,
    input: z.infer<typeof UpdateProfileSchema>,
  ) {
    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.gender !== undefined) data.gender = input.gender;
    if (input.dateOfBirth !== undefined) {
      data.dateOfBirth = input.dateOfBirth ? new Date(input.dateOfBirth) : null;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        profileImage: true,
        gender: true,
        dateOfBirth: true,
        emailVerified: true,
        phoneVerified: true,
        role: true,
      },
    });
  }

  async uploadProfileImage(userId: string, imageBase64: string) {
    // Get current user to check if they already have a Cloudinary profile image
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profileImageId: true },
    });

    // Delete old Cloudinary image if exists (only if it's a Cloudinary image, not a Google URL)
    if (user?.profileImageId) {
      try {
        await this.cloudinary.deleteImage(user.profileImageId);
      } catch {
        // Ignore deletion errors
      }
    }

    const { url, publicId } = await this.cloudinary.uploadImage(
      imageBase64,
      'anmol/profiles',
    );

    return this.prisma.user.update({
      where: { id: userId },
      data: { profileImage: url, profileImageId: publicId },
      select: { id: true, profileImage: true },
    });
  }

  async removeProfileImage(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profileImageId: true },
    });

    // Only delete from Cloudinary if it was uploaded via Cloudinary (has publicId)
    if (user?.profileImageId) {
      try {
        await this.cloudinary.deleteImage(user.profileImageId);
      } catch {
        // Ignore
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { profileImage: null, profileImageId: null },
      select: { id: true, profileImage: true },
    });
  }

  async addAddress(userId: string, input: z.infer<typeof AddAddressSchema>) {
    if (input.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    // If this is the first address, make it default
    const count = await this.prisma.address.count({ where: { userId } });
    const isDefault = input.isDefault || count === 0;

    return this.prisma.address.create({
      data: {
        ...input,
        isDefault,
        userId,
      },
    });
  }

  async updateAddress(
    userId: string,
    input: z.infer<typeof UpdateAddressSchema>,
  ) {
    const { id, ...data } = input;

    // Verify ownership
    const address = await this.prisma.address.findFirst({
      where: { id, userId },
    });
    if (!address) notFound('Address');

    if (data.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, NOT: { id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({
      where: { id },
      data,
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) notFound('Address');

    await this.prisma.address.delete({ where: { id: addressId } });

    // If deleted address was default, set the first remaining as default
    if (address.isDefault) {
      const first = await this.prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });
      if (first) {
        await this.prisma.address.update({
          where: { id: first.id },
          data: { isDefault: true },
        });
      }
    }

    return { success: true };
  }

  async setDefaultAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) notFound('Address');

    await this.prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    return this.prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });
  }

  async sendOtp(userId: string, input: z.infer<typeof SendOtpSchema>) {
    // Delete previous unused OTPs for this type
    await this.prisma.otpCode.deleteMany({
      where: { userId, type: input.type, verified: false },
    });

    // Generate 6-digit OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));

    await this.prisma.otpCode.create({
      data: {
        userId,
        type: input.type,
        code,
        target: input.target,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
      },
    });

    // Send OTP via the appropriate channel
    let sent = false;
    if (input.type === 'PHONE') {
      sent = await this.otp.sendSmsOtp(input.target, code);
    } else {
      sent = await this.otp.sendEmailOtp(input.target, code);
    }

    if (!sent) {
      badRequest('Failed to send OTP. Please try again.');
    }

    return { success: true, message: `OTP sent to ${input.target}` };
  }

  async verifyOtp(userId: string, input: z.infer<typeof VerifyOtpSchema>) {
    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        userId,
        type: input.type,
        code: input.code,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      badRequest('Invalid or expired OTP');
    }

    // Mark OTP as verified
    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    // Mark user's email/phone as verified
    const updateData =
      input.type === 'EMAIL'
        ? { emailVerified: true, email: otpRecord.target }
        : { phoneVerified: true, phone: otpRecord.target };

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        phone: true,
        emailVerified: true,
        phoneVerified: true,
      },
    });

    return { success: true, user };
  }

  async changePassword(
    userId: string,
    input: z.infer<typeof ChangePasswordSchema>,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user?.password) {
      badRequest(
        'Your account uses Google Sign-In and does not have a password set.',
      );
    }

    const isValid = await bcrypt.compare(input.currentPassword, user.password);
    if (!isValid) {
      badRequest('Current password is incorrect');
    }

    const hashedPassword = await this.auth.hashPassword(input.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true };
  }

  async deleteAccount(
    userId: string,
    input: z.infer<typeof DeleteAccountSchema>,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { password: true, googleId: true, profileImageId: true },
    });

    if (!user) notFound('User');

    // For password-based accounts, verify password
    if (user.password) {
      const isValid = await bcrypt.compare(input.password, user.password);
      if (!isValid) {
        badRequest('Password is incorrect');
      }
    }

    // Clean up Cloudinary profile image if exists
    if (user.profileImageId) {
      try {
        await this.cloudinary.deleteImage(user.profileImageId);
      } catch {
        // Ignore
      }
    }

    // Cascade delete the user (addresses, cart, OTPs all cascade)
    await this.prisma.user.delete({ where: { id: userId } });

    return { success: true };
  }
}
