export type ReactionType = 'like' | 'love' | 'sparkle' | 'wow';

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
}
