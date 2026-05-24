import { createSolarClients, getSolarConfig } from '@solar/api';
import { getSession } from '@solar/auth';

export const solar = createSolarClients({
  ...getSolarConfig(),
  getToken: () => getSession()?.token ?? null,
});
