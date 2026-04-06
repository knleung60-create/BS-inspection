import AsyncStorage from '@react-native-async-storage/async-storage';

const CURRENT_PROJECT_KEY = '@current_project';
// --- (新) 我們為 PDF 計數器添加的新 KEY ---
const SITE_MEMO_COUNT_KEY = '@site_memo_count';

export const saveCurrentProject = async (projectTitle) => {
  try {
    await AsyncStorage.setItem(CURRENT_PROJECT_KEY, projectTitle);
    console.log('Current project saved:', projectTitle);
  } catch (error) {
    console.error('Error saving current project:', error);
  }
};

export const getCurrentProject = async () => {
  try {
    const projectTitle = await AsyncStorage.getItem(CURRENT_PROJECT_KEY);
    console.log('Current project retrieved:', projectTitle);
    return projectTitle;
  } catch (error) {
    console.error('Error getting current project:', error);
    return null;
  }
};

export const clearCurrentProject = async () => {
  try {
    await AsyncStorage.removeItem(CURRENT_PROJECT_KEY);
    console.log('Current project cleared');
  } catch (error) {
    console.error('Error clearing current project:', error);
  }
};

// --- (新) 儲存 PDF 計數的新函式 ---
export const saveSiteMemoCount = async (count) => {
  try {
    // 我們將數字轉換為字串來儲存
    await AsyncStorage.setItem(SITE_MEMO_COUNT_KEY, String(count));
    console.log('Site memo count saved:', count);
  } catch (error) {
    console.error('Error saving site memo count:', error);
  }
};

// --- (新) 讀取 PDF 計數的新函式 ---
export const getSiteMemoCount = async () => {
  try {
    const count = await AsyncStorage.getItem(SITE_MEMO_COUNT_KEY);
    console.log('Site memo count retrieved:', count);
    // 如果是第一次，則回傳 '0'
    return count || '0'; 
  } catch (error) {
    console.error('Error getting site memo count:', error);
    return '0';
  }
};