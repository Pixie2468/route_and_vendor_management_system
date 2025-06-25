import { router, publicProcedure } from '../trpc.js';
import { z } from 'zod';

export const routesRouter = router({
  createRoute: publicProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: any, input: any }) => {
      return ctx.prisma.route.create({ data: input });
    }),

  listRoutes: publicProcedure.query(async ({ ctx }: { ctx: any }) => {
    return ctx.prisma.route.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }),

  addVendorToRoute: publicProcedure
    .input(
      z.object({
        name: z.string(),
        routeId: z.string(),
        contact: z.string().optional(),
        address: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: any, input: any }) => {
      return ctx.prisma.vendor.create({
        data: input,
      });
    }),

  listVendorsByRoute: publicProcedure
    .input(z.string().optional())
    .query(async ({ ctx, input }: { ctx: any, input: any }) => {
      const whereClause = input ? { routeId: input } : {};
      return ctx.prisma.vendor.findMany({
        where: whereClause,
        include: {
          route: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
    }),
}); 