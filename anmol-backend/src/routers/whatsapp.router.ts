import { router, adminProcedure } from '../config/trpc.config';

export const whatsappRouter = router({
  adminGetStatus: adminProcedure.query(async ({ ctx }) => {
    return ctx.services.whatsapp.getStatus();
  }),
  
  adminLogout: adminProcedure.mutation(async ({ ctx }) => {
    await ctx.services.whatsapp.logout();
    return { success: true };
  }),
});
