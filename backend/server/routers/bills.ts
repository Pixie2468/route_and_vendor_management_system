import { router, publicProcedure } from '../trpc.js';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const createBillInput = z.object({
  vendorId: z.string(),
  date: z.string(),
  items: z.array(
    z.object({
      itemId: z.string(),
      quantity: z.number(),
      rate: z.number(),
    })
  ),
  total: z.number(),
  gstTotal: z.number(),
});

type CreateBillInput = z.infer<typeof createBillInput>;

export const billsRouter = router({
  createBill: publicProcedure
    .input(createBillInput)
    .mutation(async ({ ctx, input }: { ctx: any, input: CreateBillInput }) => {
      const { vendorId, date, items, total, gstTotal } = input;
      const bill = await ctx.prisma.bill.create({
        data: {
          vendorId,
          date: new Date(date),
          total,
          gstTotal,
          items: {
            create: items.map((item: { itemId: string, quantity: number, rate: number }) => ({
              itemId: item.itemId,
              quantity: item.quantity,
              rate: item.rate,
            })),
          },
        },
        include: {
          items: {
            include: {
              item: true,
            },
          },
          vendor: true,
        },
      });
      return bill;
    }),

  getBill: publicProcedure.input(z.string()).query(async ({ ctx, input }: { ctx: any, input: string }) => {
    return ctx.prisma.bill.findUnique({
      where: { id: input },
      include: {
        items: {
          include: {
            item: true,
          },
        },
        vendor: true,
      },
    });
  }),
  
  listAllBills: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.bill.findMany({
      orderBy: { date: 'desc' },
      include: {
        vendor: true,
        items: { include: { item: true } },
      },
    });
  }),

  deleteBill: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }: { ctx: any, input: { id: string } }) => {
      const { id } = input;

      return ctx.prisma.$transaction(async (prisma: any) => {
        // First, delete all BillItems associated with the Bill
        await prisma.billItem.deleteMany({
          where: {
            billId: id,
          },
        });

        // Then, delete the Bill itself
        const deletedBill = await prisma.bill.delete({
          where: {
            id: id,
          },
        });

        return deletedBill;
      });
    }),
}); 