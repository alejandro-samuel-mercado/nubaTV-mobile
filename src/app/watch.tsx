
import * as AsyncStore from '../utils/storage';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as NavigationBar from 'expo-navigation-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import { AlertCircle, ArrowLeft, Check, ChevronDown, ChevronRight, Clock, Languages, List, Lock, Maximize, MessageSquare, Minimize, Pause, Play, RotateCcw, RotateCw, Settings, SkipBack, SkipForward, Smartphone, Unlock, Volume2, VolumeX, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Video from 'react-native-video';
import { useAppTheme } from '../contexts/SettingsContext';
import { useGlobal } from '../contexts/GlobalContext';
import { saveProgress as saveLocalProgress } from '../services/continueWatching';
import { NEXOPLAY_API_BASE as API_BASE, nexoFetch as fetchApi } from '../services/nexoplay';

const API = {
    CONTENT: {
        DETAIL: (slug: string) => `${API_BASE}/api/content/${slug}`,
        WATCH: (slug: string, episodeId?: string) => `${API_BASE}/api/content/${slug}/watch${episodeId ? `?episodeId=${episodeId}` : ''}`,
    },
};
import { parseVTT, SubtitleCue } from '../lib/vtt-parser';

const scale = (s: number) => s;




// Isolated Video component to prevent any UI-induced re-renders
const NobaVideoPlayer = React.memo(({
    streamSrc,
    videoRef,
    resizeMode,
    onStatus,
    setError,
    onPlayerError,
    shouldPlay,
    width,
    height,
    onLoad,
    isMuted,
    selectedAudioTrack,
    snapdragonFix,
}: any) => {
    return (
        <Video
            key="noba-video-player"
            ref={videoRef}
            source={streamSrc ? { uri: streamSrc } : undefined}
            style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]}
            resizeMode={resizeMode}
            paused={!shouldPlay}
            muted={isMuted}
            selectedAudioTrack={selectedAudioTrack}
            useTextureView={snapdragonFix?.useTextureView || false}
            disableFocus={snapdragonFix?.disableFocus || false}
            maxBitRate={snapdragonFix?.dataSaver ? 1_000_000 : 12_000_000}
            bufferConfig={snapdragonFix?.highBuffer
                ? { minBufferMs: 15000, maxBufferMs: 50000, bufferForPlaybackMs: 2500, bufferForPlaybackAfterRebufferMs: 5000 }
                : { minBufferMs: 30000, maxBufferMs: 120000, bufferForPlaybackMs: 3000, bufferForPlaybackAfterRebufferMs: 8000 }}
            onProgress={(data: any) => {
                onStatus({
                    isLoaded: true,
                    positionMillis: (data.currentTime || 0) * 1000,
                    durationMillis: data.seekableDuration ? data.seekableDuration * 1000 : 0,
                    isPlaying: shouldPlay,
                });
            }}
            onBuffer={({ isBuffering }: any) => {
                onStatus({ isLoaded: true, isBuffering, isPlaying: shouldPlay });
            }}
            onEnd={() => {
                onStatus({ isLoaded: true, didJustFinish: true });
            }}
            onError={(err: any) => {
                console.error("RNVideo error:", err);
                onPlayerError?.('network_blip');
                setError("Error de reproducción. Reintentando...");
            }}
            onLoad={(data: any) => {
                onStatus({ isLoaded: true, durationMillis: data.duration * 1000, positionMillis: 0, isPlaying: shouldPlay });
                if (onLoad) onLoad(data);
            }}
        />
    );
}, (prev: any, next: any) => prev.resizeMode === next.resizeMode && prev.streamSrc === next.streamSrc && prev.shouldPlay === next.shouldPlay && prev.isMuted === next.isMuted && prev.width === next.width && prev.height === next.height && prev.selectedAudioTrack?.value === next.selectedAudioTrack?.value);

export default function PlayerScreen() {
    const { width: SW, height: SH } = useWindowDimensions();
    const router = useRouter();
    const appTheme = useAppTheme();
    const { setMiniPlayerAllowed } = useGlobal();
    useEffect(() => { setMiniPlayerAllowed(false); }, []);
    const colors = { primary: appTheme.accent };
    const navigation = {
        goBack: () => router.back(),
        replace: (_name: string, params: any) => router.replace({ pathname: '/watch', params }),
    };
    const authLoading = false;

    // Stable IDs that never change their reference because they are primitive strings
    const params = useLocalSearchParams<{ slug?: string; episodeId?: string; initialProgress?: string }>();
    const { slug: id, episodeId: rawEpisodeId, initialProgress: routeInitialProgress } = params as any;
    const episodeId = rawEpisodeId ? String(rawEpisodeId) : undefined;

    const insets = useSafeAreaInsets();

    const [content, setContent] = useState<any>(null);
    const [currentEpisode, setCurrentEpisode] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isBuffering, setIsBuffering] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const retryCount = useRef(0);
    const streamUrlRef = useRef<string | null>(null);
    const lastPositionRef = useRef(0);
    const [streamSrc, setStreamSrc] = useState<string | null>(null);
    const [showControls, setShowControls] = useState(true);
    const controlsOpacity = useSharedValue(1);
    const { width: W, height: H } = useWindowDimensions();
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [resizeMode, setResizeMode] = useState<'contain' | 'cover'>('contain');
    const positionSV = useSharedValue(0);
    const durationSV = useSharedValue(0);
    const [displayTime, setDisplayTime] = useState({ pos: 0, dur: 0 });
    const [streamData, setStreamData] = useState<any>(null);
    const [activeMenu, setActiveMenuState] = useState<'episodes' | 'subs' | 'audio' | 'quality' | null>(null);
    const activeMenuRef = useRef<'episodes' | 'subs' | 'audio' | 'quality' | null>(null);
    const setActiveMenu = useCallback((menu: 'episodes' | 'subs' | 'audio' | 'quality' | null) => {
        activeMenuRef.current = menu;
        setActiveMenuState(menu);
        
        if (controlsTimer.current) {
            clearTimeout(controlsTimer.current);
            controlsTimer.current = null;
        }

        // If a menu is opened, cancel the auto-hide timer so it doesn't close on the user
        // If it's closed, start the timer so controls auto-hide after 4 seconds
        if (menu === null && controlsOpacity.value > 0.5) {
            controlsTimer.current = setTimeout(() => {
                if (!activeMenuRef.current) {
                    controlsOpacity.value = withTiming(0, { duration: 300 }, () => {
                        runOnJS(setShowControls)(false);
                    });
                }
            }, 4000);
        }
    }, [controlsOpacity]);
    const [selectedQuality, setSelectedQuality] = useState('Auto');
    const [snapdragonFix, setSnapdragonFix] = useState<any>({});
    
    // Subtitles Engine State
    const [selectedSubtitle, setSelectedSubtitle] = useState<any>(null);
    const [subtitleCues, setSubtitleCues] = useState<SubtitleCue[]>([]);
    const subtitleCuesRef = useRef<SubtitleCue[]>([]);
    const [currentSubtitleText, setCurrentSubtitleText] = useState<string>('');

    // Audio Engine State
    const [audioTracks, setAudioTracks] = useState<any[]>([]);
    const [selectedAudioTrack, setSelectedAudioTrack] = useState<any>({ type: 'default' });
    
    const [isLocked, setIsLocked] = useState(false);
    const [showLockIndicator, setShowLockIndicator] = useState(false);
    const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isSwitchingEpisodeRef = useRef(false);
    const barWidthRef = useRef(300);
    const [resumeTime, setResumeTime] = useState<number | null>(null);
    const [showResumePopup, setShowResumePopup] = useState(false);
    const videoRef = useRef<any>(null);
    const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    const isSeeking = useSharedValue(false);
    const seekProgress = useSharedValue(0);
    const positionRef = useRef(0);
    const durationRef = useRef(0);

    // Fetch and parse VTT subtitle file when selectedSubtitle changes
    useEffect(() => {
        if (!selectedSubtitle || !selectedSubtitle.url) {
            setSubtitleCues([]);
            subtitleCuesRef.current = [];
            setCurrentSubtitleText('');
            return;
        }

        const fetchSubtitles = async () => {
            try {
                // Ensure the URL is absolute
                const baseUrl = API_BASE.replace('/api', '');
                const url = selectedSubtitle.url.startsWith('http') 
                    ? selectedSubtitle.url 
                    : `${baseUrl}${selectedSubtitle.url.startsWith('/') ? '' : '/'}${selectedSubtitle.url}`;

                const response = await fetch(url);
                if (response.ok) {
                    const text = await response.text();
                    const parsedCues = parseVTT(text);
                    setSubtitleCues(parsedCues);
                    subtitleCuesRef.current = parsedCues;
                } else {
                    console.error('[PlayerScreen] VTT Fetch failed:', response.status);
                    setSubtitleCues([]);
                    subtitleCuesRef.current = [];
                }
            } catch (error) {
                console.error('[PlayerScreen] Error fetching VTT:', error);
                setSubtitleCues([]);
                subtitleCuesRef.current = [];
            }
        };

        fetchSubtitles();
    }, [selectedSubtitle, streamData?.streamBaseUrl]);

    const onSeek = async (percent: number) => {
        try {
            const dur = durationSV.value;
            if (dur > 0) {
                const targetPos = Math.floor(dur * percent);
                positionSV.value = targetPos;
                positionRef.current = targetPos;
                // Avoid calling play right after setPosition as it can freeze
                if (videoRef.current) { videoRef.current.seek((targetPos) / 1000); }
            }
        } catch (e) {
            console.error("Seek error:", e);
        } finally {
            isSeeking.value = false;
        }
    };

    const barWidth = W > H ? W - 80 : W - 40;

    const gesture = Gesture.Pan()
        .activeCursor('pointer')
        .onBegin((e) => {
            isSeeking.value = true;
            seekProgress.value = Math.max(0, Math.min(1, e.x / barWidth)) * 100;
        })
        .onUpdate((e) => {
            seekProgress.value = Math.max(0, Math.min(1, e.x / barWidth)) * 100;
        })
        .onEnd((e) => {
            const p = Math.max(0, Math.min(1, e.x / barWidth));
            runOnJS(onSeek)(p);
        });

    const tap = Gesture.Tap()
        .onBegin((e) => {
            isSeeking.value = true;
            seekProgress.value = Math.max(0, Math.min(1, e.x / barWidth)) * 100;
        })
        .onEnd((e) => {
            const p = Math.max(0, Math.min(1, e.x / barWidth));
            runOnJS(onSeek)(p);
        });

    const combinedGesture = Gesture.Exclusive(gesture, tap);

    const animatedProgressStyle = useAnimatedStyle(() => {
        const p = isSeeking.value ? seekProgress.value : (durationSV.value > 0 ? (positionSV.value / durationSV.value) * 100 : 0);
        return { width: `${p}%` };
    });



    useEffect(() => {
        // Fetch snapdragon video settings
        AsyncStore.getItemAsync('Vexa_video_settings').then((res: any) => {
            if (res) {
                setSnapdragonFix(JSON.parse(res));
            }
        }).catch(console.error);

        // Auto-hide on mount
        controlsTimer.current = setTimeout(() => {
            if (!activeMenuRef.current) {
                // Inline version of hideControls since it can't be added to dependency array easily without causing loops
                controlsOpacity.value = withTiming(0, { duration: 300 }, () => {
                    runOnJS(setShowControls)(false);
                });
            }
        }, 4000);

        return () => {
            if (controlsTimer.current) clearTimeout(controlsTimer.current);
        };
    }, []);

    const allEpisodes = useMemo(() => {
        if (!content?.seasons) return [];
        return content.seasons.flatMap((s: any) => (s.episodes || []).map((e: any) => ({ ...e, seasonNumber: s.number })));
    }, [content?.seasons]);

    const sidebarScrollRef = useRef<ScrollView>(null);

    const seasonsWithEpisodes = useMemo(() => {
        if (!content?.seasons) return [];
        return content.seasons.map((s: any) => ({
            ...s,
            episodes: (s.episodes || []).map((e: any) => ({ ...e, seasonNumber: s.number }))
        }));
    }, [content?.seasons]);

    const activeEpId = currentEpisode?.id || episodeId;

    const [expandedSeasons, setExpandedSeasons] = useState<Record<number, boolean>>({});

    useEffect(() => {
        if (activeMenu === 'episodes') {
            const currentEpObj = allEpisodes.find((e: any) => String(e.id) === String(activeEpId));
            const sNum = currentEpObj?.seasonNumber || content?.seasons?.[0]?.number || 1;
            setExpandedSeasons(prev => ({ ...prev, [sNum]: true }));
        }
    }, [activeMenu, allEpisodes, activeEpId, content]);

    const toggleSeason = useCallback((sNum: number) => {
        setExpandedSeasons(prev => ({ ...prev, [sNum]: !prev[sNum] }));
    }, []);

    const currentIdx = useMemo(() => {
        if (!currentEpisode) return -1;
        return allEpisodes.findIndex((e: any) => e.id === currentEpisode.id);
    }, [allEpisodes, currentEpisode]);

    const hasNext = currentIdx >= 0 && currentIdx < allEpisodes.length - 1;
    const hasPrev = currentIdx > 0;

    // Default to sensor-based orientation
    useEffect(() => {
        const prepare = async () => {
            try {
                // Keep the current orientation (don't force portrait)
                await activateKeepAwakeAsync();
            } catch (e) { }
        };
        prepare();
        return () => {
            const cleanup = async () => {
                try {
                    await deactivateKeepAwake();
                    // Force portrait before leaving the player to stabilize the rest of the app,
                    // BUT ONLY if we are not just switching to another episode
                    if (!isSwitchingEpisodeRef.current) {
                        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
                    }
                } catch (e) { }
            };
            cleanup();
        };
    }, []);

    // Load all video data in parallel for maximum speed
    useEffect(() => {
        // authLoading not applicable in Vexa
        

        // Since id and episodeId are now stable refs, this effect will only run once per screen mount.
        // The guard is kept just in case.
        

        const load = async () => {
            setLoading(true);
            setContent(null);
            setCurrentEpisode(null);
            setError(null);
            setResumeTime(null);
            setShowResumePopup(false);
            hasInitialSeeked.current = false;
            hasStartedRef.current = false; durationSV.value = 0; durationRef.current = 0;

            try {
                // 1. Fetch content info and history in parallel
                const [contentRes, historyRes] = await Promise.all([
                    fetchApi(API.CONTENT.DETAIL(id)),
                    fetchApi(`${API_BASE}/api/history/progress/${id}${episodeId ? `?episodeId=${episodeId}` : ''}`)
                ]);

                if (!contentRes.success || !contentRes.data) throw new Error('No se pudo cargar el contenido');
                const data = contentRes.data;
                setContent(data);

                // 2. Determine target episode
                let targetEpId = episodeId;
                if (!targetEpId && historyRes.success && historyRes.data?.episodeId) {
                    targetEpId = historyRes.data.episodeId;
                }

                let ep = null;
                if (targetEpId && data.seasons) {
                    for (const s of data.seasons) {
                        ep = s.episodes?.find((e: any) => e.id === targetEpId);
                        if (ep) { ep.seasonNumber = s.number; break; }
                    }
                } else if (data.type !== 'MOVIE' && data.seasons?.[0]?.episodes?.[0]) {
                    ep = data.seasons[0].episodes[0];
                    ep.seasonNumber = data.seasons[0].number;
                }

                if (ep) {
                    setCurrentEpisode(ep);
                    targetEpId = ep.id;
                }

                // 3. Handle resume progress - Store in local var first to ensure accuracy
                let finalResumeTime = 0;
                let progressVal = routeInitialProgress;
                if (!progressVal && historyRes.success && historyRes.data) {
                    if (Array.isArray(historyRes.data)) {
                        const match = targetEpId ? historyRes.data.find((h: any) => (h.episodeId || h.episode?.id) == targetEpId) : historyRes.data[0];
                        if (match) progressVal = match.progressSeconds || match.progress;
                    } else {
                        progressVal = historyRes.data.progressSeconds || historyRes.data.progress;
                    }
                }
                if (Number(progressVal) > 10) {
                    finalResumeTime = Number(progressVal);
                    setResumeTime(finalResumeTime);
                    setShowResumePopup(true);
                    setIsPlaying(false);
                } else {
                    setIsPlaying(true);
                }

                // 4. Request stream URL
                const streamJson = await fetchApi(API.CONTENT.WATCH(id, targetEpId));

                if (streamJson.success && streamJson.data) {
                    const { masterPlaylist } = streamJson.data;
                    setStreamSrc(masterPlaylist);
                    streamUrlRef.current = masterPlaylist;
                    retryCount.current = 0;
                    setStreamData(streamJson.data);
                } else {
                    throw new Error(streamJson.error || 'Error al obtener stream');
                }

            } catch (e: any) {
                setError(e.message || 'Error al cargar el video');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id, episodeId]);



    // Slow UI update for time text (every 1s)
    useEffect(() => {
        const uiTimer = setInterval(() => {
            setDisplayTime({ pos: positionRef.current, dur: durationRef.current });
        }, 1000);
        return () => clearInterval(uiTimer);
    }, []);

    const saveLocal = (posMs: number, durMs: number) => {
        if (!content) return;
        saveLocalProgress({
            slug: content.slug || id,
            title: content.title,
            posterUrl: content.posterUrl,
            backdropUrl: content.backdropUrl,
            type: content.type,
            episodeId: currentEpisode?.id,
            positionMs: posMs,
            durationMs: durMs,
        }).catch(() => {});
    };

    useEffect(() => {
        // Reset local refs when movie/episode changes
        positionRef.current = 0;
        durationRef.current = 0;

        if (progressTimer.current) clearInterval(progressTimer.current);

        progressTimer.current = setInterval(async () => {
            if (!content || durationRef.current === 0) return;
            
            const currentProgress = Math.floor(positionRef.current / 1000);
            const currentDuration = Math.floor(durationRef.current / 1000);
            saveLocal(positionRef.current, durationRef.current);

            // Evitar guardar progreso si es menos de 30 segundos (evita falsos positivos al entrar)
            // o si ya casi termina la película.
            if (currentProgress < 30 || (currentDuration > 0 && currentProgress > currentDuration * 0.95)) return;

            try {
                await fetchApi(`${API_BASE}/api/history/progress/${content.id}`, {
                    method: 'POST',
                    body: JSON.stringify({
                        progressSeconds: currentProgress,
                        durationSeconds: currentDuration,
                        episodeId: currentEpisode?.id
                    }),
                });
            } catch (e) { }

        }, 15000); // Save every 15s instead of 10s to reduce DB load
        
        return () => { 
            if (progressTimer.current) clearInterval(progressTimer.current); 
            
            // Fire-and-forget save on unmount
            if (content && durationRef.current > 0) {
                saveLocal(positionRef.current, durationRef.current);
                const finalProgress = Math.floor(positionRef.current / 1000);
                const finalDuration = Math.floor(durationRef.current / 1000);
                if (finalProgress >= 30 && !(finalDuration > 0 && finalProgress > finalDuration * 0.95)) {
                    fetchApi(`${API_BASE}/api/history/progress/${content.id}`, {
                        method: 'POST',
                        body: JSON.stringify({
                            progressSeconds: finalProgress,
                            durationSeconds: finalDuration,
                            episodeId: currentEpisode?.id
                        }),
                    }).catch(() => {});
                }
            }
        };
    }, [content?.id, currentEpisode?.id]); // Usar IDs específicos en lugar de los objetos completos

    const hideControls = useCallback(() => {
        if (activeMenuRef.current) return; // Don't hide if a menu is open
        setActiveMenu(null);
        controlsOpacity.value = withTiming(0, { duration: 300 }, () => {
            runOnJS(setShowControls)(false);
        });
    }, [setActiveMenu]);

    const showControlsTemporarily = useCallback(() => {
        if (controlsTimer.current) clearTimeout(controlsTimer.current);
        setShowControls(true);
        controlsOpacity.value = withTiming(1, { duration: 300 });
        if (!activeMenuRef.current) {
            controlsTimer.current = setTimeout(() => {
                hideControls();
            }, 4000);
        }
    }, [hideControls]);

    const toggleControls = () => {
        if (isLocked) {
            setShowLockIndicator(true);
            if (lockTimer.current) clearTimeout(lockTimer.current);
            lockTimer.current = setTimeout(() => setShowLockIndicator(false), 3000);
            return;
        }

        if (controlsTimer.current) {
            clearTimeout(controlsTimer.current);
            controlsTimer.current = null;
        }

        const isVisible = controlsOpacity.value > 0.5;
        if (isVisible) {
            if (!activeMenuRef.current) {
                hideControls();
            } else {
                setActiveMenu(null); // Close menu if clicking outside
            }
        } else {
            setShowControls(true);
            controlsOpacity.value = withTiming(1, { duration: 300 });
            if (!activeMenuRef.current) {
                controlsTimer.current = setTimeout(() => {
                    hideControls();
                }, 4000);
            }
        }
    };

    const animatedControlsStyle = useAnimatedStyle(() => ({
        opacity: controlsOpacity.value,
    }), []);

    useEffect(() => {
        const lock = async () => {
            try {
                await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
            } catch (e) { }
        };
        lock();
        return () => {
            const unlock = async () => {
                try {
                    await ScreenOrientation.unlockAsync();
                    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
                } catch (e) { }
            };
            unlock();
        };
    }, []);

    const toggleOrientation = async () => {
        const orientation = await ScreenOrientation.getOrientationAsync();
        if (orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT || orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT) {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        } else {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        }
    };

    // Fullscreen / Immersive mode
    useEffect(() => {
        const enableImmersive = async () => {
            try {
                if (Platform.OS === 'android') {
                    await (NavigationBar as any).setBehaviorAsync?.('overlay-swipe');
                    await (NavigationBar as any).setVisibilityAsync?.('hidden');
                }
            } catch { }
        };
        enableImmersive();
        return () => {
            const disableImmersive = async () => {
                try {
                    if (Platform.OS === 'android') {
                        await (NavigationBar as any).setBehaviorAsync?.('inset-touch');
                        await (NavigationBar as any).setVisibilityAsync?.('visible');
                    }
                } catch { }
            };
            disableImmersive();
        };
    }, []);

    const toggleResizeMode = () => {
        setResizeMode(prev => prev === 'contain' ? 'cover' : 'contain');
    };

    const formatTime = (ms: number) => {
        if (!ms || isNaN(ms) || ms < 0) return '0:00';
        const sec = Math.floor(ms / 1000);
        const h = Math.floor(sec / 3600); const m = Math.floor((sec % 3600) / 60); const s = sec % 60;
        return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
    };

    const hasInitialSeeked = useRef(false);
    const hasStartedRef = useRef(false);

    // Stable ref to access current state inside stable onStatus
    const stateRef = useRef({ resumeTime, hasNext, currentIdx, allEpisodes, id, hasPrev });
    useEffect(() => {
        stateRef.current = { resumeTime, hasNext, currentIdx, allEpisodes, id, hasPrev };
    }, [resumeTime, hasNext, currentIdx, allEpisodes, id, hasPrev]);

    const isPlayingRef = useRef(true);

    const goNext = useCallback(() => { 
        const { hasNext, allEpisodes, currentIdx, id } = stateRef.current;
        if (!hasNext) return; 
        isSwitchingEpisodeRef.current = true;
        navigation.replace('Player', { slug: id, episodeId: allEpisodes[currentIdx + 1].id }); 
    }, []);

    const goPrev = useCallback(() => { 
        const { hasPrev, allEpisodes, currentIdx, id } = stateRef.current;
        if (!hasPrev) return; 
        isSwitchingEpisodeRef.current = true;
        navigation.replace('Player', { slug: id, episodeId: allEpisodes[currentIdx - 1].id }); 
    }, []);

    const onStatus = useCallback((status: any) => {
        if (!status.isLoaded) {
            // Transient not-loaded state — don't crash on it
            if (status.error) {
                const isNullError = !status.error || String(status.error).toLowerCase().includes('null');
                if (!isNullError) setError(status.error);
            }
            return;
        }

        // Write to shared values and refs only - ZERO re-renders
        if (status.positionMillis !== undefined) {
            positionSV.value = status.positionMillis;
            positionRef.current = status.positionMillis;
            lastPositionRef.current = status.positionMillis;
        }
        
        if (status.durationMillis !== undefined && status.durationMillis > 0) {
            if (durationRef.current === 0 || status.durationMillis > durationRef.current) {
                durationSV.value = status.durationMillis;
                durationRef.current = status.durationMillis;
            }
        }

        if (status.isPlaying !== isPlayingRef.current) {
            isPlayingRef.current = status.isPlaying;
            setIsPlaying(status.isPlaying);
        }

        // Detect buffering — show spinner so user knows it's loading, not frozen
        if (status.isBuffering !== undefined) {
            setIsBuffering(status.isBuffering);
        }

        // --- Subtitle Synchronization Engine ---
        if (subtitleCuesRef.current && subtitleCuesRef.current.length > 0) {
            const posSec = status.positionMillis / 1000;
            // Find the active cue
            const activeCue = subtitleCuesRef.current.find(cue => posSec >= cue.start && posSec <= cue.end);
            setCurrentSubtitleText(activeCue ? activeCue.text : '');
        } else {
            // Keep it clear if no subtitles are active to avoid hanging text
            setCurrentSubtitleText('');
        }

        const { hasNext: hn } = stateRef.current;

        if (status.didJustFinish) {
            if (hn) {
                goNext();
            } else {
                navigation.goBack();
            }
        }
    }, [goNext]);

    if (loading && !content) return (
        <View style={s.loader}>
            <ActivityIndicator size="large" color={'#FFD700'} />
        </View>
    );

    if (error || !content) return <View style={s.loader}><AlertCircle size={48} color={colors.primary} /><Text style={s.errorTitle}>Error</Text><Text style={s.loaderText}>{error || 'No encontrado'}</Text><TouchableOpacity style={s.retryBtn} onPress={() => navigation.goBack()}><Text style={s.retryText}>Volver</Text></TouchableOpacity></View>;

    const title = currentEpisode
        ? `${content?.title || ''} — T${currentEpisode.seasonNumber}E${currentEpisode.number}`
        : content?.title || '';



    return (
        <GestureHandlerRootView style={s.container}>
            <StatusBar hidden={true} />

            {/* Screen Lock Overlay */}
            {isLocked && showLockIndicator && (
                <View style={s.lockOverlay}>
                    <TouchableOpacity style={s.unlockBtn} onPress={() => setIsLocked(false)}>
                        <Unlock size={32} color={'#fff'} />
                        <Text style={s.lockText}>Pantalla Bloqueada</Text>
                        <Text style={s.lockText}>Toca para desbloquear</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Video Layer - Isolated in a bunker */}
            {streamSrc ? (
                <NobaVideoPlayer
                    streamSrc={streamSrc}
                    videoRef={videoRef}
                    resizeMode={resizeMode}
                    shouldPlay={isPlaying}
                    width={SW}
                    height={SH}
                    isMuted={isMuted}
                    selectedAudioTrack={selectedAudioTrack}
                    snapdragonFix={snapdragonFix}
                    onStatus={onStatus}
                    onLoad={(status: any) => {
                        if (status?.audioTracks && status.audioTracks.length > 0) {
                            setAudioTracks(status.audioTracks);
                            // Only force-select by index if the user hasn't already picked a track
                            // and we're still on 'default' type. This avoids a re-render mid-playback.
                        }
                        if (!hasInitialSeeked.current && resumeTime && resumeTime > 10 && videoRef.current) {
                            videoRef.current.seek((resumeTime * 1000) / 1000);
                            hasInitialSeeked.current = true;
                        }
                    }}
                    setError={setError}
                    onPlayerError={async (type: string) => {
                        if (type !== 'network_blip') return;
                        if (retryCount.current >= 3) {
                            setError('Error de reproducción. Verifica tu conexión a internet.');
                            return;
                        }
                        retryCount.current += 1;
                        const url = streamUrlRef.current;
                        const savedPos = lastPositionRef.current;
                        if (!url || !videoRef.current) return;
                        try {
                            setIsBuffering(true);
                            
                            await new Promise(r => setTimeout(r, 1500));
                            
                            if (savedPos > 2000) {
                                videoRef.current.seek((savedPos) / 1000);
                            }
                        } catch (e) {
                            setError('Error al reconectar el stream.');
                        } finally {
                            setIsBuffering(false);
                        }
                    }}
                />
            ) : null}

            {/* Custom VTT Subtitles Overlay */}
            {currentSubtitleText ? (
                <View style={s.subtitleOverlay} pointerEvents="none">
                    <Text style={s.subtitleText}>{currentSubtitleText}</Text>
                </View>
            ) : null}

            {!streamSrc && (
                <View style={[s.loader, StyleSheet.absoluteFill]}>
            <ActivityIndicator size="large" color={'#FFD700'} />
                </View>
            )}



            {/* Auto-recovery handler for network blips */}
            {/* Passed as prop to the isolated player so it doesn't trigger re-renders */}

            {/* Controls Toggle Layer */}
            <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={toggleControls}
            />

            {error && (
                <View style={s.errorContainer}>
                    <AlertCircle size={48} color={'#ff4d4d'} />
                    <Text style={s.errorTitle}>¡Ups! Algo salió mal</Text>
                    <Text style={s.errorText}>{error}</Text>
                    <TouchableOpacity style={s.retryBtn} onPress={() => navigation.goBack()}>
                        <Text style={s.retryText}>Volver</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Controls overlay */}
            <Animated.View
                style={[StyleSheet.absoluteFill, animatedControlsStyle]}
                pointerEvents={showControls ? 'auto' : 'none'}
            >
                {!isLocked && (
                    <>
                        {/* Top */}
                        <View style={[s.topBar, {
                            paddingTop: W > H ? 20 : Math.max(insets.top, 16),
                            paddingLeft: W > H ? 40 : 20,
                            paddingRight: W > H ? 40 : 20
                        }]}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}><ArrowLeft size={22} color={'#fff'} /></TouchableOpacity>
                            <View style={{ flex: 1 }}><Text style={s.titleText} numberOfLines={1}>{title}</Text></View>
                            {content.seasons?.length > 0 && (
                                <TouchableOpacity style={s.epBtn} onPress={() => setActiveMenu('episodes')}><List size={16} color={'#fff'} /><Text style={s.epBtnText}>Episodios</Text></TouchableOpacity>
                            )}
                        </View>

                        {/* Center */}
                        <View style={s.centerControls}>
                            <TVPlaybackButton onPress={() => {
                                const newPos = Math.max(0, positionRef.current - 20000);
                                positionSV.value = newPos;
                                positionRef.current = newPos;
                                if (videoRef.current) { videoRef.current.seek((newPos) / 1000); }
                            }} onFocus={showControlsTemporarily}>
                                <RotateCcw size={scale(32)} color="rgba(255,255,255,0.8)" />
                                <Text style={s.skipText}>20s</Text>
                            </TVPlaybackButton>
                            <TVPlaybackButton style={s.playBtn} onPress={() => {
                                if (isPlaying) {
                                    setIsPlaying(false);
                                    
                                } else {
                                    setIsPlaying(true);
                                    
                                }
                            }} onFocus={showControlsTemporarily}>
                                {isPlaying ? <Pause size={scale(36)} fill={'#fff'} color={'#fff'} /> : <Play size={scale(36)} fill={'#fff'} color={'#fff'} style={{ marginLeft: 4 }} />}
                            </TVPlaybackButton>
                            <TVPlaybackButton onPress={() => {
                                const newPos = Math.min(durationRef.current, positionRef.current + 20000);
                                positionSV.value = newPos;
                                positionRef.current = newPos;
                                if (videoRef.current) { videoRef.current.seek((newPos) / 1000); }
                            }} onFocus={showControlsTemporarily}>
                                <RotateCw size={scale(32)} color="rgba(255,255,255,0.8)" />
                                <Text style={s.skipText}>20s</Text>
                            </TVPlaybackButton>
                        </View>

                        {/* Bottom */}
                        <View style={[s.bottomBar, {
                            paddingBottom: W > H ? 20 : Math.max(insets.bottom, 16),
                            paddingLeft: W > H ? 40 : 20,
                            paddingRight: W > H ? 40 : 20
                        }]}>
                            <View 
                                style={s.progressWrap}
                                onLayout={(e) => { barWidthRef.current = Math.max(1, e.nativeEvent.layout.width); }}
                                onStartShouldSetResponder={() => true}
                                onResponderGrant={(e) => {
                                    isSeeking.value = true;
                                    const px = e.nativeEvent.locationX;
                                    seekProgress.value = Math.max(0, Math.min(1, px / barWidthRef.current)) * 100;
                                }}
                                onResponderMove={(e) => {
                                    const px = e.nativeEvent.locationX;
                                    seekProgress.value = Math.max(0, Math.min(1, px / barWidthRef.current)) * 100;
                                }}
                                onResponderRelease={(e) => {
                                    const px = e.nativeEvent.locationX;
                                    const p = Math.max(0, Math.min(1, px / barWidthRef.current));
                                    runOnJS(onSeek)(p);
                                }}
                            >
                                <View style={s.progressBg}>
                                    <Animated.View style={[s.progressFill, animatedProgressStyle]}>
                                        <View style={s.progressThumb} />
                                    </Animated.View>
                                </View>
                            </View>

                            <View style={s.bottomRow}>
                                <View style={s.timeRow}>
                                    <Text style={s.time}>{formatTime(displayTime.pos)}</Text>
                                    <Text style={s.timeDur}> / {formatTime(displayTime.dur)}</Text>
                                </View>

                                <View style={s.actionsRow}>
                                    {/* Volume */}
                                    <TouchableOpacity onPress={() => {
                                        const nextMute = !isMuted;
                                        setIsMuted(nextMute);
                                        if (videoRef.current) {  }
                                    }} style={s.actionBtn}>
                                        {isMuted ? <VolumeX size={20} color={'#fff'} /> : <Volume2 size={20} color={'#fff'} />}
                                    </TouchableOpacity>

                                    {/* Episodes Nav */}
                                    {(hasNext || hasPrev) && (
                                        <>
                                            {W > H && <View style={s.divider} />}
                                            {hasPrev && <TouchableOpacity onPress={goPrev} style={s.actionBtn}><SkipBack size={20} color={'#fff'} /></TouchableOpacity>}
                                            {hasNext && <TouchableOpacity onPress={goNext} style={s.actionBtn}><SkipForward size={20} color={'#fff'} /></TouchableOpacity>}
                                        </>
                                    )}

                                    {/* Player Settings */}
                                    {W > H && <View style={s.divider} />}
                                    {W > H && (
                                        <TouchableOpacity onPress={toggleResizeMode} style={s.actionBtn}>
                                            {resizeMode === 'contain' ? <Maximize size={18} color={'#fff'} /> : <Minimize size={18} color={'#fff'} />}
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity onPress={() => setActiveMenu('audio')} style={s.actionBtn}><Languages size={18} color={'#fff'} /></TouchableOpacity>
                                    <TouchableOpacity onPress={() => setActiveMenu('subs')} style={s.actionBtn}><MessageSquare size={18} color={'#fff'} /></TouchableOpacity>
                                    {W > H && <TouchableOpacity onPress={() => setActiveMenu('quality')} style={s.actionBtn}><Settings size={18} color={'#fff'} /></TouchableOpacity>}
                                    {W > H && (
                                        <TouchableOpacity onPress={() => setIsLocked(true)} style={s.actionBtn}>
                                            <Lock size={18} color={'#fff'} />
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity onPress={toggleOrientation} style={s.actionBtn}>
                                        <Smartphone size={18} color={'#fff'} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </>
                )}
            </Animated.View>

            {/* Sidebar / Settings Menus */}
            {activeMenu && (
                <View style={[
                    activeMenu === 'episodes' ? s.sidebar : s.settingsMenu,
                    {
                        paddingTop: W > H ? 20 : insets.top + 20,
                        paddingBottom: W > H ? 20 : insets.bottom + 20,
                        paddingRight: W > H ? 20 : insets.right + 20,
                        paddingLeft: activeMenu === 'episodes' ? 20 : 20
                    }
                ]}>
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(8, 12, 20, 0.96)' }]} />
                    <View style={s.sidebarHeader}>
                        <Text style={s.sidebarTitle}>
                            {activeMenu === 'episodes' ? 'Episodios' :
                                activeMenu === 'subs' ? 'Subtítulos' : 
                                activeMenu === 'audio' ? 'Audio' : 'Calidad'}
                        </Text>
                        <TouchableOpacity onPress={() => setActiveMenu(null)}><X size={24} color={'#fff'} /></TouchableOpacity>
                    </View>

                    <View style={{ flex: 1 }}>
                        {activeMenu === 'episodes' && (
                            <ScrollView ref={sidebarScrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                                {seasonsWithEpisodes.map((se: any, sIdx: number) => {
                                    const isExpanded = !!expandedSeasons[se.number];
                                    const isCurrentSeason = se.episodes.some((e: any) => String(e.id) === String(activeEpId));
                                    return (
                                        <View key={se.id || sIdx} style={{ marginBottom: 6 }}>
                                            {/* Season Header */}
                                            <TouchableOpacity
                                                onPress={() => toggleSeason(se.number)}
                                                style={[s.seasonHeader, isCurrentSeason && s.seasonHeaderCurrent]}
                                                activeOpacity={0.8}
                                            >
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                    {isExpanded ? (
                                                        <ChevronDown size={18} color={'#fff'} />
                                                    ) : (
                                                        <ChevronRight size={18} color={'#fff'} />
                                                    )}
                                                    <Text style={s.seasonTitle}>
                                                        Temporada {se.number}
                                                    </Text>
                                                </View>
                                                <Text style={s.seasonCount}>
                                                    {se.episodes.length} ep.
                                                </Text>
                                            </TouchableOpacity>

                                            {/* Expanded Episodes with Indentation */}
                                            {isExpanded && (
                                                <View style={s.episodesContainer}>
                                                    {se.episodes.map((ep: any, epIdx: number) => {
                                                        const isCurrentEp = String(activeEpId) === String(ep.id);
                                                        return (
                                                            <TouchableOpacity
                                                                key={ep.id || epIdx}
                                                                onLayout={isCurrentEp ? (e: any) => {
                                                                    if (sidebarScrollRef.current) {
                                                                        const y = e.nativeEvent.layout.y;
                                                                        const offset = Math.max(0, (sIdx * 60) + y - 100);
                                                                        sidebarScrollRef.current.scrollTo({ y: offset, animated: false });
                                                                    }
                                                                } : undefined}
                                                                onPress={() => { 
                                                                    setActiveMenu(null); 
                                                                    isSwitchingEpisodeRef.current = true;
                                                                    navigation.replace('Player', { slug: id, episodeId: ep.id }); 
                                                                }}
                                                                style={[s.epItem, isCurrentEp && s.epItemActive]}
                                                                activeOpacity={0.8}
                                                            >
                                                                <View style={[s.epNum, isCurrentEp && s.epNumActive]}>
                                                                    <Text style={[s.epNumText, isCurrentEp && { color: '#000' }]}>{ep.number ?? ''}</Text>
                                                                </View>
                                                                <View style={{ flex: 1 }}>
                                                                    <Text style={[s.epName, isCurrentEp && { color: colors.primary }]} numberOfLines={1}>
                                                                        {ep.translations?.[0]?.title || `Episodio ${ep.number ?? ''}`}
                                                                    </Text>
                                                                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
                                                                        {ep.durationSeconds ? `${Math.round(ep.durationSeconds / 60)} min` : `Temporada ${se.number}`}
                                                                    </Text>
                                                                </View>
                                                                {isCurrentEp && (
                                                                    <View style={s.playingBadge}>
                                                                        <Text style={s.playingText}>Viendo</Text>
                                                                    </View>
                                                                )}
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </View>
                                            )}
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        )}

                        {activeMenu !== 'episodes' && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {activeMenu === 'subs' && (
                                    <>
                                        <TouchableOpacity style={[s.menuItem, !selectedSubtitle && s.menuItemActive]} onPress={() => { setSelectedSubtitle(null); setActiveMenu(null); }}>
                                            <Text style={s.menuItemText}>Desactivados</Text>
                                            {!selectedSubtitle && <Check size={16} color={colors.primary} />}
                                        </TouchableOpacity>
                                        {(streamData?.subtitleTracks || currentEpisode?.videoFiles?.[0]?.subtitleTracks || content.videoFiles?.[0]?.subtitleTracks)?.map((sub: any, i: number) => {
                                            const isActive = selectedSubtitle?.url === sub.url;
                                            return (
                                                <TouchableOpacity key={i} style={[s.menuItem, isActive && s.menuItemActive]} onPress={() => { setSelectedSubtitle(sub); setActiveMenu(null); }}>
                                                    <Text style={s.menuItemText}>{sub.label || sub.language}</Text>
                                                    {isActive && <Check size={16} color={colors.primary} />}
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </>
                                )}

                                {activeMenu === 'audio' && (
                                    <>
                                        {audioTracks.length === 0 ? (
                                            <TouchableOpacity style={[s.menuItem, s.menuItemActive]}>
                                                <Text style={s.menuItemText}>Español (Predeterminado)</Text>
                                                <Check size={16} color={colors.primary} />
                                            </TouchableOpacity>
                                        ) : (
                                            <>
                                                <TouchableOpacity style={[s.menuItem, selectedAudioTrack?.type === 'default' && s.menuItemActive]} onPress={() => { setSelectedAudioTrack({ type: 'default' }); setActiveMenu(null); }}>
                                                    <Text style={s.menuItemText}>Predeterminado</Text>
                                                    {selectedAudioTrack?.type === 'default' && <Check size={16} color={colors.primary} />}
                                                </TouchableOpacity>
                                                {audioTracks.map((track: any, i: number) => {
                                                    const isActive = selectedAudioTrack?.type === 'index' && selectedAudioTrack?.value === (track.index ?? i);
                                                    const label = track.title || track.language || `Pista ${i + 1}`;
                                                    return (
                                                        <TouchableOpacity key={i} style={[s.menuItem, isActive && s.menuItemActive]} onPress={() => { setSelectedAudioTrack({ type: 'index', value: track.index ?? i }); setActiveMenu(null); }}>
                                                            <Text style={s.menuItemText}>{label}</Text>
                                                            {isActive && <Check size={16} color={colors.primary} />}
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </>
                                        )}
                                    </>
                                )}

                                {activeMenu === 'quality' && (
                                    <>
                                        <TouchableOpacity style={[s.menuItem, selectedQuality === 'Auto' && s.menuItemActive]} onPress={() => { setSelectedQuality('Auto'); setActiveMenu(null); }}>
                                            <Text style={s.menuItemText}>Automática (Recomendado)</Text>
                                            {selectedQuality === 'Auto' && <Check size={16} color={colors.primary} />}
                                        </TouchableOpacity>
                                        {streamData?.qualities?.map((q: any, i: number) => {
                                            const resLabel = q.resolution || q.height || q.name || q.quality || (typeof q === 'string' ? q : 'Auto');
                                            return (
                                                <TouchableOpacity key={i} style={[s.menuItem, selectedQuality === resLabel && s.menuItemActive]} onPress={() => { setSelectedQuality(resLabel); setActiveMenu(null); }}>
                                                    <Text style={s.menuItemText}>{resLabel}{resLabel !== 'Auto' ? 'p' : ''}</Text>
                                                    {selectedQuality === resLabel && <Check size={16} color={'#FFD700'} />}
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            )}

            {/* Resume Popup - Placed here to ensure it is the topmost layer */}
            {showResumePopup && (
                <View style={s.resumeOverlay}>
                    <View style={s.resumeBox}>
                        <Clock size={40} color={colors.primary} />
                        <Text style={s.resumeTitle}>¿Continuar viendo?</Text>
                        <Text style={s.resumeText}>
                            Te quedaste en el minuto {resumeTime && resumeTime > 0 ? formatTime(resumeTime * 1000) : '...'}
                        </Text>
                        <View style={s.resumeActions}>
                            <TouchableOpacity style={s.resumeBtn} onPress={async () => {
                                setShowResumePopup(false);
                                setIsPlaying(true);
                                try {
                                    if (videoRef.current) {
                                        videoRef.current.seek(((resumeTime || 0) * 1000) / 1000);
                                        
                                    }
                                } catch (e) { }
                            }}>
                                <Text style={s.resumeBtnText}>Continuar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={s.startOverBtn} onPress={async () => {
                                setShowResumePopup(false);
                                setIsPlaying(true);
                                try {
                                    if (videoRef.current) {
                                        videoRef.current.seek((0) / 1000);
                                        
                                    }
                                } catch (e) { }
                            }}>
                                <Text style={s.startOverText}>Desde el inicio</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </GestureHandlerRootView>
    );
}

function TVPlaybackButton({ children, onPress, onFocus, style }: any) {
    const [isFocused, setIsFocused] = useState(false);
    const scaleV = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scaleV.value }],
        borderWidth: isFocused ? 2 : (style?.borderWidth || 0),
        borderColor: isFocused ? '#FFD700' : (style?.borderColor || 'transparent'),
    }));
    return (
        <Pressable
            onFocus={() => { setIsFocused(true); scaleV.value = withSpring(1.2); onFocus?.(); }}
            onBlur={() => { setIsFocused(false); scaleV.value = withSpring(1); }}
            onPress={onPress}
        >
            <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
        </Pressable>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    video: { ...StyleSheet.absoluteFill },
    subtitleOverlay: { position: 'absolute', bottom: '15%', left: 40, right: 40, alignItems: 'center', justifyContent: 'flex-end', zIndex: 50 },
    subtitleText: { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },
    loader: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
    logoText: { fontSize: 36, fontWeight: '900', color: '#FFD700', letterSpacing: 4, textTransform: 'uppercase' },
    loaderText: { color: 'rgba(255,255,255,0.6)', marginTop: 12, fontSize: 14 },
    errorContainer: { ...StyleSheet.absoluteFill, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 40, zIndex: 1000 },
    errorTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 16, textAlign: 'center' },
    errorText: { color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 8, fontSize: 14, lineHeight: 20 },
    retryBtn: { marginTop: 30, backgroundColor: '#FFD700', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16 },
    retryText: { color: '#000', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    topBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 12, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.3)' },
    iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    titleText: { fontSize: 16, fontWeight: '900', color: '#fff', textTransform: 'uppercase' },
    epBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFD700', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
    epBtnText: { fontSize: 11, fontWeight: '900', color: '#fff', textTransform: 'uppercase' },
    centerControls: { position: 'absolute', top: '50%', left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 60, marginTop: -30, zIndex: 100 },
    playBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0,229,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFD700' },
    skipText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: 4 },
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.5)' },
    progressWrap: { height: 40, justifyContent: 'center', marginBottom: 4 },
    progressBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'visible' },
    progressFill: { height: '100%', backgroundColor: '#FFD700', borderRadius: 3, position: 'relative', overflow: 'visible' },
    progressThumb: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#FFD700', position: 'absolute', right: -8, top: -5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 5 },
    bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    timeRow: { flexDirection: 'row', alignItems: 'center' },
    time: { fontSize: 14, fontWeight: '700', color: '#fff' },
    timeDur: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
    actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    actionBtn: { padding: 8, marginLeft: 4, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    divider: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 4 },
    sidebar: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 320, zIndex: 200, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
    settingsMenu: { position: 'absolute', right: 20, top: '15%', bottom: '15%', width: 280, zIndex: 200, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 },
    sidebarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    sidebarTitle: { fontSize: 20, fontWeight: '900', color: '#fff', textTransform: 'uppercase' },
    seasonHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 6 },
    seasonHeaderCurrent: { borderColor: 'rgba(255, 215, 0, 0.4)', backgroundColor: 'rgba(255, 215, 0, 0.12)' },
    seasonTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
    seasonCount: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    episodesContainer: { marginLeft: 14, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: 'rgba(255,255,255,0.15)', gap: 6, marginTop: 4, marginBottom: 8 },
    playingBadge: { backgroundColor: '#FFD700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    playingText: { fontSize: 10, fontWeight: '900', color: '#000', textTransform: 'uppercase' },
    seasonLabel: { fontSize: 11, fontWeight: '900', color: '#FFD700', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,215,0,0.2)', paddingBottom: 6 },
    epItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 8 },
    epItemActive: { backgroundColor: 'rgba(255,215,0,0.15)', borderColor: 'rgba(255,215,0,0.5)' },
    epNum: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    epNumActive: { backgroundColor: '#FFD700' },
    epNumText: { fontSize: 13, fontWeight: '900', color: '#fff' },
    epName: { flex: 1, fontSize: 14, fontWeight: '700', color: '#fff' },
    menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 8 },
    menuItemActive: { backgroundColor: 'rgba(0,229,255,0.1)', borderColor: 'rgba(0,229,255,0.2)', borderWidth: 1 },
    menuItemText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    lockOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0, 0, 0, 0.15)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    unlockBtn: { backgroundColor: 'rgba(0,0,0,0.6)', padding: 30, borderRadius: 100, alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
    lockText: { color: '#fff', fontSize: 12, fontWeight: '900', marginTop: 12, textTransform: 'uppercase' },
    unlockHint: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 },
    resumeOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
    resumeBox: { width: 320, padding: 30, borderRadius: 24, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
    resumeTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 16 },
    resumeText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 24 },
    resumeActions: { width: '100%', gap: 12 },
    resumeBtn: { backgroundColor: '#FFD700', width: '100%', height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    resumeBtnText: { color: '#000', fontWeight: '900', fontSize: 15 },
    startOverBtn: { width: '100%', height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    startOverText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    bufferingOverlay: { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 500 },
    bufferingText: { color: 'rgba(255,255,255,0.7)', marginTop: 12, fontSize: 13, fontWeight: '600' },
});
