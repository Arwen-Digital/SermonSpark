import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { theme } from '@/constants/Theme';
import authService from '@/services/supabaseAuthService';
import communityService, { CommunityPostDto } from '@/services/supabaseCommunityService';
import sermonService, { SermonDto } from '@/services/supabaseSermonService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, ImageBackground, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const motivationalQuotes = [
  "Preach the Word, not your opinions. God's truth transforms hearts, not clever arguments.",
  "Every sermon is a sacred trust—handle God's Word with reverence and deliver it with boldness.",
  "You're not called to fill pews, but to feed souls with the bread of life.",
  "The Gospel never gets old, but your presentation of it should never grow stale.",
  "Pray more than you prepare, but prepare as if lives depend on it—because they do.",
  "Speak to the heart, not just the head. Truth that touches the soul changes everything.",
  "Your weakness is God's opportunity to display His strength through His Word.",
  "Don't just explain the text—let the text explain the human condition and God's solution.",
  "Comfort the disturbed and disturb the comfortable—that's the biblical balance.",
  "Remember: you're a steward of mysteries, not the author of truth. Deliver faithfully what has been entrusted to you.",
  "Grace received should always lead to grace proclaimed. Let your preaching overflow from a grateful heart.",
  "The pulpit is not a throne—it's an altar where you offer God's truth as a living sacrifice.",
  "Preach to one heart at a time, even when addressing hundreds. Personal truth penetrates deepest.",
  "Let Scripture do the heavy lifting. Your job is to unveil, not to convince by human wisdom.",
  "Every 'Therefore' in Scripture is there for a reason—don't preach conclusions without foundations.",
  "Faithful exposition requires both archaeological digging and architectural building for modern application.",
  "Your congregation needs to hear 'Thus says the Lord,' not 'It seems to me that...'",
  "The Gospel is free, but faithful preaching costs everything. Count the cost and pay it gladly.",
  "Don't just inform minds—transform lives through the power of God's unchanging Word.",
  "Stand on the shoulders of giants, but let your voice carry the fresh wind of the Spirit for today's generation."
];

const { width } = Dimensions.get('window');

const heroImages = [
  require('../../assets/images/hero-bg-0.png'),
  require('../../assets/images/hero-bg-1.png'),
  require('../../assets/images/hero-bg-2.png'),
  require('../../assets/images/hero-bg-3.png'),
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const isLargeScreen = Math.min(winW, winH) >= 600;
  const [sermons, setSermons] = useState<SermonDto[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPostDto[]>([]);
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentQuote, setCurrentQuote] = useState('');
  const [currentHeroImage, setCurrentHeroImage] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const [list, posts, user] = await Promise.all([
        sermonService.listMine().catch(() => []),
        communityService.getAllPosts().catch(() => []),
        authService.getUser(),
      ]);
      setSermons(list);
      setCommunityPosts(posts.slice(0, 5));
      setUserName(user?.fullName || user?.username || 'Pastor');
    } catch (error) {
      console.warn('Failed to load home data:', error);
      setSermons([]);
      setCommunityPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    // Select a random quote and hero image each time the component loads
    const randomQuoteIndex = Math.floor(Math.random() * motivationalQuotes.length);
    const randomImageIndex = Math.floor(Math.random() * heroImages.length);
    console.log('Selected hero image index:', randomImageIndex, 'out of', heroImages.length, 'images');
    setCurrentQuote(motivationalQuotes[randomQuoteIndex]);
    setCurrentHeroImage(randomImageIndex);
  }, []); // Empty dependency array to run only once per mount

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'GOOD MORNING';
    if (hour < 17) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  };

  const getGreetingIcon = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'sunny';
    if (hour < 17) return 'partly-sunny';
    return 'moon';
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: Math.max(insets.top || 0, isLargeScreen ? theme.spacing.xl : theme.spacing.md), paddingBottom: Math.max(insets.bottom || 0, theme.spacing.md) }]}>
        <View style={styles.loadingContainer}>
          <LoadingIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  const minHeaderPad = isLargeScreen ? 28 : 12;
  // const headerTopPad = Math.max(insets.top || 0, minHeaderPad);
  // const headerTopPad = 0;

  const topPadding = Math.max(insets.top || 0, isLargeScreen ? theme.spacing.xl : theme.spacing.md);
  const bottomPadding = Math.max(insets.bottom || 0, theme.spacing.md);

  return (
    <View style={[styles.container, { paddingTop: topPadding, paddingBottom: bottomPadding }]}>
      {/* Header */}
      <View style={[styles.header]}>
        <View style={styles.tabsContainer}>
          <View style={styles.activeTab}>
            <Text style={styles.activeTabText}>Today</Text>
            <View style={styles.activeTabIndicator} />
          </View>
          <TouchableOpacity style={styles.inactiveTab} onPress={() => router.push('/community')}>
            <Text style={styles.inactiveTabText}>Community</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* Greeting */}
          <View style={styles.greetingContainer}>
            <Ionicons name={getGreetingIcon()} size={20} color="#666" />
            <Text style={styles.greetingText}>{getGreeting()}, {userName.toUpperCase()}</Text>
          </View>

          {/* Two Column Layout for Web */}
          {Platform.OS === 'web' ? (
            <View style={styles.webTwoColumnContainer}>
              {/* Left Column - Hero Image */}
              <TouchableOpacity 
                style={[styles.webHeroColumn, { aspectRatio: isLargeScreen ? 16/9 : 1 }]}
                onPress={() => {
                  // Cycle to next image for testing
                  const nextImage = (currentHeroImage + 1) % heroImages.length;
                  console.log('Cycling from image', currentHeroImage, 'to image', nextImage);
                  setCurrentHeroImage(nextImage);
                }}
              >
                <ImageBackground 
                  source={heroImages[currentHeroImage]}
                  style={styles.webHeroBackground}
                  imageStyle={styles.webHeroBackgroundImage}
                >
                  <View style={styles.webHeroOverlay}>
                    <View style={styles.webQuoteContainer}>
                      <Text style={styles.webQuoteText}>{currentQuote}</Text>
                    </View>
                  </View>
                </ImageBackground>
              </TouchableOpacity>

              {/* Right Column - Action Cards */}
              <View style={styles.webCardsColumn}>
          {/* Latest Sermon */}
          {sermons.length > 0 && (
            <TouchableOpacity 
              style={styles.contentCard}
              onPress={() => router.push(`/sermon/${sermons[0].id}`)}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardLeft}>
                  <View style={styles.dayBadge}>
                    <Ionicons name="document-text-outline" size={16} color="#666" />
                    <Text style={styles.dayText}>Latest Sermon</Text>
                  </View>
                  <Text style={styles.cardTitle}>
                    {sermons[0].title || 'Untitled Sermon'}
                  </Text>
                  <View style={styles.progressIndicator} />
                </View>
                <View style={styles.cardImage} />
              </View>
            </TouchableOpacity>
          )}

          {/* Create New Sermon */}
          <TouchableOpacity 
            style={styles.contentCard}
            onPress={() => router.push('/sermon/create')}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardLeft}>
                <View style={styles.dayBadge}>
                  <Ionicons name="add-outline" size={16} color="#666" />
                  <Text style={styles.dayText}>New Sermon</Text>
                </View>
                <Text style={styles.cardTitle}>Create a New Sermon</Text>
                <View style={styles.progressIndicator} />
              </View>
              <View style={styles.cardImage} />
            </View>
          </TouchableOpacity>

          {/* Manage Series */}
          <TouchableOpacity 
            style={styles.contentCard}
            onPress={() => router.push('/series')}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardLeft}>
                <View style={styles.dayBadge}>
                  <Ionicons name="albums-outline" size={16} color="#666" />
                  <Text style={styles.dayText}>Series</Text>
                </View>
                <Text style={styles.cardTitle}>Manage Your Series</Text>
                <View style={styles.progressIndicator} />
              </View>
              <View style={styles.cardImage} />
            </View>
          </TouchableOpacity>

          {/* Research */}
          <TouchableOpacity 
            style={styles.contentCard}
            onPress={() => router.push('/(tabs)/research')}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardLeft}>
                <View style={styles.dayBadge}>
                  <Ionicons name="search-outline" size={16} color="#666" />
                  <Text style={styles.dayText}>Research</Text>
                </View>
                <Text style={styles.cardTitle}>Research Your Next Sermon</Text>
                <View style={styles.progressIndicator} />
              </View>
              <View style={styles.cardImage} />
            </View>
          </TouchableOpacity>
                </View>
              </View>
            ) : (
              // Mobile/Native Layout
              <>
                {/* Hero Verse Card */}
                <TouchableOpacity 
                  style={[styles.heroCard, { aspectRatio: isLargeScreen ? 16/9 : 1 }]}
                  onPress={() => {
                  // Cycle to next image for testing
                  const nextImage = (currentHeroImage + 1) % heroImages.length;
                  console.log('Cycling from image', currentHeroImage, 'to image', nextImage);
                  setCurrentHeroImage(nextImage);
                  }}
                >
                  <ImageBackground 
                    source={heroImages[currentHeroImage]}
                    style={styles.heroBackground}
                    imageStyle={styles.heroBackgroundImage}
                  >
                    <View style={styles.heroOverlay}>
                      <View style={styles.quoteContainer}>
                        <Text style={styles.quoteText}>{currentQuote}</Text>
                      </View>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>

                {/* Content Cards */}
                <View style={styles.contentCards}>
                  {/* Latest Sermon */}
                  {sermons.length > 0 && (
                    <TouchableOpacity 
                      style={styles.contentCard}
                      onPress={() => router.push(`/sermon/${sermons[0].id}`)}
                    >
                      <View style={styles.cardContent}>
                        <View style={styles.cardLeft}>
                          <View style={styles.dayBadge}>
                            <Ionicons name="document-text-outline" size={16} color="#666" />
                            <Text style={styles.dayText}>Latest Sermon</Text>
                          </View>
                          <Text style={styles.cardTitle}>
                            {sermons[0].title || 'Untitled Sermon'}
                          </Text>
                          <View style={styles.progressIndicator} />
                        </View>
                        <View style={styles.cardImage} />
                      </View>
                    </TouchableOpacity>
                  )}

                  {/* Create New Sermon */}
                  <TouchableOpacity 
                    style={styles.contentCard}
                    onPress={() => router.push('/sermon/create')}
                  >
                    <View style={styles.cardContent}>
                      <View style={styles.cardLeft}>
                        <View style={styles.dayBadge}>
                          <Ionicons name="add-outline" size={16} color="#666" />
                          <Text style={styles.dayText}>New Sermon</Text>
                        </View>
                        <Text style={styles.cardTitle}>Create a New Sermon</Text>
                        <View style={styles.progressIndicator} />
                      </View>
                      <View style={styles.cardImage} />
                    </View>
                  </TouchableOpacity>

                  {/* Manage Series */}
                  <TouchableOpacity 
                    style={styles.contentCard}
                    onPress={() => router.push('/series')}
                  >
                    <View style={styles.cardContent}>
                      <View style={styles.cardLeft}>
                        <View style={styles.dayBadge}>
                          <Ionicons name="albums-outline" size={16} color="#666" />
                          <Text style={styles.dayText}>Series</Text>
                        </View>
                        <Text style={styles.cardTitle}>Manage Your Series</Text>
                        <View style={styles.progressIndicator} />
                      </View>
                      <View style={styles.cardImage} />
                    </View>
                  </TouchableOpacity>

                  {/* Research */}
                  <TouchableOpacity 
                    style={styles.contentCard}
                    onPress={() => router.push('/(tabs)/research')}
                  >
                    <View style={styles.cardContent}>
                      <View style={styles.cardLeft}>
                        <View style={styles.dayBadge}>
                          <Ionicons name="search-outline" size={16} color="#666" />
                          <Text style={styles.dayText}>Research</Text>
                        </View>
                        <Text style={styles.cardTitle}>Research Your Next Sermon</Text>
                        <View style={styles.progressIndicator} />
                      </View>
                      <View style={styles.cardImage} />
                    </View>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  header: {
    backgroundColor: '#f5f5f5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  activeTab: {
    marginRight: 30,
    paddingBottom: 10,
  },
  activeTabText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  activeTabIndicator: {
    height: 3,
    backgroundColor: '#ff4444',
    borderRadius: 2,
  },
  inactiveTab: {
    paddingBottom: 10,
  },
  inactiveTabText: {
    fontSize: 18,
    fontWeight: '400',
    color: '#999',
    marginBottom: 11,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationContainer: {
    alignItems: 'center',
    marginRight: 15,
  },
  notificationText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  notificationIcon: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B4513',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  contentWrapper: {
    paddingHorizontal: 15,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: '#f5f5f5',
  },
  greetingText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  heroCard: {
    marginVertical: 0,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    aspectRatio: width > 768 ? 16/9 : 1, // 16:9 on tablets/desktop, 1:1 on mobile
  },
  heroBackground: {
    width: '100%',
    height: '100%',
  },
  heroBackgroundImage: {
    borderRadius: 20,
    resizeMode: 'cover', // Ensure consistent cropping
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0)',
    borderRadius: 20,
    justifyContent: 'flex-end',
    padding: 20,
  },
  quoteContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 15,
    marginHorizontal: 10,
  },
  quoteText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'center',
    // fontStyle: 'italic',
  },
  contentCards: {
    paddingTop: 10,
  },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  cardLeft: {
    flex: 1,
    marginRight: 15,
  },
  dayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginLeft: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    lineHeight: 24,
    marginBottom: 10,
  },
  progressIndicator: {
    height: 3,
    backgroundColor: '#ff4444',
    width: 40,
    borderRadius: 2,
  },
  cardImage: {
    width: 80,
    height: 80,
  },
  cardImageBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImageStyle: {
    borderRadius: 12,
  },
  cardImageOverlay: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  cardImageText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Web-specific styles for two-column layout
  webTwoColumnContainer: {
    flexDirection: 'row',
    gap: 30,
    marginTop: 10,
    alignItems: 'flex-start',
  },
  webHeroColumn: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    aspectRatio: 1, // 1:1 aspect ratio for web hero image
  },
  webHeroBackground: {
    width: '100%',
    height: '100%',
  },
  webHeroBackgroundImage: {
    borderRadius: 20,
    resizeMode: 'cover',
  },
  webHeroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0)',
    borderRadius: 20,
    justifyContent: 'flex-end',
    padding: 20,
  },
  webQuoteContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 15,
  },
  webQuoteText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    textAlign: 'center',
  },
  webCardsColumn: {
    flex: 1,
    gap: 15,
  },
});
