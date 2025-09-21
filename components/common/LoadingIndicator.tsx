import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { theme } from '../../constants/Theme';

type LoadingIndicatorSize = 'small' | 'large';

interface LoadingIndicatorProps {
  size?: LoadingIndicatorSize;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = 'large',
  color: _color,
  style,
}) => {
  const baseColor = theme.colors.gray400;
  const highlightColor = theme.colors.gray300;
  void _color; // preserve prop compatibility while enforcing neutral palette
  const shimmer = useRef(new Animated.Value(0)).current;
  const animatedBackground = useMemo(
    () =>
      shimmer.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [baseColor, highlightColor, baseColor],
      }),
    [baseColor, highlightColor, shimmer]
  );

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [shimmer]);

  if (size === 'small') {
    return (
      <View style={[styles.smallContainer, style]}>
        <Animated.View
          style={[
            styles.smallBar,
            {
              backgroundColor: animatedBackground,
            },
          ]}
        />
      </View>
    );
  }

  return (
    <View style={[styles.pageContainer, style]}>
      <Animated.View
        style={[
          styles.heroBlock,
          {
            backgroundColor: animatedBackground,
          },
        ]}
      />
      <View style={styles.cardRow}>
        {CARD_SKELETONS.map((width, index) => (
          <Animated.View
            key={index}
            style={[
              styles.cardBlock,
              {
                width,
                backgroundColor: animatedBackground,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  smallContainer: {
    width: 28,
    height: 12,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  smallBar: {
    height: '100%',
    borderRadius: theme.borderRadius.sm,
  },
  pageContainer: {
    width: '100%',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  heroBlock: {
    height: 140,
    borderRadius: theme.borderRadius.lg,
  },
  cardRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    flexWrap: 'wrap' as const,
  },
  cardBlock: {
    height: 96,
    borderRadius: theme.borderRadius.lg,
    flexGrow: 1,
  },
});

const CARD_SKELETONS = ['48%', '48%'];
