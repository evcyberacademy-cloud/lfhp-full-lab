import { LabTask, LabValidationContext } from '@/types/labs';

export class LabValidator {
  public static async validateTask(task: LabTask, context: LabValidationContext): Promise<boolean> {
    try {
      const result = await Promise.resolve(task.validator(context));
      return !!result;
    } catch (e) {
      console.error(`Validation error for task ${task.id}:`, e);
      return false;
    }
  }
}
