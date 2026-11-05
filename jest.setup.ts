// jest-expo zastępuje moduły natywne atrapami; expo-crypto potrzebuje prawdziwych UUID w testach bazy.
jest.mock('expo-crypto', () => ({
  randomUUID: () => jest.requireActual<typeof import('node:crypto')>('node:crypto').randomUUID(),
}));
