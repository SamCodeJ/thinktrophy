import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../store/authStore';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../utils/theme';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import GameScreen from '../screens/GameScreen';
import ResultScreen from '../screens/ResultScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import CategorySelectionScreen from '../screens/CategorySelectionScreen';
import GameHistoryScreen from '../screens/GameHistoryScreen';
import GameTranscriptScreen from '../screens/GameTranscriptScreen';

const Root = createNativeStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.darker }}>
        <ActivityIndicator color={colors.blue} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Root.Screen name="Main"              component={MainNavigator} />
            <Root.Screen name="CategorySelection" component={CategorySelectionScreen}
              options={{ animation: 'slide_from_bottom' }} />
            <Root.Screen name="Game"              component={GameScreen}
              options={{ animation: 'fade', gestureEnabled: false }} />
            <Root.Screen name="Result"            component={ResultScreen}
              options={{ animation: 'slide_from_bottom' }} />
            <Root.Screen name="GameHistory"       component={GameHistoryScreen}
              options={{ animation: 'slide_from_right' }} />
            <Root.Screen name="GameTranscript"    component={GameTranscriptScreen}
              options={{ animation: 'slide_from_right' }} />
          </>
        ) : (
          <>
            <Root.Screen name="Onboarding" component={OnboardingScreen} />
            <Root.Screen name="Auth"       component={AuthNavigator} />
          </>
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}
