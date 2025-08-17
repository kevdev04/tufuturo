import React, { useEffect, useMemo, useState, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Image, Dimensions } from 'react-native';
import { violetTheme } from '../theme/colors';
import { useOnboarding } from '../context/OnboardingContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import mcp, { extractResultsArray, normalizeVolunteerOpportunity, normalizeJobs } from '../services/mcp';
import ModuleCard from '../components/learning/ModuleCard';
import GeminiService from '../services/gemini';
import Input from '../components/ui/Input';
import GeminiStatusButton from '../components/learning/GeminiStatusButton';
import SideDrawer from '../components/SideDrawer';
import type { SideDrawerItem } from '../components/SideDrawer';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

const ExploreScreen: React.FC = () => {
  const { volunteerPlan, riasecTop, riasecScores, location, learningPlan, setLearningPlan, setVolunteerPlan, setLocation } = useOnboarding();
  const route = useRoute<any>();
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [vols, setVols] = useState<any[]>([]);
  const [volsLoading, setVolsLoading] = useState(false);
  const [onlyLinkedIn, setOnlyLinkedIn] = useState(false);
  const [learning, setLearning] = useState<{ track: string; modules: any[] } | null>(null);
  const [edu, setEdu] = useState<{ title: string; url: string; snippet?: string }[]>([]);
  const [eduLoading, setEduLoading] = useState(false);
  const [studyLoading, setStudyLoading] = useState(false);
  const [kwChips, setKwChips] = useState<{ label: string; selected: boolean }[]>([]);
  const [locInput, setLocInput] = useState<string>(location || '');
  const navigation = useNavigation<any>();
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => setMenuOpen(true)} accessibilityLabel="Open menu" style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
          <Ionicons name="menu" size={22} color={violetTheme.colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const toPlainText = (html?: string): string => {
    if (!html || typeof html !== 'string') return '';
    const noTags = html.replace(/<[^>]+>/g, ' ');
    return noTags
      .replace(/&nbsp;?/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const categoryImages: Record<string, string> = {
    'Data & AI': 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1200&auto=format&fit=crop',
    'Software Dev': 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1200&auto=format&fit=crop',
    'Design & Product': 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?q=80&w=1200&auto=format&fit=crop',
    'Healthcare': 'https://images.unsplash.com/photo-1584467735871-2f1f7d1f7b66?q=80&w=1200&auto=format&fit=crop',
    'Education': 'https://images.unsplash.com/photo-1588072432836-e10032774350?q=80&w=1200&auto=format&fit=crop',
    'Marketing & Sales': 'https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=1200&auto=format&fit=crop',
    'Finance': 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1200&auto=format&fit=crop',
    'Operations': 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=1200&auto=format&fit=crop',
    'Social': 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?q=80&w=1200&auto=format&fit=crop',
    'Environmental': 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop',
    'Animal Care': 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?q=80&w=1200&auto=format&fit=crop',
    'General': 'https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?q=80&w=1200&auto=format&fit=crop',
  };
  const getImageFor = (text?: string, fallback?: string): string => {
    const key = fallback && categoryImages[fallback] ? fallback : 'General';
    return categoryImages[key];
  };

  const inferJobCategory = (job: any): string => {
    const hay = `${job.title || ''} ${job.org || ''} ${job.snippet || ''}`.toLowerCase();
    if (/data|analyt|bi|ml|ai|science/.test(hay)) return 'Data & AI';
    if (/developer|engineer|software|frontend|backend|full.?stack|program/.test(hay)) return 'Software Dev';
    if (/design|ux|ui|product/.test(hay)) return 'Design & Product';
    if (/health|salud|clinic|hospital|nurse|medic/.test(hay)) return 'Healthcare';
    if (/teach|educa|school|mentor|profesor/.test(hay)) return 'Education';
    if (/market|sales|venta|seo|ads|growth/.test(hay)) return 'Marketing & Sales';
    if (/finance|account|contab|bank|finanzas/.test(hay)) return 'Finance';
    if (/logistic|operac|supply|mantenimiento/.test(hay)) return 'Operations';
    return 'General';
  };

  const inferVolCategory = (op: any): string => {
    const t = (op.type || '').toLowerCase();
    if (t) return t.charAt(0).toUpperCase() + t.slice(1);
    const hay = `${op.title || ''} ${op.organization || ''} ${op.description || ''}`.toLowerCase();
    if (/social|community|comunidad|volunteer/.test(hay)) return 'Social';
    if (/education|escuela|teach|mentor/.test(hay)) return 'Education';
    if (/environment|ambiental|sustaina|eco/.test(hay)) return 'Environmental';
    if (/health|salud|clinic|hospital/.test(hay)) return 'Healthcare';
    if (/animal|pet|rescue/.test(hay)) return 'Animal Care';
    return 'General';
  };

  const loadVolunteer = async () => {
    setVolsLoading(true);
    try {
      const filters: any = { location: 'cdmx' };
      if (volunteerPlan?.categories?.length) filters.career = volunteerPlan.categories;
      if (volunteerPlan?.suggestedKeywords?.length) filters.keywords = volunteerPlan.suggestedKeywords;
      const resp = await mcp.volunteer.mxSearch({ filters });
      const arr = extractResultsArray(resp).map((x: any, i: number) => normalizeVolunteerOpportunity(x, i));
      setVols(arr);
    } catch (e) {
      setVols([]);
    } finally {
      setVolsLoading(false);
    }
  };

  const loadJobs = async () => {
    setJobsLoading(true);
    try {
      const inferredRole = (() => {
        const top = (riasecTop || []).join('');
        if (/IA|AI|I|A/.test(top)) return 'developer data analytics diseño';
        if (/S/.test(top)) return 'orientador educación salud social';
        if (/E/.test(top)) return 'project manager marketing ventas';
        if (/R/.test(top)) return 'operaciones logística mantenimiento';
        if (/C/.test(top)) return 'administrativo finanzas contabilidad';
        return 'analista';
      })();
      const query = [inferredRole, ...(volunteerPlan?.suggestedKeywords || []), 'remoto', location || 'CDMX']
        .filter(Boolean)
        .join(' ');
      const resp = await mcp.jobs.search({
        query,
        location: location || 'CDMX',
        career: volunteerPlan?.categories?.[0] || undefined,
        topK: 8,
      });
      let { items } = normalizeJobs(resp);
      if (onlyLinkedIn) items = items.filter((j: any) => (j.link || '').includes('linkedin.com/jobs'));
      setJobs(items);
    } catch {
      setJobs([]);
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    // preload from stored plan if available
    if (learningPlan && !learning) setLearning(learningPlan);
    if (learningPlan && (edu.length === 0)) {
      loadEducation(volunteerPlan?.suggestedKeywords || []);
    }
    loadJobs();
    loadVolunteer();
  }, [
    onlyLinkedIn,
    (volunteerPlan?.categories || []).join('|'),
    (volunteerPlan?.suggestedKeywords || []).join('|'),
    location,
  ]);

  // Apply incoming career filter from navigation params
  useEffect(() => {
    const carrera: string | undefined = (route as any)?.params?.carrera;
    if (!carrera) return;
    const normalized = String(carrera).trim();
    const currentCategories = volunteerPlan?.categories || [];
    const updatedCategories = [normalized, ...currentCategories.filter((c: string) => c !== normalized)];
    const currentKeywords = volunteerPlan?.suggestedKeywords || [];
    const updatedKeywords = Array.from(new Set([normalized, ...currentKeywords]));
    setVolunteerPlan({
      categories: updatedCategories,
      suggestedKeywords: updatedKeywords,
      rationale: volunteerPlan?.rationale,
    });
  }, [(route as any)?.params?.carrera]);

  const loadEducation = async (keywords: string[], customLocation?: string) => {
    setEduLoading(true);
    try {
      const q = [keywords.join(' '), 'programa curso certificación', (customLocation || location || 'México')].filter(Boolean).join(' ');
      const resp = await mcp.education.search({ query: q, topK: 6 });
      const arr = extractResultsArray(resp).map((r: any) => ({ title: r.title || r.name, url: r.url, snippet: r.snippet }));
      setEdu(arr);
    } catch {
      setEdu([]);
    } finally {
      setEduLoading(false);
    }
  };

  // Initialize keyword chips from plan
  useEffect(() => {
    const initial = (volunteerPlan?.suggestedKeywords || []).map((k: string) => ({ label: k, selected: true }));
    setKwChips(initial);
  }, [volunteerPlan?.suggestedKeywords]);

  // Debounce updates for education search when keywords/location change
  useEffect(() => {
    const t = setTimeout(() => {
      const selected = kwChips.filter(c => c.selected).map(c => c.label);
      loadEducation(selected, locInput);
      // Persist to context
      setVolunteerPlan({ categories: volunteerPlan?.categories || [], suggestedKeywords: selected, rationale: volunteerPlan?.rationale });
      setLocation(locInput);
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kwChips, locInput]);

  const drawerItems: SideDrawerItem[] = [
    { label: 'Explore', icon: 'compass-outline' as keyof typeof Ionicons.glyphMap, onPress: () => { setMenuOpen(false); navigation.navigate('Explore' as never); } },
    { label: 'Home', icon: 'home-outline' as keyof typeof Ionicons.glyphMap, onPress: () => { setMenuOpen(false); navigation.navigate('Home' as never); } },
    { label: 'Schools Map', icon: 'school-outline' as keyof typeof Ionicons.glyphMap, onPress: () => { setMenuOpen(false); navigation.navigate('SchoolsMap' as never); } },
    { label: 'Assessment', icon: 'podium-outline' as keyof typeof Ionicons.glyphMap, onPress: () => { setMenuOpen(false); navigation.getParent()?.navigate('Assessment' as never); } },
    { label: 'Results', icon: 'analytics-outline' as keyof typeof Ionicons.glyphMap, onPress: () => { setMenuOpen(false); navigation.getParent()?.navigate('Results' as never); } },
    { label: 'Account', icon: 'person-outline' as keyof typeof Ionicons.glyphMap, onPress: () => { setMenuOpen(false); navigation.getParent()?.navigate('Account' as never); } },
  ];
  if (user) {
    drawerItems.push({ label: 'Sign Out', icon: 'log-out-outline' as keyof typeof Ionicons.glyphMap, color: violetTheme.colors.danger, onPress: async () => { setMenuOpen(false); await signOut(); } });
  } else {
    drawerItems.push({ label: 'Sign In', icon: 'log-in-outline' as keyof typeof Ionicons.glyphMap, color: violetTheme.colors.primary, onPress: () => { setMenuOpen(false); navigation.getParent()?.navigate('Login' as never); } });
  }

  return (
    <>
    <ScrollView style={styles.container}>
      {/* 1. Study */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Study offers</CardTitle>
            <CardDescription>Programs and courses based on your interests</CardDescription>
          </CardHeader>
          <CardContent>
            <View style={{ marginBottom: 8 }}>
              <GeminiStatusButton />
            </View>
            {!learning && (
              <>
                <Text style={styles.placeholder}>Genera un plan de introducción con IA según tu perfil.</Text>
                <View style={{ height: 8 }} />
                <Button
                  variant="default"
                  onPress={async () => {
                    setStudyLoading(true);
                    try {
                      const goal = (() => {
                        const cats = volunteerPlan?.categories || [];
                        if (cats.includes('ti') || /IA|AI|I|A/.test((riasecTop||[]).join(''))) return 'licenciatura en matemáticas y computación (intro)';
                        if (cats.includes('salud') || (riasecTop||[]).includes('S')) return 'ciencias de la salud (intro)';
                        if (cats.includes('ambiental') || (riasecTop||[]).includes('R')) return 'ingeniería ambiental (intro)';
                        if (cats.includes('social') || (riasecTop||[]).includes('S')) return 'ciencias sociales y educación (intro)';
                        return 'matemáticas aplicadas (intro)';
                      })();
                      const plan = await GeminiService.generateLearningPlan({
                        goal,
                        riasecScores: riasecScores || { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
                        topDimensions: riasecTop || [],
                        interests: volunteerPlan?.suggestedKeywords || [],
                        suggestedKeywords: volunteerPlan?.suggestedKeywords || [],
                      });
                      setLearning(plan);
                      await setLearningPlan(plan);
                      await loadEducation(volunteerPlan?.suggestedKeywords || []);
                    } catch { setLearning(null); } finally { setStudyLoading(false); }
                  }}
                  loading={studyLoading}
                >
                  Generar plan introductorio
                </Button>
              </>
            )}
            {learning && (
              <>
                <Text style={{ fontWeight: '700', color: violetTheme.colors.foreground, marginBottom: 8 }}>{learning.track}</Text>
                {learning.modules.map((m: any, i: number) => (
                  <ModuleCard
                    key={i}
                    title={m.title}
                    objectives={m.objectives || []}
                    topics={m.topics || []}
                    timeHours={m.time_hours || 8}
                    resources={(m.resources || []).slice(0, 4)}
                  />
                ))}
              </>
            )}
          </CardContent>
        </Card>

      {/* 2. Lessons (from plan) */}
      {learning && (
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Lessons</CardTitle>
            <CardDescription>Start with the next modules in your plan</CardDescription>
          </CardHeader>
          <CardContent>
            {learning.modules.slice(0, 2).map((m: any, i: number) => (
              <ModuleCard
                key={i}
                title={m.title}
                objectives={m.objectives || []}
                topics={m.topics || []}
                timeHours={m.time_hours || 8}
                resources={(m.resources || []).slice(0, 3)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* 3. Oportunidades (Jobs) - carousels by category */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Oportunidades</CardTitle>
            <CardDescription>Roles alineados a tu perfil</CardDescription>
          </CardHeader>
          <CardContent>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <TouchableOpacity
                onPress={() => { setOnlyLinkedIn(v => !v); }}
                style={[styles.tab, onlyLinkedIn && styles.tabActive]}
              >
                <Ionicons name="logo-linkedin" size={16} color={onlyLinkedIn ? violetTheme.colors.primaryForeground : violetTheme.colors.primary} />
                <Text style={[styles.tabText, onlyLinkedIn && styles.tabTextActive]}>Solo LinkedIn</Text>
              </TouchableOpacity>
            </View>
            {jobsLoading && <Text style={styles.placeholder}>Cargando...</Text>}
            {!jobsLoading && (
              (Object.entries(jobs.reduce((acc: any, j: any) => {
                const cat = inferJobCategory(j);
                acc[cat] = acc[cat] || [];
                acc[cat].push(j);
                return acc;
              }, {} as Record<string, any[]>)) as [string, any[]][]).map(([cat, list]) => (
                <View key={cat} style={styles.carouselBlock}>
                  <View style={styles.carouselHeader}>
                    <Ionicons name="briefcase-outline" size={18} color={violetTheme.colors.primary} />
                    <Text style={styles.carouselTitle}>{cat}</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
                    {list.map((job: any, idx: number) => (
                      <View key={idx} style={styles.carouselCard}>
                        <Image source={{ uri: getImageFor(job.title || job.org, cat) }} style={styles.carouselImage} />
                        <Text style={styles.itemTitle} numberOfLines={2}>{job.title}</Text>
                        {!!job.org && <Text style={styles.itemOrg} numberOfLines={1}>{job.org}</Text>}
                        {!!job.location && <Text style={styles.itemMeta} numberOfLines={1}>{job.location}</Text>}
                        {!!job.snippet && <Text style={styles.itemDesc} numberOfLines={3}>{toPlainText(job.snippet)}</Text>}
                        <Button variant="ghost" size="sm" style={styles.ctaBtn} onPress={() => Linking.openURL(job.link)}>
                          <Ionicons name="open-outline" size={16} color={violetTheme.colors.primary} />
                          <Text style={{ marginLeft: 6, color: violetTheme.colors.primary }}>Abrir</Text>
                        </Button>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ))
            )}
          </CardContent>
        </Card>
      
      {/* 4. Volunteer - carousels by category */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Volunteer opportunities</CardTitle>
            <CardDescription>Personalized with your categories</CardDescription>
          </CardHeader>
          <CardContent>
            {volsLoading && <Text style={styles.placeholder}>Cargando...</Text>}
            {!volsLoading && (
              (Object.entries(vols.reduce((acc: any, v: any) => {
                const cat = inferVolCategory(v);
                acc[cat] = acc[cat] || [];
                acc[cat].push(v);
                return acc;
              }, {} as Record<string, any[]>)) as [string, any[]][]).map(([cat, list]) => (
                <View key={cat} style={styles.carouselBlock}>
                  <View style={styles.carouselHeader}>
                    <Ionicons name="hand-left-outline" size={18} color={violetTheme.colors.primary} />
                    <Text style={styles.carouselTitle}>{cat}</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
                    {list.map((op: any) => (
                      <View key={op.id} style={styles.carouselCard}>
                        <Image source={{ uri: getImageFor(op.title || op.type || op.organization, cat) }} style={styles.carouselImage} />
                        <Text style={styles.itemTitle} numberOfLines={2}>{op.title}</Text>
                        {!!op.organization && <Text style={styles.itemOrg} numberOfLines={1}>{op.organization}</Text>}
                        <Text style={styles.itemMeta} numberOfLines={1}>{op.location}{op.duration ? ` · ${op.duration}` : ''}</Text>
                        {!!op.description && <Text style={styles.itemDesc} numberOfLines={3}>{toPlainText(op.description)}</Text>}
                        <Button variant="ghost" size="sm" style={styles.ctaBtn} onPress={() => Linking.openURL(op.applicationLink)}>
                          <Ionicons name="open-outline" size={16} color={violetTheme.colors.primary} />
                          <Text style={{ marginLeft: 6, color: violetTheme.colors.primary }}>Aplicar</Text>
                        </Button>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ))
            )}
          </CardContent>
        </Card>
      
    </ScrollView>
    <SideDrawer
      visible={menuOpen}
      onClose={() => setMenuOpen(false)}
      user={user}
      title="Menu"
      items={drawerItems}
    />
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: violetTheme.colors.background, padding: violetTheme.spacing.md },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: violetTheme.spacing.md },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: violetTheme.colors.violet200, backgroundColor: violetTheme.colors.violet50, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  tabActive: { backgroundColor: violetTheme.colors.primary, borderColor: violetTheme.colors.primary },
  tabText: { color: violetTheme.colors.primary, fontWeight: '600' },
  tabTextActive: { color: violetTheme.colors.primaryForeground },
  card: { marginBottom: violetTheme.spacing.lg },
  placeholder: { color: violetTheme.colors.muted },
  item: { borderWidth: 1, borderColor: violetTheme.colors.border, borderRadius: violetTheme.borderRadius.md, padding: violetTheme.spacing.md, marginBottom: violetTheme.spacing.md },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { fontSize: 16, fontWeight: '700', color: violetTheme.colors.foreground },
  itemType: { fontSize: 12, fontWeight: '700', color: violetTheme.colors.primary, backgroundColor: violetTheme.colors.violet50, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  itemOrg: { color: violetTheme.colors.muted, marginTop: 2 },
  itemMeta: { color: violetTheme.colors.muted, marginTop: 4, fontSize: 12 },
  itemDesc: { color: violetTheme.colors.foreground, marginVertical: 8 },
  ctaBtn: { alignSelf: 'flex-start', paddingHorizontal: 0 },
  carouselBlock: { marginBottom: 12 },
  carouselHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  carouselTitle: { color: violetTheme.colors.foreground, fontWeight: '700' },
  carousel: { paddingBottom: 6 },
  carouselCard: { width: Math.min(280, Dimensions.get('window').width * 0.72), borderWidth: 1, borderColor: violetTheme.colors.border, borderRadius: violetTheme.borderRadius.md, padding: violetTheme.spacing.sm, marginRight: violetTheme.spacing.sm, backgroundColor: violetTheme.colors.card },
  carouselImage: { width: '100%', height: 120, borderRadius: 8, marginBottom: 8 },
});

export default ExploreScreen;


