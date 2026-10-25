import { z } from "zod";

export const employeeSchema = z.object({
  employeeCode: z.string().trim().min(2).max(30).regex(/^[A-Za-z0-9_-]+$/),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  address: z.string().trim().max(240).optional().or(z.literal("")),
  gender: z.string().trim().max(30).optional().or(z.literal("")),
  departmentId: z.string().uuid().nullable().optional(),
  designationId: z.string().uuid().nullable().optional(),
  joinDate: z.string().date(),
  employmentStatus: z.enum(["active", "probation", "suspended", "exited"]),
  basicSalary: z.coerce.number().positive(),
  temporaryPassword: z.string().min(8).max(128),
});
