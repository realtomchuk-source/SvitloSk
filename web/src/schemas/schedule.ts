import { z } from 'zod';

export const ScheduleModeSchema = z.enum(['schedule', 'all_clear', 'no_power']);

export const QueuesSchema = z.record(z.string(), z.string().length(24));

export const ScheduleSchema = z.object({
  date: z.string(),
  updated_at: z.string(),
  mode: ScheduleModeSchema,
  message: z.string(),
  queues: QueuesSchema,
  meta: z.object({
    generated_at: z.string().optional(),
    state: z.string().optional(),
    target_date: z.string().optional(),
  }).optional(),
});

export type ScheduleMode = z.infer<typeof ScheduleModeSchema>;
export type Queues = z.infer<typeof QueuesSchema>;
export type Schedule = z.infer<typeof ScheduleSchema>;

export interface TimeInterval {
  start: string; // HH:mm
  end: string;   // HH:mm
  status: 'available' | 'unavailable' | 'unknown';
}
