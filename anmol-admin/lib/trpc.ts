import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../anmol-backend/src/trpc/trpc.router';

export const trpc = createTRPCReact<AppRouter>();
