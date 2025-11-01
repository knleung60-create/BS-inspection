import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert, Modal, ActivityIndicator } from 'react-native';
import { Button, TextInput, Card, Title, Menu, Divider, Text } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { SERVICE_TYPES, DEFECT_CATEGORIES, SERVICE_TYPE_NAMES } from '../constants/defectData';
import { addDefect, generateDefectId, getAllProjects } from '../database/db';
import { saveCurrentProject, getCurrentProject } from '../utils/storage';

export default function AddDefectScreen({ navigation }) {
  const [projectTitle, setProjectTitle] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [remarks, setRemarks] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [serviceTypeMenuVisible, setServiceTypeMenuVisible] = useState(false);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [projectMenuVisible, setProjectMenuVisible] = useState(false);
  const [existingProjects, setExistingProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [tempPhotoUri, setTempPhotoUri] = useState(null);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);

  useEffect(() => {
    loadCurrentProject();
    loadExistingProjects();
  }, []);

  const loadCurrentProject = async () => {
    const currentProject = await getCurrentProject();
    if (currentProject) {
      setProjectTitle(currentProject);
    }
  };

  const loadExistingProjects = async () => {
    const projects = await getAllProjects();
    setExistingProjects(projects);
  };

  const optimizeImage = async (uri) => {
    try {
      setProcessingImage(true);
      
      // Compress and resize image for better performance
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [
          { resize: { width: 1200 } }, // Resize to max width 1200px
        ],
        {
          compress: 0.7, // Compress to 70% quality
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      
      return manipResult.uri;
    } catch (error) {
      console.error('Error optimizing image:', error);
      // Return original if optimization fails
      return uri;
    } finally {
      setProcessingImage(false);
    }
  };

  const handlePhotoSelected = async (uri) => {
    const optimizedUri = await optimizeImage(uri);
    setTempPhotoUri(optimizedUri);
    setShowPhotoPreview(true);
  };

  const confirmPhoto = () => {
    setPhotoUri(tempPhotoUri);
    setShowPhotoPreview(false);
    setTempPhotoUri(null);
  };

  const cancelPhoto = () => {
    setShowPhotoPreview(false);
    setTempPhotoUri(null);
  };

  const removePhoto = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setPhotoUri(null);
          },
        },
      ]
    );
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // Disable built-in editing for custom preview
      quality: 1.0, // Get full quality, we'll compress it ourselves
      base64: false,
    });

    if (!result.canceled) {
      await handlePhotoSelected(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false, // Disable built-in editing for custom preview
      quality: 1.0, // Get full quality, we'll compress it ourselves
    });

    if (!result.canceled) {
      await handlePhotoSelected(result.assets[0].uri);
    }
  };

  const validateForm = () => {
    if (!projectTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter a project title');
      return false;
    }
    if (!serviceType) {
      Alert.alert('Validation Error', 'Please select a service type');
      return false;
    }
    if (!category) {
      Alert.alert('Validation Error', 'Please select a defect category');
      return false;
    }
    if (!location.trim()) {
      Alert.alert('Validation Error', 'Please enter a location');
      return false;
    }
    if (!photoUri) {
      Alert.alert('Validation Error', 'Please add a photo');
      return false;
    }
    if (remarks.length > 500) {
      Alert.alert('Validation Error', 'Remarks cannot exceed 500 characters');
      return false;
    }
    return true;
  };

  const savePhoto = async (uri) => {
    const fileName = `defect_${Date.now()}.jpg`;
    const directory = `${FileSystem.documentDirectory}defect_photos/`;
    
    // Create directory if it doesn't exist using new API
    try {
      // Check if directory exists by trying to read it
      await FileSystem.readDirectoryAsync(directory);
    } catch (error) {
      // Directory doesn't exist, create it
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    }
    
    const newPath = directory + fileName;
    await FileSystem.copyAsync({
      from: uri,
      to: newPath,
    });
    
    return newPath;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      console.log('Starting defect submission...');
      
      // Save photo to permanent location
      console.log('Saving photo:', photoUri);
      const savedPhotoPath = await savePhoto(photoUri);
      console.log('Photo saved to:', savedPhotoPath);
      
      // Generate defect ID
      const defectId = generateDefectId();
      console.log('Generated defect ID:', defectId);
      
      // Save current project for next time
      await saveCurrentProject(projectTitle.trim());
      
      // Prepare defect data
      const defectData = {
        defectId,
        projectTitle: projectTitle.trim(),
        serviceType,
        category,
        location: location.trim(),
        remarks: remarks.trim(),
        photoPath: savedPhotoPath,
        createdAt: new Date().toISOString(),
      };
      
      console.log('Defect data prepared:', defectData);
      
      // Save to database
      console.log('Saving to database...');
      await addDefect(defectData);
      console.log('Defect saved successfully!');
      
      Alert.alert(
        'Success',
        `Defect recorded successfully!\nDefect ID: ${defectId}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form but keep project title
              setServiceType('');
              setCategory('');
              setLocation('');
              setRemarks('');
              setPhotoUri(null);
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error saving defect:', error);
      // --- 請在這裡添加下面這一行 ---
      console.error('DETAILED DATABASE ERROR:', JSON.stringify(error, null, 2));
      // --- 結束添加 ---
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // More detailed error message
      let errorMessage = 'Failed to save defect. ';
      if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Add New Defect</Title>
            
            {/* Project Title Input with Suggestions */}
            <Menu
              visible={projectMenuVisible}
              onDismiss={() => setProjectMenuVisible(false)}
              anchor={
                <TextInput
                  label="Project Title *"
                  value={projectTitle}
                  onChangeText={setProjectTitle}
                  mode="outlined"
                  style={styles.input}
                  placeholder="e.g., ABC Tower Renovation"
                  onFocus={() => {
                    if (existingProjects.length > 0) {
                      setProjectMenuVisible(true);
                    }
                  }}
                  right={
                    existingProjects.length > 0 && (
                      <TextInput.Icon
                        icon="menu-down"
                        onPress={() => setProjectMenuVisible(!projectMenuVisible)}
                      />
                    )
                  }
                />
              }
            >
              {existingProjects.map((project, index) => (
                <Menu.Item
                  key={index}
                  onPress={() => {
                    setProjectTitle(project);
                    setProjectMenuVisible(false);
                  }}
                  title={project}
                />
              ))}
            </Menu>
            
            {/* Service Type Selector */}
            <Menu
              visible={serviceTypeMenuVisible}
              onDismiss={() => setServiceTypeMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setServiceTypeMenuVisible(true)}
                  style={styles.input}
                  contentStyle={styles.menuButton}
                >
                  {serviceType ? `${serviceType} - ${SERVICE_TYPE_NAMES[serviceType]}` : 'Select Service Type'}
                </Button>
              }
            >
              {SERVICE_TYPES.map((type) => (
                <Menu.Item
                  key={type}
                  onPress={() => {
                    setServiceType(type);
                    setCategory(''); // Reset category when service type changes
                    setServiceTypeMenuVisible(false);
                  }}
                  title={`${type} - ${SERVICE_TYPE_NAMES[type]}`}
                />
              ))}
            </Menu>

            {/* Category Selector */}
            {serviceType && (
              <Menu
                visible={categoryMenuVisible}
                onDismiss={() => setCategoryMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setCategoryMenuVisible(true)}
                    style={styles.input}
                    contentStyle={styles.menuButton}
                    icon="chevron-down"
                  >
                    {category || 'Select Defect Category'}
                  </Button>
                }
              >
                {DEFECT_CATEGORIES[serviceType].map((cat, index) => (
                  <Menu.Item
                    key={index}
                    onPress={() => {
                      setCategory(cat);
                      setCategoryMenuVisible(false);
                    }}
                    title={cat}
                  />
                ))}
              </Menu>
            )}

            {/* Location Input */}
            <TextInput
              label="Location *"
              value={location}
              onChangeText={setLocation}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Lift Lobby L2"
            />

            {/* Remarks Input */}
            <TextInput
              label="Remarks (Optional)"
              value={remarks}
              onChangeText={setRemarks}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
              placeholder="Additional notes (max 500 characters)"
              maxLength={500}
            />

            {/* Photo Section */}
            <View style={styles.photoSection}>
              <Title style={styles.photoTitle}>Photo *</Title>
              {photoUri && (
                <View style={styles.photoContainer}>
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                  <Button
                    mode="text"
                    icon="close-circle"
                    onPress={removePhoto}
                    style={styles.removePhotoButton}
                    textColor="#d32f2f"
                  >
                    Remove Photo
                  </Button>
                </View>
              )}
              <View style={styles.photoButtons}>
                <Button
                  mode="outlined"
                  icon="camera"
                  onPress={takePhoto}
                  style={styles.photoButton}
                  disabled={processingImage}
                >
                  Take Photo
                </Button>
                <Button
                  mode="outlined"
                  icon="image"
                  onPress={pickImage}
                  style={styles.photoButton}
                  disabled={processingImage}
                >
                  Choose Photo
                </Button>
              </View>
              {processingImage && (
                <Text style={styles.processingText}>Optimizing image...</Text>
              )}
            </View>

            {/* Submit Button */}
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
            >
              Submit Defect
            </Button>
          </Card.Content>
        </Card>
      </View>

      {/* Photo Preview Modal */}
      <Modal
        visible={showPhotoPreview}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelPhoto}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Card style={styles.previewCard}>
              <Card.Content>
                <Title style={styles.previewTitle}>Confirm Photo</Title>
                {tempPhotoUri && (
                  <Image
                    source={{ uri: tempPhotoUri }}
                    style={styles.previewImage}
                    resizeMode="contain"
                  />
                )}
                {processingImage && (
                  <View style={styles.processingContainer}>
                    <ActivityIndicator size="large" color="#6200ee" />
                    <Text style={styles.processingModalText}>Optimizing image...</Text>
                  </View>
                )}
                <View style={styles.previewButtons}>
                  <Button
                    mode="outlined"
                    onPress={cancelPhoto}
                    style={styles.previewButton}
                    disabled={processingImage}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={confirmPhoto}
                    style={styles.previewButton}
                    disabled={processingImage}
                  >
                    Confirm
                  </Button>
                </View>
              </Card.Content>
            </Card>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  card: {
    elevation: 4,
  },
  input: {
    marginTop: 15,
  },
  menuButton: {
    justifyContent: 'flex-start',
  },
  photoSection: {
    marginTop: 20,
  },
  photoTitle: {
    fontSize: 16,
    marginBottom: 10,
  },
  photoPreview: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    marginBottom: 15,
    resizeMode: 'contain',
  },
  photoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  photoButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  submitButton: {
    marginTop: 25,
    borderRadius: 8,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  photoContainer: {
    marginBottom: 15,
  },
  removePhotoButton: {
    marginTop: 5,
  },
  processingText: {
    textAlign: 'center',
    color: '#6200ee',
    marginTop: 10,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
  },
  previewCard: {
    elevation: 8,
  },
  previewTitle: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 15,
  },
  previewImage: {
    width: '100%',
    height: 400,
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
  },
  previewButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  previewButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  processingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  processingModalText: {
    marginTop: 10,
    color: '#6200ee',
    fontSize: 16,
  },
});
