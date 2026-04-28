import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InteractionManager, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { MarathiDistrict } from '../types';
import { getMonthSummary, getOfflineYear, getPanchangForDate, prewarmMonthSummary } from '../services/panchangService';
import { colors, spacing } from '../constants/theme';
import { formatLocalTime, formatMarathiMonthYear, formatMarathiNumber, toMarathiDigits } from '../utils/date';
import { normalizeMarathi } from '../utils/marathi';
import { InfoRow } from '../components/InfoRow';
import { ShimmerBlock } from '../components/ShimmerBlock';

const weekdayLabels = ['सोम', 'मंगळ', 'बुध', 'गुरु', 'शुक्र', 'शनि', 'रवि'];

type Props = {
    district: MarathiDistrict;
    largeTextMode: boolean;
};

type MonthRow = Awaited<ReturnType<typeof getMonthSummary>>[number];

function CalendarScreenBase({ district, largeTextMode }: Props) {
    const [monthDate, setMonthDate] = useState(new Date(getOfflineYear(), new Date().getMonth(), 1));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [rows, setRows] = useState<Awaited<ReturnType<typeof getMonthSummary>>>([]);
    const [loadedMonthKey, setLoadedMonthKey] = useState('');
    const [selectedDay, setSelectedDay] = useState(1);
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState('');
    const [detailBundle, setDetailBundle] = useState<Awaited<ReturnType<typeof getPanchangForDate>> | null>(null);
    const hasLoadedOnce = useRef(false);
    const requestId = useRef(0);

    const monthKey = useMemo(
        () => `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}::${district.id}`,
        [district.id, monthDate]
    );

    const monthLabel = useMemo(() => formatMarathiMonthYear(monthDate), [monthDate]);

    const load = useCallback(async () => {
        const token = requestId.current + 1;
        requestId.current = token;
        const isBackgroundUpdate = hasLoadedOnce.current;

        if (!isBackgroundUpdate) {
            setLoading(true);
        }
        setError('');

        try {
            const data = await getMonthSummary(monthDate, district);
            if (requestId.current !== token) {
                return;
            }

            setRows(data);
            setLoadedMonthKey(monthKey);
            hasLoadedOnce.current = true;

            const prevMonth = new Date(monthDate);
            prevMonth.setMonth(monthDate.getMonth() - 1);
            const nextMonth = new Date(monthDate);
            nextMonth.setMonth(monthDate.getMonth() + 1);
            void prewarmMonthSummary(prevMonth, district);
            void prewarmMonthSummary(nextMonth, district);

            const now = new Date();
            if (now.getFullYear() === monthDate.getFullYear() && now.getMonth() === monthDate.getMonth()) {
                setSelectedDay(now.getDate());
            } else {
                setSelectedDay(1);
            }
        } catch (e) {
            if (requestId.current !== token) {
                return;
            }
            setError(e instanceof Error ? e.message : 'माहिती लोड करता आली नाही.');
        } finally {
            if (requestId.current === token) {
                setLoading(false);
            }
        }
    }, [district, monthDate, monthKey]);

    useEffect(() => {
        const task = InteractionManager.runAfterInteractions(() => {
            void load();
        });

        return () => {
            task.cancel();
        };
    }, [load]);

    const goPrev = useCallback(() => {
        setMonthDate((old) => {
            const next = new Date(old);
            next.setMonth(old.getMonth() - 1);
            return next;
        });
    }, []);

    const goNext = useCallback(() => {
        setMonthDate((old) => {
            const next = new Date(old);
            next.setMonth(old.getMonth() + 1);
            return next;
        });
    }, []);

    const weeks = useMemo(() => {
        const firstWeekday = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).getDay();
        const leadingPadding = firstWeekday === 0 ? 6 : firstWeekday - 1;
        const cells: Array<MonthRow | null> = [];

        for (let index = 0; index < leadingPadding; index += 1) {
            cells.push(null);
        }

        rows.forEach((row) => cells.push(row));

        while (cells.length % 7 !== 0) {
            cells.push(null);
        }

        const output: Array<Array<MonthRow | null>> = [];
        for (let index = 0; index < cells.length; index += 7) {
            output.push(cells.slice(index, index + 7));
        }

        return output;
    }, [monthDate, rows]);

    const selectedRow = useMemo(() => rows.find((item) => item.dayNumber === selectedDay) ?? null, [rows, selectedDay]);
    const selectedDate = useMemo(() => new Date(monthDate.getFullYear(), monthDate.getMonth(), selectedDay), [monthDate, selectedDay]);

    const openDetail = useCallback(async () => {
        try {
            setDetailOpen(true);
            setDetailLoading(true);
            setDetailError('');
            const data = await getPanchangForDate(selectedDate, district, 'full');
            setDetailBundle(data);
        } catch (e) {
            setDetailError(e instanceof Error ? e.message : 'तपशील मिळाला नाही.');
        } finally {
            setDetailLoading(false);
        }
    }, [district, selectedDate]);

    const closeDetail = useCallback(() => {
        setDetailOpen(false);
        const now = new Date();
        if (now.getFullYear() === monthDate.getFullYear() && now.getMonth() === monthDate.getMonth()) {
            setSelectedDay(now.getDate());
        } else {
            setSelectedDay(-1);
        }
    }, [monthDate]);

    const openDetailForDay = useCallback(
        async (day: number) => {
            const targetDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
            setSelectedDay(day);

            try {
                setDetailOpen(true);
                setDetailLoading(true);
                setDetailError('');
                const data = await getPanchangForDate(targetDate, district, 'full');
                setDetailBundle(data);
            } catch (e) {
                setDetailError(e instanceof Error ? e.message : 'तपशील मिळाला नाही.');
            } finally {
                setDetailLoading(false);
            }
        },
        [district, monthDate]
    );

    const today = new Date();
    const todayDay = today.getFullYear() === monthDate.getFullYear() && today.getMonth() === monthDate.getMonth() ? today.getDate() : -1;
    const gridReady = !loading && loadedMonthKey === monthKey && rows.length > 0;

    const panResponder = useMemo(
        () =>
            PanResponder.create({
                onMoveShouldSetPanResponderCapture: (_, gestureState) => {
                    const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
                    return isHorizontal && Math.abs(gestureState.dx) > 14;
                },
                onPanResponderRelease: (_, gestureState) => {
                    if (gestureState.dx > 40) {
                        goPrev();
                    } else if (gestureState.dx < -40) {
                        goNext();
                    }
                }
            }),
        [goNext, goPrev]
    );

    return (
        <View style={styles.page} {...panResponder.panHandlers}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <View style={styles.headerCard}>
                    <View style={styles.navRow}>
                        <Pressable onPress={goPrev} style={styles.navBtn}>
                            <Text style={styles.navTxt}>◀ मागील</Text>
                        </Pressable>
                        <View style={styles.headerCenter}>
                            <Text style={styles.headerTitle}>मराठी पंचांग महिना</Text>
                            <Text style={styles.heading}>{monthLabel}</Text>
                            <Text style={styles.monthMetaSub}>जिल्हा: {district.name} • वर्ष: {formatMarathiNumber(getOfflineYear())}</Text>
                        </View>
                        <Pressable onPress={goNext} style={styles.navBtn}>
                            <Text style={styles.navTxt}>पुढील ▶</Text>
                        </Pressable>
                    </View>

                    <View style={styles.legendRow}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendBox, styles.legendToday]} />
                            <Text style={styles.legendText}>आज</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendBox, styles.legendFestival]} />
                            <Text style={styles.legendText}>सण</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendBox, styles.legendUpwas]} />
                            <Text style={styles.legendText}>उपवास / व्रत</Text>
                        </View>
                    </View>
                </View>

                {loading && !gridReady ? (
                    <View style={styles.skeletonWrap}>
                        {Array.from({ length: 5 }).map((_, rowIndex) => (
                            <View key={`skeleton-row-${rowIndex}`} style={styles.skeletonRow}>
                                {Array.from({ length: 7 }).map((__, columnIndex) => (
                                    <ShimmerBlock key={`skeleton-cell-${rowIndex}-${columnIndex}`} height={66} borderRadius={12} style={styles.skeletonCell} />
                                ))}
                            </View>
                        ))}
                    </View>
                ) : error && !gridReady ? (
                    <Text style={styles.loading}>{error}</Text>
                ) : (
                    <>
                        <View style={styles.weekHeader}>
                            {weekdayLabels.map((label, index) => (
                                <Text key={label} style={[styles.weekHeaderLabel, index === 5 && styles.saturdayText, index === 6 && styles.sundayText]}>
                                    {label}
                                </Text>
                            ))}
                        </View>

                        <View style={styles.gridShell}>
                            {weeks.map((week, weekIndex) => (
                                <View key={`week-${weekIndex}`} style={styles.weekRow}>
                                    {week.map((day, dayIndex) => {
                                        if (!day) {
                                            return <View key={`empty-${weekIndex}-${dayIndex}`} style={styles.cellEmpty} />;
                                        }

                                        const isToday = day.dayNumber === todayDay;
                                        const isSelected = detailOpen && day.dayNumber === selectedDay;
                                        const hasFestival = day.festivals.length > 0;
                                        const miniTithi = day.tithi.split(' ')[0] ?? day.tithi;
                                        const isSunday = dayIndex === 6;
                                        const isSaturday = dayIndex === 5;

                                        return (
                                            <Pressable
                                                key={day.dateKey}
                                                style={[
                                                    styles.cell,
                                                    isSaturday && !hasFestival && !day.hasUpwas && styles.cellSaturday,
                                                    isSunday && !hasFestival && !day.hasUpwas && styles.cellSunday,
                                                    hasFestival && !day.hasUpwas && styles.cellFestival,
                                                    day.hasUpwas && styles.cellUpwas,
                                                    isToday && styles.cellToday,
                                                    isSelected && !isToday && styles.cellSelected
                                                ]}
                                                onPress={() => openDetailForDay(day.dayNumber)}
                                            >
                                                <View style={styles.cellTopRow}>
                                                    <Text style={[styles.cellDay, isToday && styles.cellDayToday, isSelected && !isToday && styles.cellDaySelected]}>
                                                        {formatMarathiNumber(day.dayNumber)}
                                                    </Text>
                                                </View>
                                                <Text style={styles.cellMiniText} numberOfLines={2}>
                                                    {miniTithi}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            ))}
                        </View>

                        {selectedRow ? (
                            <View style={styles.detailCard}>
                                <View style={styles.detailTopRow}>
                                    <View style={styles.detailDateBlock}>
                                        <Text style={styles.detailDateNumber}>{formatMarathiNumber(selectedRow.dayNumber)}</Text>
                                        <Text style={styles.detailDateLabel}>{monthLabel}</Text>
                                    </View>
                                    <View style={styles.detailSummary}>
                                        <Text style={styles.detailTitle}>निवडलेला दिवस</Text>
                                        <Text style={styles.tithi}>{selectedRow.tithi}</Text>
                                        <Text style={styles.detailHint}>{selectedRow.hasUpwas ? 'उपवास / व्रत आहे' : 'सामान्य दिवस'}</Text>
                                    </View>
                                </View>

                                {selectedRow.festivals.length > 0 ? (
                                    selectedRow.festivals.slice(0, 5).map((festival) => (
                                        <Text key={`${selectedRow.dateKey}-festival-${festival}`} style={styles.festival}>
                                            • {festival}
                                        </Text>
                                    ))
                                ) : (
                                    <Text style={styles.emptyInfo}>आज विशेष सण नाही.</Text>
                                )}

                                <Pressable style={styles.detailBtn} onPress={openDetail}>
                                    <Text style={styles.detailBtnText}>या दिवसाचा पूर्ण तपशील</Text>
                                </Pressable>
                            </View>
                        ) : (
                            <Text style={styles.loading}>ऑफलाइन वर्ष: {formatMarathiNumber(getOfflineYear())}</Text>
                        )}
                    </>
                )}

                <Modal visible={detailOpen} animationType="slide" onRequestClose={closeDetail} transparent>
                    <View style={styles.modalBackdrop}>
                        <View style={styles.modalCard}>
                            <View style={styles.modalHeader}>
                                <View>
                                    <Text style={styles.modalTitle}>दिवस तपशील</Text>
                                    <Text style={styles.modalDateLabel}>
                                        {toMarathiDigits(selectedDate.toLocaleDateString('mr-IN', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }))}
                                    </Text>
                                </View>
                                <Pressable onPress={closeDetail}>
                                    <Text style={styles.modalClose}>बंद</Text>
                                </Pressable>
                            </View>

                            {detailLoading ? (
                                <Text style={styles.loading}>तपशील लोड होत आहे...</Text>
                            ) : detailError ? (
                                <Text style={styles.loading}>{detailError}</Text>
                            ) : detailBundle ? (
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    <View style={styles.modalSection}>
                                        <InfoRow largeTextMode={largeTextMode} label="वार" value={normalizeMarathi(detailBundle.data.vara.name)} icon="calendar-today" />
                                        <InfoRow largeTextMode={largeTextMode} label="तिथी" value={normalizeMarathi(detailBundle.data.tithis[0]?.name ?? '—')} icon="moon-first-quarter" />
                                        <InfoRow largeTextMode={largeTextMode} label="नक्षत्र" value={normalizeMarathi(detailBundle.data.nakshatras[0]?.name ?? '—')} icon="star-four-points" />
                                        <InfoRow largeTextMode={largeTextMode} label="योग" value={normalizeMarathi(detailBundle.data.yogas[0]?.name ?? '—')} icon="meditation" />
                                        <InfoRow largeTextMode={largeTextMode} label="करण" value={normalizeMarathi(detailBundle.data.karanas[0]?.name ?? '—')} icon="leaf" />
                                    </View>

                                    <View style={styles.modalSection}>
                                        <InfoRow largeTextMode={largeTextMode} label="सूर्योदय" value={formatLocalTime(detailBundle.data.sunrise)} icon="weather-sunset-up" />
                                        <InfoRow largeTextMode={largeTextMode} label="सूर्यास्त" value={formatLocalTime(detailBundle.data.sunset)} icon="weather-sunset-down" />
                                        <InfoRow
                                            largeTextMode={largeTextMode}
                                            label="राहुकाल"
                                            value={`${formatLocalTime(detailBundle.data.rahuKalam.start)} - ${formatLocalTime(detailBundle.data.rahuKalam.end)}`}
                                            icon="clock-alert-outline"
                                        />
                                        <InfoRow
                                            largeTextMode={largeTextMode}
                                            label="गुलिककाल"
                                            value={`${formatLocalTime(detailBundle.data.gulikaKalam.start)} - ${formatLocalTime(detailBundle.data.gulikaKalam.end)}`}
                                            icon="timer-sand-empty"
                                        />
                                        <InfoRow
                                            largeTextMode={largeTextMode}
                                            label="यमगंड"
                                            value={`${formatLocalTime(detailBundle.data.yamaganda.start)} - ${formatLocalTime(detailBundle.data.yamaganda.end)}`}
                                            icon="alert-circle-outline"
                                        />
                                        <InfoRow
                                            largeTextMode={largeTextMode}
                                            label="अभिजीत मुहूर्त"
                                            value={`${formatLocalTime(detailBundle.data.abhijitMuhurta.start)} - ${formatLocalTime(detailBundle.data.abhijitMuhurta.end)}`}
                                            icon="star-circle"
                                        />
                                    </View>

                                    <View style={styles.modalSection}>
                                        <Text style={styles.modalSectionTitle}>सण / उपवास</Text>
                                        {detailBundle.marathiFestivals.length > 0 ? (
                                            detailBundle.marathiFestivals.map((festival) => (
                                                <Text key={`detail-${festival}`} style={styles.festival}>
                                                    • {festival}
                                                </Text>
                                            ))
                                        ) : (
                                            <Text style={styles.emptyInfo}>आज विशेष सण नाही.</Text>
                                        )}
                                    </View>
                                </ScrollView>
                            ) : (
                                <Text style={styles.loading}>तपशील उपलब्ध नाही.</Text>
                            )}
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </View>
    );
}

export const CalendarScreen = memo(CalendarScreenBase);

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
    headerCard: {
        backgroundColor: '#FFF3E0',
        borderWidth: 1,
        borderColor: '#FFB74D',
        borderRadius: 20,
        padding: spacing.md,
        marginBottom: spacing.sm
    },
    navRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.sm
    },
    navBtn: {
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: colors.card,
        minWidth: 74,
        alignItems: 'center'
    },
    navTxt: {
        color: colors.primary,
        fontWeight: '800'
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center'
    },
    headerTitle: {
        color: colors.muted,
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.4,
        textTransform: 'uppercase'
    },
    heading: {
        fontSize: 20,
        fontWeight: '900',
        color: colors.text,
        textAlign: 'center',
        marginTop: 4
    },
    monthMetaSub: {
        color: colors.muted,
        fontSize: 12,
        marginTop: 2,
        textAlign: 'center',
        fontWeight: '600'
    },
    legendRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 14,
        justifyContent: 'center'
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    legendBox: {
        width: 10,
        height: 10,
        borderRadius: 3,
        backgroundColor: colors.border
    },
    legendToday: {
        backgroundColor: colors.primary
    },
    legendFestival: {
        backgroundColor: '#FFE0B2', // Matches cellFestival backgroundColor
        borderColor: '#FFB74D',
        borderWidth: 1
    },
    legendUpwas: {
        backgroundColor: '#FCE4EC', // Matches cellUpwas backgroundColor
        borderColor: '#E57373',
        borderWidth: 1
    },
    legendText: {
        color: colors.muted,
        fontSize: 12,
        fontWeight: '700'
    },
    loading: {
        marginTop: spacing.lg,
        textAlign: 'center',
        color: colors.muted,
        fontWeight: '700'
    },
    skeletonWrap: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 18,
        padding: 10,
        marginBottom: spacing.sm
    },
    skeletonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 6,
        marginBottom: 6
    },
    skeletonCell: {
        flex: 1,
        minWidth: 0
    },
    weekHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        paddingHorizontal: 2
    },
    weekHeaderLabel: {
        flex: 1,
        minWidth: 0,
        textAlign: 'center',
        color: colors.muted,
        fontSize: 12,
        fontWeight: '800'
    },
    saturdayText: {
        color: '#0E7490'
    },
    sundayText: {
        color: '#B91C1C'
    },
    gridShell: {
        backgroundColor: '#FFF3E0',
        borderWidth: 1,
        borderColor: '#FFB74D',
        borderRadius: 18,
        padding: 8,
        marginBottom: spacing.sm
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
        gap: 4
    },
    cellEmpty: {
        flex: 1,
        minWidth: 0,
        aspectRatio: 0.96
    },
    cell: {
        flex: 1,
        minWidth: 0,
        aspectRatio: 0.96,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2D1BC',
        backgroundColor: '#FFFDF8',
        paddingVertical: 4,
        paddingHorizontal: 4,
        justifyContent: 'space-between'
    },
    cellSaturday: {
        backgroundColor: '#F3E5F5' // warm purple/grey
    },
    cellSunday: {
        backgroundColor: '#FFEBEE' // warm light red
    },
    cellFestival: {
        backgroundColor: '#FFE0B2',
        borderColor: '#FFB74D'
    },
    cellUpwas: {
        backgroundColor: '#FCE4EC',
        borderColor: '#E57373'
    },
    cellToday: {
        borderColor: colors.primary,
        backgroundColor: '#FFF3E0',
        borderWidth: 2
    },
    cellSelected: {
        borderColor: colors.primary,
        backgroundColor: '#FFCC80'
    },
    cellTopRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-start'
    },
    cellDay: {
        color: colors.text,
        fontWeight: '900',
        fontSize: 18,
        lineHeight: 18
    },
    cellDayToday: {
        color: colors.primary
    },
    cellDaySelected: {
        color: colors.primary
    },
    cellMiniText: {
        color: colors.muted,
        fontSize: 9,
        lineHeight: 12,
        fontWeight: '700',
        textAlign: 'center',
        flexShrink: 1,
        minHeight: 22,
        paddingBottom: 4
    },
    detailCard: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 18,
        padding: spacing.md
    },
    detailTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.sm
    },
    detailDateBlock: {
        width: 86,
        height: 86,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#FFCC80',
        backgroundColor: '#FFF3E0',
        alignItems: 'center',
        justifyContent: 'center'
    },
    detailDateNumber: {
        color: colors.primary,
        fontSize: 36,
        fontWeight: '900',
        lineHeight: 36
    },
    detailDateLabel: {
        color: colors.muted,
        fontSize: 11,
        fontWeight: '700',
        marginTop: 2,
        textAlign: 'center'
    },
    detailSummary: {
        flex: 1
    },
    detailTitle: {
        color: colors.text,
        fontSize: 18,
        fontWeight: '900'
    },
    tithi: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.primary,
        marginTop: 4
    },
    detailHint: {
        color: colors.muted,
        marginTop: 4,
        fontWeight: '700'
    },
    festival: {
        marginTop: 2,
        color: colors.festival,
        fontSize: 14,
        fontWeight: '700'
    },
    emptyInfo: {
        color: colors.muted,
        marginTop: 2
    },
    detailBtn: {
        marginTop: spacing.sm,
        backgroundColor: '#FFE0B2',
        borderColor: colors.primary,
        borderWidth: 1,
        borderRadius: 14,
        paddingVertical: 10,
        alignItems: 'center'
    },
    detailBtnText: {
        color: colors.primary,
        fontWeight: '900'
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.36)',
        justifyContent: 'flex-end'
    },
    modalCard: {
        backgroundColor: colors.bg,
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        maxHeight: '88%',
        padding: spacing.md
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.sm,
        gap: spacing.sm
    },
    modalTitle: {
        color: colors.text,
        fontSize: 20,
        fontWeight: '900'
    },
    modalClose: {
        color: colors.primary,
        fontWeight: '900',
        fontSize: 15
    },
    modalDateLabel: {
        color: colors.muted,
        marginTop: 2,
        fontWeight: '600'
    },
    modalSection: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 14,
        padding: spacing.sm,
        marginBottom: spacing.sm
    },
    modalSectionTitle: {
        color: colors.primary,
        fontWeight: '900',
        marginBottom: 6
    }
});
