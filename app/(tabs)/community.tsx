import React, { useState, useMemo, useCallback, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, Dimensions, TextInput, Platform, Modal, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Sparkles, Heart, MessageCircle, Share2, PlusCircle, MapPin, ImagePlus, Send, X, ThumbsUp, Star, Bookmark } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { getPalette, shadow, spacing, radii } from "@/constants/theme";
import { useCommunity } from "@/contexts/CommunityContext";
import type { Post, ReactionType } from "@/types/community";
import * as ImagePicker from 'expo-image-picker';
import * as ExpoLocation from 'expo-location';

const { width: screenWidth } = Dimensions.get('window');

export default function CommunityScreen() {
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [minimalMode, setMinimalMode] = useState<boolean>(true);
  const [composerOpen, setComposerOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'following' | 'explore'>('following');

  const {
    circles,
    posts,
    memberships,
    isLoading,
    createCircle,
    joinCircle,
    createPost,
    reactToPost,
    addComment,
    getPostsForCircle,
    getUserMembership,
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

  const feed: Post[] = useMemo(() => getPostsForCircle(selectedCircleId), [selectedCircleId, getPostsForCircle]);
  const allPosts: Post[] = useMemo(() => Object.values(posts).flat(), [posts]);
  const exploreGrid: Post[] = useMemo(() => allPosts.slice().sort((a: Post, b: Post) => (b.reactions?.love?.length ?? 0) - (a.reactions?.love?.length ?? 0)), [allPosts]);
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
      await createPost({ circleId: selectedCircleId, caption: caption.trim(), imageUrl: pickedImage, locationName: locName, coords });
      setCaption("");
      setPickedImage(null);
      setLocName(null);
      setCoords(null);
      setComposerOpen(false);
    } catch (e) {
      console.log('Create post failed', e);
    } finally {
      setBusy(false);
    }
  }, [caption, pickedImage, locName, coords, selectedCircleId, createPost]);

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
        return <ThumbsUp color={palette.primary} size={18} />;
      case 'love':
        return <Heart color={palette.primary} size={18} fill={palette.blush} />;
      case 'sparkle':
        return <Sparkles color={palette.lavender} size={18} />;
      case 'wow':
        return <Star color={palette.gold} size={18} fill={palette.gold} />;
      default:
        return <Heart color={palette.primary} size={18} />;
    }
  }, [palette]);

  const toggleReaction = useCallback((postId: string, type: ReactionType) => {
    reactToPost(selectedCircleId, postId, type);
  }, [selectedCircleId, reactToPost]);

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

  // Stories data (unique authors from feed)
  const stories = useMemo(() => {
    const map = new Map<string, { id: string; name: string; avatar: string }>();
    allPosts.forEach((p: Post) => {
      if (!map.has(p.author.id)) map.set(p.author.id, { id: p.author.id, name: p.author.name, avatar: p.author.avatar });
    });
    return Array.from(map.values()).slice(0, 20);
  }, [allPosts]);

  // Double-tap like overlay per post
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoTitle}>Beauty Circle</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} activeOpacity={0.8} testID="toggle-minimal" onPress={() => setMinimalMode(v => !v)}>
            <Sparkles color={palette.textPrimary} size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} activeOpacity={0.8} testID="open-composer" onPress={() => setComposerOpen(true)}>
            <PlusCircle color={palette.textPrimary} size={22} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Stories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesRow}>
          <TouchableOpacity style={styles.storyItem} activeOpacity={0.9} testID="story-create" onPress={() => setComposerOpen(true)}>
            <View style={[styles.storyAvatar, { backgroundColor: palette.overlayLight, borderStyle: 'dashed' as const }]}> 
              <PlusCircle color={palette.primary} size={20} />
            </View>
            <Text style={styles.storyName}>Your story</Text>
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

        {/* Segmented control */}
        <View style={styles.segmented}>
          {(['following','explore'] as const).map(key => (
            <TouchableOpacity key={key} style={[styles.segmentBtn, viewMode === key && styles.segmentBtnActive]} onPress={() => setViewMode(key)} activeOpacity={0.9} testID={`segment-${key}`}>
              <Text style={[styles.segmentText, viewMode === key && styles.segmentTextActive]}>{key === 'following' ? 'Following' : 'Explore'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Circles quick switch */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.circlesRow}>
          {circles.map(c => {
            const joined = !!getUserMembership(c.id);
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.circlePill, selectedCircleId === c.id && { backgroundColor: palette.overlayLight }]}
                onPress={() => setSelectedCircleId(c.id)}
                activeOpacity={0.9}
                testID={`circle-${c.id}`}
              >
                <Image source={{ uri: c.coverImage }} style={styles.circlePillImg} />
                <Text style={styles.circlePillText} numberOfLines={1}>{c.name}</Text>
                {!joined && (
                  <TouchableOpacity style={styles.joinMini} onPress={() => joinCircle(c.id)} testID={`join-${c.id}`}>
                    <Text style={styles.joinMiniText}>Join</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={[styles.createCirclePill, shadow.card]} onPress={() => setCreatingCircle(true)} activeOpacity={0.9} testID="create-circle">
            <PlusCircle color={palette.primary} size={18} />
            <Text style={styles.createCircleText}>New</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Feed / Explore */}
        {viewMode === 'following' ? (
          <View style={styles.feedWrap}>
            {isLoading && <ActivityIndicator color={palette.primary} />}
            {!isLoading && feed.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No posts yet. Be the first to share ✨</Text>
              </View>
            )}
            {feed.map((post) => {
              const overlay = ensurePostAnim(post.id);
              return (
                <View key={post.id} style={[styles.postCard, shadow.card]} testID={`post-${post.id}`}>
                  <View style={styles.postHeader}>
                    <View style={styles.postUserInfo}>
                      <Image source={{ uri: post.author.avatar }} style={styles.postAvatar} />
                      <View style={styles.postUserDetails}>
                        <Text style={styles.postUserName}>{post.author.name}</Text>
                        <Text style={styles.postTime}>{new Date(post.createdAt).toLocaleString()}</Text>
                      </View>
                    </View>
                    {!!membership && <Text style={styles.circleTag}>#{circles.find(c=>c.id===selectedCircleId)?.name ?? 'Circle'}</Text>}
                  </View>

                  {post.caption ? (
                    <Text style={styles.postContent}>{post.caption}</Text>
                  ) : null}

                  {post.imageUrl && (
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
                    <TouchableOpacity style={styles.actionIcon} onPress={() => toggleReaction(post.id, 'love')} testID={`react-love-${post.id}`}>
                      <Heart color={palette.textPrimary} size={24} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIcon} onPress={() => openComments(post.id)} testID={`open-comments-${post.id}`}>
                      <MessageCircle color={palette.textPrimary} size={24} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIcon} onPress={() => {}}>
                      <Share2 color={palette.textPrimary} size={24} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity style={styles.actionIcon} onPress={() => toggleReaction(post.id, 'wow')}>
                      <Bookmark color={palette.textPrimary} size={24} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.reactionsRow}>
                    {(['like','love','sparkle','wow'] as ReactionType[]).map(rt => (
                      <View key={rt} style={styles.reactionCount}>
                        {reactionIcon(rt)}
                        <Text style={styles.reactionText}>{(post.reactions[rt]?.length ?? 0)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.exploreGrid}>
            {exploreGrid.map((p, i) => (
              <View key={p.id} style={[styles.exploreItem, { marginRight: (i % 3 !== 2) ? 4 : 0 }]}> 
                {p.imageUrl ? (
                  <Image source={{ uri: p.imageUrl }} style={styles.exploreImage} />
                ) : (
                  <View style={[styles.exploreImage, styles.exploreFallback]}> 
                    <Text style={styles.exploreFallbackText}>{p.caption?.slice(0, 40) ?? 'Glow'}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Composer Modal */}
      <Modal visible={composerOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.composerCard, shadow.elevated]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Post</Text>
              <TouchableOpacity onPress={() => setComposerOpen(false)} testID="close-composer">
                <X color={palette.textPrimary} size={22} />
              </TouchableOpacity>
            </View>
            <Text style={styles.composerSubtitle}>Posting to {circles.find(c=>c.id===selectedCircleId)?.name ?? 'Circle'}</Text>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="Write a caption..."
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
                <Text style={styles.actionText}>Image</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={handleGetLocation} activeOpacity={0.8} testID="add-location">
                <MapPin color={palette.textPrimary} size={18} />
                <Text style={styles.actionText}>{locName ? (locName.length>20? locName.slice(0,20)+'…': locName) : 'Location'}</Text>
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

      {/* Create Circle Modal */}
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

      {/* Comments Modal */}
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
                if (!post) return <Text style={styles.emptyText}>No comments yet.</Text>;
                return post.comments.map((c) => (
                  <View key={c.id} style={styles.commentRow}>
                    <Image source={{ uri: c.author.avatar }} style={styles.commentAvatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.commentAuthor}>{c.author.name}</Text>
                      <Text style={styles.commentText}>{c.text}</Text>
                    </View>
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
    </SafeAreaView>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.backgroundStart },
  scrollContent: { paddingBottom: spacing.xxl },

  header: { height: 52, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: palette.divider, backgroundColor: palette.backgroundStart },
  logoTitle: { fontSize: 20, fontWeight: '900', color: palette.textPrimary, letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerBtn: { padding: spacing.xs },

  storiesRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md },
  storyItem: { width: 72, alignItems: 'center' },
  storyRing: { width: 64, height: 64, borderRadius: 32, padding: 2, borderWidth: 2, borderColor: palette.blush, alignItems: 'center', justifyContent: 'center' },
  storyAvatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.divider },
  storyAvatarImg: { width: 60, height: 60, borderRadius: 30 },
  storyName: { fontSize: 11, color: palette.textSecondary, marginTop: 6 },

  segmented: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: 8, marginBottom: spacing.md },
  segmentBtn: { flex: 1, borderRadius: 12, paddingVertical: 10, backgroundColor: palette.surfaceElevated, borderWidth: 1, borderColor: palette.divider, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: palette.surface },
  segmentText: { color: palette.textSecondary, fontWeight: '700' },
  segmentTextActive: { color: palette.textPrimary },

  circlesRow: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, flexDirection: 'row', gap: 8 },
  circlePill: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 18, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.divider, marginRight: 8 },
  circlePillImg: { width: 20, height: 20, borderRadius: 10, marginRight: 8 },
  circlePillText: { color: palette.textPrimary, fontWeight: '700', maxWidth: 120 },
  joinMini: { marginLeft: 8, backgroundColor: palette.primary, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  joinMiniText: { color: palette.textLight, fontSize: 10, fontWeight: '800' },
  createCirclePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 18, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.divider },
  createCircleText: { color: palette.textPrimary, fontWeight: '800' },

  feedWrap: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  postCard: { backgroundColor: palette.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: palette.divider, overflow: 'hidden' },
  postHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.md },
  postUserInfo: { flexDirection: 'row', alignItems: 'center' },
  postAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: spacing.sm },
  postUserDetails: { },
  postUserName: { fontSize: 14, fontWeight: '800', color: palette.textPrimary },
  postTime: { fontSize: 11, color: palette.textMuted },
  circleTag: { fontSize: 12, color: palette.textSecondary, fontWeight: '700' },
  postContent: { fontSize: 15, color: palette.textPrimary, lineHeight: 22, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  postImage: { width: '100%', height: screenWidth * 0.9, backgroundColor: palette.surfaceElevated },
  likeOverlay: { position: 'absolute', top: '40%', left: 0, right: 0, alignItems: 'center' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  locationText: { fontSize: 12, color: palette.textSecondary },
  actionsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  actionIcon: { marginRight: spacing.md },
  reactionsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  reactionCount: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reactionText: { color: palette.textSecondary, fontWeight: '700' },

  exploreGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg },
  exploreItem: { width: (screenWidth - (spacing.lg * 2) - 8) / 3, height: (screenWidth - (spacing.lg * 2) - 8) / 3, marginBottom: 4, borderRadius: 10, overflow: 'hidden', backgroundColor: palette.surface },
  exploreImage: { width: '100%', height: '100%' },
  exploreFallback: { alignItems: 'center', justifyContent: 'center', padding: spacing.sm, backgroundColor: palette.surfaceElevated },
  exploreFallbackText: { color: palette.textSecondary, fontSize: 12, textAlign: 'center' },

  composerCard: { backgroundColor: palette.surface, padding: spacing.md, borderRadius: radii.lg, borderWidth: 1, borderColor: palette.divider, width: '100%' },
  composerSubtitle: { color: palette.textSecondary, paddingHorizontal: spacing.xs, marginBottom: spacing.xs },
  captionInput: { minHeight: 64, color: palette.textPrimary, fontSize: 15 },
  previewImage: { width: '100%', height: 200, borderRadius: radii.md, marginTop: spacing.sm },
  composerActions: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, backgroundColor: palette.overlayLight, borderRadius: radii.md, marginRight: spacing.sm },
  actionText: { color: palette.textPrimary, fontWeight: '600', fontSize: 12 },
  postBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: palette.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.md },
  postBtnText: { color: palette.textLight, fontWeight: '800' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: spacing.lg },
  modalCard: { backgroundColor: palette.surface, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: palette.divider },
  commentsCard: { backgroundColor: palette.surface, borderRadius: radii.lg, paddingBottom: spacing.sm, borderWidth: 1, borderColor: palette.divider, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  modalTitle: { color: palette.textPrimary, fontWeight: '900', fontSize: 18 },
  modalInput: { backgroundColor: palette.surfaceElevated, borderRadius: radii.md, padding: spacing.md, color: palette.textPrimary, marginBottom: spacing.md, borderWidth: 1, borderColor: palette.divider },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: palette.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.md, alignSelf: 'flex-end' },
  createBtnText: { color: palette.textLight, fontWeight: '800' },

  commentRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md, alignItems: 'flex-start' },
  commentAvatar: { width: 36, height: 36, borderRadius: 18 },
  commentAuthor: { color: palette.textPrimary, fontWeight: '800' },
  commentText: { color: palette.textPrimary },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  commentInput: { flex: 1, backgroundColor: palette.surfaceElevated, borderRadius: radii.md, paddingHorizontal: spacing.md, color: palette.textPrimary, borderWidth: 1, borderColor: palette.divider, height: 40 },
  sendCommentBtn: { backgroundColor: palette.primary, padding: spacing.sm, borderRadius: radii.md },

  emptyState: { backgroundColor: palette.surface, borderRadius: radii.lg, padding: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: palette.divider, marginHorizontal: spacing.lg },
  emptyText: { color: palette.textSecondary },
});
