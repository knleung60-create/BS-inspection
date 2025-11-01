import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Card, Title, Text, DataTable, Divider, Button, Menu, IconButton } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { getAllDefects, getDefectStatistics, getAllProjects, getDefectsByProject } from '../database/db';
import { SERVICE_TYPES, SERVICE_TYPE_NAMES } from '../constants/defectData';
import { generateStatisticsPDF, sharePDF } from '../utils/pdfGenerator';
import { getCurrentProject } from '../utils/storage';

export default function StatisticsScreen() {
  const [defects, setDefects] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [selectedProject, setSelectedProject] = useState('All');
  const [projects, setProjects] = useState([]);
  const [projectMenuVisible, setProjectMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadStatistics = async (projectTitle = null) => {
    try {
      setLoading(true);
      
      // Load all defects for the selected project
      let allDefects;
      if (projectTitle && projectTitle !== 'All') {
        allDefects = await getDefectsByProject(projectTitle);
      } else {
        allDefects = await getAllDefects();
      }
      setDefects(allDefects);
      
      // Load projects
      const projectList = await getAllProjects();
      setProjects(projectList);
      
      // Get statistics
      const stats = await getDefectStatistics(projectTitle === 'All' ? null : projectTitle);
      
      // Organize statistics by service type
      const organized = {};
      SERVICE_TYPES.forEach(type => {
        organized[type] = {};
      });
      
      stats.forEach(stat => {
        if (!organized[stat.serviceType]) {
          organized[stat.serviceType] = {};
        }
        organized[stat.serviceType][stat.category] = stat.count;
      });
      
      setStatistics(organized);
    } catch (error) {
      console.error('Error loading statistics:', error);
      Alert.alert('Error', 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const initLoad = async () => {
        const currentProject = await getCurrentProject();
        if (currentProject) {
          setSelectedProject(currentProject);
          await loadStatistics(currentProject);
        } else {
          await loadStatistics('All');
        }
      };
      initLoad();
    }, [])
  );

  const handleProjectFilter = async (project) => {
    setSelectedProject(project);
    setProjectMenuVisible(false);
    await loadStatistics(project === 'All' ? null : project);
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const pdfPath = await generateStatisticsPDF(defects, selectedProject);
      
      Alert.alert(
        'PDF Generated',
        'Statistics report has been exported to PDF. Would you like to share it?',
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

  const getTotalByServiceType = (serviceType) => {
    if (!statistics[serviceType]) return 0;
    return Object.values(statistics[serviceType]).reduce((sum, count) => sum + count, 0);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading statistics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
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

        <IconButton
          icon="file-pdf-box"
          mode="contained"
          iconColor="#d32f2f"
          size={24}
          onPress={handleExportPDF}
          disabled={exporting || defects.length === 0}
        />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title style={styles.summaryTitle}>Defect Summary</Title>
            <Text style={styles.totalText}>Total Defects: {defects.length}</Text>
            <Divider style={styles.divider} />
            {SERVICE_TYPES.map(type => {
              const total = getTotalByServiceType(type);
              return (
                <View key={type} style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    {type} - {SERVICE_TYPE_NAMES[type]}:
                  </Text>
                  <Text style={styles.summaryValue}>{total}</Text>
                </View>
              );
            })}
          </Card.Content>
        </Card>

        {/* Detailed Statistics by Service Type */}
        {SERVICE_TYPES.map(type => {
          const typeStats = statistics[type];
          const total = getTotalByServiceType(type);
          
          if (total === 0) return null;
          
          return (
            <Card key={type} style={styles.detailCard}>
              <Card.Content>
                <Title style={styles.cardTitle}>
                  {type} - {SERVICE_TYPE_NAMES[type]}
                </Title>
                <Text style={styles.subtitle}>Total: {total} defects</Text>
                
                <DataTable>
                  <DataTable.Header>
                    <DataTable.Title style={styles.categoryColumn}>Category</DataTable.Title>
                    <DataTable.Title numeric style={styles.countColumn}>Count</DataTable.Title>
                  </DataTable.Header>

                  {Object.keys(typeStats)
                    .sort((a, b) => typeStats[b] - typeStats[a])
                    .map((category, index) => (
                      <DataTable.Row key={index}>
                        <DataTable.Cell style={styles.categoryColumn}>
                          {category}
                        </DataTable.Cell>
                        <DataTable.Cell numeric style={styles.countColumn}>
                          {typeStats[category]}
                        </DataTable.Cell>
                      </DataTable.Row>
                    ))}
                </DataTable>
              </Card.Content>
            </Card>
          );
        })}

        {defects.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No defects recorded yet</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

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
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterButton: {
    flex: 1,
    marginRight: 10,
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  summaryCard: {
    marginBottom: 20,
    elevation: 4,
    backgroundColor: '#fff',
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 10,
  },
  divider: {
    marginVertical: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  detailCard: {
    marginBottom: 15,
    elevation: 4,
    backgroundColor: '#fff',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  categoryColumn: {
    flex: 3,
  },
  countColumn: {
    flex: 1,
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
