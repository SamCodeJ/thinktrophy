import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, Dimensions,
  TouchableOpacity, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../utils/theme';

const { width } = Dimensions.get('window');

const slides = [
  {
    emoji:    '🧠',
    title:    'Think Sharp',
    subtitle: 'Answer 10 trivia questions from 5 categories you choose — test your knowledge across Science, History, Sports, Tech and Pop Culture.',
  },
  {
    emoji:    '💰',
    title:    'Stake Real Money',
    subtitle: 'Top up your wallet and place a stake before each game. The more you know, the more you win.',
  },
  {
    emoji:    '🏆',
    title:    'Win Big',
    subtitle: 'Score 9 or 10 out of 10 to multiply your stake. Perfect score = 2× your money. Are you ready?',
  },
];

export default function OnboardingScreen({ navigation }) {
  const [current, setCurrent] = useState(0);
  const flatRef = useRef(null);

  function next() {
    if (current < slides.length - 1) {
      flatRef.current?.scrollToIndex({ index: current + 1 });
      setCurrent(c => c + 1);
    } else {
      navigation.replace('Auth');
    }
  }

  return (
    <LinearGradient colors={[colors.darker, colors.dark]} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <FlatList
          ref={flatRef}
          data={slides}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={e => setCurrent(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <Text style={styles.emoji}>{item.emoji}</Text>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
          )}
          keyExtractor={(_, i) => String(i)}
        />

        {/* Dots */}
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === current && styles.dotActive]} />
          ))}
        </View>

        {/* CTA */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={next} activeOpacity={0.85}>
            <LinearGradient colors={[colors.blue, colors.teal]} style={styles.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.btnText}>
                {current === slides.length - 1 ? "Let's Play!" : 'Next'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {current < slides.length - 1 && (
            <TouchableOpacity onPress={() => navigation.replace('Auth')}>
              <Text style={styles.skip}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe:      { flex: 1 },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emoji:    { fontSize: 80, marginBottom: 32 },
  title:    { fontSize: 32, fontWeight: '800', color: colors.light, textAlign: 'center', marginBottom: 16 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 32 },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActive: { width: 24, backgroundColor: colors.blue },
  footer: { paddingHorizontal: 24, paddingBottom: 16, gap: 16 },
  btn:     { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skip:    { textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 14, paddingVertical: 8 },
});
