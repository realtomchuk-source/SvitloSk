import { z } from 'zod';

export const SlotSchema = z.object({
  id: z.string(),
  name: z.string(),
  subGroup: z.string(),
  notifyAdvance: z.number().int().min(5).max(15),
  notify247: z.boolean(),
  dndStart: z.string().regex(/^\d{2}:\d{2}$/),
  dndEnd: z.string().regex(/^\d{2}:\d{2}$/),
  isActive: z.boolean(),
});

export const DndSettingsSchema = z.object({
  active: z.boolean(),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
});

export const UserConfigSchema = z.object({
  startGroup: z.string(),
  tomorrowPush: z.boolean(),
  dnd: DndSettingsSchema,
});

export type Slot = z.infer<typeof SlotSchema>;
export type DndSettings = z.infer<typeof DndSettingsSchema>;
export type UserConfig = z.infer<typeof UserConfigSchema>;
