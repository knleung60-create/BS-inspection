const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');

const app = express();

const PORT = Number(process.env.PORT || 3020);
const API_KEY = process.env.SYNC_API_KEY || '';
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const DEFECTS_FILE = path.join(DATA_DIR, 'defects.json');
const DELETED_DEFECTS_FILE = path.join(DATA_DIR, 'deleted-defects.json');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

if (!fs.existsSync(DEFECTS_FILE)) {
  fs.writeFileSync(DEFECTS_FILE, '[]\n', 'utf8');
}

if (!fs.existsSync(DELETED_DEFECTS_FILE)) {
  fs.writeFileSync(DELETED_DEFECTS_FILE, '[]\n', 'utf8');
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, UPLOAD_DIR);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname || '.jpg') || '.jpg';
    const safeName = `photo-${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`;
    callback(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: Number(process.env.MAX_PHOTO_SIZE_BYTES || 15 * 1024 * 1024),
  },
});

const readDefects = () => {
  try {
    return JSON.parse(fs.readFileSync(DEFECTS_FILE, 'utf8'));
  } catch (error) {
    console.error('Failed to read defects file:', error);
    return [];
  }
};

const writeDefects = (defects) => {
  const tempFile = `${DEFECTS_FILE}.tmp`;
  fs.writeFileSync(tempFile, `${JSON.stringify(defects, null, 2)}\n`, 'utf8');
  fs.renameSync(tempFile, DEFECTS_FILE);
};

const readDeletedDefects = () => {
  try {
    return JSON.parse(fs.readFileSync(DELETED_DEFECTS_FILE, 'utf8'));
  } catch (error) {
    console.error('Failed to read deleted defects file:', error);
    return [];
  }
};

const writeDeletedDefects = (deletedDefects) => {
  const tempFile = `${DELETED_DEFECTS_FILE}.tmp`;
  fs.writeFileSync(tempFile, `${JSON.stringify(deletedDefects, null, 2)}\n`, 'utf8');
  fs.renameSync(tempFile, DELETED_DEFECTS_FILE);
};

const isNewerOrEqual = (nextDate, currentDate) => {
  if (!currentDate) {
    return true;
  }
  return new Date(nextDate).getTime() >= new Date(currentDate).getTime();
};

const deletePhotoFile = (fileName) => {
  if (fileName) {
    fs.unlink(path.join(UPLOAD_DIR, fileName), () => {});
  }
};

const getBaseUrl = (req) => {
  if (PUBLIC_BASE_URL) {
    return PUBLIC_BASE_URL;
  }
  return `${req.protocol}://${req.get('host')}`;
};

const getPhotoUrl = (req, fileName) => {
  if (!fileName) {
    return '';
  }
  return `${getBaseUrl(req)}/uploads/${encodeURIComponent(fileName)}`;
};

const requireApiKey = (req, res, next) => {
  if (!API_KEY) {
    next();
    return;
  }

  if (req.get('x-api-key') !== API_KEY) {
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }

  next();
};

const parseMetadata = (rawMetadata) => {
  if (!rawMetadata) {
    throw new Error('Missing metadata');
  }

  if (typeof rawMetadata === 'object') {
    return rawMetadata;
  }

  return JSON.parse(rawMetadata);
};

const normalizeDefect = (metadata, req, existingDefect = null, uploadedFile = null) => {
  const requiredFields = ['defectId', 'projectTitle', 'serviceType', 'category', 'location', 'createdAt'];
  for (const field of requiredFields) {
    if (!metadata[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  const photoFileName = uploadedFile?.filename || existingDefect?.photoFileName || '';
  const photoUrl = photoFileName
    ? getPhotoUrl(req, photoFileName)
    : metadata.remotePhotoUrl || existingDefect?.photoUrl || '';

  return {
    defectId: metadata.defectId,
    projectTitle: metadata.projectTitle,
    serviceType: metadata.serviceType,
    category: metadata.category,
    location: metadata.location,
    remarks: metadata.remarks || '',
    createdAt: metadata.createdAt,
    updatedAt: metadata.updatedAt || new Date().toISOString(),
    createdBy: metadata.createdBy || '',
    photoFileName,
    photoUrl,
  };
};

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-api-key');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use('/uploads', express.static(UPLOAD_DIR));
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/defects', requireApiKey, (req, res) => {
  const defects = readDefects()
    .map((defect) => ({
      ...defect,
      photoUrl: defect.photoFileName ? getPhotoUrl(req, defect.photoFileName) : defect.photoUrl || '',
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const deletedDefects = readDeletedDefects();
  res.json({ defects, deletedDefects });
});

app.post('/api/defects', requireApiKey, upload.single('photo'), (req, res) => {
  try {
    const metadata = parseMetadata(req.body.metadata);
    const defects = readDefects();
    const deletedDefects = readDeletedDefects();
    const existingIndex = defects.findIndex((defect) => defect.defectId === metadata.defectId);
    const existingDefect = existingIndex >= 0 ? defects[existingIndex] : null;
    const defect = normalizeDefect(metadata, req, existingDefect, req.file);
    const tombstone = deletedDefects.find((deleted) => deleted.defectId === defect.defectId);

    if (tombstone && !isNewerOrEqual(defect.updatedAt, tombstone.deletedAt)) {
      deletePhotoFile(req.file?.filename);
      res.status(409).json({ error: 'Defect was deleted by a newer sync operation' });
      return;
    }

    if (existingDefect && !isNewerOrEqual(defect.updatedAt, existingDefect.updatedAt)) {
      deletePhotoFile(req.file?.filename);
      res.json({
        defect: {
          ...existingDefect,
          photoUrl: existingDefect.photoFileName ? getPhotoUrl(req, existingDefect.photoFileName) : existingDefect.photoUrl || '',
        },
        ignored: true,
      });
      return;
    }

    if (existingIndex >= 0) {
      if (req.file?.filename && existingDefect?.photoFileName && existingDefect.photoFileName !== req.file.filename) {
        deletePhotoFile(existingDefect.photoFileName);
      }
      defects[existingIndex] = defect;
    } else {
      defects.push(defect);
    }

    writeDefects(defects);
    res.json({ defect });
  } catch (error) {
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/defects/:defectId', requireApiKey, (req, res) => {
  const defects = readDefects();
  const target = defects.find((defect) => defect.defectId === req.params.defectId);
  const deletedAt = req.query.deletedAt || new Date().toISOString();

  if (target && !isNewerOrEqual(deletedAt, target.updatedAt)) {
    res.status(409).json({ error: 'Delete ignored because the central defect is newer' });
    return;
  }

  const remaining = defects.filter((defect) => defect.defectId !== req.params.defectId);
  const deletedDefects = readDeletedDefects();
  const existingDeletedIndex = deletedDefects.findIndex((deleted) => deleted.defectId === req.params.defectId);
  const tombstone = { defectId: req.params.defectId, deletedAt };

  if (existingDeletedIndex >= 0) {
    if (isNewerOrEqual(deletedAt, deletedDefects[existingDeletedIndex].deletedAt)) {
      deletedDefects[existingDeletedIndex] = tombstone;
    }
  } else {
    deletedDefects.push(tombstone);
  }

  deletePhotoFile(target?.photoFileName);
  writeDefects(remaining);
  writeDeletedDefects(deletedDefects);
  res.json({ deleted: defects.length - remaining.length, deletedAt });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Defect sync server listening on port ${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
});
