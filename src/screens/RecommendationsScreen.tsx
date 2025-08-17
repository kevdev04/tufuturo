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

  const curatedImages: { match: RegExp; url: string }[] = [
    { match: /(data|analyst|analytics|bi|ml|ai)/i, url: 'https://images.unsplash.com/photo-1518186233392-c232efbf2373?q=80&w=1600&auto=format&fit=crop' },
    { match: /(developer|engineer|software|frontend|backend|full.?stack|programmer)/i, url: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1600&auto=format&fit=crop' },
    { match: /(designer|ux|ui|product)/i, url: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?q=80&w=1600&auto=format&fit=crop' },
    { match: /(nurse|health|clinic|hospital|salud|medic)/i, url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1600&auto=format&fit=crop' },
    { match: /(teacher|profesor|education|school|mentor)/i, url: 'https://images.unsplash.com/photo-1529078155058-5d716f45d604?q=80&w=1600&auto=format&fit=crop' },
    { match: /(marketing|sales|venta|growth|seo|ads)/i, url: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=1600&auto=format&fit=crop' },
    { match: /(finance|account|contab|bank)/i, url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1600&auto=format&fit=crop' },
    { match: /(operations|logistic|supply|project manager)/i, url: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=1600&auto=format&fit=crop' },
    { match: /(social worker|community|social)/i, url: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?q=80&w=1600&auto=format&fit=crop' },
    { match: /(environment|ambiental|sustain)/i, url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop' },
    { match: /(animal|vet|veterinary|rescue)/i, url: 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?q=80&w=1600&auto=format&fit=crop' },
  ];
  const defaultHero = 'https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?q=80&w=1600&auto=format&fit=crop';
  const pickImage = (name?: string): string => {
    const n = name || '';
    const hit = curatedImages.find(ci => ci.match.test(n));
    return hit?.url || defaultHero;
  };
  const hero = pickImage(advice?.careers?.[0]?.name);

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
          <Image source={{ uri: pickImage(c.name) }} style={styles.careerImage} />
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
      {/* Single navigation CTA is in header; avoid duplicating action buttons */}
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


