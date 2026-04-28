import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InteractionManager, PanResponder, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { MarathiDistrict } from '../types';
import { getOfflineYear, getPanchangForDate } from '../services/panchangService';
import { addDays, formatLocalTime, formatMarathiDate, formatMarathiNumber, formatMarathiWeekdayShort, isSameDay, toDateKey, toMarathiDigits } from '../utils/date';
import { normalizeMarathi } from '../utils/marathi';
import { colors, spacing } from '../constants/theme';
import { SectionCard } from '../components/SectionCard';
import { InfoRow } from '../components/InfoRow';
import { ShimmerBlock } from '../components/ShimmerBlock';

type Props = {
    district: MarathiDistrict;
    largeTextMode: boolean;
};

function HomeScreenBase({ district, largeTextMode }: Props) {
    const today = useMemo(() => new Date(), []);
    const [selectedDate, setSelectedDate] = useState(today);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');
    const [bundle, setBundle] = useState<Awaited<ReturnType<typeof getPanchangForDate>> | null>(null);
    const [tomorrowBundle, setTomorrowBundle] = useState<Awaited<ReturnType<typeof getPanchangForDate>> | null>(null);
    const requestId = useRef(0);
    const hasLoadedOnce = useRef(false);

    const load = useCallback(
        async (targetDate: Date) => {
            const token = requestId.current + 1;
            requestId.current = token;
            const isBackgroundUpdate = hasLoadedOnce.current;

            if (isBackgroundUpdate) {
                setUpdating(true);
            } else {
                setLoading(true);
            }

            setError('');

            try {
                const nextDate = addDays(targetDate, 1);
                const [currentBundle, nextBundle] = await Promise.all([
                    getPanchangForDate(targetDate, district, 'full'),
                    getPanchangForDate(nextDate, district, 'lite')
                ]);

                if (requestId.current !== token) {
                    return;
                }

                setBundle(currentBundle);
                setTomorrowBundle(nextBundle);
                hasLoadedOnce.current = true;

                void getPanchangForDate(addDays(targetDate, -1), district, 'lite');
            } catch (e) {
                if (requestId.current !== token) {
                    return;
                }

                setError(e instanceof Error ? e.message : 'माहिती मिळाली नाही.');
            } finally {
                if (requestId.current === token) {
                    setLoading(false);
                    setRefreshing(false);
                    setUpdating(false);
                }
            }
        },
        [district]
    );

    useEffect(() => {
        const task = InteractionManager.runAfterInteractions(() => {
            void load(selectedDate);
        });

        return () => {
            task.cancel();
        };
    }, [load, selectedDate]);

    const goToPreviousDay = useCallback(() => {
        setSelectedDate((old) => addDays(old, -1));
    }, []);

    const goToNextDay = useCallback(() => {
        setSelectedDate((old) => addDays(old, 1));
    }, []);

    const goToToday = useCallback(() => {
        setSelectedDate(new Date());
    }, []);

    const panResponder = useMemo(
        () =>
            PanResponder.create({
                onMoveShouldSetPanResponderCapture: (_, gestureState) => {
                    const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
                    return isHorizontal && Math.abs(gestureState.dx) > 14;
                },
                onPanResponderRelease: (_, gestureState) => {
                    if (gestureState.dx > 40) {
                        goToPreviousDay();
                    } else if (gestureState.dx < -40) {
                        goToNextDay();
                    }
                }
            }),
        [goToNextDay, goToPreviousDay]
    );

    const liveToday = new Date();
    const isToday = isSameDay(selectedDate, liveToday);
    const selectedDateKey = toDateKey(selectedDate);
    const activeBundle = bundle?.dateKey === selectedDateKey ? bundle : null;
    const activeTomorrowBundle = activeBundle ? tomorrowBundle : null;
    const weekdayShort = formatMarathiWeekdayShort(selectedDate);
    const titleLabel = isToday ? 'आज' : weekdayShort;
    const monthYearLabel = toMarathiDigits(selectedDate.toLocaleDateString('mr-IN', {
        month: 'long',
        year: 'numeric'
    }));
    const selectedFestivalCount = activeBundle?.marathiFestivals.length ?? 0;
    const selectedUpwasCount = activeBundle?.upwasItems.length ?? 0;
    const showingInitialLoading = loading && !bundle;

    if (showingInitialLoading) {
        return (
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <ShimmerBlock height={210} borderRadius={22} style={styles.heroSkeleton} />
                <View style={styles.quickRow}>
                    <ShimmerBlock height={88} style={styles.quickCard} />
                    <ShimmerBlock height={88} style={styles.quickCard} />
                </View>
                <ShimmerBlock height={180} borderRadius={18} style={styles.sectionSkeleton} />
                <ShimmerBlock height={180} borderRadius={18} style={styles.sectionSkeleton} />
                <ShimmerBlock height={160} borderRadius={18} style={styles.sectionSkeleton} />
            </ScrollView>
        );
    }

    if (error && !activeBundle) {
        return (
            <View style={styles.center}>
                <Text style={styles.error}>{error || 'तांत्रिक अडचण'}</Text>
                <Text style={styles.helper}>ऑफलाइन वर्ष: {formatMarathiNumber(getOfflineYear())}</Text>
            </View>
        );
    }

    return (
        <View style={styles.page} {...panResponder.panHandlers}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            void load(selectedDate);
                        }}
                        tintColor={colors.primary}
                    />
                }
            >
                <View style={styles.heroCard}>
                    <View style={styles.heroTopRow}>
                        <View style={styles.titleGroup}>
                            <Text style={styles.heroEyebrow}>{titleLabel}</Text>
                            <Text style={styles.heroSub}>{formatMarathiDate(selectedDate)}</Text>
                        </View>
                        {isToday ? (
                            <View style={styles.todayBadge}>
                                <Text style={styles.todayBadgeText}>आजचा दिवस</Text>
                            </View>
                        ) : (
                            <Pressable style={styles.todayBtn} onPress={goToToday}>
                                <Text style={styles.todayBtnText}>आज</Text>
                            </Pressable>
                        )}
                    </View>

                    <View style={styles.heroDateRow}>
                        <View style={styles.dateBlock}>
                            <Text style={[styles.dateNumber, largeTextMode && styles.dateNumberLarge]}>
                                {formatMarathiNumber(selectedDate.getDate())}
                            </Text>
                            <Text style={styles.monthYear}>{monthYearLabel}</Text>
                        </View>
                        <View style={styles.dateMetaWrap}>
                            <View style={styles.metaChip}>
                                <Text style={styles.metaLabel}>वार</Text>
                                <Text style={styles.metaValue}>{weekdayShort}</Text>
                            </View>
                            <View style={styles.metaChip}>
                                <Text style={styles.metaLabel}>जिल्हा</Text>
                                <Text style={styles.metaValue} numberOfLines={1}>
                                    {district.name}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.swipeHelpRow}>
                        <Text style={styles.swipeHelp}>◀ उजवीकडे</Text>
                        <Text style={styles.swipeHelpCenter}>डावीकडे / उजवीकडे स्वाइप करा</Text>
                        <Text style={styles.swipeHelp}>पुढचा ▶</Text>
                    </View>

                    {(updating || refreshing) && (
                        <View style={styles.loadingPill}>
                            <Text style={styles.loadingPillText}>माहिती आणत आहे...</Text>
                        </View>
                    )}
                </View>

                <View style={styles.quickRow}>
                    <View style={styles.quickCard}>
                        <MaterialCommunityIcons name="party-popper" size={24} color={colors.primary} style={styles.quickIcon} />
                        <Text style={styles.quickLabel}>आजचे सण</Text>
                        <Text style={styles.quickValue}>{formatMarathiNumber(selectedFestivalCount)}</Text>
                    </View>
                    <View style={styles.quickCard}>
                        <MaterialCommunityIcons name="moon-waning-crescent" size={24} color={colors.primary} style={styles.quickIcon} />
                        <Text style={styles.quickLabel}>उपवास</Text>
                        <Text style={styles.quickValue}>{formatMarathiNumber(selectedUpwasCount)}</Text>
                    </View>
                </View>

                {!activeBundle ? (
                    <View style={styles.sectionLoadingWrap}>
                        <Text style={styles.sectionLoadingText}>या दिवसाची माहिती लोड होत आहे...</Text>
                    </View>
                ) : (
                    <>
                        <SectionCard title="पंचांग माहिती" icon="book-open-page-variant-outline">
                            <InfoRow largeTextMode={largeTextMode} label="वार" value={normalizeMarathi(activeBundle.data.vara.name)} icon="calendar-today" />
                            <InfoRow largeTextMode={largeTextMode} label="तिथी" value={normalizeMarathi(activeBundle.data.tithis[0]?.name ?? '—')} icon="moon-first-quarter" />
                            <InfoRow largeTextMode={largeTextMode} label="नक्षत्र" value={normalizeMarathi(activeBundle.data.nakshatras[0]?.name ?? '—')} icon="star-four-points" />
                            <InfoRow largeTextMode={largeTextMode} label="योग" value={normalizeMarathi(activeBundle.data.yogas[0]?.name ?? '—')} icon="meditation" />
                            <InfoRow largeTextMode={largeTextMode} label="करण" value={normalizeMarathi(activeBundle.data.karanas[0]?.name ?? '—')} icon="leaf" />
                        </SectionCard>

                        <SectionCard title="महत्त्वाच्या वेळा" icon="clock-outline">
                            <InfoRow largeTextMode={largeTextMode} label="सूर्योदय" value={formatLocalTime(activeBundle.data.sunrise)} icon="weather-sunset-up" />
                            <InfoRow largeTextMode={largeTextMode} label="सूर्यास्त" value={formatLocalTime(activeBundle.data.sunset)} icon="weather-sunset-down" />
                            <InfoRow
                                largeTextMode={largeTextMode}
                                label="राहुकाल"
                                value={`${formatLocalTime(activeBundle.data.rahuKalam.start)} - ${formatLocalTime(activeBundle.data.rahuKalam.end)}`}
                                icon="clock-alert-outline"
                            />
                            <InfoRow
                                largeTextMode={largeTextMode}
                                label="गुलिककाल"
                                value={`${formatLocalTime(activeBundle.data.gulikaKalam.start)} - ${formatLocalTime(activeBundle.data.gulikaKalam.end)}`}
                                icon="timer-sand-empty"
                            />
                            <InfoRow
                                largeTextMode={largeTextMode}
                                label="यमगंड"
                                value={`${formatLocalTime(activeBundle.data.yamaganda.start)} - ${formatLocalTime(activeBundle.data.yamaganda.end)}`}
                                icon="alert-circle-outline"
                            />
                            <InfoRow
                                largeTextMode={largeTextMode}
                                label="अभिजीत मुहूर्त"
                                value={`${formatLocalTime(activeBundle.data.abhijitMuhurta.start)} - ${formatLocalTime(activeBundle.data.abhijitMuhurta.end)}`}
                                icon="star-circle"
                            />
                        </SectionCard>

                        <SectionCard title="सण / उपवास" icon="calendar-star">
                            {activeBundle.marathiFestivals.length === 0 ? (
                                <Text style={styles.empty}>आज विशेष सण नाही.</Text>
                            ) : (
                                activeBundle.marathiFestivals.map((item) => {
                                    const isUpwas = activeBundle.upwasItems.includes(item);
                                    return (
                                        <Text key={item} style={[styles.list, isUpwas && styles.listUpwas, largeTextMode && styles.listLarge]}>
                                            • {item} {isUpwas && '(उपवास)'}
                                        </Text>
                                    );
                                })
                            )}
                        </SectionCard>

                        <SectionCard title="उद्याचे विशेष" icon="calendar-arrow-right">
                            {!activeTomorrowBundle ? (
                                <Text style={styles.empty}>उद्याची माहिती उपलब्ध नाही.</Text>
                            ) : (
                                <>
                                    <Text style={styles.tomorrowLabel}>
                                        तिथी: {normalizeMarathi(activeTomorrowBundle.data.tithis[0]?.name ?? '—')}
                                    </Text>
                                    {activeTomorrowBundle.marathiFestivals.length > 0 ? (
                                        activeTomorrowBundle.marathiFestivals.slice(0, 4).map((item) => {
                                            const isUpwas = activeTomorrowBundle.upwasItems.includes(item);
                                            return (
                                                <Text key={`tomorrow-${item}`} style={[styles.list, isUpwas && styles.listUpwas, largeTextMode && styles.listLarge]}>
                                                    • {item} {isUpwas && '(उपवास)'}
                                                </Text>
                                            );
                                        })
                                    ) : (
                                        <Text style={styles.empty}>उद्या प्रमुख सण नाही.</Text>
                                    )}
                                </>
                            )}
                        </SectionCard>
                    </>
                )}

                <View style={styles.footerNote}>
                    <Text style={styles.footerNoteText}>ऑफलाइन वर्ष: {formatMarathiNumber(getOfflineYear())}</Text>
                </View>
            </ScrollView>
        </View>
    );
}

export const HomeScreen = memo(HomeScreenBase);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg
    },
    page: {
        flex: 1
    },
    content: {
        padding: spacing.md,
        paddingBottom: spacing.lg
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.bg,
        padding: spacing.lg
    },
    error: {
        color: '#A40000',
        fontWeight: '800',
        textAlign: 'center',
        fontSize: 18
    },
    helper: {
        marginTop: spacing.sm,
        color: colors.muted
    },
    heroSkeleton: {
        marginBottom: spacing.sm
    },
    sectionSkeleton: {
        marginBottom: spacing.sm
    },
    heroCard: {
        backgroundColor: '#FFF3E0',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#FFB74D',
        padding: spacing.md,
        marginBottom: spacing.sm,
        elevation: 2
    },
    heroTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: spacing.sm
    },
    titleGroup: {
        flex: 1
    },
    heroEyebrow: {
        color: colors.primary,
        fontSize: 31,
        fontWeight: '900',
        lineHeight: 42,
    },
    heroSub: {
        color: colors.muted,
        marginTop: 3,
        fontSize: 13,
        fontWeight: '600'
    },
    todayBadge: {
        backgroundColor: colors.upwas,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6
    },
    todayBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800'
    },
    todayBtn: {
        backgroundColor: '#FFE0B2',
        borderColor: colors.primary,
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6
    },
    todayBtnText: {
        color: colors.primary,
        fontWeight: '800'
    },
    heroDateRow: {
        flexDirection: 'row',
        gap: spacing.md,
        alignItems: 'center',
        marginTop: spacing.sm
    },
    dateBlock: {
        flex: 1,
        backgroundColor: '#FFFDF8',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#FFCC80',
        paddingVertical: 16,
        paddingHorizontal: 14,
        alignItems: 'center',
        justifyContent: 'center'
    },
    dateNumber: {
        color: colors.text,
        fontSize: 54,
        fontWeight: '900',
        lineHeight: 56
    },
    dateNumberLarge: {
        fontSize: 60,
        lineHeight: 62
    },
    monthYear: {
        color: colors.primary,
        fontSize: 15,
        fontWeight: '800',
        marginTop: 3,
        textAlign: 'center'
    },
    dateMetaWrap: {
        flex: 1,
        gap: 8
    },
    metaChip: {
        backgroundColor: '#FFFDF8',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#FFCC80',
        paddingHorizontal: 12,
        paddingVertical: 10
    },
    metaLabel: {
        color: colors.muted,
        fontSize: 12,
        fontWeight: '700'
    },
    metaValue: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '800',
        marginTop: 2
    },
    swipeHelpRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.sm,
        gap: 6
    },
    swipeHelp: {
        color: colors.muted,
        fontSize: 12,
        fontWeight: '700'
    },
    swipeHelpCenter: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: '800'
    },
    loadingPill: {
        marginTop: spacing.sm,
        alignSelf: 'flex-start',
        backgroundColor: '#FFE0B2',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5
    },
    loadingPillText: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: '800'
    },
    quickRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: spacing.sm
    },
    quickCard: {
        flex: 1,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        padding: 12
    },
    quickIcon: {
        fontSize: 18,
        marginBottom: 2
    },
    quickLabel: {
        color: colors.muted,
        fontSize: 12,
        fontWeight: '700'
    },
    quickValue: {
        marginTop: 4,
        color: colors.primary,
        fontSize: 24,
        fontWeight: '900'
    },
    sectionLoadingWrap: {
        backgroundColor: colors.card,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
        alignItems: 'center'
    },
    sectionLoadingText: {
        color: colors.muted,
        fontWeight: '700'
    },
    list: {
        color: colors.festival,
        fontSize: 16,
        marginBottom: 5,
        fontWeight: '700'
    },
    listUpwas: {
        color: colors.upwas
    },
    listLarge: {
        fontSize: 18
    },
    tomorrowLabel: {
        color: colors.primary,
        fontWeight: '800',
        marginBottom: spacing.xs
    },
    empty: {
        color: colors.muted
    },
    upwasHint: {
        color: colors.upwas,
        fontWeight: '800',
        marginTop: spacing.xs
    },
    footerNote: {
        alignItems: 'center',
        marginTop: spacing.sm,
        marginBottom: 2
    },
    footerNoteText: {
        color: colors.muted,
        fontSize: 12,
        fontWeight: '600'
    }
});
