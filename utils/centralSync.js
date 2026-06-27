import {
  getPendingSyncDefects,
  markDefectSynced,
  markDefectSyncError,
  upsertCentralDefects,
} from '../database/db';
import { CENTRAL_SYNC_CONFIG, isCentralSyncEnabled } from '../constants/syncConfig';

const isRemoteUri = (uri = '') => /^https?:\/\//i.test(uri);

const requestCentral = async (path, options = {}) => {
  if (!isCentralSyncEnabled()) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CENTRAL_SYNC_CONFIG.timeoutMs);

  const headers = {
    ...(CENTRAL_SYNC_CONFIG.apiKey ? { 'x-api-key': CENTRAL_SYNC_CONFIG.apiKey } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(`${CENTRAL_SYNC_CONFIG.serverUrl}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Central sync failed with status ${response.status}`);
    }

    return response.status === 204 ? null : response.json();
  } finally {
    clearTimeout(timeout);
  }
};

export const pushDefectToCentral = async (defect) => {
  if (!isCentralSyncEnabled()) {
    return null;
  }

  const formData = new FormData();
  const metadata = {
    defectId: defect.defectId,
    projectTitle: defect.projectTitle,
    serviceType: defect.serviceType,
    category: defect.category,
    location: defect.location,
    remarks: defect.remarks || '',
    createdAt: defect.createdAt,
    updatedAt: defect.updatedAt || defect.createdAt,
    createdBy: defect.createdBy || '',
    remotePhotoUrl: defect.remotePhotoUrl || '',
  };

  formData.append('metadata', JSON.stringify(metadata));

  if (defect.photoPath && !isRemoteUri(defect.photoPath)) {
    formData.append('photo', {
      uri: defect.photoPath,
      name: `${defect.defectId}.jpg`,
      type: 'image/jpeg',
    });
  }

  const result = await requestCentral('/api/defects', {
    method: 'POST',
    body: formData,
  });

  await markDefectSynced(defect.defectId, result?.defect?.photoUrl || null);
  return result;
};

export const pushPendingDefectsToCentral = async () => {
  if (!isCentralSyncEnabled()) {
    return { pushed: 0, failed: 0 };
  }

  const pendingDefects = await getPendingSyncDefects();
  let pushed = 0;
  let failed = 0;

  for (const defect of pendingDefects) {
    try {
      await pushDefectToCentral(defect);
      pushed += 1;
    } catch (error) {
      failed += 1;
      await markDefectSyncError(defect.defectId, error.message);
      console.error('Error syncing defect to central:', defect.defectId, error);
    }
  }

  return { pushed, failed };
};

export const pullDefectsFromCentral = async () => {
  if (!isCentralSyncEnabled()) {
    return { pulled: 0 };
  }

  const result = await requestCentral('/api/defects');
  const defects = result?.defects || [];
  const pulled = await upsertCentralDefects(defects);
  return { pulled };
};

export const syncWithCentral = async () => {
  if (!isCentralSyncEnabled()) {
    return { enabled: false, pushed: 0, failed: 0, pulled: 0 };
  }

  const pushResult = await pushPendingDefectsToCentral();
  const pullResult = await pullDefectsFromCentral();

  return {
    enabled: true,
    ...pushResult,
    ...pullResult,
  };
};

export const deleteCentralDefect = async (defectId) => {
  if (!isCentralSyncEnabled()) {
    return null;
  }

  return requestCentral(`/api/defects/${encodeURIComponent(defectId)}`, {
    method: 'DELETE',
  });
};

export { isCentralSyncEnabled };
