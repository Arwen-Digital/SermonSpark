import React from 'react';
import { StyleSheet } from 'react-native';
import { PulpitMode } from '@/components/pulpit/PulpitMode';
import { router, useLocalSearchParams } from 'expo-router';
import { Sermon } from '@/types';

// Mock sermon data - in a real app, this would come from local storage or API
const mockSermon: Sermon = {
  id: '1',
  title: 'The Good Shepherd',
  content: `Jesus said, "I am the good shepherd. The good shepherd lays down his life for the sheep."

In this passage from John 10:11, we see a beautiful picture of Christ's sacrificial love for His people. The image of a shepherd was familiar to Jesus' audience, but His words revealed something extraordinary about His identity and mission.

**The Heart of the Shepherd**

Unlike a hired hand who flees when danger comes, Jesus describes Himself as the shepherd who owns the sheep. This ownership is not possessive or controlling, but protective and caring. He knows each sheep by name, understands their needs, and is intimately involved in their lives.

When we think about what it means for Jesus to be our shepherd, we must first understand that this is a relationship of love, not duty. The good shepherd doesn't care for the sheep because he has to, but because he chooses to. This choice is rooted in love.

**The Sacrifice of the Shepherd**

The most striking aspect of Jesus' declaration is His willingness to lay down His life for the sheep. This goes beyond the normal duties of a shepherd. While a good shepherd might risk his life to protect the flock, Jesus promises to give His life as a sacrifice.

This sacrificial love is what sets Christianity apart from every other religion. Our God doesn't demand that we sacrifice for Him; instead, He sacrifices Himself for us. The cross becomes the ultimate expression of the good shepherd's heart.

**The Call of the Shepherd**

Jesus also speaks of other sheep that are not of this fold. He must bring them also, and they will listen to His voice. This is a beautiful picture of the gospel's reach beyond the Jewish people to include all nations and peoples.

The shepherd's call goes out to every person, inviting them into the safety and security of His fold. But notice that Jesus says they will listen to His voice. The sheep know their shepherd's voice and respond to it.

**Living Under the Good Shepherd**

What does it mean for us today to live as sheep under the care of the Good Shepherd? First, it means recognizing our need for His guidance and protection. We are not independent beings who can navigate life on our own.

Second, it means learning to recognize and respond to His voice. In a world filled with competing voices and conflicting messages, we must train our ears to hear the voice of our Shepherd through His Word and His Spirit.

Finally, it means trusting in His sacrificial love. When we face difficulties, uncertainties, or fears, we can rest in the knowledge that our Shepherd has already given His life for us. If He was willing to die for us, how much more will He care for us in our daily needs?

**Conclusion**

The image of Jesus as the Good Shepherd reminds us that we are deeply loved, carefully watched over, and eternally secure in His care. Unlike earthly shepherds who may fail or abandon their flocks, our Shepherd is faithful, powerful, and devoted to our well-being.

Today, let us rest in the assurance that we belong to the Good Shepherd. Let us listen for His voice and follow His leading. And let us never forget the price He paid to make us His own.`,
  outline: `I. The Heart of the Shepherd (John 10:11-13)
   A. Not a hired hand, but an owner
   B. Knows each sheep personally
   C. Acts out of love, not duty

II. The Sacrifice of the Shepherd (John 10:11, 15)
   A. Willing to lay down His life
   B. Goes beyond normal shepherd duties
   C. The cross as ultimate expression

III. The Call of the Shepherd (John 10:16)
   A. Other sheep not of this fold
   B. All will hear His voice
   C. Universal reach of the gospel

IV. Living Under the Good Shepherd (Application)
   A. Recognizing our need for guidance
   B. Learning to hear His voice
   C. Trusting in His sacrificial love`,
  scripture: 'John 10:11-16',
  tags: ['Jesus', 'Love', 'Sacrifice', 'Shepherd'],
  series: 'I Am Statements',
  date: new Date('2024-01-15'),
  lastModified: new Date('2024-01-20'),
  wordCount: 2800,
  readingTime: 18,
  isArchived: false,
  isFavorite: true,
  notes: 'Focus on the personal nature of Christ\'s care for each believer.',
};

export default function PulpitPage() {
  const { id } = useLocalSearchParams();
  
  // In a real app, you would fetch the sermon by ID
  const sermon = mockSermon;

  const handleExit = () => {
    router.back();
  };

  return (
    <PulpitMode
      sermon={sermon}
      onExit={handleExit}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});