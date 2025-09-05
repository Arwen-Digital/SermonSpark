import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface FadeInViewProps {
  children: React.ReactNode;
  duration?: number;
  style?: ViewStyle;
}

export const FadeInView: React.FC<FadeInViewProps> = ({ 
  children, 
  duration = 300, 
  style 
}) => {
  const fadeAnim = useRef(null);
  if (fadeAnim.current === null) {
    fadeAnim.current = new Animated.Value(0);
  }

  useEffect(() => {
    Animated.timing(fadeAnim.current, {
      toValue: 1,
      duration: duration,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, duration]);

  return (
    <Animated.View style={[{ opacity: fadeAnim.current }, style]}>
      {children}
    </Animated.View>
  );
};