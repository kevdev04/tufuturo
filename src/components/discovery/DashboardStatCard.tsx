import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { violetTheme } from '../../theme/colors';

interface DashboardStatCardProps {
  career: string;
  average: number;
}

const DashboardStatCard: React.FC<DashboardStatCardProps> = ({ career, average }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title} numberOfLines={1}>{career}</Text>
      <View style={styles.barBg}>
        <View style={[styles.bar, { width: `${Math.min(100, Math.max(0, average))}%` }]} />
      </View>
      <Text style={styles.value}>{Math.round(average)}%</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 180,
    backgroundColor: violetTheme.colors.card,
    borderRadius: violetTheme.borderRadius.md,
    padding: violetTheme.spacing.md,
    marginRight: violetTheme.spacing.sm,
    borderWidth: 1,
    borderColor: violetTheme.colors.border,
  },
  title: {
    fontWeight: '700',
    color: violetTheme.colors.foreground,
    marginBottom: 8,
  },
  barBg: {
    width: '100%',
    height: 8,
    backgroundColor: violetTheme.colors.violet100,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  bar: {
    height: '100%',
    backgroundColor: violetTheme.colors.primary,
  },
  value: {
    color: violetTheme.colors.muted,
    fontSize: 12,
  },
});

export default DashboardStatCard;


