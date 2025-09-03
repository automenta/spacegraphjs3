import { vi } from 'vitest';

import { vi } from 'vitest';

export const tick = async () => {
  await vi.runAllTimersAsync();
};
