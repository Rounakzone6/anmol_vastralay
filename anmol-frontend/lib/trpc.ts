import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../anmol-backend/src/routers/index';

export const trpc = createTRPCReact<AppRouter>();
