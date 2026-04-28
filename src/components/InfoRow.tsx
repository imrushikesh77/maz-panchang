import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../constants/theme';

type Props = {
    label: string;
    value: string;
    largeTextMode?: boolean;
    icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
};

function InfoRowBase({ label, value, largeTextMode, icon }: Props) {
    return (
        <View style={styles.row}>
            <View style={styles.labelContainer}>
                {!!icon && <MaterialCommunityIcons name={icon} size={largeTextMode ? 20 : 18} color={colors.primary} style={styles.iconStyle} />}
                <Text style={[styles.label, largeTextMode && styles.labelLarge]}>
                    {label}
                </Text>
            </View>
            <Text style={[styles.value, largeTextMode && styles.valueLarge]}>{value}</Text>
        </View>
    );
}

export const InfoRow = memo(InfoRowBase);

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: spacing.md,
        marginBottom: spacing.sm,
        paddingBottom: spacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: '#F0E1CF'
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        flexShrink: 1,
        gap: 6
    },
    iconStyle: {
        marginRight: 2
    },
    label: {
        color: colors.muted,
        fontSize: 15,
        fontWeight: '700',
        flexShrink: 1
    },
    value: {
        color: colors.text,
        fontSize: 15,
        fontWeight: '800',
        flexShrink: 1,
        flex: 1,
        textAlign: 'right'
    },
    labelLarge: {
        fontSize: 17
    },
    valueLarge: {
        fontSize: 18
    }
});
