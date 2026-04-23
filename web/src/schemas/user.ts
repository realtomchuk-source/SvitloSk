import { z } from 'zod';

export const SlotSchema = z.object({
  id: z.string().uuid(),
  locationName: z.string().min(1).max(20),
  group: z.string(),
  notifyTime: z.number().int().positive(),
  isActive: z.boolean(),
  dndEnabled: z.boolean(),
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
