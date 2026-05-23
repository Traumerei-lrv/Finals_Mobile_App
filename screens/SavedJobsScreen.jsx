import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  clearSavedJobs,
  getSavedJobs,
  removeSavedJob,
  updateSavedJob,
} from '../utils/storage';

const COLORS = {
  primary: '#1a365d',
  secondary: '#5d7291',
  surface: '#f9f9ff',
  outline: '#cfdaf1',
  white: '#ffffff',
};

export default function SavedJobsScreen({ navigation }) {
  const [savedJobs, setSavedJobs] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      const storedJobs = await getSavedJobs();
      if (isMounted) {
        setSavedJobs(storedJobs);
      }
    };

    hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  const savedCount = useMemo(() => savedJobs.length, [savedJobs]);

  const handleUpdateSavedJobStatus = async (jobId) => {
    const currentJob = savedJobs.find((item) => item.id === jobId);

    if (!currentJob) {
      return;
    }

    const nextStatus =
      currentJob.status === 'Saved'
        ? 'Applied'
        : currentJob.status === 'Applied'
          ? 'Interviewing'
          : 'Saved';

    const nextSavedJobs = await updateSavedJob(jobId, { status: nextStatus });
    setSavedJobs(nextSavedJobs);
  };

  const handleRemoveSavedJob = async (jobId) => {
    const nextSavedJobs = await removeSavedJob(jobId);
    setSavedJobs(nextSavedJobs);
  };

  const handleClearSavedJobs = async () => {
    await clearSavedJobs();
    setSavedJobs([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Saved</Text>
          <Text style={styles.subtitle}>{savedCount} saved jobs</Text>
        </View>
        <TouchableOpacity onPress={handleClearSavedJobs}>
          <Text style={styles.clearText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {savedJobs.length ? (
          savedJobs.map((job) => (
            <View key={job.id} style={styles.card}>
              <View style={styles.cardTopRow}>
                <View style={[styles.iconBox, { backgroundColor: job.color || COLORS.primary }]}>
                  <MaterialCommunityIcons name={job.icon || 'bookmark-outline'} size={20} color={COLORS.white} />
                </View>
                <View style={styles.cardMainInfo}>
                  <Text style={styles.jobRole}>{job.role}</Text>
                  <Text style={styles.jobMeta}>{job.company} • {job.location}</Text>
                  <Text style={styles.jobSalary}>{job.salary ?? job.type ?? 'Saved job'}</Text>
                </View>
              </View>

              <View style={styles.statusRow}>
                <View style={styles.statusPill}>
                  <Text style={styles.statusText}>{job.status}</Text>
                </View>
                <TouchableOpacity style={styles.actionButton} onPress={() => handleUpdateSavedJobStatus(job.id)}>
                  <Text style={styles.actionText}>Update Status</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleRemoveSavedJob(job.id)}
                >
                  <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bookmark-outline" size={24} color={COLORS.secondary} />
            <Text style={styles.emptyText}>No saved jobs yet. Use the sidebar Saved button to view them here.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outline,
    backgroundColor: COLORS.white,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.secondary,
    textAlign: 'center',
    marginTop: 2,
  },
  clearText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outline,
    padding: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMainInfo: {
    flex: 1,
  },
  jobRole: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  jobMeta: {
    fontSize: 13,
    color: COLORS.secondary,
    marginTop: 3,
  },
  jobSalary: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusPill: {
    backgroundColor: '#E2E7F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  deleteButton: {
    backgroundColor: '#FDE8E8',
  },
  actionText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  deleteText: {
    color: '#B42318',
  },
  emptyState: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.secondary,
    fontSize: 13,
    lineHeight: 18,
  },
});