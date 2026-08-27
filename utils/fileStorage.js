import { Directory, File, Paths } from 'expo-file-system';

const DEFECT_PHOTO_DIRECTORY_NAME = 'defect_photos';
const DEFECT_PHOTO_DIRECTORY = new Directory(Paths.document, DEFECT_PHOTO_DIRECTORY_NAME);

export const ensureDefectPhotoDirectoryExists = () => {
  if (!DEFECT_PHOTO_DIRECTORY.exists) {
    DEFECT_PHOTO_DIRECTORY.create({ intermediates: true, idempotent: true });
  }
};

export const saveDefectPhoto = async (uri, defectId) => {
  ensureDefectPhotoDirectoryExists();

  const safeDefectId = String(defectId || Date.now()).replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${safeDefectId}_${Date.now()}.jpg`;
  const sourceFile = new File(uri);
  const destinationFile = new File(DEFECT_PHOTO_DIRECTORY, fileName);

  sourceFile.copy(destinationFile);

  return destinationFile.uri;
};

export const isDefectPhotoUri = (uri = '') => uri.includes(`/${DEFECT_PHOTO_DIRECTORY_NAME}/`);

export const deleteLocalFileIfExists = async (uri) => {
  if (!uri) {
    return;
  }

  const file = new File(uri);
  if (file.exists) {
    file.delete();
  }
};
