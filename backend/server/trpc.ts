import { initTRPC } from '@trpc/server';
import { Context } from './context.js';

const t = initTRPC.context<typeof Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure; 