import { router } from './trpc.js';
import { routesRouter } from './routers/routes.js';
import { itemsRouter } from './routers/items.js';
import { billsRouter } from './routers/bills.js';

export const appRouter = router({
  routes: routesRouter,
  items: itemsRouter,
  bills: billsRouter,
});

export type AppRouter = typeof appRouter; 