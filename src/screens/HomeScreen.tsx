import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Linking,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { violetTheme } from '../theme/colors';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useOnboarding } from '../context/OnboardingContext';
import RadarChart from '../components/learning/RadarChart';
import mcp, { extractResultsArray, normalizeVolunteerOpportunity } from '../services/mcp';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

const HomeScreen: React.FC = () => {
  const { t } = useLanguage();
  const { riasecScores, riasecTop, userStrengths, userWeaknesses, volunteerPlan } = useOnboarding() as any;

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
  const navigation = useNavigation<any>();
  const { user, signOut } = useAuth();

  // Hamburger side menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const menuWidth = Math.min(300, Math.floor(Dimensions.get('window').width * 0.8));
  const translateX = useRef(new Animated.Value(menuWidth)).current;

  const openMenu = () => {
    setMenuOpen(true);
    Animated.timing(translateX, { toValue: 0, duration: 220, useNativeDriver: true }).start();
  };
  const closeMenu = () => {
    Animated.timing(translateX, { toValue: menuWidth, duration: 200, useNativeDriver: true }).start(() => setMenuOpen(false));
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={openMenu} accessibilityLabel="Open menu" style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
          <Ionicons name="menu" size={22} color={violetTheme.colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

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

        {/* Volunteer Opportunities */}
        <Card style={styles.volunteerCard}>
          <CardHeader>
            <CardTitle>{t('home.volunteer.title')}</CardTitle>
            <CardDescription>{t('home.volunteer.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ActivityIndicator size="large" color={violetTheme.colors.primary} />
            ) : (
              volunteerOpportunities.map((opportunity) => (
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
                  
                  <View style={styles.benefitsContainer}>
                    <Text style={styles.benefitsTitle}>Benefits:</Text>
                    <Text style={styles.benefitsText}>{opportunity.benefits}</Text>
                  </View>
                  
                  {opportunity.financialSupport && (
                    <View style={styles.financialContainer}>
                      <Ionicons name="cash" size={16} color={violetTheme.colors.success} />
                      <Text style={styles.financialText}>{opportunity.financialSupport}</Text>
                    </View>
                  )}
                  
                  <View style={styles.deadlineContainer}>
                    <Ionicons name="calendar" size={16} color={violetTheme.colors.warning} />
                    <Text style={styles.deadlineText}>Apply by: {opportunity.applicationDeadline}</Text>
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
              ))
            )}
          </CardContent>
        </Card>
      </ScrollView>

      {/* Side Drawer Overlay */}
      {menuOpen && (
        <TouchableOpacity activeOpacity={1} onPress={closeMenu} style={styles.menuBackdrop}>
          <View />
        </TouchableOpacity>
      )}
      <Animated.View style={[styles.sideMenu, { width: menuWidth, transform: [{ translateX }] }]}>
        <View style={styles.sideMenuHeader}>
          <Text style={styles.sideMenuTitle}>Menu</Text>
          <TouchableOpacity onPress={closeMenu} accessibilityLabel="Close menu">
            <Ionicons name="close" size={20} color={violetTheme.colors.muted} />
          </TouchableOpacity>
        </View>
        <View style={styles.sideMenuUserRow}>
          <Ionicons name="person-circle" size={28} color={violetTheme.colors.primary} />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.sideMenuUserName}>{user?.name || 'Guest'}</Text>
            <Text style={styles.sideMenuUserEmail}>{user?.email || 'Not signed in'}</Text>
          </View>
        </View>
        <View style={styles.sideMenuDivider} />
        {/* Dynamic links */}
        <TouchableOpacity style={styles.sideMenuItem} onPress={() => { closeMenu(); navigation.navigate('Explore'); }}>
          <Ionicons name="compass-outline" size={18} color={violetTheme.colors.foreground} />
          <Text style={styles.sideMenuItemText}>Explore</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sideMenuItem} onPress={() => { closeMenu(); navigation.navigate('SchoolsMap'); }}>
          <Ionicons name="school-outline" size={18} color={violetTheme.colors.foreground} />
          <Text style={styles.sideMenuItemText}>Schools Map</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sideMenuItem} onPress={() => { closeMenu(); navigation.navigate('Assessment'); }}>
          <Ionicons name="podium-outline" size={18} color={violetTheme.colors.foreground} />
          <Text style={styles.sideMenuItemText}>{riasecScores ? 'Retake Assessment' : 'Start Assessment'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sideMenuItem} onPress={() => { closeMenu(); navigation.navigate('Account'); }}>
          <Ionicons name="person-outline" size={18} color={violetTheme.colors.foreground} />
          <Text style={styles.sideMenuItemText}>Account</Text>
        </TouchableOpacity>
        <View style={styles.sideMenuDivider} />
        {user ? (
          <TouchableOpacity style={styles.sideMenuItem} onPress={async () => { closeMenu(); await signOut(); }}>
            <Ionicons name="log-out-outline" size={18} color={violetTheme.colors.danger} />
            <Text style={[styles.sideMenuItemText, { color: violetTheme.colors.danger }]}>Sign Out</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.sideMenuItem} onPress={() => { closeMenu(); navigation.navigate('Login'); }}>
            <Ionicons name="log-in-outline" size={18} color={violetTheme.colors.primary} />
            <Text style={[styles.sideMenuItemText, { color: violetTheme.colors.primary }]}>Sign In</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
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
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 15,
  },
  sideMenu: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: violetTheme.colors.background,
    borderRightWidth: 1,
    borderRightColor: violetTheme.colors.border,
    paddingTop: 16,
    paddingHorizontal: 14,
    zIndex: 30,
  },
  sideMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sideMenuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: violetTheme.colors.foreground,
  },
  sideMenuUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sideMenuUserName: {
    fontWeight: '600',
    color: violetTheme.colors.foreground,
  },
  sideMenuUserEmail: {
    color: violetTheme.colors.muted,
    fontSize: 12,
  },
  sideMenuDivider: {
    height: 1,
    backgroundColor: violetTheme.colors.border,
    marginVertical: 10,
  },
  sideMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  sideMenuItemText: {
    fontSize: 14,
    color: violetTheme.colors.foreground,
    fontWeight: '600',
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
});

export default HomeScreen;