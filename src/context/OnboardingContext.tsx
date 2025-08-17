import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VolunteerPlan {
  categories: string[];
  suggestedKeywords: string[];
  rationale?: string;
}

export interface CareerRecommendation {
  name: string;
  why: string;
  nextSteps: string[];
}

export interface ProfileData {
  name?: string;
  email?: string;
  education?: string;
  birthYear?: string;
  disabilities?: string[];
  sectors?: string[];
  interests?: string[];
  zonePreference?: 'local' | 'external';
}

interface OnboardingState {
  profileCompleted: boolean;
  assessmentCompleted: boolean;
  selectedMajors: string[];
  volunteerPlan?: VolunteerPlan;
  riasecTop?: string[];
  location?: string;
  recommendations?: CareerRecommendation[];
  learningPlan?: {
    track: string;
    modules: {
      title: string;
      objectives: string[];
      topics: string[];
      time_hours: number;
      resources: { title: string; url: string }[];
    }[];
  };
  profile?: ProfileData;
  riasecScores?: { R: number; I: number; A: number; S: number; E: number; C: number };
  userStrengths?: string[];
  userWeaknesses?: string[];
  userValues?: string[];
}

interface OnboardingContextType extends OnboardingState {
  setProfileCompleted: (v: boolean) => Promise<void>;
  setAssessmentCompleted: (v: boolean) => Promise<void>;
  setSelectedMajors: (majors: string[]) => Promise<void>;
  setVolunteerPlan: (plan: VolunteerPlan | undefined) => Promise<void>;
  setRiasecTop: (dims: string[] | undefined) => Promise<void>;
  setLocation: (loc: string | undefined) => Promise<void>;
  setRecommendations: (recs: CareerRecommendation[] | undefined) => Promise<void>;
  setLearningPlan: (plan: OnboardingState['learningPlan'] | undefined) => Promise<void>;
  setProfile: (data: ProfileData | undefined) => Promise<void>;
  setRiasecScores: (scores: OnboardingState['riasecScores']) => Promise<void>;
  setUserStrengths: (s: string[] | undefined) => Promise<void>;
  setUserWeaknesses: (s: string[] | undefined) => Promise<void>;
  setUserValues: (v: string[] | undefined) => Promise<void>;
}

const STORAGE_KEY = 'onboarding_state_v1';

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<OnboardingState>({
    profileCompleted: false,
    assessmentCompleted: false,
    selectedMajors: [],
    volunteerPlan: undefined,
    riasecTop: undefined,
    location: undefined,
    recommendations: undefined,
    learningPlan: undefined,
    profile: undefined,
    riasecScores: undefined,
    userStrengths: undefined,
    userWeaknesses: undefined,
    userValues: undefined,
  });

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setState(JSON.parse(raw));
      } catch {}
    })();
  }, []);

  const persist = async (next: OnboardingState) => {
    setState(next);
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const setProfileCompleted = async (v: boolean) => persist({ ...state, profileCompleted: v });
  const setAssessmentCompleted = async (v: boolean) => persist({ ...state, assessmentCompleted: v });
  const setSelectedMajors = async (majors: string[]) => persist({ ...state, selectedMajors: majors });
  const setVolunteerPlan = async (plan?: VolunteerPlan) => persist({ ...state, volunteerPlan: plan });
  const setRiasecTop = async (dims?: string[]) => persist({ ...state, riasecTop: dims });
  const setLocation = async (loc?: string) => persist({ ...state, location: loc });
  const setRecommendations = async (recs?: CareerRecommendation[]) => persist({ ...state, recommendations: recs });
  const setLearningPlan = async (plan?: OnboardingState['learningPlan']) => persist({ ...state, learningPlan: plan });
  const setProfile = async (data?: ProfileData) => persist({ ...state, profile: data });
  const setRiasecScores = async (scores?: OnboardingState['riasecScores']) => persist({ ...state, riasecScores: scores });
  const setUserStrengths = async (s?: string[]) => persist({ ...state, userStrengths: s });
  const setUserWeaknesses = async (s?: string[]) => persist({ ...state, userWeaknesses: s });
  const setUserValues = async (v?: string[]) => persist({ ...state, userValues: v });

  return (
    <OnboardingContext.Provider value={{
      ...state,
      setProfileCompleted,
      setAssessmentCompleted,
      setSelectedMajors,
      setVolunteerPlan,
      setRiasecTop,
      setLocation,
      setRecommendations,
      setLearningPlan,
      setProfile,
      setRiasecScores,
      setUserStrengths,
      setUserWeaknesses,
      setUserValues,
    }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = (): OnboardingContextType => {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
};


