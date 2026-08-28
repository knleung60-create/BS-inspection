const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');

const DEFAULT_SYNC_SERVER_URL = 'https://knleung60.synology.me';

export const CENTRAL_SYNC_CONFIG = {
  serverUrl: trimTrailingSlash(process.env.EXPO_PUBLIC_SYNC_SERVER_URL || DEFAULT_SYNC_SERVER_URL),
  apiKey: process.env.EXPO_PUBLIC_SYNC_API_KEY || '',
  timeoutMs: Number(process.env.EXPO_PUBLIC_SYNC_TIMEOUT_MS || 15000),
};

export const isCentralSyncEnabled = () => Boolean(CENTRAL_SYNC_CONFIG.serverUrl && CENTRAL_SYNC_CONFIG.apiKey);
