import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { Card, Title, Paragraph, Button, Menu, Chip, Divider, Text, IconButton, Searchbar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { getAllDefects, getDefectsByServiceType, deleteDefect, getAllProjects, getDefectsByProject, getDefectsByProjectAndServiceType } from '../database/db';
import { SERVICE_TYPES, SERVICE_TYPE_NAMES } from '../constants/defectData';
import { generateDefectLogPDF, sharePDF } from '../utils/pdfGenerator';
import { generateSiteMemo } from '../utils/siteMemoGenerator';
import { getCurrentProject } from '../utils/storage';

export default function DefectLogScreen() {
  const [defects, setDefects] = useState([]);
  const [filteredDefects, setFilteredDefects] = useState([]);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [projectMenuVisible, setProjectMenuVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedProject, setSelectedProject] = useState('All');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportingSiteMemo, setExportingSiteMemo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayedDefects, setDisplayedDefects] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedDefects, setSelectedDefects] = useState(new Set());

  const loadDefects = async () => {
    try {
      setLoading(true);
      const data = await getAllDefects();
      setDefects(data);
      
      // Load projects
      const projectList = await getAllProjects();
      setProjects(projectList);
      
      // Try to load current project
      const currentProject = await getCurrentProject();
      if (currentProject && projectList.includes(currentProject)) {
        setSelectedProject(currentProject);
        const projectDefects = await getDefectsByProject(currentProject);
        setFilteredDefects(projectDefects);
      } else {
        setFilteredDefects(data);
      }
    } catch (error) {
      console.error('Error loading defects:', error);
      Alert.alert('Error', 'Failed to load defects');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDefects();
    }, [])
  );

  const applyFilters = async (project, serviceType) => {
    try {
      let filtered = [];
      
      if (project === 'All' && serviceType === 'All') {
        filtered = defects;
      } else if (project === 'All') {
        filtered = await getDefectsByServiceType(serviceType);
      } else if (serviceType === 'All') {
        filtered = await getDefectsByProject(project);
      } else {
        filtered = await getDefectsByProjectAndServiceType(project, serviceType);
      }
      
      setFilteredDefects(filtered);
      applySearch(filtered, searchQuery);
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  };

  const applySearch = (defectsToSearch, query) => {
    if (!query.trim()) {
      setDisplayedDefects(defectsToSearch);
      return;
    }

    const lowercaseQuery = query.toLowerCase().trim();
    const searched = defectsToSearch.filter(defect => {
      const location = defect.location?.toLowerCase() || '';
      const defectId = defect.defectId?.toLowerCase() || '';
      const category = defect.category?.toLowerCase() || '';
      const remarks = defect.remarks?.toLowerCase() || '';
      
      return location.includes(lowercaseQuery) ||
             defectId.includes(lowercaseQuery) ||
             category.includes(lowercaseQuery) ||
             remarks.includes(lowercaseQuery);
    });
    
    setDisplayedDefects(searched);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    applySearch(filteredDefects, query);
  };

  const handleProjectFilter = async (project) => {
    setSelectedProject(project);
    setProjectMenuVisible(false);
    await applyFilters(project, selectedFilter);
  };

  const handleServiceTypeFilter = async (filter) => {
    setSelectedFilter(filter);
    setFilterMenuVisible(false);
    await applyFilters(selectedProject, filter);
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedDefects(new Set());
  };

  const toggleDefectSelection = (defectId) => {
    const newSelected = new Set(selectedDefects);
    if (newSelected.has(defectId)) {
      newSelected.delete(defectId);
    } else {
      newSelected.add(defectId);
    }
    setSelectedDefects(newSelected);
  };

  const selectAllDisplayed = () => {
    const allIds = new Set(displayedDefects.map(d => d.id));
    setSelectedDefects(allIds);
  };

  const deselectAll = () => {
    setSelectedDefects(new Set());
  };

  const handleExportSiteMemo = async () => {
    try {
      setExportingSiteMemo(true);
      
      // Determine which defects to export
      let defectsToExport;
      if (selectionMode && selectedDefects.size > 0) {
        // Export only selected defects
        defectsToExport = displayedDefects.filter(d => selectedDefects.has(d.id));
      } else {
        // Export all filtered/searched defects
        defectsToExport = displayedDefects;
      }
      
      if (defectsToExport.length === 0) {
        Alert.alert('No Defects', 'Please select defects to generate site memo');
        setExportingSiteMemo(false);
        return;
      }
      
      // Get project title
      const projectTitle = selectedProject === 'All' ? defectsToExport[0]?.projectTitle : selectedProject;
      
      const pdfPath = await generateSiteMemo(defectsToExport, projectTitle);
      
      Alert.alert(
        'Site Memo Generated',
        'General Defects Site Memo has been generated. Would you like to share it?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Share',
            onPress: async () => {
              try {
                await sharePDF(pdfPath);
              } catch (error) {
                Alert.alert('Error', 'Failed to share site memo');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error generating site memo:', error);
      Alert.alert('Error', 'Failed to generate site memo');
    } finally {
      setExportingSiteMemo(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      
      // Determine which defects to export
      let defectsToExport;
      if (selectionMode && selectedDefects.size > 0) {
        // Export only selected defects
        defectsToExport = displayedDefects.filter(d => selectedDefects.has(d.id));
      } else {
        // Export all filtered/searched defects
        defectsToExport = displayedDefects;
      }
      
      if (defectsToExport.length === 0) {
        Alert.alert('No Defects', 'No defects to export');
        setExporting(false);
        return;
      }
      
      const pdfPath = await generateDefectLogPDF(
        defectsToExport,
        selectedProject,
        selectedFilter
      );
      
      Alert.alert(
        'PDF Generated',
        'Defect log has been exported to PDF. Would you like to share it?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Share',
            onPress: async () => {
              try {
                await sharePDF(pdfPath);
              } catch (error) {
                Alert.alert('Error', 'Failed to share PDF');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error exporting PDF:', error);
      Alert.alert('Error', 'Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = (id, defectId) => {
    Alert.alert(
      'Delete Defect',
      `Are you sure you want to delete defect ${defectId}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDefect(id);
              Alert.alert('Success', 'Defect deleted successfully');
              loadDefects();
            } catch (error) {
              console.error('Error deleting defect:', error);
              Alert.alert('Error', 'Failed to delete defect');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading defects...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          {/* Project Filter */}
          <Menu
            visible={projectMenuVisible}
            onDismiss={() => setProjectMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setProjectMenuVisible(true)}
                style={styles.filterButton}
                icon="folder"
              >
                {selectedProject === 'All' ? 'All Projects' : selectedProject}
              </Button>
            }
          >
            <Menu.Item
              onPress={() => handleProjectFilter('All')}
              title="All Projects"
            />
            <Divider />
            {projects.map((project, index) => (
              <Menu.Item
                key={index}
                onPress={() => handleProjectFilter(project)}
                title={project}
              />
            ))}
          </Menu>

          {/* Service Type Filter */}
          <Menu
            visible={filterMenuVisible}
            onDismiss={() => setFilterMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setFilterMenuVisible(true)}
                style={styles.filterButton}
                icon="filter"
              >
                {selectedFilter === 'All' ? 'All Types' : selectedFilter}
              </Button>
            }
          >
            <Menu.Item
              onPress={() => handleServiceTypeFilter('All')}
              title="All Service Types"
            />
            <Divider />
            {SERVICE_TYPES.map((type) => (
              <Menu.Item
                key={type}
                onPress={() => handleServiceTypeFilter(type)}
                title={`${type} - ${SERVICE_TYPE_NAMES[type]}`}
              />
            ))}
          </Menu>
        </View>

        <View style={styles.statsRow}>
          {selectionMode ? (
            <View style={styles.selectionInfo}>
              <Text style={styles.statsText}>
                {selectedDefects.size} selected of {displayedDefects.length}
              </Text>
              <View style={styles.selectionButtons}>
                <Button
                  mode="text"
                  onPress={selectAllDisplayed}
                  compact
                  style={styles.selectButton}
                >
                  Select All
                </Button>
                <Button
                  mode="text"
                  onPress={deselectAll}
                  compact
                  style={styles.selectButton}
                >
                  Clear
                </Button>
              </View>
            </View>
          ) : (
            <Text style={styles.statsText}>Total: {displayedDefects.length} of {filteredDefects.length} defects</Text>
          )}
          <View style={styles.actionButtons}>
            <IconButton
              icon={selectionMode ? "close" : "checkbox-multiple-marked"}
              mode="contained"
              iconColor={selectionMode ? "#666" : "#1976d2"}
              size={24}
              onPress={toggleSelectionMode}
              disabled={displayedDefects.length === 0}
            />
            <IconButton
              icon="file-document"
              mode="contained"
              iconColor="#2e7d32"
              size={24}
              onPress={handleExportSiteMemo}
              disabled={exportingSiteMemo || displayedDefects.length === 0}
            />
            <IconButton
              icon="file-pdf-box"
              mode="contained"
              iconColor="#d32f2f"
              size={24}
              onPress={handleExportPDF}
              disabled={exporting || displayedDefects.length === 0}
            />
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search by location, ID, category..."
          onChangeText={handleSearchChange}
          value={searchQuery}
          style={styles.searchBar}
          iconColor="#6200ee"
          elevation={2}
        />
      </View>

      <ScrollView style={styles.scrollView}>
        {displayedDefects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No defects match your search' : 'No defects found'}
            </Text>
          </View>
        ) : (
          displayedDefects.map((defect, index) => (
            <Card 
              key={defect.id} 
              style={[
                styles.card,
                selectionMode && selectedDefects.has(defect.id) && styles.selectedCard
              ]}
              onPress={selectionMode ? () => toggleDefectSelection(defect.id) : undefined}
            >
              <Card.Content>
                <View style={styles.cardHeader}>
                  {selectionMode && (
                    <IconButton
                      icon={selectedDefects.has(defect.id) ? "checkbox-marked" : "checkbox-blank-outline"}
                      size={24}
                      iconColor={selectedDefects.has(defect.id) ? "#1976d2" : "#999"}
                      onPress={() => toggleDefectSelection(defect.id)}
                      style={styles.checkbox}
                    />
                  )}
                  <Title style={styles.cardTitle}>#{index + 1}</Title>
                  <Chip
                    mode="outlined"
                    style={[styles.chip, { borderColor: getServiceTypeColor(defect.serviceType) }]}
                    textStyle={{ color: getServiceTypeColor(defect.serviceType) }}
                  >
                    {defect.serviceType}
                  </Chip>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.label}>Defect ID:</Text>
                  <Text style={styles.value}>{defect.defectId}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.label}>Project:</Text>
                  <Text style={styles.value}>{defect.projectTitle}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.label}>Category:</Text>
                  <Text style={styles.value}>{defect.category}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.label}>Location:</Text>
                  <Text style={styles.value}>{defect.location}</Text>
                </View>

                {defect.remarks && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Remarks:</Text>
                    <Text style={styles.value}>{defect.remarks}</Text>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <Text style={styles.label}>Date:</Text>
                  <Text style={styles.value}>{formatDate(defect.createdAt)}</Text>
                </View>

                {defect.photoPath && (
                  <Image source={{ uri: defect.photoPath }} style={styles.photo} />
                )}

                <Button
                  mode="outlined"
                  onPress={() => handleDelete(defect.id, defect.defectId)}
                  style={styles.deleteButton}
                  textColor="#d32f2f"
                  icon="delete"
                >
                  Delete
                </Button>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const getServiceTypeColor = (serviceType) => {
  const colors = {
    PD: '#1976d2',
    FS: '#d32f2f',
    MVAC: '#388e3c',
    EL: '#f57c00',
    Bonding: '#7b1fa2',
  };
  return colors[serviceType] || '#666';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  filterContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 15,
    elevation: 1,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#f5f5f5',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  filterButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  card: {
    marginBottom: 15,
    elevation: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  selectionInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectionButtons: {
    flexDirection: 'row',
  },
  selectButton: {
    marginLeft: 5,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  checkbox: {
    margin: 0,
    padding: 0,
  },
  selectedCard: {
    borderColor: '#1976d2',
    borderWidth: 2,
    backgroundColor: '#e3f2fd',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chip: {
    borderWidth: 2,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontWeight: 'bold',
    width: 100,
    color: '#666',
  },
  value: {
    flex: 1,
    color: '#333',
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  deleteButton: {
    marginTop: 10,
    borderColor: '#d32f2f',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
