import { memo, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { MAHARASHTRA_DISTRICTS } from '../constants/locations';
import { colors, spacing } from '../constants/theme';
import { detectNearestDistrict } from '../services/locationService';
import { notificationsSupportedInCurrentBuild } from '../services/notificationService';
import type { AppSettings } from '../types';

type Props = {
    settings: AppSettings;
    onChange: (next: AppSettings) => void;
};

function SettingsScreenBase({ settings, onChange }: Props) {
    const [locating, setLocating] = useState(false);
    const [locationMessage, setLocationMessage] = useState('');
    const notificationSupported = notificationsSupportedInCurrentBuild();

    const set = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
        onChange({ ...settings, [key]: value });
    };

    const autoDetectDistrict = async () => {
        try {
            setLocating(true);
            setLocationMessage('ठिकाण शोधत आहे...');
            const nearest = await detectNearestDistrict();
            set('districtId', nearest.id);
            setLocationMessage(`आपला जिल्हा: ${nearest.name}`);
        } catch (error) {
            setLocationMessage(error instanceof Error ? error.message : 'ठिकाण शोधता आले नाही.');
        } finally {
            setLocating(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.wrap}>
            <Text style={styles.title}>सेटिंग्स</Text>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>जिल्हा निवडा</Text>
                <TouchableOpacity
                    style={[styles.autoBtn, locating && styles.autoBtnDisabled]}
                    disabled={locating}
                    onPress={autoDetectDistrict}
                >
                    <Text style={styles.autoBtnText}>{locating ? 'शोध सुरू आहे...' : 'माझे ठिकाण आपोआप निवडा'}</Text>
                </TouchableOpacity>
                {!!locationMessage && <Text style={styles.locationMessage}>{locationMessage}</Text>}
                <View style={styles.chipsWrap}>
                    {MAHARASHTRA_DISTRICTS.map((district) => {
                        const active = settings.districtId === district.id;
                        return (
                            <TouchableOpacity
                                key={district.id}
                                style={[styles.chip, active && styles.chipActive]}
                                onPress={() => set('districtId', district.id)}
                            >
                                <Text style={[styles.chipText, active && styles.chipTextActive]}>{district.name}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>वाचनीयता</Text>
                <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>मोठा फॉन्ट मोड</Text>
                    <Switch value={settings.largeTextMode} onValueChange={(v) => set('largeTextMode', v)} />
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>सूचना</Text>
                {!notificationSupported && (
                    <Text style={styles.warning}>Expo Go मध्ये सूचना मर्यादित आहेत. पूर्ण चाचणीसाठी development build वापरा.</Text>
                )}
                <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>सकाळी ७:०० - आजचा पंचांग</Text>
                    <Switch value={settings.enableDailySummary} onValueChange={(v) => set('enableDailySummary', v)} />
                </View>

                <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>संध्याकाळी ७:०० - उद्याचा सण</Text>
                    <Switch
                        value={settings.enableFestivalReminder}
                        onValueChange={(v) => set('enableFestivalReminder', v)}
                    />
                </View>

                <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>उपवास/व्रत सूचना</Text>
                    <Switch value={settings.enableUpwasReminder} onValueChange={(v) => set('enableUpwasReminder', v)} />
                </View>
            </View>

            <Text style={styles.note}>
                सूचना नक्की येण्यासाठी एकदा ॲप उघडणे आवश्यक आहे.
            </Text>
        </ScrollView>
    );
}

export const SettingsScreen = memo(SettingsScreenBase);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg
    },
    wrap: {
        padding: spacing.md,
        paddingBottom: 80
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.text,
        marginBottom: spacing.sm
    },
    card: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        padding: spacing.md,
        marginBottom: spacing.sm
    },
    cardTitle: {
        color: colors.primary,
        fontSize: 18,
        fontWeight: '800',
        marginBottom: spacing.sm,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E9DAC6'
    },
    autoBtn: {
        alignSelf: 'flex-start',
        backgroundColor: '#FFE0B2',
        borderColor: colors.primary,
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginBottom: spacing.sm
    },
    autoBtnDisabled: {
        opacity: 0.6
    },
    autoBtnText: {
        color: colors.primary,
        fontWeight: '700'
    },
    locationMessage: {
        color: colors.muted,
        marginBottom: spacing.sm,
        fontSize: 13
    },
    chipsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    chip: {
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingHorizontal: 10,
        paddingVertical: 6
    },
    chipActive: {
        backgroundColor: '#FFE0B2',
        borderColor: colors.primary
    },
    chipText: {
        color: colors.text,
        fontSize: 13
    },
    chipTextActive: {
        color: colors.primary,
        fontWeight: '700'
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
        gap: spacing.sm
    },
    switchLabel: {
        flex: 1,
        color: colors.text,
        fontWeight: '600'
    },
    warning: {
        color: '#A40000',
        fontWeight: '600',
        marginBottom: spacing.sm
    },
    note: {
        color: colors.muted,
        fontSize: 13
    }
});
