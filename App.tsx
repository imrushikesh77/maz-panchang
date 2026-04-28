import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MAHARASHTRA_DISTRICTS } from './src/constants/locations';
import { colors } from './src/constants/theme';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { FestivalScreen } from './src/screens/FestivalScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { refreshScheduledNotifications } from './src/services/notificationService';
import { defaultSettings, loadSettings, saveSettings } from './src/storage/settingsStorage';
import type { AppSettings } from './src/types';

type TabKey = 'home' | 'calendar' | 'festivals' | 'settings';

const tabLabels: Record<TabKey, string> = {
  home: 'आज',
  calendar: 'महिना',
  festivals: 'सण',
  settings: 'सेटिंग्स'
};

const tabIcons: Record<TabKey, string> = {
  home: '☀',
  calendar: '▦',
  festivals: '✿',
  settings: '⚙'
};

export default function App() {
  const [tab, setTab] = useState<TabKey>('home');
  const [visitedTabs, setVisitedTabs] = useState<Record<TabKey, boolean>>({
    home: true,
    calendar: false,
    festivals: false,
    settings: false
  });
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const run = async () => {
      const loaded = await loadSettings();
      setSettings(loaded);
      setReady(true);
    };

    run();
  }, []);

  const district = useMemo(
    () => MAHARASHTRA_DISTRICTS.find((item) => item.id === settings.districtId) ?? MAHARASHTRA_DISTRICTS[0],
    [settings.districtId]
  );

  useEffect(() => {
    if (!ready) {
      return;
    }

    saveSettings(settings);
  }, [ready, settings]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    const timer = setTimeout(() => {
      refreshScheduledNotifications(district, settings).catch(() => {
        // Intentionally ignored. App continues without scheduled notifications.
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, [district, ready, settings]);

  if (!ready) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.loadingWrap}>
          <Text style={styles.loadingText}>अॅप सुरू होत आहे...</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        <View style={styles.body}>
          {visitedTabs.home && (
            <View
              style={[styles.screenLayer, tab !== 'home' && styles.hiddenLayer]}
              pointerEvents={tab === 'home' ? 'auto' : 'none'}
            >
              <HomeScreen district={district} largeTextMode={settings.largeTextMode} />
            </View>
          )}

          {visitedTabs.calendar && (
            <View
              style={[styles.screenLayer, tab !== 'calendar' && styles.hiddenLayer]}
              pointerEvents={tab === 'calendar' ? 'auto' : 'none'}
            >
              <CalendarScreen district={district} largeTextMode={settings.largeTextMode} />
            </View>
          )}

          {visitedTabs.festivals && (
            <View
              style={[styles.screenLayer, tab !== 'festivals' && styles.hiddenLayer]}
              pointerEvents={tab === 'festivals' ? 'auto' : 'none'}
            >
              <FestivalScreen district={district} largeTextMode={settings.largeTextMode} />
            </View>
          )}

          {visitedTabs.settings && (
            <View
              style={[styles.screenLayer, tab !== 'settings' && styles.hiddenLayer]}
              pointerEvents={tab === 'settings' ? 'auto' : 'none'}
            >
              <SettingsScreen
                settings={settings}
                onChange={(next) => {
                  setSettings(next);
                }}
              />
            </View>
          )}
        </View>

        <View style={styles.tabBar}>
          {(Object.keys(tabLabels) as TabKey[]).map((item) => (
            <Pressable
              key={item}
              style={[styles.tabBtn, tab === item && styles.tabBtnActive]}
              onPress={() => {
                setTab(item);
                setVisitedTabs((old) => (old[item] ? old : { ...old, [item]: true }));
              }}
            >
              <Text style={[styles.tabIcon, tab === item && styles.tabIconActive]}>{tabIcons[item]}</Text>
              <Text style={[styles.tabTxt, tab === item && styles.tabTxtActive]}>{tabLabels[item]}</Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg
  },
  loadingText: {
    color: colors.muted
  },
  body: {
    flex: 1,
    position: 'relative'
  },
  screenLayer: {
    ...StyleSheet.absoluteFillObject
  },
  hiddenLayer: {
    display: 'none'
  },
  tabBar: {
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFF6EA',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 6,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 }
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    minWidth: 72,
    alignItems: 'center',
    gap: 2
  },
  tabBtnActive: {
    backgroundColor: '#F7D7B8'
  },
  tabIcon: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '900'
  },
  tabIconActive: {
    color: colors.primary
  },
  tabTxt: {
    color: colors.muted,
    fontWeight: '700',
    fontSize: 12
  },
  tabTxtActive: {
    color: colors.primary
  }
});
