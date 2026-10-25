import { z } from "zod";

export const organizationSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("department"), name: z.string().trim().min(2).max(80), code: z.string().trim().min(2).max(20).regex(/^[A-Za-z0-9_-]+$/) }),
  z.object({ type: z.literal("designation"), name: z.string().trim().min(2).max(80), departmentId: z.string().uuid().nullable().optional() }),
  z.object({ type: z.literal("leaveType"), name: z.string().trim().min(2).max(80), annualQuotaDays: z.number().nonnegative().nullable(), isPaid: z.boolean() }),
  z.object({ type: z.literal("holiday"), name: z.string().trim().min(2).max(80), holidayDate: z.string().date() }),
]);
