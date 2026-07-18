import { protectedProcedure, router } from '../config/trpc.config';
import {
  UpdateProfileSchema,
  UploadProfileImageSchema,
  AddAddressSchema,
  UpdateAddressSchema,
  DeleteAddressSchema,
  SetDefaultAddressSchema,
  SendOtpSchema,
  VerifyOtpSchema,
  ChangePasswordSchema,
  DeleteAccountSchema,
} from '../models/customer.model';

export const customerRouter = router({
  // ─── Profile ──────────────────────────────────────────────
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return ctx.services.customer.getProfile(ctx.user.id);
  }),

  updateProfile: protectedProcedure
    .input(UpdateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.customer.updateProfile(ctx.user.id, input);
    }),

  uploadProfileImage: protectedProcedure
    .input(UploadProfileImageSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.customer.uploadProfileImage(ctx.user.id, input.image);
    }),

  removeProfileImage: protectedProcedure.mutation(async ({ ctx }) => {
    return ctx.services.customer.removeProfileImage(ctx.user.id);
  }),

  // ─── Addresses ────────────────────────────────────────────
  getAddresses: protectedProcedure.query(async ({ ctx }) => {
    return ctx.services.customer.getAddresses(ctx.user.id);
  }),

  addAddress: protectedProcedure
    .input(AddAddressSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.customer.addAddress(ctx.user.id, input);
    }),

  updateAddress: protectedProcedure
    .input(UpdateAddressSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.customer.updateAddress(ctx.user.id, input);
    }),

  deleteAddress: protectedProcedure
    .input(DeleteAddressSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.customer.deleteAddress(ctx.user.id, input.id);
    }),

  setDefaultAddress: protectedProcedure
    .input(SetDefaultAddressSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.customer.setDefaultAddress(ctx.user.id, input.id);
    }),

  // ─── OTP Verification ────────────────────────────────────
  sendOtp: protectedProcedure
    .input(SendOtpSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.customer.sendOtp(ctx.user.id, input);
    }),

  verifyOtp: protectedProcedure
    .input(VerifyOtpSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.customer.verifyOtp(ctx.user.id, input);
    }),

  // ─── Security ─────────────────────────────────────────────
  changePassword: protectedProcedure
    .input(ChangePasswordSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.customer.changePassword(ctx.user.id, input);
    }),

  deleteAccount: protectedProcedure
    .input(DeleteAccountSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.customer.deleteAccount(ctx.user.id, input);
    }),
});
