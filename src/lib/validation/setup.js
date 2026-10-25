import { z } from "zod";

export const setupSchema = z.object({
  companyName: z.string().trim().min(2).max(120),
  adminName: z.string().trim().min(2).max(120),
  adminEmail: z.string().trim().email().max(254),
  adminPassword: z.string().min(8).max(128),
  timezone: z.string().trim().min(1).max(80),
  officeStart: z.string().regex(/^\d{2}:\d{2}$/),
  graceMinutes: z.coerce.number().int().min(0).max(180),
});
