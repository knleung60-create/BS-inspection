import AsyncStorage from '@react-native-async-storage/async-storage';

const CURRENT_PROJECT_KEY = '@current_project';
const MEMO_NUMBER_KEY = '@memo_number';
const MEMO_PREFIX = 'YTIL46/BSI/M/';
const MEMO_START_NUMBER = 50; // Starting from 0050

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

// Memo number management
export const getNextMemoNumber = async () => {
  try {
    const storedNumber = await AsyncStorage.getItem(MEMO_NUMBER_KEY);
    let nextNumber = MEMO_START_NUMBER;
    
    if (storedNumber) {
      // Parse the number from stored memo (e.g., "YTIL46/BSI/M/0050" -> 50)
      const match = storedNumber.match(/(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    
    // Format with leading zeros (4 digits)
    const formattedNumber = nextNumber.toString().padStart(4, '0');
    const memoNumber = `${MEMO_PREFIX}${formattedNumber}`;
    
    // Save for next time
    await AsyncStorage.setItem(MEMO_NUMBER_KEY, memoNumber);
    console.log('Generated memo number:', memoNumber);
    
    return memoNumber;
  } catch (error) {
    console.error('Error getting next memo number:', error);
    // Fallback to formatted start number
    const fallback = `${MEMO_PREFIX}${MEMO_START_NUMBER.toString().padStart(4, '0')}`;
    return fallback;
  }
};

export const setMemoNumber = async (memoNumber) => {
  try {
    await AsyncStorage.setItem(MEMO_NUMBER_KEY, memoNumber);
    console.log('Memo number set to:', memoNumber);
  } catch (error) {
    console.error('Error setting memo number:', error);
  }
};
