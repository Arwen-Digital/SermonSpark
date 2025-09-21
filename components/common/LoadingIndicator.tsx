import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { theme } from '../../constants/Theme';

type LoadingIndicatorSize = 'small' | 'large';

interface LoadingIndicatorProps {
  size?: LoadingIndicatorSize;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

const BLOCK_COUNT = 3;
const MIN_OPACITY = 0.2;

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = 'large',
  color,
  style,
}) => {
  const blockColor = color ?? theme.colors.primary;
  const blockSize = size === 'small' ? 8 : 14;
  const blockSpacing = size === 'small' ? 4 : 6;
  const animatedValues = useRef(
    Array.from({ length: BLOCK_COUNT }, () => new Animated.Value(MIN_OPACITY))
  ).current;

  useEffect(() => {
    const animations = animatedValues.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 150),
          Animated.timing(value, {
            toValue: 1,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: MIN_OPACITY,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      )
    );

    animations.forEach((animation) => animation.start());

    return () => {
      animations.forEach((animation) => animation.stop());
    };
  }, [animatedValues]);

  return (
    <View style={[styles.container, style]}>
      {animatedValues.map((animatedValue, index) => (
        <Animated.View
          key={index}
          style={[
            styles.block,
            {
              backgroundColor: blockColor,
              width: blockSize,
              height: blockSize,
              borderRadius: blockSize / 4,
              marginHorizontal: blockSpacing / 2,
              opacity: animatedValue,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  block: {
    backgroundColor: theme.colors.primary,
  },
});

