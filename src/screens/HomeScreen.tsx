import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InteractionManager, Modal, PanResponder, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
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
    const [faqOpen, setFaqOpen] = useState(false);
    const [datePickerOpen, setDatePickerOpen] = useState(false);
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

    const openDatePicker = useCallback(() => setDatePickerOpen(true), []);
    const closeDatePicker = useCallback(() => setDatePickerOpen(false), []);
    const selectDate = useCallback((date: Date) => {
        setSelectedDate(date);
        setDatePickerOpen(false);
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

    const datePickerWeeks = useMemo(() => {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const firstWeekday = new Date(year, month, 1).getDay();
        const leadingPadding = firstWeekday === 0 ? 6 : firstWeekday - 1;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const cells: (number | null)[] = [];

        for (let i = 0; i < leadingPadding; i++) cells.push(null);
        for (let i = 1; i <= daysInMonth; i++) cells.push(i);
        while (cells.length % 7 !== 0) cells.push(null);

        const output: (number | null)[][] = [];
        for (let i = 0; i < cells.length; i += 7) {
            output.push(cells.slice(i, i + 7));
        }

        return output;
    }, [selectedDate]);

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
                        <Pressable style={styles.dateBlock} onPress={openDatePicker}>
                            <Text style={[styles.dateNumber, largeTextMode && styles.dateNumberLarge]}>
                                {formatMarathiNumber(selectedDate.getDate())}
                            </Text>
                            <Text style={styles.monthYear}>{monthYearLabel}</Text>
                        </Pressable>
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
                            <InfoRow largeTextMode={largeTextMode} label="महिना" value={normalizeMarathi(activeBundle.data.chandramasa.amantaName)} icon="calendar-month" />
                            <InfoRow largeTextMode={largeTextMode} label="पक्ष" value={activeBundle.data.tithis[0]?.paksha === 'शुक्ल' ? 'शुक्ल पक्ष' : (activeBundle.data.tithis[0]?.paksha === 'कृष्ण' ? 'कृष्ण पक्ष' : '—')} icon="moon-waning-crescent" />
                            <InfoRow largeTextMode={largeTextMode} label="विक्रम संवत" value={formatMarathiNumber(activeBundle.data.samvat.vikramSamvat)} icon="calendar-multiselect" />
                            <InfoRow largeTextMode={largeTextMode} label="वार" value={normalizeMarathi(activeBundle.data.vara.name)} icon="calendar-today" />
                            <InfoRow largeTextMode={largeTextMode} label="तिथी" value={`${normalizeMarathi(activeBundle.data.tithis[0]?.name ?? '—')} (समाप्ती: ${formatLocalTime(activeBundle.data.tithis[0]?.endTime)})`} icon="moon-first-quarter" />
                            <InfoRow largeTextMode={largeTextMode} label="नक्षत्र" value={`${normalizeMarathi(activeBundle.data.nakshatras[0]?.name ?? '—')} (समाप्ती: ${formatLocalTime(activeBundle.data.nakshatras[0]?.endTime)})`} icon="star-four-points" />
                            <InfoRow largeTextMode={largeTextMode} label="योग" value={`${normalizeMarathi(activeBundle.data.yogas[0]?.name ?? '—')} (समाप्ती: ${formatLocalTime(activeBundle.data.yogas[0]?.endTime)})`} icon="meditation" />
                            <InfoRow largeTextMode={largeTextMode} label="करण" value={`${normalizeMarathi(activeBundle.data.karanas[0]?.name ?? '—')} (समाप्ती: ${formatLocalTime(activeBundle.data.karanas[0]?.endTime)})`} icon="leaf" />
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
                        <View style={styles.proseWrap}>
                            <Text style={styles.proseText}>
                                हिंदू पंचांगाच्या अनुसार {formatMarathiNumber(selectedDate.getDate())} {formatMarathiDate(selectedDate).split(' ')[1]} {formatMarathiNumber(selectedDate.getFullYear())} ला {normalizeMarathi(activeBundle.data.chandramasa.amantaName)} महिन्याच्या {activeBundle.data.tithis[0]?.paksha === 'शुक्ल' ? 'शुक्ल' : 'कृष्ण'} पक्षाची {normalizeMarathi(activeBundle.data.tithis[0]?.name ?? '')} तिथि आहे. ज्योतिषीय दृष्टीने {normalizeMarathi(activeBundle.data.tithis[0]?.name ?? '')} तिथि {activeBundle.data.tithis[0]?.endTime ? formatLocalTime(activeBundle.data.tithis[0]?.endTime) : '—'} पर्यंत राहील आणि त्या नंतर पुढील दिवशीची तिथि लागेल.
                            </Text>
                        </View>

                        <SectionCard title="नेहमी विचारले जाणारे प्रश्न" icon="help-circle-outline">
                            <Pressable style={styles.faqToggle} onPress={() => setFaqOpen((old) => !old)}>
                                <Text style={styles.faqToggleText}>{faqOpen ? 'प्रश्न लपवा' : 'प्रश्न पाहा'}</Text>
                                <MaterialCommunityIcons
                                    name={faqOpen ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color={colors.primary}
                                />
                            </Pressable>

                            {faqOpen && (
                                <>
                                    <Text style={styles.faqQ}>1. शुक्ल तिथी म्हणजे काय?</Text>
                                    <Text style={styles.faqA}>शुक्ल पक्षात येणारी तिथी शुक्ल तिथी म्हणून ओळखली जाते. शुक्ल पक्षात 15 तिथी असतात.</Text>

                                    <Text style={styles.faqQ}>2. तिथी किती आहेत?</Text>
                                    <Text style={styles.faqA}>ज्योतिषशास्त्रानुसार, एका महिन्यात दोन पक्षांसह एकूण 30 तिथी असतात म्हणजे, शुक्ल पक्ष (अमावस्यापासून सुरू होतो आणि पौर्णिमेला संपतो) आणि कृष्ण पक्ष (पौर्णिमेपासून सुरू होतो आणि अमावस्येला संपतो). प्रत्येक पक्षात 15 तिथी असतात.</Text>

                                    <Text style={styles.faqQ}>3. कोणती तिथी जन्मासाठी चांगली आहे?</Text>
                                    <Text style={styles.faqA}>ज्योतिषशास्त्राच्या क्षेत्रात, कोणती ही विशिष्ट तिथी जन्मासाठी चांगली नाही कारण प्रत्येक तिथीचे स्वतःचे महत्त्व आहे.</Text>

                                    <Text style={styles.faqQ}>4. आजची तिथी काय आहे?</Text>
                                    <Text style={styles.faqA}>हिंदू पंचांगानुसार, आज विक्रम संवत {formatMarathiNumber(activeBundle.data.samvat.vikramSamvat)} च्या {normalizeMarathi(activeBundle.data.chandramasa.amantaName)} महिन्याच्या {activeBundle.data.tithis[0]?.paksha === 'शुक्ल' ? 'शुक्ल' : 'कृष्ण'} पक्षाची {normalizeMarathi(activeBundle.data.tithis[0]?.name ?? '')} तिथी आहे.</Text>

                                    <Text style={styles.faqQ}>5. शुभ तिथी म्हणजे काय?</Text>
                                    <Text style={styles.faqA}>चांगली तिथी म्हणजे ज्यामध्ये योग आणि कर्म चांगले असतात. जर ते शुक्ल पक्षात आले तर ते अधिक शुभ मानले जाते.</Text>

                                    <Text style={styles.faqQ}>6. त्रयोदशी हा शुभ दिवस आहे का?</Text>
                                    <Text style={styles.faqA}>होय, हे शुभ आहे कारण ते भगवान शिवाला समर्पित आहे.</Text>

                                    <Text style={styles.faqQ}>7. नवीन प्रोजेक्ट सुरू करण्यासाठी नवमी हा चांगला दिवस आहे का?</Text>
                                    <Text style={styles.faqA}>कोणत्या ही नवीन प्रोजेक्टच्या प्रारंभासाठी हे शुभ मानले जाते परंतु, जेव्हा ते शुक्ल पक्षात येते तेव्हा त्याचे महत्त्व मोठे असते.</Text>

                                    <Text style={styles.faqQ}>8. अष्टमी चांगली की वाईट?</Text>
                                    <Text style={styles.faqA}>अष्टमी ही एक चांगली तिथी आहे आणि त्याबद्दलची सर्वात चांगली गोष्ट म्हणजे ती शुक्ल पक्षात असो किंवा कृष्ण पक्षात असो तिला तितकेच महत्त्व असते.</Text>

                                    <Text style={styles.faqQ}>9. हिंदू पंचांगानुसार आज कोणता दिवस आहे?</Text>
                                    <Text style={styles.faqA}>हिंदू पंचांगानुसार {normalizeMarathi(activeBundle.data.vara.name)} दिवस आहे.</Text>
                                </>
                            )}
                        </SectionCard>
                    </>
                )}

                <View style={styles.footerNote}>
                    <Text style={styles.footerNoteText}>ऑफलाइन वर्ष: {formatMarathiNumber(getOfflineYear())}</Text>
                </View>
            </ScrollView>

            <Modal visible={datePickerOpen} animationType="slide" onRequestClose={closeDatePicker} transparent>
                <View style={styles.datePickerBackdrop}>
                    <View style={styles.datePickerCard}>
                        <View style={styles.datePickerHeader}>
                            <Text style={styles.datePickerTitle}>दिवस निवडा</Text>
                            <Pressable onPress={closeDatePicker}>
                                <Text style={styles.datePickerClose}>बंद</Text>
                            </Pressable>
                        </View>
                        <ScrollView contentContainerStyle={styles.datePickerContent}>
                            <View style={styles.datePickerGrid}>
                                {['सोम', 'मंगळ', 'बुध', 'गुरु', 'शुक्र', 'शनि', 'रवि'].map((label) => (
                                    <Text key={label} style={styles.datePickerWeekday}>
                                        {label}
                                    </Text>
                                ))}
                                {datePickerWeeks.map((week, weekIndex) =>
                                    week.map((day, dayIndex) => (
                                        <Pressable
                                            key={`day-${weekIndex}-${dayIndex}`}
                                            style={[
                                                styles.datePickerDay,
                                                day === selectedDate.getDate() && styles.datePickerDaySelected
                                            ]}
                                            onPress={day ? () => selectDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day)) : undefined}
                                        >
                                            <Text
                                                style={[
                                                    styles.datePickerDayText,
                                                    day === selectedDate.getDate() && styles.datePickerDayTextSelected
                                                ]}
                                            >
                                                {day ? formatMarathiNumber(day) : ''}
                                            </Text>
                                        </Pressable>
                                    ))
                                )}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    proseWrap: {
        backgroundColor: colors.card,
        borderRadius: 18,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border
    },
    proseText: {
        color: colors.text,
        fontSize: 16,
        lineHeight: 24
    },
    faqQ: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: '700',
        marginTop: spacing.sm,
        marginBottom: 4
    },
    faqToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: '#FFF6EA'
    },
    faqToggleText: {
        color: colors.primary,
        fontWeight: '800'
    },
    faqA: {
        color: colors.text,
        fontSize: 15,
        lineHeight: 22,
        marginBottom: spacing.sm
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
    },
    datePickerBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        padding: spacing.md
    },
    datePickerCard: {
        backgroundColor: colors.card,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md
    },
    datePickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm
    },
    datePickerTitle: {
        color: colors.primary,
        fontSize: 18,
        fontWeight: '900'
    },
    datePickerClose: {
        color: colors.primary,
        fontWeight: '900',
        fontSize: 15
    },
    datePickerContent: {
        paddingVertical: spacing.sm
    },
    datePickerGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap'
    },
    datePickerWeekday: {
        width: '14.28%',
        textAlign: 'center',
        color: colors.muted,
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 8
    },
    datePickerDay: {
        width: '14.28%',
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
        borderRadius: 8
    },
    datePickerDaySelected: {
        backgroundColor: colors.primary
    },
    datePickerDayText: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '700'
    },
    datePickerDayTextSelected: {
        color: '#FFFFFF'
    }
});
