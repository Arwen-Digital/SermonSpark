// Utility functions for the home screen

// Get liturgical season information
export const getLiturgicalInfo = (): { season: string; description: string; color: string } => {
  const now = new Date();
  const month = now.getMonth() + 1; // JavaScript months are 0-indexed
  const day = now.getDate();

  // Simplified liturgical calendar - this could be more sophisticated
  if ((month === 12 && day >= 1) || (month === 1 && day <= 6)) {
    return {
      season: 'Advent/Christmas',
      description: 'Season of anticipation and celebration',
      color: '#8B5CF6' // Purple/Gold
    };
  } else if (month >= 2 && month <= 4) {
    return {
      season: 'Lent/Easter',
      description: 'Season of preparation and resurrection',
      color: '#EC4899' // Purple/White
    };
  } else if (month >= 5 && month <= 8) {
    return {
      season: 'Ordinary Time',
      description: 'Season of growth and discipleship',
      color: '#10B981' // Green
    };
  } else {
    return {
      season: 'Ordinary Time',
      description: 'Season of harvest and thanksgiving',
      color: '#F59E0B' // Gold/Orange
    };
  }
};

// Get contextual greeting based on time of day
export const getContextualGreeting = (userName: string): { greeting: string; timeContext: string } => {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Sunday
  
  let greeting = 'Welcome';
  let timeContext = '';

  if (hour < 12) {
    greeting = 'Good morning';
  } else if (hour < 17) {
    greeting = 'Good afternoon';
  } else {
    greeting = 'Good evening';
  }

  // Add context based on day of week
  if (day === 0) {
    timeContext = "It's Sunday - may your service be blessed!";
  } else if (day === 6) {
    timeContext = "Tomorrow's the big day - final preparations?";
  } else if (day === 3) { // Wednesday
    timeContext = "Midweek - perfect time for deep sermon work";
  } else {
    timeContext = "Another day to serve and prepare";
  }

  return {
    greeting: userName ? `${greeting}, ${userName}` : greeting,
    timeContext
  };
};

// Get today's focus based on upcoming sermons and drafts
export const getTodaysFocus = (sermons: any[]): { title: string; subtitle: string; action: string; priority: 'high' | 'medium' | 'low' } => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const thisWeek = new Date(now);
  thisWeek.setDate(thisWeek.getDate() + 7);

  // Check for sermons due soon
  const upcomingSoon = sermons.filter(s => {
    if (!s.date) return false;
    const sermonDate = new Date(s.date);
    return sermonDate >= now && sermonDate <= thisWeek;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Check for drafts that need work
  const drafts = sermons.filter(s => s.status === 'draft' || s.status === 'preparing');

  if (upcomingSoon.length > 0) {
    const nextSermon = upcomingSoon[0];
    const daysUntil = Math.ceil((new Date(nextSermon.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil <= 1) {
      return {
        title: `Sermon "${nextSermon.title}" is ${daysUntil === 0 ? 'today' : 'tomorrow'}`,
        subtitle: 'Make sure everything is ready!',
        action: 'Review Sermon',
        priority: 'high'
      };
    } else if (daysUntil <= 3) {
      return {
        title: `"${nextSermon.title}" in ${daysUntil} days`,
        subtitle: 'Time for final preparations and practice',
        action: 'Prepare Sermon',
        priority: 'high'
      };
    }
  }

  if (drafts.length > 0) {
    return {
      title: `Continue working on "${drafts[0].title}"`,
      subtitle: 'Your draft is waiting for inspiration',
      action: 'Continue Writing',
      priority: 'medium'
    };
  }

  return {
    title: 'Create your next sermon',
    subtitle: 'Start fresh with a new message',
    action: 'Create Sermon',
    priority: 'low'
  };
};

// Scripture verses for inspiration
export const getDailyScripture = (): { verse: string; reference: string; theme: string } => {
  const verses = [
    {
      verse: "Preach the word; be prepared in season and out of season; correct, rebuke and encourage—with great patience and careful instruction.",
      reference: "2 Timothy 4:2",
      theme: "Faithful Preaching"
    },
    {
      verse: "How beautiful are the feet of those who bring good news!",
      reference: "Romans 10:15",
      theme: "Gospel Mission"
    },
    {
      verse: "Let the message of Christ dwell among you richly as you teach and admonish one another with all wisdom.",
      reference: "Colossians 3:16",
      theme: "Teaching Wisdom"
    },
    {
      verse: "Above all else, guard your heart, for everything you do flows from it.",
      reference: "Proverbs 4:23",
      theme: "Heart Guard"
    },
    {
      verse: "But as for you, be strong and do not give up, for your work will be rewarded.",
      reference: "2 Chronicles 15:7",
      theme: "Perseverance"
    },
    {
      verse: "And the things you have heard me say in the presence of many witnesses entrust to reliable people who will also be qualified to teach others.",
      reference: "2 Timothy 2:2",
      theme: "Discipleship"
    },
    {
      verse: "Be shepherds of God's flock that is under your care, watching over them—not because you must, but because you are willing, as God wants you to be.",
      reference: "1 Peter 5:2",
      theme: "Shepherding"
    }
  ];

  // Use date to pick a consistent verse for the day
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const verseIndex = dayOfYear % verses.length;
  
  return verses[verseIndex];
};

// Get stats for quick overview
export interface HomeStats {
  totalSermons: number;
  thisMonthSermons: number;
  draftSermons: number;
  upcomingSermons: number;
}

export const getHomeStats = (sermons: any[]): HomeStats => {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return {
    totalSermons: sermons.length,
    thisMonthSermons: sermons.filter(s => {
      if (!s.createdAt) return false;
      const created = new Date(s.createdAt);
      return created >= thisMonth && created < nextMonth;
    }).length,
    draftSermons: sermons.filter(s => s.status === 'draft' || s.status === 'preparing').length,
    upcomingSermons: sermons.filter(s => {
      if (!s.date) return false;
      return new Date(s.date) >= now;
    }).length
  };
};