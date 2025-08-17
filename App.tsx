import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { violetTheme } from './src/theme/colors';
import { LanguageProvider, useLanguage } from './src/context/LanguageContext';

import { OnboardingProvider } from './src/context/OnboardingContext';

import { AuthProvider } from './src/context/AuthContext';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import AssessmentGate from './src/screens/AssessmentGate';
import ResultsScreen from './src/screens/DashboardScreen';
import AccountScreen from './src/screens/AccountScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import SchoolsMapScreen from './src/screens/SchoolsMapScreen';


const Tab = createBottomTabNavigator();

const TabNavigator: React.FC = () => {
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Assessment') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Results') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'SchoolsMap') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Login') {
            iconName = focused ? 'log-in' : 'log-in-outline';
          } else if (route.name === 'Account') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          const iconSize = focused ? 28 : 26;
          return <Ionicons name={iconName} size={iconSize} color={color} />;
        },
        tabBarActiveTintColor: violetTheme.colors.primary,
        tabBarInactiveTintColor: violetTheme.colors.muted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 2,
        },
        tabBarStyle: {
          backgroundColor: violetTheme.colors.background,
          borderTopColor: violetTheme.colors.border,
          borderTopWidth: 1,
          paddingBottom: 34,
          paddingTop: 10,
          height: 88,
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: violetTheme.colors.primary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{ title: 'Explore' }}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: t('nav.home') }}
      />
      <Tab.Screen
        name="SchoolsMap"
        component={SchoolsMapScreen}
        options={{ title: 'Schools' }}
      />
    </Tab.Navigator>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <OnboardingProvider>
          <NavigationContainer>
            <StatusBar style="auto" />
            <TabNavigator />
          </NavigationContainer>
        </OnboardingProvider>
      </AuthProvider>
    </LanguageProvider>

  );
}
