import React, { useState, useMemo, useCallback, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, Dimensions, TextInput, Platform, Modal, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sparkles, Heart, MessageCircle, Share2, PlusCircle, MapPin, ImagePlus, Send, X, ThumbsUp, Star, Bookmark, Flame, Crown, TrendingUp, Award, Users, Calendar, Zap, Filter, type LucideIcon } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { getPalette, shadow, spacing, radii } from "@/constants/theme";
import { useCommunity } from "@/contexts/CommunityContext";
import { useUser } from "@/contexts/UserContext";
import type { Post, ReactionType } from "@/types/community";
import * as ImagePicker from 'expo-image-picker';
import * as ExpoLocation from 'expo-location';

const { width: screenWidth } = Dimensions.get('window');

type ViewMode = 'feed' | 'trending' | 'challenges' | 'transformations';
type ContentFilter = 'all' | 'tips' | 'reviews' | 'transformations';

export default function CommunityScreen() {
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const [viewMode, setViewMode] = useState<ViewMode>('feed');
  const [contentFilter, setContentFilter] = useState<ContentFilter>('all');
  const [composerOpen, setComposerOpen] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const {
    circles,
    posts,
    isLoading,
    challenges,
    createCircle,
    joinCircle,
    joinChallenge,
    createPost,
    reactToPost,
    addComment,
    savePost,
    sharePost,
    getPostsForCircle,
    getUserMembership,
    getTrendingPosts,
    getTransformations,
  } = useCommunity();

  const [selectedCircleId, setSelectedCircleId] = useState<string>('global');
  const [caption, setCaption] = useState<string>("");
  const [pickedImage, setPickedImage] = useState<string | null>(null);
  const [locName, setLocName] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [creatingCircle, setCreatingCircle] = useState<boolean>(false);
  const [newCircleName, setNewCircleName] = useState<string>("");
  const [newCircleDesc, setNewCircleDesc] = useState<string>("");
  const [commentsForPost, setCommentsForPost] = useState<{ postId: string | null; visible: boolean }>({ postId: null, visible: false });
  const [newComment, setNewComment] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  const [postType, setPostType] = useState<'normal' | 'transformation'>('normal');

  const feed: Post[] = useMemo(() => getPostsForCircle(selectedCircleId), [selectedCircleId, getPostsForCircle]);
  const allPosts: Post[] = useMemo(() => Object.values(posts).flat(), [posts]);
  
  const filteredFeed = useMemo(() => {
    let filtered: Post[] = viewMode === 'feed' ? feed : viewMode === 'trending' ? getTrendingPosts() : viewMode === 'transformations' ? getTransformations() : feed;
    
    if (contentFilter === 'tips') filtered = filtered.filter((p: Post) => p.type === 'tip');
    else if (contentFilter === 'reviews') filtered = filtered.filter((p: Post) => p.type === 'review');
    else if (contentFilter === 'transformations') filtered = filtered.filter((p: Post) => p.type === 'transformation');
    
    return filtered;
  }, [feed, viewMode, contentFilter, getTrendingPosts, getTransformations]);

  const membership = useMemo(() => getUserMembership(selectedCircleId), [selectedCircleId, getUserMembership]);

  const handlePickImage = useCallback(async () => {
    try {
      setBusy(true);
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const uri = res.assets[0]?.uri ?? null;
        setPickedImage(uri);
      }
    } catch (e) {
      console.log('Image pick error', e);
    } finally {
      setBusy(false);
    }
  }, []);

  const handleGetLocation = useCallback(async () => {
    try {
      setBusy(true);
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition((pos) => {
            const { latitude, longitude } = pos.coords;
            setCoords({ latitude, longitude });
            setLocName(`${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
            resolve();
          }, () => resolve());
        });
      } else {
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await ExpoLocation.getCurrentPositionAsync({});
          const latitude = loc.coords.latitude;
          const longitude = loc.coords.longitude;
          setCoords({ latitude, longitude });
          try {
            const places = await ExpoLocation.reverseGeocodeAsync({ latitude, longitude });
            const first = places[0];
            const label = [first?.city, first?.region, first?.country].filter(Boolean).join(', ');
            setLocName(label || `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
          } catch (_e) {
            setLocName(`${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
          }
        }
      }
    } catch (e) {
      console.log('Location error', e);
    } finally {
      setBusy(false);
    }
  }, []);

  const handleCreatePost = useCallback(async () => {
    if (!caption.trim() && !pickedImage) return;
    try {
      setBusy(true);
      await createPost({ 
        circleId: selectedCircleId, 
        caption: caption.trim(), 
        imageUrl: pickedImage, 
        locationName: locName, 
        coords,
        type: postType,
      });
      setCaption("");
      setPickedImage(null);
      setLocName(null);
      setCoords(null);
      setPostType('normal');
      setComposerOpen(false);
    } catch (e) {
      console.log('Create post failed', e);
    } finally {
      setBusy(false);
    }
  }, [caption, pickedImage, locName, coords, selectedCircleId, createPost, postType]);

  const handleCreateCircle = useCallback(async () => {
    if (!newCircleName.trim()) return;
    try {
      setBusy(true);
      const circle = await createCircle({ name: newCircleName.trim(), description: newCircleDesc.trim() });
      setCreatingCircle(false);
      setNewCircleName("");
      setNewCircleDesc("");
      setSelectedCircleId(circle.id);
    } catch (e) {
      console.log('Create circle failed', e);
    } finally {
      setBusy(false);
    }
  }, [newCircleName, newCircleDesc, createCircle]);

  const reactionIcon = useCallback((type: ReactionType) => {
    switch (type) {
      case 'like':
        return <ThumbsUp color={palette.primary} size={16} />;
      case 'love':
        return <Heart color="#FF69B4" size={16} fill="#FF69B4" />;
      case 'sparkle':
        return <Sparkles color="#FFD700" size={16} />;
      case 'wow':
        return <Star color="#FFA500" size={16} fill="#FFA500" />;
      case 'fire':
        return <Flame color="#FF4500" size={16} fill="#FF4500" />;
      case 'queen':
        return <Crown color="#9370DB" size={16} fill="#9370DB" />;
      default:
        return <Heart color={palette.primary} size={16} />;
    }
  }, [palette]);

  const toggleReaction = useCallback((postId: string, type: ReactionType) => {
    reactToPost(selectedCircleId, postId, type);
  }, [selectedCircleId, reactToPost]);

  const handleSavePost = useCallback((postId: string) => {
    savePost(selectedCircleId, postId);
  }, [selectedCircleId, savePost]);

  const openComments = useCallback((postId: string) => {
    setCommentsForPost({ postId, visible: true });
  }, []);

  const submitComment = useCallback(async () => {
    if (!commentsForPost.postId || !newComment.trim()) return;
    try {
      setBusy(true);
      await addComment(selectedCircleId, commentsForPost.postId, newComment.trim());
      setNewComment("");
    } catch (e) {
      console.log('Add comment failed', e);
    } finally {
      setBusy(false);
    }
  }, [commentsForPost.postId, newComment, addComment, selectedCircleId]);

  const stories = useMemo(() => {
    const map = new Map<string, { id: string; name: string; avatar: string }>();
    allPosts.forEach((p: Post) => {
      if (!map.has(p.author.id)) map.set(p.author.id, { id: p.author.id, name: p.author.name, avatar: p.author.avatar });
    });
    return Array.from(map.values()).slice(0, 20);
  }, [allPosts]);

  const likeOverlay = useRef<Record<string, Animated.Value>>({}).current;
  const lastTapRef = useRef<Record<string, number>>({});
  const ensurePostAnim = (id: string) => {
    if (!likeOverlay[id]) likeOverlay[id] = new Animated.Value(0);
    return likeOverlay[id];
  };
  const handlePostImageTap = (postId: string) => {
    const now = Date.now();
    const last = lastTapRef.current[postId] ?? 0;
    if (now - last < 280) {
      toggleReaction(postId, 'love');
      const v = ensurePostAnim(postId);
      v.setValue(0);
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }
    lastTapRef.current[postId] = now;
  };

  const getTotalReactions = (post: Post) => {
    return Object.values(post.reactions).reduce((sum, arr) => sum + (arr?.length ?? 0), 0);
  };

  const getPostTypeIcon = (type?: string) => {
    switch(type) {
      case 'transformation': return <TrendingUp size={14} color={palette.gold} />;
      case 'tip': return <Zap size={14} color={palette.primary} />;
      case 'review': return <Star size={14} color={palette.lavender} />;
      default: return null;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.logoTitle}>Beauty Circle</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} activeOpacity={0.8} testID="toggle-filters" onPress={() => setShowFilters(v => !v)}>
            <Filter color={palette.textPrimary} size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} activeOpacity={0.8} testID="open-composer" onPress={() => setComposerOpen(true)}>
            <PlusCircle color={palette.textPrimary} size={22} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesRow}>
          <TouchableOpacity style={styles.storyItem} activeOpacity={0.9} testID="story-create" onPress={() => setComposerOpen(true)}>
            <View style={[styles.storyAvatar, { backgroundColor: palette.overlayLight, borderStyle: 'dashed' as const }]}> 
              <PlusCircle color={palette.primary} size={20} />
            </View>
            <Text style={styles.storyName}>Share</Text>
          </TouchableOpacity>
          {stories.map(s => (
            <View key={s.id} style={styles.storyItem}>
              <View style={styles.storyRing}>
                <Image source={{ uri: s.avatar }} style={styles.storyAvatarImg} />
              </View>
              <Text style={styles.storyName} numberOfLines={1}>{s.name.split(' ')[0]}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.navBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navContent}>
            {([
              { key: 'feed' as const, label: 'Feed', icon: Sparkles },
              { key: 'trending' as const, label: 'Trending', icon: TrendingUp },
              { key: 'transformations' as const, label: 'Glow Ups', icon: Award },
              { key: 'challenges' as const, label: 'Challenges', icon: Flame },
            ]).map(item => (
              <TouchableOpacity 
                key={item.key} 
                style={[styles.navItem, viewMode === item.key && styles.navItemActive]} 
                onPress={() => setViewMode(item.key)} 
                activeOpacity={0.8}
                testID={`nav-${item.key}`}
              >
                <item.icon size={16} color={viewMode === item.key ? palette.textLight : palette.textSecondary} />
                <Text style={[styles.navText, viewMode === item.key && styles.navTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {showFilters && (
          <View style={styles.filterBar}>
            {(['all', 'tips', 'reviews', 'transformations'] as ContentFilter[]).map(filter => (
              <TouchableOpacity 
                key={filter} 
                style={[styles.filterChip, contentFilter === filter && styles.filterChipActive]} 
                onPress={() => setContentFilter(filter)}
                testID={`filter-${filter}`}
              >
                <Text style={[styles.filterText, contentFilter === filter && styles.filterTextActive]}>
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.circlesRow}>
          {circles.map(c => {
            const joined = !!getUserMembership(c.id);
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.circlePill, selectedCircleId === c.id && styles.circlePillActive]}
                onPress={() => setSelectedCircleId(c.id)}
                activeOpacity={0.9}
                testID={`circle-${c.id}`}
              >
                <Image source={{ uri: c.coverImage }} style={styles.circlePillImg} />
                <View>
                  <Text style={styles.circlePillText} numberOfLines={1}>{c.name}</Text>
                  <View style={styles.circleMeta}>
                    <Users size={10} color={palette.textMuted} />
                    <Text style={styles.circleMetaText}>{c.memberCount}</Text>
                  </View>
                </View>
                {!joined && (
                  <TouchableOpacity style={styles.joinMini} onPress={() => joinCircle(c.id)} testID={`join-${c.id}`}>
                    <Text style={styles.joinMiniText}>Join</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={[styles.createCirclePill, shadow.card]} onPress={() => setCreatingCircle(true)} activeOpacity={0.9} testID="create-circle">
            <PlusCircle color={palette.primary} size={16} />
            <Text style={styles.createCircleText}>New</Text>
          </TouchableOpacity>
        </ScrollView>

        {viewMode === 'challenges' ? (
          <View style={styles.challengesSection}>
            {[
              {
                id: 'challenge_glow_7day',
                icon: Flame,
                color: '#FF4500',
                title: '7-Day Glow Challenge',
                description: 'Daily skincare routine + photo tracking. Share your journey!',
                participants: 2341,
                daysLeft: 5,
                prize: null,
              },
              {
                id: 'challenge_no_makeup',
                icon: Crown,
                color: '#9370DB',
                title: 'No-Makeup Week',
                description: 'Embrace natural beauty & share your glow with the community',
                participants: 892,
                daysLeft: null,
                prize: 'Win $100 gift card',
              },
              {
                id: 'challenge_hydration',
                icon: Sparkles,
                color: '#00CED1',
                title: 'Hydration Hero',
                description: '30 days of proper hydration. Track your water intake daily!',
                participants: 1567,
                daysLeft: 12,
                prize: null,
              },
              {
                id: 'challenge_transformation',
                icon: TrendingUp,
                color: '#FFD700',
                title: '90-Day Transformation',
                description: 'Complete skincare transformation. Document your progress!',
                participants: 445,
                daysLeft: 67,
                prize: 'Featured on homepage',
              },
            ].map((challenge) => {
              const Icon = challenge.icon;
              const userJoined = challenges.some(c => c.id === challenge.id && c.participants.includes(user?.id ?? 'guest'));
              
              return (
                <View key={challenge.id} style={[styles.challengeCard, shadow.card]}>
                  <View style={styles.challengeHeader}>
                    <Icon size={24} color={challenge.color} />
                    <Text style={styles.challengeTitle}>{challenge.title}</Text>
                  </View>
                  <Text style={styles.challengeDesc}>{challenge.description}</Text>
                  <View style={styles.challengeStats}>
                    <View style={styles.challengeStat}>
                      <Users size={16} color={palette.textSecondary} />
                      <Text style={styles.challengeStatText}>{challenge.participants.toLocaleString()} joined</Text>
                    </View>
                    {challenge.daysLeft && (
                      <View style={styles.challengeStat}>
                        <Calendar size={16} color={palette.textSecondary} />
                        <Text style={styles.challengeStatText}>{challenge.daysLeft} days left</Text>
                      </View>
                    )}
                    {challenge.prize && (
                      <View style={styles.challengeStat}>
                        <Award size={16} color={palette.gold} />
                        <Text style={[styles.challengeStatText, { color: palette.gold }]}>{challenge.prize}</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={[styles.challengeBtn, userJoined && styles.challengeBtnJoined]} 
                    onPress={() => joinChallenge(challenge.id)}
                    testID={`join-challenge-${challenge.id}`}
                  >
                    <Text style={[styles.challengeBtnText, userJoined && styles.challengeBtnTextJoined]}>
                      {userJoined ? '✓ Joined' : 'Join Challenge'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.feedWrap}>
            {isLoading && <ActivityIndicator color={palette.primary} />}
            {!isLoading && filteredFeed.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No posts yet. Be the first to share ✨</Text>
              </View>
            )}
            {filteredFeed.map((post) => {
              const overlay = ensurePostAnim(post.id);
              const totalReactions = getTotalReactions(post);
              const isSaved = post.saves?.includes('user-1') ?? false;
              
              return (
                <View key={post.id} style={[styles.postCard, shadow.card, post.isPinned && styles.pinnedPost]} testID={`post-${post.id}`}>
                  {post.isPinned && (
                    <View style={styles.pinnedBadge}>
                      <Star size={12} color={palette.gold} fill={palette.gold} />
                      <Text style={styles.pinnedText}>Pinned</Text>
                    </View>
                  )}
                  
                  <View style={styles.postHeader}>
                    <View style={styles.postUserInfo}>
                      <Image source={{ uri: post.author.avatar }} style={styles.postAvatar} />
                      <View style={styles.postUserDetails}>
                        <View style={styles.postUserRow}>
                          <Text style={styles.postUserName}>{post.author.name}</Text>
                          {post.type && getPostTypeIcon(post.type)}
                        </View>
                        <Text style={styles.postTime}>{new Date(post.createdAt).toLocaleString()}</Text>
                      </View>
                    </View>
                    {!!membership && <Text style={styles.circleTag}>#{circles.find(c=>c.id===selectedCircleId)?.name ?? 'Circle'}</Text>}
                  </View>

                  {post.caption ? (
                    <Text style={styles.postContent}>{post.caption}</Text>
                  ) : null}

                  {post.transformation && (
                    <View style={styles.transformationContainer}>
                      <View style={styles.transformationImages}>
                        <View style={styles.transformationImgWrap}>
                          <Image source={{ uri: post.transformation.before }} style={styles.transformationImg} />
                          <View style={styles.transformationLabel}>
                            <Text style={styles.transformationLabelText}>Before</Text>
                          </View>
                        </View>
                        <View style={styles.transformationImgWrap}>
                          <Image source={{ uri: post.transformation.after }} style={styles.transformationImg} />
                          <View style={[styles.transformationLabel, { backgroundColor: palette.primary }]}>
                            <Text style={styles.transformationLabelText}>After</Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.transformationMeta}>
                        <TrendingUp size={14} color={palette.primary} />
                        <Text style={styles.transformationMetaText}>{post.transformation.daysTaken} days transformation</Text>
                      </View>
                    </View>
                  )}

                  {post.imageUrl && !post.transformation && (
                    <TouchableOpacity activeOpacity={0.9} onPress={() => handlePostImageTap(post.id)}>
                      <View>
                        <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
                        <Animated.View pointerEvents="none" style={[styles.likeOverlay, {
                          opacity: overlay,
                          transform: [{ scale: overlay.interpolate({ inputRange:[0,1], outputRange:[0.6, 1] }) }]
                        }]}>
                          <Heart size={84} color={palette.textLight} fill={palette.textLight} />
                        </Animated.View>
                      </View>
                    </TouchableOpacity>
                  )}

                  {(post.locationName || post.coords) && (
                    <View style={styles.locationRow}>
                      <MapPin color={palette.textSecondary} size={14} />
                      <Text style={styles.locationText}>{post.locationName ?? `${post.coords?.latitude.toFixed(3)}, ${post.coords?.longitude.toFixed(3)}`}</Text>
                    </View>
                  )}

                  <View style={styles.actionsRow}>
                    <View style={styles.actionsLeft}>
                      <TouchableOpacity style={styles.actionIcon} onPress={() => toggleReaction(post.id, 'love')} testID={`react-love-${post.id}`}>
                        <Heart color={palette.textPrimary} size={22} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionIcon} onPress={() => openComments(post.id)} testID={`open-comments-${post.id}`}>
                        <MessageCircle color={palette.textPrimary} size={22} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionIcon} onPress={() => sharePost(post)} testID={`share-${post.id}`}>
                        <Share2 color={palette.textPrimary} size={22} />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.actionIcon} onPress={() => handleSavePost(post.id)}>
                      <Bookmark color={palette.textPrimary} size={22} fill={isSaved ? palette.primary : 'transparent'} />
                    </TouchableOpacity>
                  </View>

                  {totalReactions > 0 && (
                    <View style={styles.reactionsRow}>
                      <View style={styles.reactionIcons}>
                        {Object.entries(post.reactions).map(([type, users]) => {
                          if (!users || users.length === 0) return null;
                          return (
                            <View key={type} style={styles.reactionBubble}>
                              {reactionIcon(type as ReactionType)}
                            </View>
                          );
                        })}
                      </View>
                      <Text style={styles.reactionCount}>{totalReactions} reactions</Text>
                      {post.comments.length > 0 && (
                        <Text style={styles.commentCount}>{post.comments.length} comments</Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={composerOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.composerCard, shadow.elevated]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Post</Text>
              <TouchableOpacity onPress={() => setComposerOpen(false)} testID="close-composer">
                <X color={palette.textPrimary} size={22} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.postTypeSelector}>
              {(['normal', 'transformation'] as const).map(type => (
                <TouchableOpacity 
                  key={type}
                  style={[styles.postTypeChip, postType === type && styles.postTypeChipActive]}
                  onPress={() => setPostType(type)}
                >
                  <Text style={[styles.postTypeText, postType === type && styles.postTypeTextActive]}>
                    {type === 'normal' ? '✨ Post' : '📈 Transformation'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.composerSubtitle}>Posting to {circles.find(c=>c.id===selectedCircleId)?.name ?? 'Circle'}</Text>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder={postType === 'transformation' ? "Share your glow journey..." : "Write a caption..."}
              placeholderTextColor={palette.textSecondary}
              style={styles.captionInput}
              multiline
              testID="caption-input"
            />
            {pickedImage && (
              <Image source={{ uri: pickedImage }} style={styles.previewImage} />
            )}
            <View style={styles.composerActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={handlePickImage} activeOpacity={0.8} testID="pick-image">
                <ImagePlus color={palette.textPrimary} size={18} />
                <Text style={styles.actionText}>Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={handleGetLocation} activeOpacity={0.8} testID="add-location">
                <MapPin color={palette.textPrimary} size={18} />
                <Text style={styles.actionText}>{locName ? (locName.length>15? locName.slice(0,15)+'…': locName) : 'Location'}</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <TouchableOpacity style={[styles.postBtn, shadow.elevated]} onPress={handleCreatePost} activeOpacity={0.9} testID="submit-post">
                {busy ? <ActivityIndicator color={palette.textLight} /> : (
                  <>
                    <Send color={palette.textLight} size={16} />
                    <Text style={styles.postBtnText}>Post</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={creatingCircle} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, shadow.elevated]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Circle</Text>
              <TouchableOpacity onPress={() => setCreatingCircle(false)} testID="close-create-circle">
                <X color={palette.textPrimary} size={22} />
              </TouchableOpacity>
            </View>
            <TextInput
              value={newCircleName}
              onChangeText={setNewCircleName}
              placeholder="Circle name"
              placeholderTextColor={palette.textSecondary}
              style={styles.modalInput}
              testID="circle-name-input"
            />
            <TextInput
              value={newCircleDesc}
              onChangeText={setNewCircleDesc}
              placeholder="Description (optional)"
              placeholderTextColor={palette.textSecondary}
              style={[styles.modalInput, { height: 88 }]}
              multiline
              testID="circle-desc-input"
            />
            <TouchableOpacity style={[styles.createBtn, shadow.elevated]} onPress={handleCreateCircle} activeOpacity={0.9} testID="confirm-create-circle">
              {busy ? <ActivityIndicator color={palette.textLight} /> : (
                <>
                  <PlusCircle color={palette.textLight} size={18} />
                  <Text style={styles.createBtnText}>Create</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={commentsForPost.visible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.commentsCard, shadow.elevated]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setCommentsForPost({ postId: null, visible: false })} testID="close-comments">
                <X color={palette.textPrimary} size={22} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md }}>
              {(() => {
                const post = allPosts.find((p: Post) => p.id === commentsForPost.postId);
                if (!post || !post.comments || post.comments.length === 0) return <Text style={styles.emptyText}>No comments yet. Be the first!</Text>;
                return post.comments.map((c) => (
                  <View key={c.id} style={styles.commentRow}>
                    <Image source={{ uri: c.author.avatar }} style={styles.commentAvatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.commentAuthor}>{c.author.name}</Text>
                      <Text style={styles.commentText}>{c.text}</Text>
                      <Text style={styles.commentTime}>{new Date(c.createdAt).toLocaleDateString()}</Text>
                    </View>
                    <TouchableOpacity>
                      <Heart size={16} color={palette.textMuted} />
                    </TouchableOpacity>
                  </View>
                ));
              })()}
            </ScrollView>
            <View style={styles.commentInputRow}>
              <TextInput
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Write a comment..."
                placeholderTextColor={palette.textSecondary}
                style={styles.commentInput}
                testID="comment-input"
              />
              <TouchableOpacity onPress={submitComment} style={styles.sendCommentBtn} activeOpacity={0.8} testID="send-comment">
                {busy ? <ActivityIndicator color={palette.textLight} /> : <Send color={palette.textLight} size={18} />}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.backgroundStart },
  scrollContent: { paddingBottom: spacing.xxl },

  header: { height: 56, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: palette.divider, backgroundColor: palette.backgroundStart },
  logoTitle: { fontSize: 22, fontWeight: '900' as const, color: palette.textPrimary, letterSpacing: -0.8 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerBtn: { padding: spacing.xs },

  storiesRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md },
  storyItem: { width: 68, alignItems: 'center' },
  storyRing: { width: 64, height: 64, borderRadius: 32, padding: 2, borderWidth: 2.5, borderColor: palette.blush, alignItems: 'center', justifyContent: 'center' },
  storyAvatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: palette.divider },
  storyAvatarImg: { width: 58, height: 58, borderRadius: 29 },
  storyName: { fontSize: 11, color: palette.textSecondary, marginTop: 6, fontWeight: '600' as const },

  navBar: { marginBottom: spacing.sm },
  navContent: { paddingHorizontal: spacing.lg, gap: 8 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.divider },
  navItemActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  navText: { fontSize: 13, fontWeight: '700' as const, color: palette.textSecondary },
  navTextActive: { color: palette.textLight },

  filterBar: { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: 8 },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 16, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.divider },
  filterChipActive: { backgroundColor: palette.overlayLight, borderColor: palette.primary },
  filterText: { fontSize: 12, fontWeight: '600' as const, color: palette.textSecondary },
  filterTextActive: { color: palette.primary },

  circlesRow: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, flexDirection: 'row', gap: 10 },
  circlePill: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 24, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.divider, gap: 10 },
  circlePillActive: { backgroundColor: palette.overlayLight, borderColor: palette.primary, borderWidth: 2 },
  circlePillImg: { width: 32, height: 32, borderRadius: 16 },
  circlePillText: { color: palette.textPrimary, fontWeight: '700' as const, maxWidth: 100, fontSize: 13 },
  circleMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  circleMetaText: { fontSize: 10, color: palette.textMuted, fontWeight: '600' as const },
  joinMini: { marginLeft: 8, backgroundColor: palette.primary, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  joinMiniText: { color: palette.textLight, fontSize: 11, fontWeight: '800' as const },
  createCirclePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 24, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.divider },
  createCircleText: { color: palette.textPrimary, fontWeight: '800' as const, fontSize: 13 },

  feedWrap: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  postCard: { backgroundColor: palette.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: palette.divider, overflow: 'hidden', marginBottom: spacing.sm },
  pinnedPost: { borderColor: palette.gold, borderWidth: 2 },
  pinnedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: palette.gold + '20', paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  pinnedText: { fontSize: 11, fontWeight: '700' as const, color: palette.gold },
  postHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.md },
  postUserInfo: { flexDirection: 'row', alignItems: 'center' },
  postAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: spacing.sm },
  postUserDetails: { },
  postUserRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  postUserName: { fontSize: 14, fontWeight: '800' as const, color: palette.textPrimary },
  postTime: { fontSize: 11, color: palette.textMuted, marginTop: 2 },
  circleTag: { fontSize: 12, color: palette.textSecondary, fontWeight: '700' as const },
  postContent: { fontSize: 15, color: palette.textPrimary, lineHeight: 22, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  
  transformationContainer: { marginTop: spacing.sm },
  transformationImages: { flexDirection: 'row', gap: 4 },
  transformationImgWrap: { flex: 1, position: 'relative' },
  transformationImg: { width: '100%', height: screenWidth * 0.4, backgroundColor: palette.surfaceElevated },
  transformationLabel: { position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  transformationLabelText: { color: palette.textLight, fontSize: 11, fontWeight: '700' as const },
  transformationMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  transformationMetaText: { fontSize: 12, color: palette.textSecondary, fontWeight: '600' as const },

  postImage: { width: '100%', height: screenWidth * 0.9, backgroundColor: palette.surfaceElevated },
  likeOverlay: { position: 'absolute', top: '40%', left: 0, right: 0, alignItems: 'center' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  locationText: { fontSize: 12, color: palette.textSecondary },
  actionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  actionsLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  actionIcon: { },
  reactionsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  reactionIcons: { flexDirection: 'row', alignItems: 'center', marginRight: spacing.xs },
  reactionBubble: { width: 24, height: 24, borderRadius: 12, backgroundColor: palette.backgroundStart, alignItems: 'center', justifyContent: 'center', marginLeft: -6, borderWidth: 1.5, borderColor: palette.surface },
  reactionCount: { fontSize: 13, color: palette.textSecondary, fontWeight: '600' as const },
  commentCount: { fontSize: 13, color: palette.textSecondary, fontWeight: '600' as const, marginLeft: 'auto' as const },

  challengesSection: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  challengeCard: { backgroundColor: palette.surface, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: palette.divider, marginBottom: spacing.md },
  challengeHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  challengeTitle: { fontSize: 18, fontWeight: '800' as const, color: palette.textPrimary },
  challengeDesc: { fontSize: 14, color: palette.textSecondary, marginBottom: spacing.md, lineHeight: 20 },
  challengeStats: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.md },
  challengeStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  challengeStatText: { fontSize: 12, color: palette.textSecondary, fontWeight: '600' as const },
  challengeBtn: { backgroundColor: palette.primary, borderRadius: radii.md, paddingVertical: spacing.sm, alignItems: 'center' },
  challengeBtnJoined: { backgroundColor: palette.overlayLight, borderWidth: 2, borderColor: palette.primary },
  challengeBtnText: { color: palette.textLight, fontWeight: '800' as const, fontSize: 14 },
  challengeBtnTextJoined: { color: palette.primary },

  composerCard: { backgroundColor: palette.surface, padding: spacing.md, borderRadius: radii.lg, borderWidth: 1, borderColor: palette.divider, width: '100%' },
  postTypeSelector: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  postTypeChip: { flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, backgroundColor: palette.surfaceElevated, borderWidth: 1, borderColor: palette.divider, alignItems: 'center' },
  postTypeChipActive: { backgroundColor: palette.overlayLight, borderColor: palette.primary },
  postTypeText: { fontSize: 13, fontWeight: '700' as const, color: palette.textSecondary },
  postTypeTextActive: { color: palette.primary },
  composerSubtitle: { color: palette.textSecondary, paddingHorizontal: spacing.xs, marginBottom: spacing.xs, fontSize: 12 },
  captionInput: { minHeight: 80, color: palette.textPrimary, fontSize: 15 },
  previewImage: { width: '100%', height: 200, borderRadius: radii.md, marginTop: spacing.sm },
  composerActions: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, backgroundColor: palette.overlayLight, borderRadius: radii.md },
  actionText: { color: palette.textPrimary, fontWeight: '600' as const, fontSize: 12 },
  postBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: palette.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.md },
  postBtnText: { color: palette.textLight, fontWeight: '800' as const },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.lg },
  modalCard: { backgroundColor: palette.surface, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: palette.divider },
  commentsCard: { backgroundColor: palette.surface, borderRadius: radii.lg, paddingBottom: spacing.sm, borderWidth: 1, borderColor: palette.divider, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  modalTitle: { color: palette.textPrimary, fontWeight: '900' as const, fontSize: 20 },
  modalInput: { backgroundColor: palette.surfaceElevated, borderRadius: radii.md, padding: spacing.md, color: palette.textPrimary, marginBottom: spacing.md, borderWidth: 1, borderColor: palette.divider },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: palette.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.md, alignSelf: 'flex-end' },
  createBtnText: { color: palette.textLight, fontWeight: '800' as const },

  commentRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md, alignItems: 'flex-start' },
  commentAvatar: { width: 32, height: 32, borderRadius: 16 },
  commentAuthor: { color: palette.textPrimary, fontWeight: '800' as const, fontSize: 13 },
  commentText: { color: palette.textPrimary, fontSize: 14, marginTop: 2, lineHeight: 20 },
  commentTime: { color: palette.textMuted, fontSize: 11, marginTop: 4 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: palette.divider },
  commentInput: { flex: 1, backgroundColor: palette.surfaceElevated, borderRadius: radii.md, paddingHorizontal: spacing.md, color: palette.textPrimary, borderWidth: 1, borderColor: palette.divider, height: 40 },
  sendCommentBtn: { backgroundColor: palette.primary, padding: spacing.sm, borderRadius: radii.md },

  emptyState: { backgroundColor: palette.surface, borderRadius: radii.lg, padding: spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: palette.divider },
  emptyText: { color: palette.textSecondary, fontSize: 14, textAlign: 'center' },
});
