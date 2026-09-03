import * as SQLite from 'expo-sqlite';

let db = null;

const SYNC_COLUMNS = [
  { name: 'updatedAt', definition: 'TEXT' },
  { name: 'createdBy', definition: 'TEXT' },
  { name: 'syncStatus', definition: "TEXT DEFAULT 'pending'" },
  { name: 'syncError', definition: 'TEXT' },
  { name: 'syncedAt', definition: 'TEXT' },
  { name: 'remotePhotoUrl', definition: 'TEXT' },
  { name: 'siteMemoNumbers', definition: 'TEXT' },
];

const ensureSyncColumns = async () => {
  const columns = await db.getAllAsync('PRAGMA table_info(defects)');
  const existingColumnNames = new Set(columns.map((column) => column.name));

  for (const column of SYNC_COLUMNS) {
    if (!existingColumnNames.has(column.name)) {
      await db.execAsync(`ALTER TABLE defects ADD COLUMN ${column.name} ${column.definition};`);
    }
  }
};

const toDbText = (value) => (value === null || value === undefined ? '' : String(value));

export const initDatabase = async () => {
  try {
    // Open database with correct API
    db = await SQLite.openDatabaseAsync('defects.db');
    
    // Create table if not exists
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS defects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        defectId TEXT UNIQUE NOT NULL,
        projectTitle TEXT NOT NULL,
        serviceType TEXT NOT NULL,
        category TEXT NOT NULL,
        location TEXT NOT NULL,
        remarks TEXT,
        photoPath TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );
    `);

    await ensureSyncColumns();

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS deleted_defects (
        defectId TEXT PRIMARY KEY NOT NULL,
        deletedAt TEXT NOT NULL,
        syncStatus TEXT DEFAULT 'pending',
        syncError TEXT,
        syncedAt TEXT
      );
    `);
    
    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export const getDatabase = async () => {
  if (!db) {
    // Auto-initialize if not already initialized
    await initDatabase();
  }
  return db;
};

export const addDefect = async (defectData) => {
  try {
    const database = await getDatabase();
    const {
      defectId,
      projectTitle,
      serviceType,
      category,
      location,
      remarks,
      photoPath,
      createdAt,
      updatedAt,
      createdBy,
      syncStatus,
      syncedAt,
      remotePhotoUrl,
      siteMemoNumbers,
    } = defectData;
    const now = new Date().toISOString();
    
    console.log('Attempting to save defect:', defectData);
    
    const result = await database.runAsync(
      `INSERT INTO defects (
        defectId,
        projectTitle,
        serviceType,
        category,
        location,
        remarks,
        photoPath,
        createdAt,
        updatedAt,
        createdBy,
        syncStatus,
        syncError,
        syncedAt,
        remotePhotoUrl,
        siteMemoNumbers
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        toDbText(defectId),
        toDbText(projectTitle),
        toDbText(serviceType),
        toDbText(category),
        toDbText(location),
        toDbText(remarks),
        toDbText(photoPath),
        toDbText(createdAt || now),
        toDbText(updatedAt || createdAt || now),
        toDbText(createdBy),
        toDbText(syncStatus || 'pending'),
        '',
        toDbText(syncedAt),
        toDbText(remotePhotoUrl),
        toDbText(siteMemoNumbers),
      ]
    );
    
    console.log('Defect saved successfully:', result);
    return result;
  } catch (error) {
    console.error('Error adding defect:', error);
    console.error('Error details:', error.message);
    throw error;
  }
};

export const getAllDefects = async () => {
  try {
    const database = await getDatabase();
    const allRows = await database.getAllAsync('SELECT * FROM defects ORDER BY createdAt DESC');
    console.log('Retrieved defects:', allRows.length);
    return allRows;
  } catch (error) {
    console.error('Error getting all defects:', error);
    return [];
  }
};

export const getPendingSyncDefects = async () => {
  try {
    const database = await getDatabase();
    const rows = await database.getAllAsync(
      `SELECT * FROM defects
       WHERE syncStatus IS NULL OR syncStatus != 'synced'
       ORDER BY createdAt ASC`
    );
    return rows;
  } catch (error) {
    console.error('Error getting pending sync defects:', error);
    return [];
  }
};

export const markDefectSynced = async (defectId, remotePhotoUrl = null) => {
  try {
    const database = await getDatabase();
    const syncedAt = new Date().toISOString();
    const nextRemotePhotoUrl = toDbText(remotePhotoUrl);
    await database.runAsync(
      `UPDATE defects
       SET syncStatus = 'synced',
           syncError = NULL,
           syncedAt = ?,
           remotePhotoUrl = CASE
             WHEN ? != '' THEN ?
             ELSE remotePhotoUrl
           END
       WHERE defectId = ?`,
      [syncedAt, nextRemotePhotoUrl, nextRemotePhotoUrl, toDbText(defectId)]
    );
  } catch (error) {
    console.error('Error marking defect synced:', error);
  }
};

export const markDefectSyncError = async (defectId, errorMessage) => {
  try {
    const database = await getDatabase();
    await database.runAsync(
      `UPDATE defects
       SET syncStatus = 'error',
           syncError = ?
       WHERE defectId = ?`,
      [toDbText(errorMessage || 'Sync failed'), toDbText(defectId)]
    );
  } catch (error) {
    console.error('Error marking defect sync error:', error);
  }
};

export const upsertCentralDefects = async (centralDefects = []) => {
  if (!centralDefects.length) {
    return 0;
  }

  try {
    const database = await getDatabase();
    const syncedAt = new Date().toISOString();

    for (const defect of centralDefects) {
      const deleted = await database.getFirstAsync(
        'SELECT deletedAt FROM deleted_defects WHERE defectId = ?',
        [toDbText(defect.defectId)]
      );
      const centralUpdatedAt = toDbText(defect.updatedAt || defect.createdAt);

      if (deleted && new Date(deleted.deletedAt).getTime() >= new Date(centralUpdatedAt).getTime()) {
        continue;
      }

      const remotePhotoUrl = toDbText(defect.photoUrl || defect.remotePhotoUrl);
      const photoPath = remotePhotoUrl || defect.photoPath || '';

      await database.runAsync(
        `INSERT INTO defects (
          defectId,
          projectTitle,
          serviceType,
          category,
          location,
          remarks,
          photoPath,
          createdAt,
          updatedAt,
          createdBy,
          syncStatus,
          syncError,
          syncedAt,
          remotePhotoUrl,
          siteMemoNumbers
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', NULL, ?, ?, ?)
        ON CONFLICT(defectId) DO UPDATE SET
          projectTitle = excluded.projectTitle,
          serviceType = excluded.serviceType,
          category = excluded.category,
          location = excluded.location,
          remarks = excluded.remarks,
          photoPath = CASE
            WHEN defects.photoPath IS NOT NULL
             AND defects.photoPath != ''
             AND defects.photoPath NOT LIKE 'http%'
            THEN defects.photoPath
            ELSE excluded.photoPath
          END,
          updatedAt = excluded.updatedAt,
          createdBy = excluded.createdBy,
          syncStatus = 'synced',
          syncError = NULL,
          syncedAt = excluded.syncedAt,
          remotePhotoUrl = excluded.remotePhotoUrl,
          siteMemoNumbers = excluded.siteMemoNumbers
        WHERE defects.updatedAt IS NULL
           OR excluded.updatedAt >= defects.updatedAt`,
        [
          toDbText(defect.defectId),
          toDbText(defect.projectTitle),
          toDbText(defect.serviceType),
          toDbText(defect.category),
          toDbText(defect.location),
          toDbText(defect.remarks),
          toDbText(photoPath),
          toDbText(defect.createdAt),
          toDbText(defect.updatedAt || defect.createdAt),
          toDbText(defect.createdBy),
          toDbText(syncedAt),
          remotePhotoUrl,
          toDbText(defect.siteMemoNumbers),
        ]
      );
    }

    return centralDefects.length;
  } catch (error) {
    console.error('Error upserting central defects:', error);
    return 0;
  }
};

export const addSiteMemoNumberToDefects = async (defectIds = [], memoNumber) => {
  const cleanMemoNumber = toDbText(memoNumber).trim();
  const cleanIds = defectIds.filter((id) => id !== null && id !== undefined);

  if (!cleanIds.length || !cleanMemoNumber) {
    return 0;
  }

  try {
    const database = await getDatabase();
    const now = new Date().toISOString();
    let updated = 0;

    for (const id of cleanIds) {
      const row = await database.getFirstAsync(
        'SELECT siteMemoNumbers FROM defects WHERE id = ?',
        [id]
      );
      const memoNumbers = toDbText(row?.siteMemoNumbers)
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

      if (!memoNumbers.includes(cleanMemoNumber)) {
        memoNumbers.push(cleanMemoNumber);
      }

      await database.runAsync(
        `UPDATE defects
         SET siteMemoNumbers = ?,
             updatedAt = ?,
             syncStatus = 'pending',
             syncError = NULL
         WHERE id = ?`,
        [memoNumbers.join(', '), now, id]
      );
      updated += 1;
    }

    return updated;
  } catch (error) {
    console.error('Error adding site memo number to defects:', error);
    throw error;
  }
};

export const applyCentralDeletedDefects = async (deletedDefects = []) => {
  if (!deletedDefects.length) {
    return 0;
  }

  try {
    const database = await getDatabase();
    let applied = 0;

    for (const deleted of deletedDefects) {
      const defectId = toDbText(deleted.defectId);
      const deletedAt = toDbText(deleted.deletedAt);

      if (!defectId || !deletedAt) {
        continue;
      }

      const localDefect = await database.getFirstAsync(
        'SELECT updatedAt, syncStatus FROM defects WHERE defectId = ?',
        [defectId]
      );

      if (
        localDefect
        && localDefect.syncStatus !== 'synced'
        && localDefect.updatedAt
        && new Date(localDefect.updatedAt).getTime() > new Date(deletedAt).getTime()
      ) {
        continue;
      }

      await database.runAsync('DELETE FROM defects WHERE defectId = ?', [defectId]);
      await database.runAsync(
        `INSERT INTO deleted_defects (defectId, deletedAt, syncStatus, syncError, syncedAt)
         VALUES (?, ?, 'synced', NULL, ?)
         ON CONFLICT(defectId) DO UPDATE SET
           deletedAt = CASE WHEN excluded.deletedAt >= deleted_defects.deletedAt THEN excluded.deletedAt ELSE deleted_defects.deletedAt END,
           syncStatus = 'synced',
           syncError = NULL,
           syncedAt = excluded.syncedAt`,
        [defectId, deletedAt, new Date().toISOString()]
      );
      applied += 1;
    }

    return applied;
  } catch (error) {
    console.error('Error applying central deleted defects:', error);
    return 0;
  }
};

export const getPendingDeletedDefects = async () => {
  try {
    const database = await getDatabase();
    return database.getAllAsync(
      `SELECT * FROM deleted_defects
       WHERE syncStatus IS NULL OR syncStatus != 'synced'
       ORDER BY deletedAt ASC`
    );
  } catch (error) {
    console.error('Error getting pending deleted defects:', error);
    return [];
  }
};

export const markDeletedDefectSynced = async (defectId) => {
  try {
    const database = await getDatabase();
    await database.runAsync(
      `UPDATE deleted_defects
       SET syncStatus = 'synced',
           syncError = NULL,
           syncedAt = ?
       WHERE defectId = ?`,
      [new Date().toISOString(), toDbText(defectId)]
    );
  } catch (error) {
    console.error('Error marking deleted defect synced:', error);
  }
};

export const markDeletedDefectSyncError = async (defectId, errorMessage) => {
  try {
    const database = await getDatabase();
    await database.runAsync(
      `UPDATE deleted_defects
       SET syncStatus = 'error',
           syncError = ?
       WHERE defectId = ?`,
      [toDbText(errorMessage || 'Delete sync failed'), toDbText(defectId)]
    );
  } catch (error) {
    console.error('Error marking deleted defect sync error:', error);
  }
};

export const getDefectsByServiceType = async (serviceType) => {
  try {
    const database = await getDatabase();
    const rows = await database.getAllAsync(
      'SELECT * FROM defects WHERE serviceType = ? ORDER BY createdAt DESC',
      [serviceType]
    );
    return rows;
  } catch (error) {
    console.error('Error getting defects by service type:', error);
    return [];
  }
};

export const getAllProjects = async () => {
  try {
    const database = await getDatabase();
    const rows = await database.getAllAsync(
      'SELECT DISTINCT projectTitle FROM defects ORDER BY projectTitle ASC'
    );
    return rows.map(row => row.projectTitle);
  } catch (error) {
    console.error('Error getting all projects:', error);
    return [];
  }
};

export const getDefectsByProject = async (projectTitle) => {
  try {
    const database = await getDatabase();
    const rows = await database.getAllAsync(
      'SELECT * FROM defects WHERE projectTitle = ? ORDER BY createdAt DESC',
      [projectTitle]
    );
    return rows;
  } catch (error) {
    console.error('Error getting defects by project:', error);
    return [];
  }
};

export const getDefectsByProjectAndServiceType = async (projectTitle, serviceType) => {
  try {
    const database = await getDatabase();
    const rows = await database.getAllAsync(
      'SELECT * FROM defects WHERE projectTitle = ? AND serviceType = ? ORDER BY createdAt DESC',
      [projectTitle, serviceType]
    );
    return rows;
  } catch (error) {
    console.error('Error getting defects by project and service type:', error);
    return [];
  }
};

export const getDefectsByCategory = async (category) => {
  try {
    const database = await getDatabase();
    const rows = await database.getAllAsync(
      'SELECT * FROM defects WHERE category = ? ORDER BY createdAt DESC',
      [category]
    );
    return rows;
  } catch (error) {
    console.error('Error getting defects by category:', error);
    return [];
  }
};

export const getDefectStatistics = async (projectTitle = null) => {
  try {
    const database = await getDatabase();
    let query = `
      SELECT 
        serviceType,
        category,
        COUNT(*) as count
      FROM defects
    `;
    
    let params = [];
    if (projectTitle) {
      query += ' WHERE projectTitle = ?';
      params.push(projectTitle);
    }
    
    query += `
      GROUP BY serviceType, category
      ORDER BY serviceType, category
    `;
    
    const stats = await database.getAllAsync(query, params);
    return stats;
  } catch (error) {
    console.error('Error getting defect statistics:', error);
    return [];
  }
};

export const deleteDefect = async (id, defectId = null, deletedAt = null) => {
  try {
    const database = await getDatabase();
    const nextDeletedAt = deletedAt || new Date().toISOString();
    const row = defectId
      ? { defectId }
      : await database.getFirstAsync('SELECT defectId FROM defects WHERE id = ?', [id]);

    const result = await database.runAsync('DELETE FROM defects WHERE id = ?', [id]);
    if (row?.defectId) {
      await database.runAsync(
        `INSERT INTO deleted_defects (defectId, deletedAt, syncStatus, syncError, syncedAt)
         VALUES (?, ?, 'pending', NULL, NULL)
         ON CONFLICT(defectId) DO UPDATE SET
           deletedAt = excluded.deletedAt,
           syncStatus = 'pending',
           syncError = NULL,
           syncedAt = NULL`,
        [toDbText(row.defectId), nextDeletedAt]
      );
    }
    console.log('Defect deleted:', id);
    return result;
  } catch (error) {
    console.error('Error deleting defect:', error);
    throw error;
  }
};

export const generateDefectId = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `DEF-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
};

// Helper function to test database connection
export const testDatabase = async () => {
  try {
    const database = await getDatabase();
    const result = await database.getAllAsync('SELECT * FROM defects LIMIT 1');
    console.log('Database test successful');
    return true;
  } catch (error) {
    console.error('Database test failed:', error);
    return false;
  }
};
