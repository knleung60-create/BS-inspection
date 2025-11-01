import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Card, Title, Paragraph, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Title style={styles.headerTitle}>🏗️ Building Services</Title>
          <Title style={styles.headerSubtitle}>Inspection System</Title>
          <Paragraph style={styles.headerText}>
            Professional defect tracking and reporting
          </Paragraph>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Card style={styles.actionCard} elevation={3}>
          <Card.Content>
            <View style={styles.iconContainer}>
              <View style={[styles.iconCircle, { backgroundColor: '#e8f5e9' }]}>
                <Title style={[styles.iconText, { color: '#2e7d32' }]}>+</Title>
              </View>
            </View>
            <Title style={styles.cardTitle}>Add New Defect</Title>
            <Paragraph style={styles.cardDescription}>
              Record a new defect with photo, location, and details
            </Paragraph>
            <Button
              mode="contained"
              icon="plus-circle"
              onPress={() => navigation.navigate('AddDefect')}
              style={[styles.actionButton, { backgroundColor: '#2e7d32' }]}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Start Recording
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.actionCard} elevation={3}>
          <Card.Content>
            <View style={styles.iconContainer}>
              <View style={[styles.iconCircle, { backgroundColor: '#e3f2fd' }]}>
                <Title style={[styles.iconText, { color: '#1976d2' }]}>📋</Title>
              </View>
            </View>
            <Title style={styles.cardTitle}>Defect Log</Title>
            <Paragraph style={styles.cardDescription}>
              View, search, and manage all recorded defects
            </Paragraph>
            <Button
              mode="contained"
              icon="format-list-bulleted"
              onPress={() => navigation.navigate('DefectLog')}
              style={[styles.actionButton, { backgroundColor: '#1976d2' }]}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              View Records
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.actionCard} elevation={3}>
          <Card.Content>
            <View style={styles.iconContainer}>
              <View style={[styles.iconCircle, { backgroundColor: '#fff3e0' }]}>
                <Title style={[styles.iconText, { color: '#f57c00' }]}>📊</Title>
              </View>
            </View>
            <Title style={styles.cardTitle}>Statistics</Title>
            <Paragraph style={styles.cardDescription}>
              Analyze defects by type, category, and project
            </Paragraph>
            <Button
              mode="contained"
              icon="chart-bar"
              onPress={() => navigation.navigate('Statistics')}
              style={[styles.actionButton, { backgroundColor: '#f57c00' }]}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              View Analytics
            </Button>
          </Card.Content>
        </Card>

        <Surface style={styles.infoCard} elevation={1}>
          <Paragraph style={styles.infoText}>
            <Title style={styles.infoTitle}>Quick Tips:</Title>
            {'\n'}• Use search to find defects by location
            {'\n'}• Export reports as PDF with photos
            {'\n'}• Filter by project and service type
            {'\n'}• All data stored securely on device
          </Paragraph>
        </Surface>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafbfc',
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 5,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  headerText: {
    fontSize: 15,
    color: '#ffffff',
    opacity: 0.95,
    textAlign: 'center',
  },
  content: {
    padding: 20,
    marginTop: -20,
  },
  actionCard: {
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 32,
    margin: 0,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1c1b1f',
  },
  cardDescription: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  actionButton: {
    borderRadius: 12,
    marginTop: 5,
  },
  buttonContent: {
    paddingVertical: 10,
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  infoCard: {
    marginTop: 10,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#f5f5f7',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#667eea',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 22,
  },
});
