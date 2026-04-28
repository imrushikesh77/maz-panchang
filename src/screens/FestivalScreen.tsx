import { memo, useEffect, useState } from 'react';
import { FlatList, InteractionManager, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { MarathiDistrict } from '../types';
import { getOfflineYear, getPanchangForDate } from '../services/panchangService';
import { toMarathiDigits, formatMarathiNumber } from '../utils/date';
import { colors, spacing } from '../constants/theme';
import { ShimmerBlock } from '../components/ShimmerBlock';

type Props = {
    district: MarathiDistrict;
    largeTextMode: boolean;
};

type Row = {
    id: string;
    dateLabel: string;
    eventName: string;
    isUpwas: boolean;
    type: 'festival' | 'upwas';
};

type FilterKey = 'all' | 'festival' | 'upwas';

const filterLabel: Record<FilterKey, string> = {
    all: 'सर्व',
    festival: 'सण',
    upwas: 'उपवास'
};

function FestivalScreenBase({ district, largeTextMode }: Props) {
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterKey>('all');
    const [query, setQuery] = useState('');
    const [rangeDays, setRangeDays] = useState(30);

    const MAX_RANGE_DAYS = 90;

    useEffect(() => {
        let cancelled = false;
        const yieldToUI = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

        const run = async () => {
            setLoading(true);
            setRows([]);

            const start = new Date();
            start.setFullYear(getOfflineYear());
            const nextRows: Row[] = [];

            for (let i = 0; i < rangeDays; i += 1) {
                const date = new Date(start);
                date.setDate(start.getDate() + i);

                const bundle = await getPanchangForDate(date, district, 'lite');
                bundle.marathiFestivals.forEach((name) => {
                    const isUpwas = bundle.upwasItems.includes(name);
                    nextRows.push({
                        id: `${bundle.dateKey}-${name}`,
                        dateLabel: toMarathiDigits(date.toLocaleDateString('mr-IN', { day: 'numeric', month: 'short', weekday: 'short' })),
                        eventName: name,
                        isUpwas,
                        type: isUpwas ? 'upwas' : 'festival'
                    });
                });

                if ((i + 1) % 12 === 0 && !cancelled) {
                    setRows([...nextRows]);
                    await yieldToUI();
                }
            }

            if (!cancelled) {
                setRows(nextRows);
                setLoading(false);
            }
        };

        const task = InteractionManager.runAfterInteractions(() => {
            run();
        });

        return () => {
            cancelled = true;
            task.cancel();
        };
    }, [district, rangeDays]);

    const filteredRows = rows.filter((item) => {
        if (query.trim().length > 0 && !item.eventName.includes(query.trim())) {
            return false;
        }

        if (filter === 'all') {
            return true;
        }

        return item.type === filter;
    });

    const festivalCount = rows.filter((item) => item.type === 'festival').length;
    const upwasCount = rows.filter((item) => item.type === 'upwas').length;

    if (loading) {
        return (
            <View style={styles.wrap}>
                {Array.from({ length: 5 }).map((_, i) => (
                    <View key={`festival-skeleton-${i}`} style={styles.item}>
                        <ShimmerBlock height={14} width="36%" />
                        <ShimmerBlock height={20} width="82%" style={styles.shimmerGap} />
                        <ShimmerBlock height={16} width="45%" />
                    </View>
                ))}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>सण</Text>
                    <Text style={styles.summaryValue}>{formatMarathiNumber(festivalCount)}</Text>
                </View>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>उपवास</Text>
                    <Text style={styles.summaryValue}>{formatMarathiNumber(upwasCount)}</Text>
                </View>
            </View>

            <View style={styles.searchWrap}>
                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="सण शोधा (उदा. एकादशी, गणेश)"
                    placeholderTextColor={colors.muted}
                    style={styles.searchInput}
                />
            </View>

            <View style={styles.filterRow}>
                {(Object.keys(filterLabel) as FilterKey[]).map((key) => (
                    <Pressable
                        key={key}
                        onPress={() => setFilter(key)}
                        style={[styles.filterChip, filter === key && styles.filterChipActive]}
                    >
                        <Text style={[styles.filterChipText, filter === key && styles.filterChipTextActive]}>{filterLabel[key]}</Text>
                    </Pressable>
                ))}
            </View>

            <FlatList
                data={filteredRows}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.wrap}
                initialNumToRender={18}
                maxToRenderPerBatch={16}
                ListEmptyComponent={<Text style={styles.loading}>या कालावधीत काही सापडले नाही.</Text>}
                renderItem={({ item }) => (
                    <View style={styles.item}>
                        <Text style={styles.date}>{item.dateLabel}</Text>
                        <Text style={[styles.event, largeTextMode && styles.eventLarge]}>{item.eventName}</Text>
                        {item.isUpwas && <Text style={styles.upwas}>उपवास</Text>}
                    </View>
                )}
                ListFooterComponent={
                    rangeDays < MAX_RANGE_DAYS ? (
                        <Pressable style={styles.loadMoreBtn} onPress={() => setRangeDays((old) => Math.min(old + 30, MAX_RANGE_DAYS))}>
                            <Text style={styles.loadMoreText}>आणखी पाहा</Text>
                        </Pressable>
                    ) : null
                }
            />
        </View>
    );
}

export const FestivalScreen = memo(FestivalScreenBase);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg
    },
    summaryRow: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md
    },
    summaryCard: {
        flex: 1,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        padding: 12
    },
    summaryLabel: {
        color: colors.muted,
        fontSize: 12,
        fontWeight: '600'
    },
    summaryValue: {
        color: colors.primary,
        fontWeight: '800',
        fontSize: 19,
        marginTop: 2
    },
    searchWrap: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm
    },
    searchInput: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: colors.text,
        fontWeight: '600'
    },
    filterRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md
    },
    filterChip: {
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 14
    },
    filterChipActive: {
        borderColor: colors.primary,
        backgroundColor: '#FFE0B2'
    },
    filterChipText: {
        color: colors.muted,
        fontWeight: '700'
    },
    filterChipTextActive: {
        color: colors.primary
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.bg
    },
    loading: {
        color: colors.muted
    },
    shimmerGap: {
        marginTop: 8,
        marginBottom: 8
    },
    wrap: {
        padding: spacing.md,
        paddingBottom: 70
    },
    item: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        padding: spacing.md,
        marginBottom: spacing.sm
    },
    date: {
        color: colors.muted,
        fontSize: 13
    },
    event: {
        color: colors.festival,
        marginTop: 4,
        fontSize: 17,
        fontWeight: '700'
    },
    eventLarge: {
        fontSize: 19
    },
    upwas: {
        marginTop: 6,
        color: colors.upwas,
        fontWeight: '700'
    },
    loadMoreBtn: {
        marginTop: spacing.sm,
        alignSelf: 'center',
        backgroundColor: '#FFE0B2',
        borderColor: colors.primary,
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 8
    },
    loadMoreText: {
        color: colors.primary,
        fontWeight: '800'
    }
});
