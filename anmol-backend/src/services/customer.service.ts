import { Injectable } from '@nestjs/common';
import { PrismaService } from '@backend/services/prisma.service';
import { CloudinaryService } from '@backend/services/cloudinary.service';
import { AuthService } from '@backend/services/auth.service';
import { OtpService } from '@backend/services/otp.service';
import { z } from 'zod';
import { CustomerQueries } from '@backend/services/customer/customer.queries';
import { CustomerMutations } from '@backend/services/customer/customer.mutations';
import {
  UpdateProfileSchema,
  AddAddressSchema,
  UpdateAddressSchema,
  SendOtpSchema,
  VerifyOtpSchema,
  ChangePasswordSchema,
  DeleteAccountSchema,
} from '@backend/models/customer.model';

@Injectable()
export class CustomerService {
  private queries: CustomerQueries;
  private mutations: CustomerMutations;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly auth: AuthService,
    private readonly otp: OtpService,
  ) {
    this.queries = new CustomerQueries(this.prisma);
    this.mutations = new CustomerMutations(
      this.prisma,
      this.cloudinary,
      this.auth,
      this.otp,
    );
  }

  // ─── Profile ────────────────────────────────────────────────────
  async getProfile(userId: string) {
    return this.queries.getProfile(userId);
  }

  async updateProfile(
    userId: string,
    input: z.infer<typeof UpdateProfileSchema>,
  ) {
    return this.mutations.updateProfile(userId, input);
  }

  async uploadProfileImage(userId: string, imageBase64: string) {
    return this.mutations.uploadProfileImage(userId, imageBase64);
  }

  async removeProfileImage(userId: string) {
    return this.mutations.removeProfileImage(userId);
  }

  // ─── Addresses ──────────────────────────────────────────────────
  async getAddresses(userId: string) {
    return this.queries.getAddresses(userId);
  }

  async addAddress(userId: string, input: z.infer<typeof AddAddressSchema>) {
    return this.mutations.addAddress(userId, input);
  }

  async updateAddress(
    userId: string,
    input: z.infer<typeof UpdateAddressSchema>,
  ) {
    return this.mutations.updateAddress(userId, input);
  }

  async deleteAddress(userId: string, addressId: string) {
    return this.mutations.deleteAddress(userId, addressId);
  }

  async setDefaultAddress(userId: string, addressId: string) {
    return this.mutations.setDefaultAddress(userId, addressId);
  }

  // ─── OTP Verification (Twilio SMS + SendGrid Email) ─────────────
  async sendOtp(userId: string, input: z.infer<typeof SendOtpSchema>) {
    return this.mutations.sendOtp(userId, input);
  }

  async verifyOtp(userId: string, input: z.infer<typeof VerifyOtpSchema>) {
    return this.mutations.verifyOtp(userId, input);
  }

  // ─── Security ───────────────────────────────────────────────────
  async changePassword(
    userId: string,
    input: z.infer<typeof ChangePasswordSchema>,
  ) {
    return this.mutations.changePassword(userId, input);
  }

  async deleteAccount(
    userId: string,
    input: z.infer<typeof DeleteAccountSchema>,
  ) {
    return this.mutations.deleteAccount(userId, input);
  }
}
