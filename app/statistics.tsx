import { GameRecord, GameStats, StatisticsManager } from '@/api/StatisticsManager';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function StatisticsScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<GameStats | null>(null);
  const [recentGames, setRecentGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }, 50);
  }, []);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const [statsData, recentGamesData] = await Promise.all([
        StatisticsManager.getStats(),
        StatisticsManager.getRecentGames(),
      ]);
      setStats(statsData);
      setRecentGames(recentGamesData);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearStats = () => {
    Alert.alert(
      'Clear Statistics',
      'Are you sure you want to clear all statistics? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await StatisticsManager.clearStats();
              await loadStatistics();
              Alert.alert('Success', 'Statistics cleared successfully!');
            } catch (error) {
              console.error('Error clearing stats:', error);
              Alert.alert('Error', 'Failed to clear statistics.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading statistics...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.gradient}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Statistics</Text>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearStats}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={24} color="#ff6b6b" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Overall Statistics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overall Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, styles.gamesPlayedCard]}>
                <Text style={styles.statValue}>{stats?.totalGamesPlayed || 0}</Text>
                <Text style={styles.statLabel}>Games Played</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats?.gamesCompleted || 0}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats?.gamesAbandoned || 0}</Text>
                <Text style={styles.statLabel}>Abandoned</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats?.gamesLost || 0}</Text>
                <Text style={styles.statLabel}>Lost</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {stats?.totalGamesPlayed ? Math.round((stats.gamesCompleted / stats.totalGamesPlayed) * 100) : 0}%
                </Text>
                <Text style={styles.statLabel}>Success Rate</Text>
              </View>
            </View>
          </View>

          {/* Time Statistics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Time Statistics</Text>
            <View style={styles.timeStats}>
              <View style={styles.timeStat}>
                <Text style={styles.timeLabel}>Average Time</Text>
                <Text style={styles.timeValue}>
                  {stats?.totalTimePlayed && stats?.gamesCompleted && stats.gamesCompleted > 0
                   ? StatisticsManager.formatTime(Math.round(stats.totalTimePlayed / stats.gamesCompleted)) : '0:00'}
                </Text>
              </View>
              <View style={styles.timeStat}>
                <Text style={styles.timeLabel}>Fastest Time</Text>
                <Text style={styles.timeValue}>
                  {stats?.fastestTime && stats.fastestTime !== Infinity ? StatisticsManager.formatTime(stats.fastestTime) : 'N/A'}
                </Text>
              </View>
              <View style={styles.timeStat}>
                <Text style={styles.timeLabel}>Slowest Time</Text>
                <Text style={styles.timeValue}>
                  {stats?.slowestTime ? StatisticsManager.formatTime(stats.slowestTime) : 'N/A'}
                </Text>
              </View>
              <View style={styles.timeStat}>
                <Text style={styles.timeLabel}>Total Time Played</Text>
                <Text style={styles.timeValue}>
                  {stats ? StatisticsManager.formatTime(stats.totalTimePlayed) : '0:00'}
                </Text>
              </View>
            </View>
          </View>

          {/* Recent Games */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Games</Text>
            {recentGames.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="stats-chart-outline" size={48} color="rgba(255, 255, 255, 0.3)" />
                <Text style={styles.emptyText}>No games played yet</Text>
                <Text style={styles.emptySubtext}>Complete your first game to see statistics here!</Text>
              </View>
            ) : (
              <View style={styles.recentGames}>
                {recentGames.map((game) => (
                  <View key={game.id} style={styles.gameRecord}>
                    <View style={styles.gameInfo}>
                      <Text style={styles.gameDate}>{formatDate(game.completedAt)}</Text>
                    </View>
                    <View style={styles.gameStats}>
                      {game.completed && (
                        <Text style={styles.gameTime}>
                          {StatisticsManager.formatTime(game.timeSpent)}
                        </Text>
                      )}
                      <View style={styles.completionStatus}>
                        <Ionicons 
                          name={game.completed ? "checkmark-circle" : "close-circle"} 
                          size={16} 
                          color={game.completed ? "#4CAF50" : "#f44336"} 
                        />
                        <Text style={[
                          styles.completionText,
                          game.completed ? styles.completedText : styles.abandonedOrLostText
                        ]}>
                          {game.completed ? 'Completed' : game.lost ? 'Lost' : 'Abandoned'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Dimensions.get('window').height * 0.06,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  clearButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    width: '48%',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  timeStats: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
  },
  timeStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  timeLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  timeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  recentGames: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
  },
  gameRecord: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  gameInfo: {
    flex: 1,
  },
  gameDate: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  gameStats: {
    alignItems: 'flex-end',
  },
  gameTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  completionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completionText: {
    fontSize: 12,
    marginLeft: 4,
  },
  completedText: {
    color: '#4CAF50',
  },
  abandonedOrLostText: {
    color: '#f44336',
    fontSize: 14,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 5,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  gamesPlayedCard: {
    width: '100%', // Take full width for Games Played
    marginBottom: 10, // Add some space below
  },
}); 