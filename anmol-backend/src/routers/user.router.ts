import {
  adminProcedure,
  router,
  staffProcedure,
} from '@backend/config/trpc.config';
import { CreateUserSchema, UserIdSchema } from '@backend/models/user.model';

export const userRouter = router({
  getUsers: staffProcedure.query(async ({ ctx }) => {
    return ctx.services.user.getUsers();
  }),

  getCustomers: staffProcedure.query(async ({ ctx }) => {
    return ctx.services.user.getCustomers();
  }),

  createUser: adminProcedure
    .input(CreateUserSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.user.createUser(input);
    }),

  getUserById: staffProcedure
    .input(UserIdSchema)
    .query(async ({ ctx, input }) => {
      return ctx.services.user.getUserById(input.id);
    }),

  getCustomerDetails: staffProcedure
    .input(UserIdSchema)
    .query(async ({ ctx, input }) => {
      return ctx.services.user.getCustomerDetails(input.id);
    }),
});
