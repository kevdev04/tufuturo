import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { violetTheme } from '../theme/colors';
import Button from '../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';

const RecommendationsScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const advice = route.params?.advice;

  const hero = `https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?q=80&w=1600&auto=format&fit=crop`;
  const getImageFor = (name?: string) => {
    const key = encodeURIComponent((name || 'career').toLowerCase().split(' ').slice(0, 3).join(','));
    return `https://source.unsplash.com/800x600/?${key}`;
  };

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: hero }} style={styles.hero} />
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{advice?.title || 'Career Recommendations'}</Text>
          {!!advice?.summary && <Text style={styles.summary}>{advice.summary}</Text>}
        </View>
        <Button variant="outline" onPress={() => navigation.navigate('ExploreRoot' as never)}>
          <Ionicons name="compass-outline" size={16} color={violetTheme.colors.primary} />
          <Text style={{ marginLeft: 6, color: violetTheme.colors.primary }}>Explorar</Text>
        </Button>
      </View>
      {(advice?.careers || []).map((c: any, idx: number) => (
        <View key={idx} style={styles.careerCard}>
          <Image source={{ uri: getImageFor(c.name) }} style={styles.careerImage} />
          <View style={styles.careerBody}>
            <View style={styles.careerHeader}>
              <Ionicons name="briefcase-outline" size={18} color={violetTheme.colors.primary} />
              <Text style={styles.cardTitle}>{c.name}</Text>
            </View>
            {!!c.why && <Text style={styles.cardWhy}>{c.why}</Text>}
            {Array.isArray(c.nextSteps) && c.nextSteps.length > 0 && (
              <View style={styles.stepsRow}>
                {c.nextSteps.slice(0, 3).map((s: string, i: number) => (
                  <View key={i} style={styles.stepChip}>
                    <Ionicons name="checkmark-circle-outline" size={14} color={violetTheme.colors.primary} />
                    <Text style={styles.stepChipText} numberOfLines={1}>{s}</Text>
                  </View>
                ))}
              </View>
            )}
            <View style={styles.cardActions}>
              <Button variant="ghost" size="sm">
                <Ionicons name="school-outline" size={16} color={violetTheme.colors.primary} />
                <Text style={styles.actionText}>Cursos</Text>
              </Button>
              <Button variant="ghost" size="sm">
                <Ionicons name="briefcase-outline" size={16} color={violetTheme.colors.primary} />
                <Text style={styles.actionText}>Empleos</Text>
              </Button>
              <Button variant="ghost" size="sm">
                <Ionicons name="hand-left-outline" size={16} color={violetTheme.colors.primary} />
                <Text style={styles.actionText}>Voluntariado</Text>
              </Button>
            </View>
          </View>
        </View>
      ))}
      <Button variant="default" style={{ marginTop: 12 }} onPress={() => navigation.navigate('ExploreRoot' as never)}>
        <Text style={{ color: violetTheme.colors.primaryForeground, fontWeight: '600' }}>Continuar al Explore</Text>
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: violetTheme.colors.background, padding: violetTheme.spacing.md },
  hero: { width: '100%', height: Math.min(200, Dimensions.get('window').height * 0.26), borderRadius: violetTheme.borderRadius.md, marginBottom: violetTheme.spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: violetTheme.spacing.sm, marginBottom: violetTheme.spacing.sm },
  title: { fontSize: 22, fontWeight: '700', color: violetTheme.colors.foreground, marginBottom: 8 },
  summary: { color: violetTheme.colors.muted, marginBottom: 12 },
  careerCard: { flexDirection: 'row', borderWidth: 1, borderColor: violetTheme.colors.border, borderRadius: violetTheme.borderRadius.md, backgroundColor: violetTheme.colors.card, marginBottom: violetTheme.spacing.md, overflow: 'hidden' },
  careerImage: { width: 120, height: 120 },
  careerBody: { flex: 1, padding: violetTheme.spacing.sm },
  careerHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: violetTheme.colors.foreground },
  cardWhy: { color: violetTheme.colors.foreground },
  stepsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  stepChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: violetTheme.colors.border, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: violetTheme.colors.violet50 },
  stepChipText: { color: violetTheme.colors.foreground, fontSize: 12, maxWidth: 140 },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionText: { marginLeft: 6, color: violetTheme.colors.primary, fontWeight: '600' },
});

export default RecommendationsScreen;


