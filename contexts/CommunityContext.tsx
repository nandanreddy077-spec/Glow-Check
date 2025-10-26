import { useCallback, useEffect, useMemo, useState } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { Circle, Comment, CreateCircleInput, CreatePostInput, Post, ReactionType, UserMembership, Challenge, CreateChallengeInput } from '@/types/community';
import { useUser } from '@/contexts/UserContext';

const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Community storage getItem error:', error);
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        try {
          localStorage.setItem(key, value);
        } catch {
          console.warn('LocalStorage quota exceeded. Trimming community history.');
          const parsed = JSON.parse(value ?? '[]');
          if (Array.isArray(parsed) && parsed.length > 50) {
            localStorage.setItem(key, JSON.stringify(parsed.slice(-50)));
            return;
          }
        }
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Community storage setItem error:', error);
    }
  },
};

const CIRCLES_KEY = 'glow_community_circles_v1';
const POSTS_KEY = 'glow_community_posts_v1';
const MEMBERSHIPS_KEY = 'glow_community_memberships_v1';

function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export const [CommunityProvider, useCommunity] = createContextHook(() => {
  const { user } = useUser();

  const [circles, setCircles] = useState<Circle[]>([]);
  const [posts, setPosts] = useState<Record<string, Post[]>>({});
  const [memberships, setMemberships] = useState<UserMembership[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [rawCircles, rawPosts, rawMemberships] = await Promise.all([
        storage.getItem(CIRCLES_KEY),
        storage.getItem(POSTS_KEY),
        storage.getItem(MEMBERSHIPS_KEY),
      ]);

      let nextCircles: Circle[] = createDefaultCircles();
      let nextPosts: Record<string, Post[]> = {};
      let nextMemberships: UserMembership[] = [];
      
      // Parse circles with error handling
      if (rawCircles) {
        try {
          const parsed = JSON.parse(rawCircles);
          nextCircles = Array.isArray(parsed) ? parsed : createDefaultCircles();
        } catch (parseError) {
          console.error('Error parsing circles data:', parseError);
          await storage.setItem(CIRCLES_KEY, JSON.stringify(createDefaultCircles()));
          nextCircles = createDefaultCircles();
        }
      }
      
      // Parse posts with error handling
      if (rawPosts) {
        try {
          const parsed = JSON.parse(rawPosts);
          nextPosts = typeof parsed === 'object' && parsed !== null ? parsed : createDefaultPosts(nextCircles);
        } catch (parseError) {
          console.error('Error parsing posts data:', parseError);
          nextPosts = createDefaultPosts(nextCircles);
          await storage.setItem(POSTS_KEY, JSON.stringify(nextPosts));
        }
      } else {
        nextPosts = createDefaultPosts(nextCircles);
      }
      
      // Parse memberships with error handling
      if (rawMemberships) {
        try {
          const parsed = JSON.parse(rawMemberships);
          nextMemberships = Array.isArray(parsed) ? parsed : [];
        } catch (parseError) {
          console.error('Error parsing memberships data:', parseError);
          await storage.setItem(MEMBERSHIPS_KEY, JSON.stringify([]));
          nextMemberships = [];
        }
      }

      setCircles(nextCircles);
      setPosts(nextPosts);
      setMemberships(nextMemberships);
      setError(null);
    } catch (e) {
      console.error('Failed to load community data', e);
      setError('Failed to load community data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const persist = useCallback(async (
    next: Partial<{ circles: Circle[]; posts: Record<string, Post[]>; memberships: UserMembership[] }>
  ) => {
    try {
      if (next.circles) await storage.setItem(CIRCLES_KEY, JSON.stringify(next.circles));
      if (next.posts) await storage.setItem(POSTS_KEY, JSON.stringify(next.posts));
      if (next.memberships) await storage.setItem(MEMBERSHIPS_KEY, JSON.stringify(next.memberships));
    } catch (e) {
      console.error('Failed to persist community data', e);
    }
  }, []);

  const createCircle = useCallback(async (input: CreateCircleInput) => {
    const ownerId = user?.id ?? 'guest';
    const newCircle: Circle = {
      id: generateId('circle'),
      name: input.name,
      description: input.description ?? '',
      coverImage: input.coverImage ?? 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=1200',
      creatorId: ownerId,
      memberCount: 1,
      createdAt: Date.now(),
      isPrivate: input.isPrivate ?? false,
      tags: input.tags ?? [],
      locationName: input.locationName ?? null,
    };

    const nextCircles = [newCircle, ...circles];
    setCircles(nextCircles);

    const nextMemberships: UserMembership[] = [
      ...memberships,
      { userId: ownerId, circleId: newCircle.id, role: 'owner', joinedAt: Date.now() } as UserMembership,
    ];
    setMemberships(nextMemberships);

    const nextPosts = { ...posts, [newCircle.id]: [] };
    setPosts(nextPosts);

    await persist({ circles: nextCircles, memberships: nextMemberships as UserMembership[], posts: nextPosts });
    return newCircle;
  }, [circles, memberships, posts, persist, user?.id]);

  const joinCircle = useCallback(async (circleId: string) => {
    const userId = user?.id ?? 'guest';
    if (memberships.some(m => m.userId === userId && m.circleId === circleId)) return;
    const nextMemberships: UserMembership[] = [...memberships, { userId, circleId, role: 'member', joinedAt: Date.now() } as UserMembership];
    setMemberships(nextMemberships);
    const nextCircles = circles.map(c => (c.id === circleId ? { ...c, memberCount: c.memberCount + 1 } : c));
    setCircles(nextCircles);
    await persist({ memberships: nextMemberships as UserMembership[], circles: nextCircles });
  }, [memberships, user?.id, circles, persist]);

  const leaveCircle = useCallback(async (circleId: string) => {
    const userId = user?.id ?? 'guest';
    const nextMemberships: UserMembership[] = memberships.filter(m => !(m.userId === userId && m.circleId === circleId));
    setMemberships(nextMemberships);
    const nextCircles = circles.map(c => (c.id === circleId ? { ...c, memberCount: Math.max(0, c.memberCount - 1) } : c));
    setCircles(nextCircles);
    await persist({ memberships: nextMemberships as UserMembership[], circles: nextCircles });
  }, [memberships, user?.id, circles, persist]);

  const createPost = useCallback(async (input: CreatePostInput) => {
    const author = {
      id: user?.id ?? 'guest',
      name: user?.name ?? 'Guest',
      avatar: user?.avatar ?? 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    };
    const p: Post = {
      id: generateId('post'),
      circleId: input.circleId,
      author,
      caption: input.caption,
      imageUrl: input.imageUrl ?? null,
      locationName: input.locationName ?? null,
      coords: input.coords ?? null,
      createdAt: Date.now(),
      reactions: {},
      comments: [],
      saves: [],
      shares: 0,
      type: input.type ?? 'normal',
      transformation: input.transformation,
      challengeId: input.challengeId,
      tags: input.tags ?? [],
    };
    const circlePosts = posts[input.circleId] ?? [];
    const nextPosts = { ...posts, [input.circleId]: [p, ...circlePosts].slice(0, 200) };
    setPosts(nextPosts);
    await persist({ posts: nextPosts });
    return p;
  }, [user, posts, persist]);

  const reactToPost = useCallback(async (circleId: string, postId: string, type: ReactionType) => {
    const userId = user?.id ?? 'guest';
    const nextPosts = { ...posts };
    const list = nextPosts[circleId] ?? [];
    const idx = list.findIndex(p => p.id === postId);
    if (idx === -1) return;
    const target = list[idx];
    const userExisting = Object.entries(target.reactions).find(([t, users]) => users.includes(userId));
    if (userExisting) {
      const [prevType] = userExisting as [ReactionType, string[]];
      if (prevType === type) {
        nextPosts[circleId][idx] = {
          ...target,
          reactions: { ...target.reactions, [type]: (target.reactions[type] ?? []).filter(id => id !== userId) },
        };
      } else {
        nextPosts[circleId][idx] = {
          ...target,
          reactions: {
            ...target.reactions,
            [prevType]: (target.reactions[prevType] ?? []).filter(id => id !== userId),
            [type]: [...(target.reactions[type] ?? []), userId],
          },
        };
      }
    } else {
      nextPosts[circleId][idx] = {
        ...target,
        reactions: { ...target.reactions, [type]: [...(target.reactions[type] ?? []), userId] },
      };
    }
    setPosts(nextPosts);
    await persist({ posts: nextPosts });
  }, [posts, user?.id, persist]);

  const addComment = useCallback(async (circleId: string, postId: string, text: string) => {
    const author = {
      id: user?.id ?? 'guest',
      name: user?.name ?? 'Guest',
      avatar: user?.avatar ?? 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    };
    const comment: Comment = {
      id: generateId('cmt'),
      text,
      author,
      createdAt: Date.now(),
      likes: [],
    };
    const nextPosts = { ...posts };
    nextPosts[circleId] = (nextPosts[circleId] ?? []).map(p => (p.id === postId ? { ...p, comments: [...p.comments, comment] } : p));
    setPosts(nextPosts);
    await persist({ posts: nextPosts });
    return comment;
  }, [posts, user, persist]);

  const getCircleById = useCallback((id: string) => circles.find(c => c.id === id) ?? null, [circles]);
  const getPostsForCircle = useCallback((id: string) => posts[id] ?? [], [posts]);
  const getUserMembership = useCallback((circleId: string) => {
    const userId = user?.id ?? 'guest';
    return memberships.find(m => m.userId === userId && m.circleId === circleId) ?? null;
  }, [memberships, user?.id]);

  const savePost = useCallback(async (circleId: string, postId: string) => {
    const userId = user?.id ?? 'guest';
    const nextPosts = { ...posts };
    const list = nextPosts[circleId] ?? [];
    const idx = list.findIndex(p => p.id === postId);
    if (idx === -1) return;
    const target = list[idx];
    const saves = target.saves ?? [];
    const isSaved = saves.includes(userId);
    nextPosts[circleId][idx] = {
      ...target,
      saves: isSaved ? saves.filter(id => id !== userId) : [...saves, userId],
    };
    setPosts(nextPosts);
    await persist({ posts: nextPosts });
  }, [posts, user?.id, persist]);

  const getTrendingPosts = useCallback(() => {
    const allPosts = Object.values(posts).flat();
    return allPosts.sort((a, b) => {
      const aScore = Object.values(a.reactions).reduce((sum, arr) => sum + (arr?.length ?? 0), 0) * 2 + a.comments.length + (a.saves?.length ?? 0) * 3;
      const bScore = Object.values(b.reactions).reduce((sum, arr) => sum + (arr?.length ?? 0), 0) * 2 + b.comments.length + (b.saves?.length ?? 0) * 3;
      return bScore - aScore;
    }).slice(0, 50);
  }, [posts]);

  const getTransformations = useCallback(() => {
    const allPosts = Object.values(posts).flat();
    return allPosts.filter(p => p.type === 'transformation').sort((a, b) => b.createdAt - a.createdAt);
  }, [posts]);

  const createChallenge = useCallback(async (input: CreateChallengeInput) => {
    const challenge: Challenge = {
      id: generateId('challenge'),
      title: input.title,
      description: input.description,
      duration: input.duration,
      startDate: Date.now(),
      endDate: Date.now() + input.duration * 24 * 60 * 60 * 1000,
      participants: [],
      posts: [],
      prize: input.prize,
      category: input.category,
      difficulty: input.difficulty,
    };
    const nextChallenges = [challenge, ...challenges];
    setChallenges(nextChallenges);
    return challenge;
  }, [challenges]);

  return useMemo(() => ({
    isLoading,
    error,
    circles,
    posts,
    memberships,
    challenges,
    createCircle,
    joinCircle,
    leaveCircle,
    createPost,
    reactToPost,
    addComment,
    savePost,
    getCircleById,
    getPostsForCircle,
    getUserMembership,
    getTrendingPosts,
    getTransformations,
    createChallenge,
  }), [
    isLoading,
    error,
    circles,
    posts,
    memberships,
    challenges,
    createCircle,
    joinCircle,
    leaveCircle,
    createPost,
    reactToPost,
    addComment,
    savePost,
    getCircleById,
    getPostsForCircle,
    getUserMembership,
    getTrendingPosts,
    getTransformations,
    createChallenge,
  ]);
});

function createDefaultCircles(): Circle[] {
  return [
    {
      id: 'global',
      name: 'Global Glow',
      description: 'Share your glow with everyone',
      coverImage: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200',
      creatorId: 'system',
      memberCount: 2400,
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
      isPrivate: false,
      tags: ['inspiration', 'daily'],
      locationName: null,
    },
    {
      id: 'city-style',
      name: 'City Style',
      description: 'Urban routines and tips',
      coverImage: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=1200',
      creatorId: 'system',
      memberCount: 847,
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
      isPrivate: false,
      tags: ['style', 'routine'],
      locationName: null,
    },
  ];
}

function createDefaultPosts(cs: Circle[]): Record<string, Post[]> {
  const byCircle: Record<string, Post[]> = {};
  cs.forEach(c => (byCircle[c.id] = []));
  byCircle['global'] = [
    {
      id: generateId('post'),
      circleId: 'global',
      author: {
        id: 'isabella',
        name: 'Isabella Rose',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      },
      caption: 'My 30-day glow journey! Consistent routine + hydration = results 💕',
      imageUrl: null,
      locationName: null,
      coords: null,
      createdAt: Date.now() - 1000 * 60 * 60 * 2,
      reactions: { love: ['u1', 'u2', 'u3'], fire: ['u4', 'u5'] },
      comments: [],
      saves: ['u1'],
      shares: 5,
      type: 'transformation',
      transformation: {
        before: 'https://images.unsplash.com/photo-1616683693094-2c4a49cf8b97?w=400',
        after: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
        daysTaken: 30,
      },
      isPinned: true,
    },
    {
      id: generateId('post'),
      circleId: 'global',
      author: {
        id: 'emma',
        name: 'Emma Chen',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      },
      caption: 'Morning skincare tip: Always apply products from thinnest to thickest consistency! 🌸',
      imageUrl: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800',
      locationName: null,
      coords: null,
      createdAt: Date.now() - 1000 * 60 * 60 * 5,
      reactions: { love: ['u1', 'u2'], sparkle: ['u3'] },
      comments: [],
      saves: ['u2', 'u3'],
      shares: 2,
      type: 'tip',
    },
  ];
  return byCircle;
}
