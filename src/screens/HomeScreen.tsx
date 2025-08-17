import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { violetTheme } from '../theme/colors';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useOnboarding } from '../context/OnboardingContext';
import RadarChart from '../components/learning/RadarChart';
import mcp, { extractResultsArray, normalizeVolunteerOpportunity, normalizeJobs } from '../services/mcp';
import { useNavigation } from '@react-navigation/native';
import CareerCard from '../components/discovery/CareerCard';
import SubareaChip from '../components/discovery/SubareaChip';
import FormPreview from '../components/discovery/FormPreview';
import DashboardStatCard from '../components/discovery/DashboardStatCard';

const HOST_BASE = 'https://tu-futuro-backend-production.up.railway.app';
const API_BASE = `${HOST_BASE}/api`;

function buildQuery(params?: Record<string, any>): string {
  if (!params) return '';
  const qs = Object.entries(params)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `?${qs}` : '';
}

async function getJson<T = any>(path: string, params?: Record<string, any>): Promise<T> {
  const url = `${API_BASE}${path}${buildQuery(params)}`;
  const resp = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

async function getJsonRoot<T = any>(path: string, params?: Record<string, any>): Promise<T> {
  const url = `${HOST_BASE}${path}${buildQuery(params)}`;
  const resp = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

const HomeScreen: React.FC = () => {
  const { t } = useLanguage();
  const navigation = useNavigation<any>();
  const { riasecScores, riasecTop, userStrengths, userWeaknesses, volunteerPlan, location } = useOnboarding() as any;

  const stats = [
    { label: t('home.stats.assessments'), value: '12', icon: 'document-text', color: violetTheme.colors.primary },
    { label: t('home.stats.recommendations'), value: '8', icon: 'star', color: violetTheme.colors.success },
    { label: t('home.stats.saved'), value: '15', icon: 'bookmark', color: violetTheme.colors.warning },
  ];

  const progressAreas = [
    { 
      title: 'Career Assessment', 
      progress: 75, 
      icon: 'document-text', 
      color: violetTheme.colors.primary,
      description: '3 of 4 sections completed'
    },
    { 
      title: 'Skills Development', 
      progress: 60, 
      icon: 'construct', 
      color: violetTheme.colors.success,
      description: '6 of 10 skills mastered'
    },
    { 
      title: 'Goal Achievement', 
      progress: 45, 
      icon: 'trending-up', 
      color: violetTheme.colors.warning,
      description: '2 of 5 goals reached'
    },
    { 
      title: 'Network Building', 
      progress: 30, 
      icon: 'people', 
      color: violetTheme.colors.info,
      description: '15 of 50 connections made'
    },
  ];

  // 🔹 Volunteer API state (from MCP)
  const [volunteerOpportunities, setVolunteerOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState<boolean>(false);

  // Backend data (carreras, subáreas, formulario, dashboard)
  const [careers, setCareers] = useState<string[]>([]);
  const [subareas, setSubareas] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>(["sociales","ciencias","salud","humanidades"]);
  const [selectedArea, setSelectedArea] = useState<string | undefined>(undefined);
  const [selectedCareer, setSelectedCareer] = useState<string | undefined>(undefined);
  const [selectedSubarea, setSelectedSubarea] = useState<string | undefined>(undefined);
  const [subareaDetail, setSubareaDetail] = useState<{ nombre?: string; descripcion?: string } | null>(null);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formQuestions, setFormQuestions] = useState<Array<{ id: string | number; text: string }>>([]);
  const [dashboardStats, setDashboardStats] = useState<Array<{ career: string; average: number }>>([]);
  const [loadingBackend, setLoadingBackend] = useState<boolean>(true);
  const [costStats, setCostStats] = useState<{ avg: number; min: number; max: number; count: number } | null>(null);
  const [costLoading, setCostLoading] = useState<boolean>(false);

  // Define the volunteer opportunity interface
  interface VolunteerOpportunity {
    id: number | string;
    title: string;
    organization: string;
    description: string;
    location: string;
    duration: string;
    applicationLink: string;
    image: string;
    type: string;
    requiredSkills: string[];
    benefits: string;
    financialSupport: string | null;
    applicationDeadline: string;
  }

  // Fallback data in case MCP fails
  const fallbackOpportunities: VolunteerOpportunity[] = [
    {
      id: 1,
      title: 'Community Garden Project',
      organization: 'Local Community Center',
      description: 'Help maintain and expand our community garden. We need volunteers to help with planting, watering, and harvesting. No experience necessary!',
      location: '123 Main St, Anytown, USA',
      duration: 'Ongoing (1-2 hours per week)',
      applicationLink: 'https://example.com/apply',
      image: 'https://via.placeholder.com/150',
      type: 'Community Service',
      requiredSkills: ['Teamwork', 'Patience', 'Physical Activity'],
      benefits: 'Free gardening supplies, community bonding, and the satisfaction of growing fresh produce.',
      financialSupport: 'No financial compensation',
      applicationDeadline: 'June 30, 2023',
    },
    {
      id: 2,
      title: 'Eco-Friendly Cleanup Event',
      organization: 'Environmental Association',
      description: 'Join us for a day of cleaning up local parks and waterways. We need volunteers to help remove litter and debris.',
      location: 'Central Park, Anytown, USA',
      duration: 'Full Day (8 AM - 4 PM)',
      applicationLink: 'https://example.com/apply',
      image: 'https://via.placeholder.com/150',
      type: 'Environmental',
      requiredSkills: ['Physical Activity', 'Attention to Detail'],
      benefits: 'Free lunch, t-shirt, and recognition for your efforts.',
      financialSupport: 'No financial compensation',
      applicationDeadline: 'July 15, 2023',
    },
    {
      id: 3,
      title: 'Digital Literacy Workshop',
      organization: 'Tech for All',
      description: 'Teach seniors in your community how to use smartphones and the internet. No tech experience required.',
      location: 'Senior Center, Anytown, USA',
      duration: '2 Hours (10 AM - 12 PM)',
      applicationLink: 'https://example.com/apply',
      image: 'https://via.placeholder.com/150',
      type: 'Education',
      requiredSkills: ['Patience', 'Communication Skills'],
      benefits: 'Free coffee and snacks, certificate of completion.',
      financialSupport: 'No financial compensation',
      applicationDeadline: 'August 1, 2023',
    },
    {
      id: 4,
      title: 'Hospital Patient Support',
      organization: 'City General Hospital',
      description: 'Provide companionship and support to patients. Help with reading, conversation, and basic comfort care.',
      location: 'City General Hospital, Downtown',
      duration: '3-4 hours per week',
      applicationLink: 'https://example.com/apply',
      image: 'https://via.placeholder.com/150',
      type: 'Healthcare',
      requiredSkills: ['Empathy', 'Communication', 'Reliability'],
      benefits: 'Healthcare experience, patient interaction skills, certificate of service.',
      financialSupport: 'No financial compensation',
      applicationDeadline: 'Ongoing',
    },
    {
      id: 5,
      title: 'Animal Shelter Care',
      organization: 'Paws & Hearts Rescue',
      description: 'Help care for rescued animals. Duties include feeding, walking dogs, cleaning kennels, and socializing animals.',
      location: 'Paws & Hearts Rescue Center',
      duration: '2-3 hours per week',
      applicationLink: 'https://example.com/apply',
      image: 'https://via.placeholder.com/150',
      type: 'Animal Welfare',
      requiredSkills: ['Love for Animals', 'Physical Stamina', 'Patience'],
      benefits: 'Animal care experience, training in animal handling, emotional fulfillment.',
      financialSupport: 'No financial compensation',
      applicationDeadline: 'Ongoing',
    },
    {
      id: 6,
      title: 'Youth Mentoring Program',
      organization: 'Big Brothers Big Sisters',
      description: 'Mentor a young person in your community. Share your life experiences and help guide them toward success.',
      location: 'Various locations in the city',
      duration: '2-4 hours per month',
      applicationLink: 'https://example.com/apply',
      image: 'https://via.placeholder.com/150',
      type: 'Youth Development',
      requiredSkills: ['Leadership', 'Communication', 'Commitment'],
      benefits: 'Leadership development, community impact, personal growth.',
      financialSupport: 'No financial compensation',
      applicationDeadline: 'Ongoing',
    },
    {
      id: 7,
      title: 'Food Bank Distribution',
      organization: 'Community Food Bank',
      description: 'Help sort, pack, and distribute food to families in need. Assist with food drives and community outreach.',
      location: 'Community Food Bank Warehouse',
      duration: '3-5 hours per week',
      applicationLink: 'https://example.com/apply',
      image: 'https://via.placeholder.com/150',
      type: 'Social Services',
      requiredSkills: ['Organization', 'Teamwork', 'Physical Activity'],
      benefits: 'Community service experience, food safety training, networking opportunities.',
      financialSupport: 'No financial compensation',
      applicationDeadline: 'Ongoing',
    },
    {
      id: 8,
      title: 'Library Reading Program',
      organization: 'Public Library System',
      description: 'Read to children, help with literacy programs, and assist with library events and activities.',
      location: 'Various library branches',
      duration: '2-3 hours per week',
      applicationLink: 'https://example.com/apply',
      image: 'https://via.placeholder.com/150',
      type: 'Education & Literacy',
      requiredSkills: ['Reading Skills', 'Patience with Children', 'Creativity'],
      benefits: 'Teaching experience, literacy program training, community engagement.',
      financialSupport: 'No financial compensation',
      applicationDeadline: 'Ongoing',
    }
  ];

  useEffect(() => {
    const fetchFromMcp = async () => {
      try {
        // Prefer localized opportunities for MX with personalized filters
        const filters: any = { location: 'cdmx' };
        if (volunteerPlan?.categories?.length) filters.career = volunteerPlan.categories;
        if (volunteerPlan?.suggestedKeywords?.length) filters.keywords = volunteerPlan.suggestedKeywords;
        const mx = await mcp.volunteer.mxSearch({ filters });
        const items = extractResultsArray(mx);

        const normalized = items.slice(0, 8).map((item: any, index: number) => normalizeVolunteerOpportunity(item, index));

        if (normalized.length > 0) {
          setVolunteerOpportunities(normalized);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.log('MCP volunteer.mx_search failed, using fallback:', err);
      }

      // Fallback
      setVolunteerOpportunities(fallbackOpportunities);
      setLoading(false);
    };

    fetchFromMcp();
  }, [volunteerPlan]);

  // Jobs preview (small list)
  useEffect(() => {
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
        const resp = await mcp.jobs.search({ query, location: location || 'CDMX', career: volunteerPlan?.categories?.[0] || undefined, topK: 6 });
        let { items } = normalizeJobs(resp);
        setJobs(items.slice(0, 4));
      } catch {
        setJobs([]);
      } finally {
        setJobsLoading(false);
      }
    };
    loadJobs();
  }, [riasecTop, volunteerPlan?.suggestedKeywords, location]);

  // Cost stats for selected career using root endpoint /escuelas?carrera=...
  useEffect(() => {
    let cancelled = false;
    const loadCosts = async () => {
      if (!selectedCareer) { setCostStats(null); return; }
      try {
        setCostLoading(true);
        const resp = await getJsonRoot('/escuelas', { carrera: selectedCareer });
        if (cancelled) return;
        const arr = Array.isArray(resp?.results) ? resp.results : Array.isArray(resp) ? resp : [];
        const costs = arr.map((s: any) => Number(s?.costo)).filter((n: number) => Number.isFinite(n) && n > 0);
        if (costs.length === 0) { setCostStats(null); return; }
        const sum = costs.reduce((a: number, b: number) => a + b, 0);
        const avg = Math.round(sum / costs.length);
        const min = Math.min(...costs);
        const max = Math.max(...costs);
        setCostStats({ avg, min, max, count: costs.length });
      } catch {
        setCostStats(null);
      } finally {
        if (!cancelled) setCostLoading(false);
      }
    };
    loadCosts();
    return () => { cancelled = true; };
  }, [selectedCareer]);

  // When a career is selected manually, reload subareas and the form for that career
  useEffect(() => {
    let cancelled = false;
    const loadForCareer = async () => {
      try {
        if (!selectedCareer) {
          setSubareas([]);
          setSelectedSubarea(undefined);
          setFormTitle('');
          setFormQuestions([]);
          return;
        }
        const subareasResp = await getJsonRoot('/subareas', { carrera: selectedCareer });
        if (cancelled) return;
        const subs = normalizeSubareas(subareasResp).slice(0, 16);
        setSubareas(subs);
        const subChoice = subs[0];
        setSelectedSubarea(subChoice);
        if (subChoice) {
          const formResp = await getJsonRoot('/formulario', { subarea: subChoice });
          if (cancelled) return;
          const form = normalizeForm(formResp);
          setFormTitle(form.title);
          setFormQuestions(form.questions);
          try {
            const detailResp = await getJsonRoot('/subarea', { nombre: subChoice });
            if (!cancelled) setSubareaDetail({ nombre: detailResp?.nombre || subChoice, descripcion: detailResp?.descripcion || detailResp?.description || '' });
          } catch {
            if (!cancelled) setSubareaDetail(null);
          }
        } else {
          setFormTitle('');
          setFormQuestions([]);
          setSubareaDetail(null);
        }
      } catch {
        if (!cancelled) {
          setSubareas([]);
          setSelectedSubarea(undefined);
          setFormTitle('');
          setFormQuestions([]);
          setSubareaDetail(null);
        }
      }
    };
    loadForCareer();
    return () => { cancelled = true; };
  }, [selectedCareer]);

  // When tapping a subarea manually, update form and detail
  useEffect(() => {
    let cancelled = false;
    const loadForSubarea = async () => {
      try {
        if (!selectedSubarea) { setFormTitle(''); setFormQuestions([]); setSubareaDetail(null); return; }
        const formResp = await getJsonRoot('/formulario', { subarea: selectedSubarea });
        if (cancelled) return;
        const form = normalizeForm(formResp);
        setFormTitle(form.title);
        setFormQuestions(form.questions);
        try {
          const detailResp = await getJsonRoot('/subarea', { nombre: selectedSubarea });
          if (!cancelled) setSubareaDetail({ nombre: detailResp?.nombre || selectedSubarea, descripcion: detailResp?.descripcion || detailResp?.description || '' });
        } catch { if (!cancelled) setSubareaDetail(null); }
      } catch {
        if (!cancelled) { setFormTitle(''); setFormQuestions([]); setSubareaDetail(null); }
      }
    };
    loadForSubarea();
    return () => { cancelled = true; };
  }, [selectedSubarea]);

  // Normalize helpers for backend responses
  function normalizeCareers(payload: any): string[] {
    if (!payload) return [];
    // Wrapped arrays: { results: [...] } | { data: [...] } | { items: [...] } | { carreras: [...] }
    const unwrapped = Array.isArray(payload?.results)
      ? payload.results
      : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.carreras)
      ? payload.carreras
      : undefined;
    if (Array.isArray(unwrapped)) payload = unwrapped;
    if (Array.isArray(payload)) {
      return payload
        .map((c: any) => (typeof c === 'string' ? c : c?.name || c?.nombre))
        .filter(Boolean);
    }
    if (typeof payload === 'object') {
      const all: string[] = [];
      for (const key of Object.keys(payload)) {
        const arr = Array.isArray(payload[key]) ? payload[key] : [];
        for (const c of arr) {
          const name = typeof c === 'string' ? c : c?.name || c?.nombre;
          if (name) all.push(name);
        }
      }
      return all;
    }
    return [];
  }

  function normalizeSubareas(payload: any): string[] {
    if (!payload) return [];
    const unwrapped = Array.isArray(payload?.results)
      ? payload.results
      : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.subareas)
      ? payload.subareas
      : undefined;
    if (Array.isArray(unwrapped)) payload = unwrapped;
    if (Array.isArray(payload)) {
      return payload.map((s: any) => (typeof s === 'string' ? s : s?.name || s?.nombre)).filter(Boolean);
    }
    if (typeof payload === 'object') {
      const all: string[] = [];
      for (const key of Object.keys(payload)) {
        const arr = Array.isArray(payload[key]) ? payload[key] : [];
        for (const s of arr) {
          const name = typeof s === 'string' ? s : s?.name || s?.nombre;
          if (name) all.push(name);
        }
      }
      return all;
    }
    return [];
  }

  function normalizeForm(payload: any): { title: string; questions: Array<{ id: string | number; text: string }> } {
    const title = payload?.title || payload?.titulo || 'Formulario';
    const wrapped = Array.isArray(payload?.questions)
      ? payload?.questions
      : Array.isArray(payload?.preguntas)
      ? payload?.preguntas
      : Array.isArray(payload?.items)
      ? payload?.items
      : Array.isArray(payload?.result)
      ? payload?.result
      : undefined;
    const candidates = wrapped || [];
    const questions = Array.isArray(candidates)
      ? candidates
          .map((q: any, idx: number) => ({
            id: q?.id ?? idx,
            text: q?.text || q?.texto || q?.label || q?.pregunta || q?.name || 'Pregunta',
          }))
          .filter((q: any) => typeof q.text === 'string' && q.text.trim().length > 0)
      : [];
    return { title, questions };
  }

  function normalizeDashboard(payload: any): Array<{ career: string; average: number }> {
    if (!payload) return [];
    const list: Array<{ career: string; average: number }> = [];
    const push = (career: any, avg: any) => {
      const name = typeof career === 'string' ? career : career?.name || career?.carrera || '';
      const num = Number(avg?.promedio ?? avg?.average ?? avg ?? 0);
      if (name && Number.isFinite(num)) list.push({ career: name, average: num });
    };
    const unwrapped = Array.isArray(payload?.results)
      ? payload.results
      : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.items)
      ? payload.items
      : undefined;
    const src = Array.isArray(unwrapped) ? unwrapped : payload;
    if (Array.isArray(src)) {
      for (const item of src) push(item?.career || item?.carrera, item?.average ?? item?.promedio);
      return list;
    }
    if (typeof src === 'object') {
      for (const key of Object.keys(src)) push(key, (src as any)[key]);
      return list;
    }
    return [];
  }

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoadingBackend(true);
        // 1) Carreras (sin prefijo /api); si hay área seleccionada, filtramos por área
        const carrerasResp = await (selectedArea
          ? getJsonRoot('/carreras', { area: selectedArea })
          : getJsonRoot('/carreras'));
        if (cancelled) return;
        const careersList = normalizeCareers(carrerasResp);
        setCareers(careersList);
        const careerChoice = careersList[0];
        setSelectedCareer(careerChoice);

        // 2) Subáreas por carrera
        if (careerChoice) {
          const subareasResp = await getJsonRoot('/subareas', { carrera: careerChoice });
          if (cancelled) return;
          const subs = normalizeSubareas(subareasResp).slice(0, 16);
          setSubareas(subs);
          const subChoice = subs[0];
          setSelectedSubarea(subChoice);

          // 3) Formulario por subárea
          if (subChoice) {
            const formResp = await getJsonRoot('/formulario', { subarea: subChoice });
            if (cancelled) return;
            const form = normalizeForm(formResp);
            setFormTitle(form.title);
            setFormQuestions(form.questions);
          }
        }

        // 4) Dashboard promedio por carrera
        const dashResp = await getJsonRoot('/dashboard/formularios/promedio-por-carrera');
        if (cancelled) return;
        setDashboardStats(normalizeDashboard(dashResp).slice(0, 10));
      } catch (e) {
        // Non-fatal; sections just won't render data
      } finally {
        if (!cancelled) setLoadingBackend(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedArea]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* RIASEC Summary */}
          {riasecScores && (
            <Card style={styles.quickActionsCard}>
              <CardHeader>
                <CardTitle>Your Profile Summary</CardTitle>
                <CardDescription>Top areas and your RIASEC radar</CardDescription>
              </CardHeader>
              <CardContent>
                <View style={{ alignItems: 'center', marginBottom: 12 }}>
                  <RadarChart scores={riasecScores} />
                </View>
                <View style={{ marginBottom: 8 }}>
                  <Text style={{ fontWeight: '700', color: violetTheme.colors.foreground }}>Top áreas/carreras:</Text>
                  <Text style={{ color: violetTheme.colors.foreground }}>{(riasecTop||[]).slice(0,3).join(', ') || '—'}</Text>
                </View>
                <View style={{ marginBottom: 8 }}>
                  <Text style={{ fontWeight: '700', color: violetTheme.colors.foreground }}>Fortalezas:</Text>
                  <Text style={{ color: violetTheme.colors.foreground }}>{(userStrengths||[]).join(', ') || '—'}</Text>
                </View>
                <View>
                  <Text style={{ fontWeight: '700', color: violetTheme.colors.foreground }}>Áreas a reforzar:</Text>
                  <Text style={{ color: violetTheme.colors.foreground }}>{(userWeaknesses||[]).join(', ') || '—'}</Text>
                </View>
              </CardContent>
            </Card>
          )}
          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statsHeader}>
              <Text style={styles.statsTitle}>{t('home.stats.title')}</Text>
              <LanguageSwitcher />
            </View>
            <View style={styles.statsGrid}>
              {stats.map((stat, index) => (
                <View key={index} style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                    <Ionicons name={stat.icon as any} size={24} color={stat.color} />
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

        {/* Progress Areas */}
        <Card style={styles.quickActionsCard}>
          <CardHeader>
            <CardTitle>Your Progress Areas</CardTitle>
            <CardDescription>Track your development in key areas</CardDescription>
          </CardHeader>
          <CardContent>
            <View style={styles.quickActionsGrid}>
              {progressAreas.map((area, index) => (
                <View key={index} style={styles.quickActionItem}>
                  <View style={[styles.quickActionIcon, { backgroundColor: area.color + '20' }]}>
                    <Ionicons name={area.icon as any} size={24} color={area.color} />
                  </View>
                  <Text style={styles.quickActionTitle}>{area.title}</Text>
                  <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: `${area.progress}%`, backgroundColor: area.color }]} />
                  </View>
                  <Text style={styles.progressDescription}>{area.description}</Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* Áreas y Carreras */}
        <Card style={styles.sectionCard}>
          <CardHeader>
            <CardTitle>Carreras</CardTitle>
            <CardDescription>Explora algunas opciones</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Areas chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {[undefined, ...areas].map((a, idx) => (
                <View
                  key={String(a ?? 'todas') + idx}
                  style={[styles.areaChip, (a ?? '') === (selectedArea ?? '') && styles.areaChipActive]}
                >
                  <Text onPress={() => setSelectedArea(a)} style={[styles.areaChipText, (a ?? '') === (selectedArea ?? '') && styles.areaChipTextActive]}>
                    {(a || 'todas')}
                  </Text>
                </View>
              ))}
            </ScrollView>
            {loadingBackend && careers.length === 0 ? (
              <ActivityIndicator size="small" color={violetTheme.colors.primary} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {careers.map((c) => (
                  <CareerCard key={c} name={c} selected={c===selectedCareer} onPress={() => setSelectedCareer(c)} />
                ))}
              </ScrollView>
            )}
            <Button
              variant="default"
              size="sm"
              style={{ marginTop: 8 }}
              onPress={() => navigation.navigate('Schools', { carrera: selectedCareer || careers[0] })}
              disabled={(selectedCareer || careers[0]) ? false : true}
            >
              Ver en mapa
            </Button>
          </CardContent>
        </Card>

        {/* Oportunidades (preview) */}
        <Card style={styles.sectionCard}>
          <CardHeader>
            <CardTitle>Oportunidades</CardTitle>
            <CardDescription>Alineadas a tu perfil</CardDescription>
          </CardHeader>
          <CardContent>
            {jobsLoading ? (
              <ActivityIndicator size="small" color={violetTheme.colors.primary} />
            ) : (
              <View style={{ maxHeight: 320 }}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {jobs.map((job: any, idx: number) => (
                    <View key={idx} style={styles.jobItem}>
                      <Text style={styles.jobTitle} numberOfLines={2}>{job.title}</Text>
                      {!!job.org && <Text style={styles.jobMeta} numberOfLines={1}>{job.org}</Text>}
                      {!!job.location && <Text style={styles.jobMeta} numberOfLines={1}>{job.location}</Text>}
                      {!!job.snippet && <Text style={styles.jobSnippet} numberOfLines={3}>{job.snippet}</Text>}
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
            <Button variant="default" size="sm" style={{ marginTop: 8 }} onPress={() => navigation.navigate('Explore')}>
              Ver más
            </Button>
          </CardContent>
        </Card>

        {/* Subáreas */}
        {selectedCareer && subareas.length > 0 && (
          <Card style={styles.sectionCard}>
            <CardHeader>
              <CardTitle>Subáreas</CardTitle>
              <CardDescription>{selectedArea ? `${selectedArea} · ${selectedCareer}` : selectedCareer}</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {subareas.map((s) => (
                  <SubareaChip key={s} name={s} selected={s===selectedSubarea} onPress={() => setSelectedSubarea(s)} />
                ))}
              </ScrollView>
              {subareaDetail && (
                <View style={{ marginTop: 12 }}>
                  <Text style={{ fontWeight: '700', color: violetTheme.colors.foreground }}>{subareaDetail.nombre}</Text>
                  {!!subareaDetail.descripcion && (
                    <Text style={{ color: violetTheme.colors.muted, marginTop: 4 }} numberOfLines={4}>{subareaDetail.descripcion}</Text>
                  )}
                </View>
              )}
            </CardContent>
          </Card>
        )}

        {/* Costo por escuela (estimado) */}
        {selectedCareer && (
          <Card style={styles.sectionCard}>
            <CardHeader>
              <CardTitle>Costos por escuela</CardTitle>
              <CardDescription>{selectedCareer}</CardDescription>
            </CardHeader>
            <CardContent>
              {costLoading ? (
                <ActivityIndicator size="small" color={violetTheme.colors.primary} />
              ) : costStats ? (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={styles.costPill}><Text style={styles.costPillLabel}>Promedio</Text><Text style={styles.costPillValue}>{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(costStats.avg)}</Text></View>
                  <View style={styles.costPill}><Text style={styles.costPillLabel}>Mín</Text><Text style={styles.costPillValue}>{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(costStats.min)}</Text></View>
                  <View style={styles.costPill}><Text style={styles.costPillLabel}>Máx</Text><Text style={styles.costPillValue}>{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(costStats.max)}</Text></View>
                </View>
              ) : (
                <Text style={{ color: violetTheme.colors.muted }}>Sin datos de costos</Text>
              )}
            </CardContent>
          </Card>
        )}

        {/* Formulario por subárea */}
        {formQuestions.length > 0 && (
          <Card style={styles.sectionCard}>
            <CardHeader>
              <CardTitle>Formulario</CardTitle>
              <CardDescription>{selectedSubarea || ''}</CardDescription>
            </CardHeader>
            <CardContent>
              <FormPreview title={formTitle || 'Formulario'} questions={formQuestions} />
            </CardContent>
          </Card>
        )}

        {/* Dashboard promedio por carrera */}
        {dashboardStats.length > 0 && (
          <Card style={styles.sectionCard}>
            <CardHeader>
              <CardTitle>Dashboard</CardTitle>
              <CardDescription>Promedio por carrera</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {dashboardStats.map((d) => (
                  <DashboardStatCard key={d.career} career={d.career} average={d.average} />
                ))}
              </ScrollView>
            </CardContent>
          </Card>
        )}

        {/* Volunteer Opportunities (preview) */}
        <Card style={styles.sectionCard}>
          <CardHeader>
            <CardTitle>{t('home.volunteer.title')}</CardTitle>
            <CardDescription>{t('home.volunteer.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ActivityIndicator size="small" color={violetTheme.colors.primary} />
            ) : (
              <View style={{ maxHeight: 360 }}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {volunteerOpportunities.map((opportunity) => (
                    <View key={opportunity.id} style={styles.opportunityItem}>
                      <View style={styles.opportunityHeader}>
                        <View style={styles.opportunityImageContainer}>
                          <Image 
                            source={{ uri: opportunity.image }} 
                            style={styles.opportunityImage}
                            resizeMode="cover"
                          />
                        </View>
                        <View style={styles.opportunityInfo}>
                          <Text style={styles.opportunityTitle}>{opportunity.title}</Text>
                          <Text style={styles.organizationName}>{opportunity.organization}</Text>
                          <View style={styles.opportunityMeta}>
                            <View style={styles.metaItem}>
                              <Ionicons name="location" size={14} color={violetTheme.colors.muted} />
                              <Text style={styles.metaText}>{opportunity.location}</Text>
                            </View>
                            <View style={styles.metaItem}>
                              <Ionicons name="time" size={14} color={violetTheme.colors.muted} />
                              <Text style={styles.metaText}>{opportunity.duration}</Text>
                            </View>
                          </View>
                        </View>
                        <View style={styles.opportunityType}>
                          <Text style={styles.typeText}>{opportunity.type}</Text>
                        </View>
                      </View>
                      <Text style={styles.opportunityDescription}>{opportunity.description}</Text>
                      <View style={styles.skillsContainer}>
                        {opportunity.requiredSkills.map((skill: string, index: number) => (
                          <View key={index} style={styles.skillTag}>
                            <Text style={styles.skillText}>{skill}</Text>
                          </View>
                        ))}
                      </View>
                      <Button
                        variant="default"
                        size="sm"
                        style={styles.applyButton}
                        onPress={() => Linking.openURL(opportunity.applicationLink)}
                      >
                        <Ionicons name="open-outline" size={16} color={violetTheme.colors.primaryForeground} />
                        <Text style={styles.applyButtonText}>{t('home.volunteer.apply')}</Text>
                      </Button>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
            <Button variant="default" size="sm" style={{ marginTop: 8 }} onPress={() => navigation.navigate('Explore')}>
              Ver más
            </Button>
          </CardContent>
        </Card>
      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: violetTheme.colors.background,
  },
  scrollView: {
    flex: 1,
    padding: violetTheme.spacing.md,
  },
  statsContainer: {
    marginBottom: violetTheme.spacing.lg,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: violetTheme.spacing.md,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: violetTheme.colors.foreground,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: violetTheme.colors.card,
    padding: violetTheme.spacing.md,
    borderRadius: violetTheme.borderRadius.md,
    marginHorizontal: 2,
    elevation: 2,
    shadowColor: violetTheme.colors.foreground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: violetTheme.spacing.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: violetTheme.colors.foreground,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: violetTheme.colors.muted,
    textAlign: 'center',
  },
  quickActionsCard: {
    marginBottom: violetTheme.spacing.lg,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    width: '48%',
    backgroundColor: violetTheme.colors.card,
    borderRadius: violetTheme.borderRadius.md,
    padding: violetTheme.spacing.md,
    marginBottom: violetTheme.spacing.md,
    borderWidth: 1,
    borderColor: violetTheme.colors.border,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: violetTheme.spacing.sm,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: violetTheme.colors.foreground,
    textAlign: 'center',
    marginBottom: violetTheme.spacing.sm,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: violetTheme.colors.violet100,
    borderRadius: 4,
    marginTop: violetTheme.spacing.xs,
    marginBottom: violetTheme.spacing.sm,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressDescription: {
    fontSize: 11,
    color: violetTheme.colors.muted,
    textAlign: 'center',
    lineHeight: 14,
  },
  volunteerCard: {
    marginBottom: violetTheme.spacing.lg,
  },
  opportunityItem: {
    backgroundColor: violetTheme.colors.card,
    borderRadius: violetTheme.spacing.md,
    padding: violetTheme.spacing.md,
    marginBottom: violetTheme.spacing.md,
    borderWidth: 1,
    borderColor: violetTheme.colors.border,
  },
  opportunityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: violetTheme.spacing.sm,
  },
  opportunityImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginRight: violetTheme.spacing.md,
  },
  opportunityImage: {
    width: '100%',
    height: '100%',
  },
  opportunityInfo: {
    flex: 1,
  },
  opportunityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: violetTheme.colors.foreground,
    marginBottom: violetTheme.spacing.xs,
  },
  organizationName: {
    fontSize: 14,
    color: violetTheme.colors.muted,
    marginBottom: violetTheme.spacing.xs,
  },
  opportunityMeta: {
    flexDirection: 'row',
    marginTop: violetTheme.spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: violetTheme.spacing.sm,
  },
  metaText: {
    fontSize: 12,
    color: violetTheme.colors.muted,
  },
  opportunityType: {
    backgroundColor: violetTheme.colors.violet50,
    borderRadius: violetTheme.spacing.sm,
    paddingVertical: violetTheme.spacing.xs,
    paddingHorizontal: violetTheme.spacing.sm,
    alignSelf: 'flex-start',
  },
  typeText: {
    fontSize: 12,
    color: violetTheme.colors.primary,
    fontWeight: 'bold',
  },
  opportunityDescription: {
    fontSize: 14,
    color: violetTheme.colors.foreground,
    marginBottom: violetTheme.spacing.sm,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: violetTheme.spacing.sm,
  },
  skillTag: {
    backgroundColor: violetTheme.colors.violet100,
    borderRadius: violetTheme.spacing.xs,
    paddingVertical: violetTheme.spacing.xs,
    paddingHorizontal: violetTheme.spacing.sm,
    marginRight: violetTheme.spacing.xs,
    marginBottom: violetTheme.spacing.xs,
  },
  skillText: {
    fontSize: 12,
    color: violetTheme.colors.primary,
    fontWeight: 'bold',
  },
  benefitsContainer: {
    marginBottom: violetTheme.spacing.sm,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: violetTheme.colors.foreground,
    marginBottom: violetTheme.spacing.xs,
  },
  benefitsText: {
    fontSize: 14,
    color: violetTheme.colors.foreground,
  },
  financialContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: violetTheme.spacing.sm,
  },
  financialText: {
    fontSize: 14,
    color: violetTheme.colors.success,
    marginLeft: violetTheme.spacing.xs,
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: violetTheme.spacing.sm,
  },
  deadlineText: {
    fontSize: 14,
    color: violetTheme.colors.warning,
    marginLeft: violetTheme.spacing.xs,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: violetTheme.colors.violet100,
    borderRadius: violetTheme.spacing.md,
    paddingVertical: violetTheme.spacing.sm,
  },
  applyButtonText: {
    marginLeft: violetTheme.spacing.xs,
    color: violetTheme.colors.primary,
    fontWeight: 'bold',
  },
  sectionCard: {
    marginBottom: violetTheme.spacing.lg,
  },
  areaChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: violetTheme.colors.violet200,
    backgroundColor: violetTheme.colors.violet50,
    marginRight: 8,
  },
  areaChipActive: {
    backgroundColor: violetTheme.colors.primary,
    borderColor: violetTheme.colors.primary,
  },
  areaChipText: {
    color: violetTheme.colors.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  areaChipTextActive: {
    color: violetTheme.colors.primaryForeground,
  },
  jobItem: {
    borderWidth: 1,
    borderColor: violetTheme.colors.border,
    borderRadius: violetTheme.borderRadius.md,
    padding: violetTheme.spacing.md,
    marginBottom: violetTheme.spacing.sm,
    backgroundColor: violetTheme.colors.card,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: violetTheme.colors.foreground,
  },
  jobMeta: {
    color: violetTheme.colors.muted,
    marginTop: 2,
    fontSize: 12,
  },
  jobSnippet: {
    color: violetTheme.colors.foreground,
    marginTop: 6,
    fontSize: 13,
  },
  costPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: violetTheme.colors.violet50,
    borderWidth: 1,
    borderColor: violetTheme.colors.border,
    minWidth: 100,
    alignItems: 'center',
  },
  costPillLabel: {
    color: violetTheme.colors.muted,
    fontSize: 12,
    marginBottom: 2,
  },
  costPillValue: {
    color: violetTheme.colors.foreground,
    fontWeight: '700',
  },
});

export default HomeScreen;