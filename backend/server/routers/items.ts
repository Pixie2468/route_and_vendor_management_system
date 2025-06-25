import { router, publicProcedure } from '../trpc.js';
import { z } from 'zod';

export const itemsRouter = router({
  createItem: publicProcedure
    .input(
      z.object({
        nameEn: z.string(),
        nameGu: z.string(),
        rate: z.number(),
        hasGst: z.boolean(),
        gstPercentage: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: any; input: any }) => {
      return ctx.prisma.item.create({ data: input });
    }),

  listItems: publicProcedure.query(async ({ ctx }: { ctx: any }) => {
    return ctx.prisma.item.findMany({
      orderBy: {
        nameEn: 'asc',
      },
    });
  }),

  deleteItem: publicProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }: { ctx: any; input: any }) => {
      await ctx.prisma.billItem.deleteMany({
        where: {
          itemId: input,
        },
      });
      return ctx.prisma.item.delete({
        where: {
          id: input,
        },
      });
    }),

  updateItem: publicProcedure
    .input(
      z.object({
        id: z.string(),
        nameEn: z.string(),
        nameGu: z.string(),
        rate: z.number(),
        hasGst: z.boolean(),
        gstPercentage: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }: { ctx: any; input: any }) => {
      const { id, ...data } = input;
      return ctx.prisma.item.update({
        where: { id },
        data,
      });
    }),
}); 