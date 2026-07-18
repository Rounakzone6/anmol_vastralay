import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@backend/routers/index';

export const trpc = createTRPCReact<AppRouter>();
