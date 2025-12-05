// Local storage utilities for Coach2Coach platform
export interface CoachProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  bio: string;
  location: string;
  yearsExperience: string;
  sports: string[];
  levels: string[];
  specialties: string[];
  achievements: string[];
  website?: string;
  socialLinks: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export interface Resource {
  id: string;
  coachId: string;
  title: string;
  description: string;
  price: number;
  sports: string[];
  levels: string[];
  category: string;
  fileUrls?: string[];
  previewImages?: string[];
  status: 'pending' | 'active' | 'rejected' | 'inactive';
  downloads: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

// User management
export const userStorage = {
  getUsers: (): User[] => {
    const users = localStorage.getItem('coach2coach_users');
    return users ? JSON.parse(users) : [];
  },

  saveUser: (user: User): void => {
    const users = userStorage.getUsers();
    const existingIndex = users.findIndex(u => u.id === user.id);
    
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    
    localStorage.setItem('coach2coach_users', JSON.stringify(users));
  },

  getUserByEmail: (email: string): User | null => {
    const users = userStorage.getUsers();
    return users.find(u => u.email === email) || null;
  },

  getUserById: (id: string): User | null => {
    const users = userStorage.getUsers();
    return users.find(u => u.id === id) || null;
  }
};

// Session management
export const sessionStorage = {
  getCurrentUser: (): User | null => {
    const session = localStorage.getItem('coach2coach_session');
    if (!session) return null;
    
    const { userId } = JSON.parse(session);
    return userStorage.getUserById(userId);
  },

  setCurrentUser: (user: User): void => {
    localStorage.setItem('coach2coach_session', JSON.stringify({ userId: user.id }));
  },

  clearSession: (): void => {
    localStorage.removeItem('coach2coach_session');
  }
};

// Coach profile management
export const profileStorage = {
  getProfiles: (): CoachProfile[] => {
    const profiles = localStorage.getItem('coach2coach_profiles');
    return profiles ? JSON.parse(profiles) : [];
  },

  saveProfile: (profile: CoachProfile): void => {
    try {
      console.log('Attempting to save profile:', profile);
      const profiles = profileStorage.getProfiles();
      const existingIndex = profiles.findIndex(p => p.id === profile.id);
      
      if (existingIndex >= 0) {
        profiles[existingIndex] = { ...profile, updatedAt: new Date().toISOString() };
        console.log('Updated existing profile at index:', existingIndex);
      } else {
        profiles.push(profile);
        console.log('Added new profile, total profiles:', profiles.length);
      }
      
      localStorage.setItem('coach2coach_profiles', JSON.stringify(profiles));
      console.log('Profile saved to localStorage successfully');
    } catch (error) {
      console.error('Error in saveProfile:', error);
      throw error;
    }
  },

  getProfileByUserId: (userId: string): CoachProfile | null => {
    try {
      const profiles = profileStorage.getProfiles();
      const profile = profiles.find(p => p.userId === userId) || null;
      console.log('Retrieved profile for userId:', userId, profile);
      return profile;
    } catch (error) {
      console.error('Error in getProfileByUserId:', error);
      return null;
    }
  },

  getProfileById: (id: string): CoachProfile | null => {
    try {
      const profiles = profileStorage.getProfiles();
      const profile = profiles.find(p => p.id === id) || null;
      console.log('Retrieved profile for id:', id, profile);
      return profile;
    } catch (error) {
      console.error('Error in getProfileById:', error);
      return null;
    }
  }
};

// Resource management
export const resourceStorage = {
  getResources: (): Resource[] => {
    const resources = localStorage.getItem('coach2coach_resources');
    return resources ? JSON.parse(resources) : [];
  },

  saveResource: (resource: Resource): void => {
    const resources = resourceStorage.getResources();
    const existingIndex = resources.findIndex(r => r.id === resource.id);
    
    if (existingIndex >= 0) {
      resources[existingIndex] = { ...resource, updatedAt: new Date().toISOString() };
    } else {
      resources.push(resource);
    }
    
    localStorage.setItem('coach2coach_resources', JSON.stringify(resources));
  },

  getResourcesByCoachId: (coachId: string): Resource[] => {
    const resources = resourceStorage.getResources();
    return resources.filter(r => r.coachId === coachId);
  },

  getActiveResources: (): Resource[] => {
    const resources = resourceStorage.getResources();
    return resources.filter(r => r.status === 'active');
  }
};

// Utility functions
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Initialize with sample data if empty
export const initializeSampleData = (): void => {
  // Add sample data for testing if none exists
  const existingUsers = userStorage.getUsers();
  const existingProfiles = profileStorage.getProfiles();
  const existingResources = resourceStorage.getResources();
  
  // Only add sample data if database is empty
  if (existingUsers.length === 0) {
    // Sample users
    const sampleUsers: User[] = [
      {
        id: 'user1',
        email: 'mike.johnson@email.com',
        firstName: 'Mike',
        lastName: 'Johnson',
        createdAt: '2024-01-01T10:00:00Z'
      },
      {
        id: 'user2',
        email: 'sarah.williams@email.com',
        firstName: 'Sarah',
        lastName: 'Williams',
        createdAt: '2024-01-02T10:00:00Z'
      },
      {
        id: 'user3',
        email: 'tom.davis@email.com',
        firstName: 'Tom',
        lastName: 'Davis',
        createdAt: '2024-01-03T10:00:00Z'
      }
    ];
    
    sampleUsers.forEach(user => userStorage.saveUser(user));
  }
  
  if (existingProfiles.length === 0) {
    // Sample coach profiles
    const sampleProfiles: CoachProfile[] = [
      {
        id: 'coach1',
        userId: 'user1',
        firstName: 'Chan',
        lastName: 'Brown',
        email: 'chan.brown@email.com',
        title: 'Baseball Coach & Skills Development Specialist',
        bio: 'Experienced baseball coach with a passion for developing young athletes and teaching fundamental skills. Specializing in hitting mechanics, fielding techniques, and game strategy.',
        location: 'Atlanta, GA',
        yearsExperience: '6-10',
        sports: ['Baseball'],
        levels: ['Youth (Ages 6-12)', 'Middle School', 'High School', 'Travel/Club'],
        specialties: ['Hitting Mechanics', 'Fielding', 'Player Development', 'Game Strategy'],
        achievements: [
          'Regional Championship Winner 2023',
          'Coach of the Year - Georgia Baseball League 2022',
          'Developed 12+ players who earned college scholarships',
          'Former College Baseball Player'
        ],
        website: '',
        socialLinks: {
          twitter: '@CoachChanB',
          instagram: '@chanbrownbaseball'
        },
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z'
      },
      {
        id: 'coach2',
        userId: 'user2',
        firstName: 'Robby',
        lastName: 'Gilbert',
        email: 'robby.gilbert@email.com',
        title: 'Baseball Coach & Pitching Specialist',
        bio: 'Dedicated baseball coach specializing in pitching mechanics and player development. Expert in training young pitchers and developing arm strength safely.',
        location: 'Birmingham, AL',
        yearsExperience: '11-15',
        sports: ['Baseball'],
        levels: ['Middle School', 'High School', 'Travel/Club'],
        specialties: ['Pitching Mechanics', 'Arm Care', 'Player Development', 'Mental Training'],
        achievements: [
          'State Championship 2023',
          'Developed 8+ college pitchers',
          'Certified Pitching Instructor',
          'Perfect Safety Record - 10 years'
        ],
        website: '',
        socialLinks: {
          twitter: '@CoachRobbyG',
          instagram: '@robbygilbertbaseball'
        },
        createdAt: '2024-01-02T10:00:00Z',
        updatedAt: '2024-01-02T10:00:00Z'
      },
      {
        id: 'coach3',
        userId: 'user3',
        firstName: 'Jamie',
        lastName: 'Suggs',
        email: 'jamie.suggs@email.com',
        title: 'Baseball Coach & Hitting Instructor',
        bio: 'Passionate baseball coach focused on hitting instruction and offensive strategy. Specializes in developing young hitters and improving batting averages.',
        location: 'Nashville, TN',
        yearsExperience: '6-10',
        sports: ['Baseball'],
        levels: ['Youth (Ages 6-12)', 'Middle School', 'High School'],
        specialties: ['Hitting Instruction', 'Offensive Strategy', 'Player Development', 'Fundamentals'],
        achievements: [
          'Regional Championship 2022',
          'Hitting Instructor Certification',
          'Developed 15+ .300+ hitters',
          'Team Batting Average Leader 3 years'
        ],
        website: '',
        socialLinks: {
          instagram: '@jamiesuggsbaseball'
        },
        createdAt: '2024-01-03T10:00:00Z',
        updatedAt: '2024-01-03T10:00:00Z'
      },
      {
        id: 'coach4',
        userId: 'user4',
        firstName: 'Willie',
        lastName: 'Hildebrand',
        email: 'willie.hildebrand@email.com',
        title: 'Swimming Coach & Technique Specialist',
        bio: 'Experienced swimming coach with expertise in stroke technique, training programs, and competitive swimming. Focused on developing swimmers at all levels.',
        location: 'Austin, TX',
        yearsExperience: '11-15',
        sports: ['Swimming'],
        levels: ['Youth (Ages 6-12)', 'Middle School', 'High School', 'Collegiate'],
        specialties: ['Stroke Technique', 'Training Programs', 'Competitive Swimming', 'Conditioning'],
        achievements: [
          'State Championship Coach 2023',
          'USA Swimming Certified',
          'Developed 20+ state qualifiers',
          'Masters Swimming Instructor'
        ],
        website: '',
        socialLinks: {
          twitter: '@CoachWillieH'
        },
        createdAt: '2024-01-04T10:00:00Z',
        updatedAt: '2024-01-04T10:00:00Z'
      },
      {
        id: 'coach5',
        userId: 'user5',
        firstName: 'P.J.',
        lastName: 'Katz',
        email: 'pj.katz@email.com',
        title: 'Football Coach & Offensive Coordinator',
        bio: 'Football coach specializing in offensive strategy and quarterback development. Expert in play calling, game planning, and developing young quarterbacks.',
        location: 'Dallas, TX',
        yearsExperience: '11-15',
        sports: ['Football'],
        levels: ['High School', 'Travel/Club', 'Collegiate'],
        specialties: ['Offensive Strategy', 'Quarterback Development', 'Play Calling', 'Game Planning'],
        achievements: [
          'District Championship 2023',
          'Offensive Coordinator of the Year 2022',
          'Developed 5+ college quarterbacks',
          'High School Coaching Certification'
        ],
        website: '',
        socialLinks: {
          twitter: '@CoachPJKatz'
        },
        createdAt: '2024-01-05T10:00:00Z',
        updatedAt: '2024-01-05T10:00:00Z'
      },
      {
        id: 'coach6',
        userId: 'user6',
        firstName: 'Trae',
        lastName: 'Owens',
        email: 'trae.owens@email.com',
        title: 'Football Coach & Defensive Specialist',
        bio: 'Football coach focused on defensive strategy and player development. Specializes in developing strong defensive units and teaching fundamentals.',
        location: 'Houston, TX',
        yearsExperience: '6-10',
        sports: ['Football'],
        levels: ['Middle School', 'High School', 'Travel/Club'],
        specialties: ['Defensive Strategy', 'Player Development', 'Fundamentals', 'Team Building'],
        achievements: [
          'Regional Defense Leader 2023',
          'Defensive Coordinator Certification',
          'Led top-ranked defense 2 years',
          'Youth Football Safety Certified'
        ],
        website: '',
        socialLinks: {
          instagram: '@traeowensfootball'
        },
        createdAt: '2024-01-06T10:00:00Z',
        updatedAt: '2024-01-06T10:00:00Z'
      },
      {
        id: 'coach7',
        userId: 'user7',
        firstName: 'Ryan',
        lastName: 'Sutton',
        email: 'ryan.sutton@email.com',
        title: 'Soccer Coach & Tactical Specialist',
        bio: 'Soccer coach with expertise in tactical training, team coordination, and player development. Focused on developing technical skills and game understanding.',
        location: 'Seattle, WA',
        yearsExperience: '6-10',
        sports: ['Soccer'],
        levels: ['Youth (Ages 6-12)', 'Middle School', 'High School'],
        specialties: ['Tactical Training', 'Technical Skills', 'Player Development', 'Game Strategy'],
        achievements: [
          'State Cup Winner 2023',
          'USSF Coaching License',
          'Developed 10+ college players',
          'Regional Coach of the Year 2022'
        ],
        website: '',
        socialLinks: {
          twitter: '@CoachRyanS',
          instagram: '@ryansuttonsoccer'
        },
        createdAt: '2024-01-07T10:00:00Z',
        updatedAt: '2024-01-07T10:00:00Z'
      }
    ];
    
    sampleProfiles.forEach(profile => profileStorage.saveProfile(profile));
  }
  
  if (existingUsers.length === 0) {
    // Add corresponding users for the coaches
    const additionalUsers: User[] = [
      {
        id: 'user4',
        email: 'willie.hildebrand@email.com',
        firstName: 'Willie',
        lastName: 'Hildebrand',
        createdAt: '2024-01-04T10:00:00Z'
      },
      {
        id: 'user5',
        email: 'pj.katz@email.com',
        firstName: 'P.J.',
        lastName: 'Katz',
        createdAt: '2024-01-05T10:00:00Z'
      },
      {
        id: 'user6',
        email: 'trae.owens@email.com',
        firstName: 'Trae',
        lastName: 'Owens',
        createdAt: '2024-01-06T10:00:00Z'
      },
      {
        id: 'user7',
        email: 'ryan.sutton@email.com',
        firstName: 'Ryan',
        lastName: 'Sutton',
        createdAt: '2024-01-07T10:00:00Z'
      }
    ];
    
    additionalUsers.forEach(user => userStorage.saveUser(user));
  }
  
  // Clear any existing resources to start fresh
  localStorage.removeItem('coach2coach_resources');
}