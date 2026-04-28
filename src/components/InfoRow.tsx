import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../constants/theme';

type Props = {
    label: string;
    value: string;
    largeTextMode?: boolean;
    icon?: string;
};

function InfoRowBase({ label, value, largeTextMode, icon }: Props) {
    return (
        <View style={styles.row}>
            <Text style={[styles.label, largeTextMode && styles.labelLarge]}>
                {!!icon && `${icon} `}
                {label}
            </Text>
            <Text style={[styles.value, largeTextMode && styles.valueLarge]}>{value}</Text>
        </View>
    );
}

export const InfoRow = memo(InfoRowBase);

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: spacing.md,
        marginBottom: spacing.sm,
        paddingBottom: spacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: '#F0E1CF'
    },
    label: {
        color: colors.muted,
        fontSize: 15,
        fontWeight: '700'
    },
    value: {
        color: colors.text,
        fontSize: 15,
        fontWeight: '800',
        flexShrink: 1,
        textAlign: 'right'
    },
    labelLarge: {
        fontSize: 17
    },
    valueLarge: {
        fontSize: 18
    }
});
