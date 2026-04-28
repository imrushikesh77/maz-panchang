import { memo, PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../constants/theme';

type Props = PropsWithChildren<{
    title: string;
    icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}>;

function SectionCardBase({ title, icon, children }: Props) {
    return (
        <View style={styles.card}>
            <View style={styles.titleRow}>
                {!!icon && <MaterialCommunityIcons name={icon} size={22} color={colors.primary} style={styles.icon} />}
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
        borderBottomColor: '#F0E1CF' // matching the InfoRow border color slightly
    },
    icon: {
        opacity: 0.9
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.primary,
        letterSpacing: 0.2
    }
});
