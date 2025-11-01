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
        createdAt TEXT NOT NULL
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
