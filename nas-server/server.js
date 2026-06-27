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

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

if (!fs.existsSync(DEFECTS_FILE)) {
  fs.writeFileSync(DEFECTS_FILE, '[]\n', 'utf8');
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

  res.json({ defects });
});

app.post('/api/defects', requireApiKey, upload.single('photo'), (req, res) => {
  try {
    const metadata = parseMetadata(req.body.metadata);
    const defects = readDefects();
    const existingIndex = defects.findIndex((defect) => defect.defectId === metadata.defectId);
    const existingDefect = existingIndex >= 0 ? defects[existingIndex] : null;
    const defect = normalizeDefect(metadata, req, existingDefect, req.file);

    if (existingIndex >= 0) {
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
  const remaining = defects.filter((defect) => defect.defectId !== req.params.defectId);

  if (target?.photoFileName) {
    fs.unlink(path.join(UPLOAD_DIR, target.photoFileName), () => {});
  }

  writeDefects(remaining);
  res.json({ deleted: defects.length - remaining.length });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Defect sync server listening on port ${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
});
