export type ReactionType = 'like' | 'love' | 'sparkle' | 'wow' | 'fire' | 'queen';

export interface AuthorRef {
  id: string;
  name: string;
  avatar: string;
}

export interface Comment {
  id: string;
  text: string;
  author: AuthorRef;
  createdAt: number;
  likes: string[];
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  duration: number;
  startDate: number;
  endDate: number;
  participants: string[];
  posts: string[];
  prize?: string;
  category: 'skincare' | 'makeup' | 'wellness' | 'transformation';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface ProductReview {
  id: string;
  productName: string;
  brand: string;
  category: string;
  rating: number;
  review: string;
  beforeAfter?: { before: string; after: string };
  author: AuthorRef;
  createdAt: number;
  helpful: string[];
}

export interface ExpertTip {
  id: string;
  expert: AuthorRef & { verified: boolean; specialty: string };
  tip: string;
  category: string;
  saves: string[];
  createdAt: number;
}

export interface Post {
  id: string;
  circleId: string;
  author: AuthorRef;
  caption: string;
  imageUrl: string | null;
  locationName: string | null;
  coords: { latitude: number; longitude: number } | null;
  createdAt: number;
  reactions: Partial<Record<ReactionType, string[]>>;
  comments: Comment[];
  saves: string[];
  shares: number;
  type?: 'normal' | 'transformation' | 'tip' | 'review' | 'challenge';
  transformation?: { before: string; after: string; daysTaken: number };
  challengeId?: string;
  isPinned?: boolean;
  tags?: string[];
}

export interface Circle {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  creatorId: string;
  memberCount: number;
  createdAt: number;
  isPrivate: boolean;
  tags: string[];
  locationName: string | null;
  activeChallenges?: string[];
  topContributors?: { userId: string; postCount: number }[];
  weeklyTheme?: string;
}

export interface UserMembership {
  userId: string;
  circleId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: number;
}

export interface CreateCircleInput {
  name: string;
  description?: string;
  coverImage?: string;
  isPrivate?: boolean;
  tags?: string[];
  locationName?: string | null;
}

export interface CreatePostInput {
  circleId: string;
  caption: string;
  imageUrl?: string | null;
  locationName?: string | null;
  coords?: { latitude: number; longitude: number } | null;
  type?: 'normal' | 'transformation' | 'tip' | 'review' | 'challenge';
  transformation?: { before: string; after: string; daysTaken: number };
  challengeId?: string;
  tags?: string[];
}

export interface CreateChallengeInput {
  title: string;
  description: string;
  duration: number;
  category: 'skincare' | 'makeup' | 'wellness' | 'transformation';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prize?: string;
}
