import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../utils/theme';

import HomeScreen        from '../screens/HomeScreen';
import WalletScreen      from '../screens/WalletScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import ProfileScreen     from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

function TabIcon({ emoji, focused }) {
  return (
    <View style={{
      width: 40, height: 40, borderRadius: 12,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: focused ? `${colors.blue}22` : 'transparent',
    }}>
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
    </View>
  );
}

export default function MainNavigator() {
  const insets = useSafeAreaInsets();
  const TAB_HEIGHT = 60;
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.dark,
          borderTopColor: 'rgba(255,255,255,0.06)',
          borderTopWidth: 1,
          height: TAB_HEIGHT + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 6,
        },
        tabBarActiveTintColor:   colors.blue,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.35)',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen}
        options={{ title: 'Home', tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} /> }} />
      <Tab.Screen name="Wallet" component={WalletScreen}
        options={{ title: 'Wallet', tabBarIcon: ({ focused }) => <TabIcon emoji="💰" focused={focused} /> }} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen}
        options={{ title: 'Top Players', tabBarIcon: ({ focused }) => <TabIcon emoji="🏆" focused={focused} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen}
        options={{ title: 'Profile', tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} /> }} />
    </Tab.Navigator>
  );
}
