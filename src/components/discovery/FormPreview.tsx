import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { violetTheme } from '../../theme/colors';

interface FormPreviewProps {
  title: string;
  questions: Array<{ id: string | number; text: string }>;
}

const FormPreview: React.FC<FormPreviewProps> = ({ title, questions }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.list}>
        {questions.slice(0, 4).map((q) => (
          <Text key={q.id} style={styles.item} numberOfLines={1}>• {q.text}</Text>
        ))}
      </View>
      {questions.length > 4 ? (
        <Text style={styles.more}>+{questions.length - 4} más…</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 260,
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
  list: {
    gap: 4 as any,
  },
  item: {
    color: violetTheme.colors.foreground,
    fontSize: 12,
  },
  more: {
    marginTop: 6,
    color: violetTheme.colors.muted,
    fontSize: 12,
  },
});

export default FormPreview;


