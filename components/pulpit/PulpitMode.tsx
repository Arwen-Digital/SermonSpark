import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/Theme';
import { Sermon, PulpitSettings } from '@/types';

interface PulpitModeProps {
  sermon: Sermon;
  onExit: () => void;
  settings?: PulpitSettings;
}

const { width, height } = Dimensions.get('window');

export const PulpitMode: React.FC<PulpitModeProps> = ({
  sermon,
  onExit,
  settings = {
    fontSize: 18,
    lineHeight: 1.6,
    theme: 'light',
    showTimer: true,
    showProgress: true,
    timerDuration: sermon.readingTime * 60, // Convert to seconds
  },
}) => {
  const [currentTheme, setCurrentTheme] = useState(settings.theme);
  const [fontSize, setFontSize] = useState(settings.fontSize);
  const [showControls, setShowControls] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showOnlyOutline, setShowOnlyOutline] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Hide status bar in pulpit mode
    StatusBar.setHidden(true);
    
    return () => {
      StatusBar.setHidden(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const showControlsTemporarily = () => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTargetTime = () => {
    return formatTime(settings.timerDuration || sermon.readingTime * 60);
  };

  const getTimerColor = () => {
    const targetTime = settings.timerDuration || sermon.readingTime * 60;
    const progress = timerSeconds / targetTime;
    
    if (progress < 0.8) return theme.colors.success;
    if (progress < 1) return theme.colors.warning;
    return theme.colors.error;
  };

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const progress = contentOffset.y / (contentSize.height - layoutMeasurement.height);
    setScrollProgress(Math.max(0, Math.min(1, progress)));
  };

  const themeColors = {
    light: {
      background: theme.colors.white,
      text: theme.colors.black,
      secondary: theme.colors.gray600,
    },
    dark: {
      background: theme.colors.black,
      text: theme.colors.white,
      secondary: theme.colors.gray400,
    },
  };

  const currentColors = themeColors[currentTheme];

  const renderContent = () => {
    if (showOnlyOutline && sermon.outline) {
      return (
        <Text style={[styles.content, { 
          color: currentColors.text, 
          fontSize: fontSize,
          lineHeight: fontSize * settings.lineHeight,
        }]}>
          {sermon.outline}
        </Text>
      );
    }

    // Remove basic markdown formatting for cleaner display
    const cleanContent = sermon.content
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markers
      .replace(/\*(.*?)\*/g, '$1')     // Remove italic markers
      .replace(/__(.*?)__/g, '$1')     // Remove underline markers
      .replace(/==(.*?)==/g, '$1')     // Remove highlight markers
      .replace(/#{1,6}\s/g, '');       // Remove heading markers

    return (
      <Text style={[styles.content, { 
        color: currentColors.text, 
        fontSize: fontSize,
        lineHeight: fontSize * settings.lineHeight,
      }]}>
        {cleanContent}
      </Text>
    );
  };

  const renderControls = () => {
    if (!showControls) return null;

    return (
      <View style={[styles.controlsOverlay, { backgroundColor: currentColors.background + 'F0' }]}>
        {/* Top Controls */}
        <View style={styles.topControls}>
          <View style={styles.controlGroup}>
            <Text style={[styles.sermonTitle, { color: currentColors.text }]}>
              {sermon.title}
            </Text>
            {sermon.scripture && (
              <Text style={[styles.scripture, { color: currentColors.secondary }]}>
                {sermon.scripture}
              </Text>
            )}
          </View>
          
          <Pressable onPress={onExit} style={styles.exitButton}>
            <Ionicons name="close" size={24} color={currentColors.text} />
          </Pressable>
        </View>

        {/* Timer and Progress */}
        {(settings.showTimer || settings.showProgress) && (
          <View style={styles.statusBar}>
            {settings.showTimer && (
              <View style={styles.timerContainer}>
                <Pressable
                  onPress={() => setIsTimerRunning(!isTimerRunning)}
                  style={styles.timerButton}
                >
                  <Ionicons
                    name={isTimerRunning ? 'pause' : 'play'}
                    size={16}
                    color={getTimerColor()}
                  />
                  <Text style={[styles.timerText, { color: getTimerColor() }]}>
                    {formatTime(timerSeconds)} / {formatTargetTime()}
                  </Text>
                </Pressable>
              </View>
            )}
            
            {settings.showProgress && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${scrollProgress * 100}%`, backgroundColor: theme.colors.primary }
                    ]} 
                  />
                </View>
                <Text style={[styles.progressText, { color: currentColors.secondary }]}>
                  {Math.round(scrollProgress * 100)}%
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <View style={styles.controlGroup}>
            {/* Theme Toggle */}
            <Pressable
              onPress={() => setCurrentTheme(currentTheme === 'light' ? 'dark' : 'light')}
              style={styles.controlButton}
            >
              <Ionicons
                name={currentTheme === 'light' ? 'moon' : 'sunny'}
                size={20}
                color={currentColors.text}
              />
            </Pressable>

            {/* Font Size Controls */}
            <View style={styles.fontControls}>
              <Pressable
                onPress={() => setFontSize(Math.max(12, fontSize - 2))}
                style={styles.controlButton}
              >
                <Ionicons name="remove" size={20} color={currentColors.text} />
              </Pressable>
              
              <Text style={[styles.fontSizeText, { color: currentColors.text }]}>
                {fontSize}
              </Text>
              
              <Pressable
                onPress={() => setFontSize(Math.min(36, fontSize + 2))}
                style={styles.controlButton}
              >
                <Ionicons name="add" size={20} color={currentColors.text} />
              </Pressable>
            </View>

            {/* Outline Toggle */}
            {sermon.outline && (
              <Pressable
                onPress={() => setShowOnlyOutline(!showOnlyOutline)}
                style={[
                  styles.controlButton,
                  showOnlyOutline && { backgroundColor: theme.colors.primary + '30' }
                ]}
              >
                <Ionicons
                  name="list"
                  size={20}
                  color={showOnlyOutline ? theme.colors.primary : currentColors.text}
                />
              </Pressable>
            )}
          </View>

          {/* Navigation */}
          <View style={styles.controlGroup}>
            <Pressable
              onPress={() => scrollViewRef.current?.scrollTo({ y: 0, animated: true })}
              style={styles.controlButton}
            >
              <Ionicons name="arrow-up" size={20} color={currentColors.text} />
            </Pressable>
            
            <Pressable
              onPress={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              style={styles.controlButton}
            >
              <Ionicons name="arrow-down" size={20} color={currentColors.text} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Pressable
      style={[styles.container, { backgroundColor: currentColors.background }]}
      onPress={showControlsTemporarily}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {renderContent()}
      </ScrollView>
      
      {renderControls()}
      
      {/* Always visible minimal progress bar */}
      {!showControls && settings.showProgress && (
        <View style={styles.minimalProgressBar}>
          <View 
            style={[
              styles.minimalProgressFill, 
              { width: `${scrollProgress * 100}%` }
            ]} 
          />
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
  },
  content: {
    textAlign: 'left',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: theme.spacing.md,
    paddingTop: theme.spacing.xl,
  },
  controlGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  sermonTitle: {
    ...theme.typography.h5,
    maxWidth: width * 0.7,
  },
  scripture: {
    ...theme.typography.body2,
    fontStyle: 'italic',
  },
  exitButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.error + '20',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.black + '10',
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  timerContainer: {
    flex: 1,
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  timerText: {
    ...theme.typography.body1,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
    justifyContent: 'flex-end',
  },
  progressBar: {
    height: 4,
    width: 100,
    backgroundColor: theme.colors.gray300,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    ...theme.typography.caption,
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  controlButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.gray200 + '50',
  },
  fontControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray200 + '50',
    borderRadius: theme.borderRadius.md,
    padding: 2,
  },
  fontSizeText: {
    ...theme.typography.body2,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  minimalProgressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: theme.colors.gray300 + '50',
  },
  minimalProgressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
});