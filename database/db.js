import * as SQLite from 'expo-sqlite';

let db = null;

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
        createdAt TEXT NOT NULL,
        syncStatus INTEGER DEFAULT 0,
        serverId INTEGER
      );
    `);
    
    // Add columns if they don't exist (for existing databases)
    try {
      await db.execAsync('ALTER TABLE defects ADD COLUMN syncStatus INTEGER DEFAULT 0;');
    } catch (e) {
      // Column might already exist
    }
    try {
      await db.execAsync('ALTER TABLE defects ADD COLUMN serverId INTEGER;');
    } catch (e) {
      // Column might already exist
    }
    
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
    const { defectId, projectTitle, serviceType, category, location, remarks, photoPath, createdAt } = defectData;
    
    console.log('Attempting to save defect:', defectData);
    
    const result = await database.runAsync(
      'INSERT INTO defects (defectId, projectTitle, serviceType, category, location, remarks, photoPath, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [defectId, projectTitle, serviceType, category, location, remarks || '', photoPath, createdAt]
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

export const deleteDefect = async (id) => {
  try {
    const database = await getDatabase();
    const result = await database.runAsync('DELETE FROM defects WHERE id = ?', [id]);
    console.log('Defect deleted:', id);
    return result;
  } catch (error) {
    console.error('Error deleting defect:', error);
    throw error;
  }
};

export const getUnsyncedDefects = async () => {
  try {
    const database = await getDatabase();
    const rows = await database.getAllAsync('SELECT * FROM defects WHERE syncStatus = 0');
    return rows;
  } catch (error) {
    console.error('Error getting unsynced defects:', error);
    return [];
  }
};

export const markDefectSynced = async (id, serverId) => {
  try {
    const database = await getDatabase();
    await database.runAsync(
      'UPDATE defects SET syncStatus = 1, serverId = ? WHERE id = ?',
      [serverId, id]
    );
    console.log(`Defect ${id} marked as synced with serverId ${serverId}`);
  } catch (error) {
    console.error('Error marking defect as synced:', error);
  }
};

export const updateDefectFromServer = async (defect) => {
  try {
    const database = await getDatabase();
    // Check if defectId already exists
    const existing = await database.getFirstAsync('SELECT id FROM defects WHERE defectId = ?', [defect.defectId]);
    
    if (existing) {
      // Update existing record if it came from server
      await database.runAsync(
        'UPDATE defects SET projectTitle = ?, serviceType = ?, category = ?, location = ?, remarks = ?, photoPath = ?, createdAt = ?, syncStatus = 1, serverId = ? WHERE defectId = ?',
        [defect.projectTitle, defect.serviceType, defect.category, defect.location, defect.remarks, defect.photoPath, defect.createdAt, defect.id, defect.defectId]
      );
    } else {
      // Insert new record
      await database.runAsync(
        'INSERT INTO defects (defectId, projectTitle, serviceType, category, location, remarks, photoPath, createdAt, syncStatus, serverId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)',
        [defect.defectId, defect.projectTitle, defect.serviceType, defect.category, defect.location, defect.remarks, defect.photoPath, defect.createdAt, defect.id]
      );
    }
  } catch (error) {
    console.error('Error updating defect from server:', error);
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
