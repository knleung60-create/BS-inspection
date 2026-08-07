import * as FileSystem from 'expo-file-system';
import { getUnsyncedDefects, markDefectSynced, updateDefectFromServer } from '../database/db';
import { getNasIp, getUserId } from './storage';

export const syncWithNas = async () => {
  const nasIp = await getNasIp();
  if (!nasIp) {
    throw new Error('NAS IP not configured. Please set it in settings.');
  }

  const baseUrl = `http://${nasIp}:3000`;
  const userId = await getUserId();

  console.log('Starting sync with NAS:', baseUrl);

  try {
    // 1. Upload unsynced local defects
    await uploadLocalDefects(baseUrl, userId);

    // 2. Download remote defects
    await downloadRemoteDefects(baseUrl);

    console.log('Sync completed successfully');
    return { success: true };
  } catch (error) {
    console.error('Sync failed:', error);
    throw error;
  }
};

const uploadLocalDefects = async (baseUrl, userId) => {
  const unsynced = await getUnsyncedDefects();
  console.log(`Found ${unsynced.length} unsynced defects`);

  for (const defect of unsynced) {
    try {
      // First, upload the photo if it exists locally
      const photoName = defect.photoPath.split('/').pop();
      
      console.log(`Uploading photo: ${photoName}`);
      const uploadResult = await FileSystem.uploadAsync(
        `${baseUrl}/sync/photo`,
        defect.photoPath,
        {
          fieldName: 'photo',
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        }
      );

      if (uploadResult.status !== 200) {
        throw new Error(`Photo upload failed for ${defect.defectId}`);
      }

      // Then, upload defect data
      const response = await fetch(`${baseUrl}/sync/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...defect,
          uploaderId: userId,
          photoPath: photoName, // Store only filename on server
        }),
      });

      const result = await response.json();
      if (result.success) {
        await markDefectSynced(defect.id, result.id);
      }
    } catch (error) {
      console.error(`Failed to upload defect ${defect.defectId}:`, error);
    }
  }
};

const downloadRemoteDefects = async (baseUrl) => {
  const response = await fetch(`${baseUrl}/sync/download`);
  const remoteDefects = await response.json();
  console.log(`Downloaded ${remoteDefects.length} defects from server`);

  for (const remoteDefect of remoteDefects) {
    try {
      // Ensure photo is downloaded if it doesn't exist locally
      const localPhotoPath = `${FileSystem.documentDirectory}defect_photos/${remoteDefect.photoPath}`;
      const fileInfo = await FileSystem.getInfoAsync(localPhotoPath);
      
      if (!fileInfo.exists) {
        console.log(`Downloading photo: ${remoteDefect.photoPath}`);
        await FileSystem.downloadAsync(
          `${baseUrl}/photos/${remoteDefect.photoPath}`,
          localPhotoPath
        );
      }

      // Update local database
      await updateDefectFromServer({
        ...remoteDefect,
        photoPath: localPhotoPath,
      });
    } catch (error) {
      console.error(`Failed to process remote defect ${remoteDefect.defectId}:`, error);
    }
  }
};
