import { z } from "zod";

export { formatJalaliDate, formatJalaliYear } from "./jalali";
export type { JalaliFormatOptions } from "./jalali";

export { logger, setLogLevel } from "./logger";
export type { LogLevel } from "./logger";

export { SEO_DEFAULTS } from "./seo-types";
export type { SeoSettings } from "./seo-types";

export const orderStatusSchema = z.enum([
  "placed",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
]);

export const contentWorkflowSchema = z.enum([
  "draft",
  "ai_generated",
  "human_approved",
  "published",
]);

export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type ContentWorkflow = z.infer<typeof contentWorkflowSchema>;

export const productSeoSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(320),
});

export type ProductSeoInput = z.infer<typeof productSeoSchema>;
