import { z } from 'zod';
import { TASK_PRIORITIES, TASK_STATUSES } from '../board/boardConstants';

const emptyToNull = (value: string) => {
  const trimmed = value.trim();

  return trimmed ? trimmed : null;
};

export const taskFormSchema = z.object({
  title: z.string().trim().min(1, 'Название обязательно'),
  description: z.string().transform(emptyToNull),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(TASK_PRIORITIES),
  assigneeId: z.string().trim().transform(emptyToNull),
  dueDate: z.string().trim().transform(emptyToNull),
  labelIds: z.array(z.string()).refine(
    (labelIds) => new Set(labelIds).size === labelIds.length,
    'Метки не должны повторяться',
  ),
});

export type TaskFormSchemaInput = z.input<typeof taskFormSchema>;
export type TaskFormSchemaOutput = z.output<typeof taskFormSchema>;
