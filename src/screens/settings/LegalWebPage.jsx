import React, { useState } from 'react';
import { ActivityIndicator, Linking, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { ExternalLink, FileWarning } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Button } from '../../components/ui/Button';
import { Header } from '../../components/ui/Header';
import { IconButton } from '../../components/ui/IconButton';
import { useTheme } from '../../theme';
import { useT } from '../../store/languageStore';
import { LEGAL_PAGE_URLS, LEGAL_SITE_ORIGIN } from '../../constants/legalPages';

const PAGE_TITLE_KEYS = {
  home: 'settings.about.legalCenter',
  privacy: 'auth.register3.privacyPolicy',
  terms: 'auth.register3.termsOfService',
  deleteAccount: 'settings.about.deleteAccount',
};

export default function LegalWebPage() {
  const route = useRoute();
  const t = useT();
  const { colors, typography, spacing } = useTheme();
  const page = Object.prototype.hasOwnProperty.call(LEGAL_PAGE_URLS, route.params?.page) ? route.params.page : 'home';
  const url = LEGAL_PAGE_URLS[page];
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  function handleNavigation(request) {
    const requestedUrl = request.url;
    if (requestedUrl === 'about:blank' || requestedUrl === LEGAL_SITE_ORIGIN || requestedUrl.startsWith(`${LEGAL_SITE_ORIGIN}/`)) return true;
    if (/^(https:|mailto:|tel:)/i.test(requestedUrl)) Linking.openURL(requestedUrl).catch(() => {});
    return false;
  }

  return (
    <AnimatedScreen>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
        <Header
          title={t(PAGE_TITLE_KEYS[page])}
          right={<IconButton icon={ExternalLink} onPress={() => Linking.openURL(url).catch(() => {})} accessibilityLabel={t('settings.legal.openBrowser')} />}
        />
        <View style={{ flex: 1, backgroundColor: colors.surface.card }}>
          {failed ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
              <FileWarning size={44} color={colors.semantic.warning} strokeWidth={1.6} />
              <Text style={[typography.h3, { color: colors.ink.primary, textAlign: 'center' }]}>{t('settings.legal.loadFailed')}</Text>
              <Text style={[typography.body, { color: colors.ink.secondary, textAlign: 'center' }]}>{t('settings.legal.loadFailedDescription')}</Text>
              <Button title={t('common.retry')} onPress={() => { setFailed(false); setLoading(true); setReloadKey((key) => key + 1); }} />
              <Button title={t('settings.legal.openBrowser')} variant="outline" onPress={() => Linking.openURL(url).catch(() => {})} />
            </View>
          ) : (
            <>
              <WebView
                key={reloadKey}
                source={{ uri: url }}
                originWhitelist={[LEGAL_SITE_ORIGIN]}
                onShouldStartLoadWithRequest={handleNavigation}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                onError={() => { setLoading(false); setFailed(true); }}
                onHttpError={() => { setLoading(false); setFailed(true); }}
                javaScriptEnabled
                domStorageEnabled
                setSupportMultipleWindows={false}
                javaScriptCanOpenWindowsAutomatically={false}
                allowsBackForwardNavigationGestures
                style={{ flex: 1, backgroundColor: colors.surface.card }}
              />
              {loading ? (
                <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface.card }}>
                  <ActivityIndicator color={colors.brand.primary} />
                  <Text style={[typography.caption, { color: colors.ink.secondary, marginTop: spacing.sm }]}>{t('common.loading')}</Text>
                </View>
              ) : null}
            </>
          )}
        </View>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
