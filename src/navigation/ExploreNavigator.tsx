import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ExploreScreen from '../screens/ExploreScreen';
import FormScreen from '../screens/FormScreen';
import RecommendationsScreen from '../screens/RecommendationsScreen';

const Stack = createStackNavigator();

const ExploreNavigator: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Form" component={FormScreen} options={{ title: 'Assessment' }} />
      <Stack.Screen name="Recommendations" component={RecommendationsScreen} options={{ title: 'Recommendations' }} />
      <Stack.Screen name="ExploreRoot" component={ExploreScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

export default ExploreNavigator;


