import AsyncStorage from '@react-native-async-storage/async-storage';

const CURRENT_PROJECT_KEY = '@current_project';

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
