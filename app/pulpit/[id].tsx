import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, ScrollView, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { theme } from '@/constants/Theme';
import { Sermon } from '@/types';

// Mock sermon data (same as detail page for consistency)
const mockSermon: Sermon = {
  id: '1',
  title: 'The Good Shepherd: Understanding Christ\'s Heart for His People',
  content: `Jesus said, "I am the good shepherd. The good shepherd lays down his life for the sheep." In this passage from John 10:11, we see a beautiful picture of Christ's sacrificial love for His people.

**Introduction**

In a world where leadership often means power over others, Jesus presents us with a radically different model. He doesn't call himself a king, a ruler, or even a teacher in this passage. He calls himself a shepherd. This simple yet profound metaphor reveals the very heart of who Jesus is and how He relates to those who follow Him.

The image of a shepherd was deeply familiar to Jesus' audience. In the ancient Near East, shepherding was not just a profession—it was a way of life that required complete dedication, sacrifice, and love for the flock. When Jesus declares "I am the good shepherd," He's making a statement about His character, His mission, and His relationship with us that goes far beyond what we might initially understand.

**I. The Heart of the Good Shepherd (John 10:11-13)**

The first thing we notice about Jesus as the good shepherd is His heart. Unlike a hired hand who works merely for wages, the good shepherd owns the sheep. This ownership is not possessive or controlling, but protective and caring. It speaks of a relationship that goes beyond duty or obligation—it's a relationship of love.

When Jesus says He is the good shepherd, He's contrasting Himself with the religious leaders of His day who were more concerned with their own comfort and status than with caring for God's people. These leaders were like hired hands who, when danger came, would flee rather than protect the flock.

But Jesus is different. His heart is completely devoted to His people. He knows each sheep by name. He understands their needs, their weaknesses, their fears, and their hopes. This intimate knowledge isn't distant or clinical—it's born out of deep, personal love.

Consider how a shepherd knows his sheep. He can identify each one by its voice, its walk, even by its personality. He knows which sheep tends to wander, which one is prone to fear, which one needs extra attention. This is exactly how Jesus knows us. He doesn't see us as a faceless crowd, but as individuals whom He loves with perfect, personal love.

**II. The Sacrifice of the Good Shepherd (John 10:11, 15-18)**

The most striking aspect of Jesus' declaration is His willingness to lay down His life for the sheep. This goes far beyond the normal duties of even the most dedicated shepherd. While a good shepherd might risk his life to protect the flock from wolves or other predators, Jesus promises to actually give His life as a sacrifice.

This sacrificial love is what sets Christianity apart from every other religion in the world. In other faiths, humans must work their way up to God through good deeds, religious observances, or spiritual enlightenment. But in Christianity, God comes down to us. The shepherd doesn't demand that the sheep find their own way to safety—He lays down His own life to secure their salvation.

Jesus makes it clear that this sacrifice is voluntary. "No one takes it from me, but I lay it down of my own accord" (John 10:18). This wasn't a tragedy that befell Him, nor was it simply the result of human wickedness, though human sin certainly played a part. This was God's planned rescue mission for humanity.

The cross becomes the ultimate expression of the good shepherd's heart. There, we see Jesus literally laying down His life for His sheep. Every lash of the whip, every thorn in the crown, every nail in His hands and feet was motivated by His love for us. He endured the wrath of God that we deserved so that we might experience the love of God that we could never earn.

But the sacrifice doesn't end with death. Jesus also says, "I have authority to lay it down and authority to take it up again" (John 10:18). The resurrection is just as much a part of the shepherd's work as the crucifixion. Through His death, Jesus pays the penalty for our sin. Through His resurrection, He demonstrates His power over death and secures our eternal life.

**III. The Call of the Good Shepherd (John 10:16)**

Jesus also speaks of "other sheep that are not of this sheep pen." He must bring them also, and they will listen to His voice. This is a beautiful picture of the gospel's reach beyond the Jewish people to include all nations, tribes, and tongues.

The shepherd's call goes out to every person, but notice that Jesus says His sheep will listen to His voice. This tells us something important about how people come to faith. It's not ultimately about human persuasion or clever arguments, though these can be used by God. It's about the supernatural work of the Holy Spirit opening hearts to hear and respond to the voice of Jesus.

This has profound implications for how we share the gospel. We don't need to manipulate people into the kingdom or pressure them into making decisions. Our job is to faithfully proclaim the truth about Jesus and trust that the Good Shepherd will call His sheep to Himself.

At the same time, this should give us great confidence in evangelism. When we share the gospel, we're not just sharing human wisdom or religious ideas—we're participating in the Good Shepherd's call to His sheep. Some will hear His voice and respond with faith. Others will remain hardened for now. But we can trust that all of God's sheep will eventually come to Him.

**IV. Living Under the Good Shepherd's Care (Application)**

What does it mean for us today to live as sheep under the care of the Good Shepherd? Let me suggest several practical implications:

*First, it means recognizing our need for His guidance and protection.* Sheep are not particularly intelligent or strong animals. They're vulnerable to predators, prone to wandering, and utterly dependent on their shepherd for survival. This is actually a pretty accurate picture of our spiritual condition. We're not independent beings who can successfully navigate life on our own. We need the Good Shepherd's guidance, protection, and provision.

Pride often keeps us from acknowledging this dependence. We want to be the masters of our own destiny, the captains of our own souls. But Jesus calls us to humility—to recognize that we're sheep who desperately need a shepherd.

*Second, it means learning to recognize and respond to His voice.* Jesus says His sheep know His voice and follow Him. In a world filled with competing voices and conflicting messages, we must train our ears to hear the voice of our Shepherd through His Word and His Spirit.

This requires spending time in Scripture, where we hear Jesus speak to us through the written Word. It requires prayer, where we learn to quiet our hearts and listen for His gentle leading. It requires fellowship with other believers, where we can test what we think we're hearing against the wisdom of the body of Christ.

*Third, it means trusting in His sacrificial love.* When we face difficulties, uncertainties, or fears, we can rest in the knowledge that our Shepherd has already given His life for us. If He was willing to die for us when we were His enemies, how much more will He care for us now that we're His beloved sheep?

This doesn't mean life will be easy or that we'll never face trials. Even sheep under the care of a good shepherd sometimes face storms, predators, and difficult terrain. But we can trust that our Shepherd will never leave us or forsake us. He will guide us through the valley of the shadow of death, and we need fear no evil.

*Fourth, it means living in the security of His eternal love.* Jesus says that no one can snatch His sheep out of His hand (John 10:28-29). This isn't just a nice sentiment—it's an ironclad guarantee. Our salvation doesn't depend on our ability to hold on to Jesus, but on His commitment to hold on to us.

This should give us great peace and confidence. We don't have to wonder whether we're truly saved or worry that we might lose our salvation if we stumble and fall. We're secure in the Good Shepherd's grip, and His grip is stronger than any force that might try to separate us from Him.

**V. The Good Shepherd's Promise for the Future**

Finally, we must remember that the Good Shepherd's work is not yet complete. He is preparing a place for His sheep in His Father's house (John 14:2-3). One day, He will gather all His sheep together in perfect unity—one flock under one Shepherd.

Until that day, we live by faith, not by sight. We trust in His promises even when we can't see the full picture. We follow His voice even when the path seems unclear. We rest in His love even when circumstances suggest otherwise.

**Conclusion**

The image of Jesus as the Good Shepherd reminds us that we are deeply loved, carefully watched over, and eternally secure in His care. Unlike earthly shepherds who may fail, grow tired, or abandon their flocks, our Shepherd is faithful, powerful, and devoted to our well-being.

He knows each of us by name. He gave His life to secure our salvation. He continues to guide, protect, and provide for us each day. And He will never lose even one of His sheep.

Today, let us rest in the assurance that we belong to the Good Shepherd. Let us listen for His voice and follow His leading. Let us trust in His sacrificial love, especially when life is difficult or confusing.

And let us never forget the price He paid to make us His own. The cross stands as the eternal testament to the Good Shepherd's love—a love that is deeper than our sin, stronger than death, and more enduring than time itself.

In Him, we find everything we need for life and godliness. In Him, we discover what it means to be truly loved, perfectly protected, and eternally secure. May we live each day in the joy and confidence that comes from knowing we belong to Jesus Christ, the Good Shepherd who gave His life for His sheep.

*Let us pray together as we close...*`,
  outline: '',
  scripture: 'John 10:11-16',
  tags: [],
  series: 'I Am Statements',
  date: new Date('2024-01-15'),
  lastModified: new Date('2024-01-20'),
  wordCount: 2800,
  readingTime: 18,
  isArchived: false,
  isFavorite: true,
  notes: '',
};

export default function PulpitViewPage() {
  const { id } = useLocalSearchParams();
  const [seconds, setSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const sermon = mockSermon;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSeconds(prevSeconds => prevSeconds + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleBack = () => {
    router.back();
  };

  const handleStartTimer = () => {
    if (isTimerRunning) {
      setIsTimerRunning(false);
    } else {
      setIsTimerRunning(true);
      if (seconds === 0) {
        setSeconds(0);
      }
    }
  };

  const resetTimer = () => {
    setSeconds(0);
    setIsTimerRunning(false);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.stickyHeader}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </Pressable>
        
        <View style={styles.timerDisplay}>
          <Text style={styles.timerText}>{formatTime(seconds)}</Text>
        </View>

        <View style={styles.timerControls}>
          <Pressable 
            onPress={handleStartTimer} 
            style={styles.timerButton}
          >
            <Ionicons 
              name={isTimerRunning ? "pause" : "play"} 
              size={20} 
              color={isTimerRunning ? theme.colors.error : theme.colors.primary} 
            />
          </Pressable>
          {seconds > 0 && (
            <Pressable onPress={resetTimer} style={styles.resetButton}>
              <Ionicons name="refresh" size={18} color={theme.colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sermonText}>{sermon.content}</Text>
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  stickyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
    elevation: 3,
  },
  backButton: {
    padding: theme.spacing.xs,
    flex: 1,
    alignItems: 'flex-start',
  },
  timerDisplay: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  timerControls: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: theme.spacing.xs,
  },
  timerButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.gray100,
  },
  resetButton: {
    padding: theme.spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
  },
  sermonText: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    lineHeight: 32,
    fontSize: 18,
    fontWeight: '400',
  },
  bottomPadding: {
    height: 100,
  },
});