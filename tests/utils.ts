import { vi } from 'vitest';

export const tick = async () => {
  await vi.runAllTimersAsync();
};
