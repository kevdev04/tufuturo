import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { violetTheme } from '../../theme/colors';

interface CareerCardProps {
  name: string;
  area?: string;
  onPress?: () => void;
  selected?: boolean;
}

const CareerCard: React.FC<CareerCardProps> = ({ name, area, onPress, selected }) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.card, selected && styles.cardSelected]}>
        <View style={styles.iconWrap}>
          <Ionicons name="briefcase" size={20} color={violetTheme.colors.primary} />
        </View>
        <Text style={styles.title} numberOfLines={2}>{name}</Text>
        {area ? <Text style={styles.subtitle} numberOfLines={1}>{area}</Text> : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 160,
    backgroundColor: violetTheme.colors.card,
    borderRadius: violetTheme.borderRadius.md,
    padding: violetTheme.spacing.md,
    marginRight: violetTheme.spacing.sm,
    borderWidth: 1,
    borderColor: violetTheme.colors.border,
  },
  cardSelected: {
    borderColor: violetTheme.colors.primary,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${violetTheme.colors.primary}22`,
    marginBottom: 8,
  },
  title: {
    fontWeight: '700',
    color: violetTheme.colors.foreground,
  },
  subtitle: {
    marginTop: 4,
    color: violetTheme.colors.muted,
    fontSize: 12,
  },
});

export default CareerCard;


