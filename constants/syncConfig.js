const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');

const DEFAULT_SYNC_SERVER_URL = 'https://knleung60.synology.me';
const DEFAULT_SYNC_API_KEY = 'bs-sync-8bd727a02da74574ba92c7f5ab5724ae';

export const CENTRAL_SYNC_CONFIG = {
  serverUrl: trimTrailingSlash(process.env.EXPO_PUBLIC_SYNC_SERVER_URL || DEFAULT_SYNC_SERVER_URL),
  apiKey: (process.env.EXPO_PUBLIC_SYNC_API_KEY || DEFAULT_SYNC_API_KEY).trim(),
  timeoutMs: Number(process.env.EXPO_PUBLIC_SYNC_TIMEOUT_MS || 15000),
};

export const isCentralSyncEnabled = () => Boolean(CENTRAL_SYNC_CONFIG.serverUrl && CENTRAL_SYNC_CONFIG.apiKey);
