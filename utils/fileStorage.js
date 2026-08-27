import * as FileSystem from 'expo-file-system/legacy';

const DEFECT_PHOTO_DIRECTORY = `${FileSystem.documentDirectory}defect_photos/`;

export const ensureDirectoryExists = async (directoryUri) => {
  try {
    await FileSystem.readDirectoryAsync(directoryUri);
  } catch (error) {
    await FileSystem.makeDirectoryAsync(directoryUri, { intermediates: true });
  }
};

export const saveDefectPhoto = async (uri, defectId) => {
  await ensureDirectoryExists(DEFECT_PHOTO_DIRECTORY);

  const safeDefectId = String(defectId || Date.now()).replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${safeDefectId}_${Date.now()}.jpg`;
  const newPath = `${DEFECT_PHOTO_DIRECTORY}${fileName}`;

  await FileSystem.copyAsync({
    from: uri,
    to: newPath,
  });

  return newPath;
};

export { FileSystem };
