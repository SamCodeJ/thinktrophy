import { useEffect, useState } from 'react';
import { Dimensions, Keyboard, Platform, useWindowDimensions } from 'react-native';

// Expo Go often resizes with the keyboard; production edge-to-edge Android
// builds usually do not, so the keypad covers focused fields unless we pad.
export function useKeyboardOverlap() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { height: windowHeight } = useWindowDimensions();

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, e => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (keyboardHeight <= 0) return 0;

  const alreadyShrunk = Math.max(0, Dimensions.get('screen').height - windowHeight);
  if (alreadyShrunk >= keyboardHeight * 0.5) {
    return Math.max(0, keyboardHeight - alreadyShrunk);
  }
  return keyboardHeight;
}
