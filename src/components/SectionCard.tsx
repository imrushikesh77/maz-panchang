import { memo, PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../constants/theme';

type Props = PropsWithChildren<{
    title: string;
    icon?: string;
}>;

function SectionCardBase({ title, icon, children }: Props) {
    return (
        <View style={styles.card}>
            <View style={styles.titleRow}>
                {!!icon && <Text style={styles.icon}>{icon}</Text>}
                <Text style={styles.title}>{title}</Text>
            </View>
            {children}
        </View>
    );
}

export const SectionCard = memo(SectionCardBase);

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
        marginBottom: spacing.sm
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: spacing.sm,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E9DAC6'
    },
    icon: {
        fontSize: 17,
        color: colors.primary
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.primary,
        letterSpacing: 0.2
    }
});
