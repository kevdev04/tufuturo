import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { violetTheme } from '../../theme/colors';

interface SubareaChipProps {
  name: string;
  onPress?: () => void;
  selected?: boolean;
}

const SubareaChip: React.FC<SubareaChipProps> = ({ name, onPress, selected }) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.chip, selected && styles.chipActive]}>
        <Text style={[styles.text, selected && styles.textActive]} numberOfLines={1}>{name}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: violetTheme.colors.violet100,
    borderWidth: 1,
    borderColor: violetTheme.colors.border,
    marginRight: violetTheme.spacing.xs,
  },
  chipActive: {
    backgroundColor: violetTheme.colors.primary,
    borderColor: violetTheme.colors.primary,
  },
  text: {
    color: violetTheme.colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  textActive: {
    color: violetTheme.colors.primaryForeground,
  },
});

export default SubareaChip;


