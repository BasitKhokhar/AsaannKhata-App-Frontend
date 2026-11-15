import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import { ExternalLink, Sparkles, X } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { WebView } from 'react-native-webview';
import { getHomePopup } from '../../services/engagementApi';
import { useT, useIsUrdu } from '../../store/languageStore';
import { useTheme } from '../../theme';
import { cooldownReady, normalizePopup, youtubeId } from '../../utils/engagement';

const LAST_SHOWN_KEY = 'home-popup-last-shown-v1';
let lastShownInSession = 0;
const escapeAttribute = (value) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const PopupVideo = memo(function PopupVideo({ url, colors }) {
  const [failed, setFailed] = useState(false);
  const id = youtubeId(url);
  const source = useMemo(() => ({
    baseUrl: 'https://asaandukaan.com/',
    html: `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="strict-origin-when-cross-origin"><style>html,body{margin:0;background:#000;width:100%;height:100%}iframe,video{width:100%;height:100%;border:0}</style></head><body>${id ? `<iframe src="https://www.youtube-nocookie.com/embed/${id}?playsinline=1&autoplay=1&mute=1" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe>` : `<video controls autoplay muted playsinline preload="auto" src="${escapeAttribute(url)}"></video>`}</body></html>`,
  }), [id, url]);
  if (failed) return <Text style={{ color: colors.ink.secondary }}>Video unavailable. Use the button below to open it.</Text>;
  return <View style={styles.video}><WebView
    source={source}
    originWhitelist={['https://*']}
    allowsInlineMediaPlayback
    allowsFullscreenVideo
    mediaPlaybackRequiresUserAction={false}
    javaScriptEnabled={Boolean(id)}
    setSupportMultipleWindows={false}
    onError={() => setFailed(true)}
    onHttpError={() => setFailed(true)}
    onShouldStartLoadWithRequest={(request) => request.url === 'about:blank' || request.isTopFrame === false || request.url === 'https://asaandukaan.com/'}
  /></View>;
});

export function HomeAnnouncement() {
  const focused = useIsFocused();
  const t = useT();
  const isUrdu = useIsUrdu();
  const { colors, radii, typography, spacing } = useTheme();
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const [campaign, setCampaign] = useState(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [closeDeadline, setCloseDeadline] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(5);
  const attempted = useRef(false);
  const shown = useRef(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setAppActive(state === 'active'));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!focused || !appActive) {
      attempted.current = false;
      setCampaign(null);
    }
  }, [focused, appActive]);

  useEffect(() => {
    if (!focused || !appActive || attempted.current) return undefined;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const stored = await SecureStore.getItemAsync(LAST_SHOWN_KEY);
        if (cancelled) return;
        if (!cooldownReady(Math.max(Number(stored) || 0, lastShownInSession))) {
          attempted.current = true;
          return;
        }
        const popup = normalizePopup(await getHomePopup());
        if (cancelled) return;
        attempted.current = true;
        if (!popup || !cooldownReady(lastShownInSession)) return;
        shown.current = false;
        setImageFailed(false);
        setCloseDeadline(null);
        setSecondsLeft(5);
        setCampaign(popup);
      } catch {
        attempted.current = true;
      }
    }, 1200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [focused, appActive]);

  useEffect(() => {
    if (!campaign || closeDeadline === null || !focused || !appActive) return undefined;
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((closeDeadline - Date.now()) / 1000)));
    const timer = setInterval(tick, 100);
    tick();
    return () => clearInterval(timer);
  }, [campaign, closeDeadline, focused, appActive]);

  const dismiss = useCallback(() => {
    if (closeDeadline !== null && Date.now() >= closeDeadline) setCampaign(null);
  }, [closeDeadline]);

  if (!campaign || !focused || !appActive) return null;
  const canClose = secondsLeft === 0;
  const actionUrl = campaign.type === 'video'
    ? campaign.actionUrl || campaign.videoUrl
    : campaign.type === 'image_link' ? campaign.actionUrl : null;
  const textAlign = isUrdu ? 'right' : 'left';

  return <Modal
    transparent
    visible
    animationType="fade"
    statusBarTranslucent
    onRequestClose={dismiss}
    onShow={() => {
      if (shown.current) return;
      shown.current = true;
      lastShownInSession = Date.now();
      setCloseDeadline(lastShownInSession + 5000);
      SecureStore.setItemAsync(LAST_SHOWN_KEY, String(lastShownInSession)).catch(() => {});
    }}
  >
    <View style={[styles.backdrop, { backgroundColor: colors.surface.overlay, padding: spacing.lg }]}> 
      <View accessibilityViewIsModal style={[styles.card, { backgroundColor: colors.surface.raised, borderColor: colors.surface.border, borderRadius: radii.xl }]}> 
        <LinearGradient colors={colors.gradient.primary} style={styles.accent} />
        <View style={[styles.header, { padding: spacing.lg }]}> 
          <View style={styles.heading}>
            <View style={styles.eyebrow}><Sparkles size={14} color={colors.brand.primary} /><Text style={[typography.caption, { color: colors.brand.primary, fontWeight: '700' }]}>{t('engagement.forYou')}</Text></View>
            <Text style={[typography.h2, { color: colors.ink.primary, textAlign }]}>{campaign.title || t('engagement.forYouTitle')}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={canClose ? t('engagement.close') : t('engagement.closeIn').replace('{seconds}', secondsLeft)}
            accessibilityState={{ disabled: !canClose }}
            disabled={!canClose}
            onPress={dismiss}
            style={[styles.close, { backgroundColor: colors.surface.card, borderColor: colors.surface.border }]}
          >
            {canClose ? <X size={20} color={colors.ink.secondary} /> : <>
              <Svg width={34} height={34} viewBox="0 0 34 34" style={StyleSheet.absoluteFill}>
                <Circle cx={17} cy={17} r={14} fill="none" stroke={colors.surface.border} strokeWidth={2} />
                <Circle cx={17} cy={17} r={14} fill="none" stroke={colors.brand.primary} strokeWidth={2} strokeLinecap="round" strokeDasharray={2 * Math.PI * 14} strokeDashoffset={2 * Math.PI * 14 * (1 - secondsLeft / 5)} rotation={-90} origin="17, 17" />
              </Svg>
              <Text style={[typography.caption, { color: colors.brand.primary, fontWeight: '700' }]}>{secondsLeft}</Text>
            </>}
          </Pressable>
        </View>
        <ScrollView bounces={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}>
          {campaign.type === 'video'
            ? <PopupVideo url={campaign.videoUrl} colors={colors} />
            : !imageFailed && <Image source={{ uri: campaign.imageUrl }} resizeMode="contain" accessibilityLabel={campaign.title || t('engagement.announcement')} style={[styles.image, { backgroundColor: colors.surface.card }]} onError={() => setImageFailed(true)} />}
          {imageFailed ? <Text style={[typography.body, { color: colors.ink.secondary, marginTop: spacing.md }]}>{t('engagement.imageUnavailable')}</Text> : null}
          {campaign.message ? <Text style={[typography.body, { color: colors.ink.secondary, marginTop: spacing.md, textAlign }]}>{campaign.message}</Text> : null}
        </ScrollView>
        <View style={[styles.footer, { borderTopColor: colors.surface.border, padding: spacing.lg }]}> 
          {actionUrl ? <Pressable
            accessibilityRole="link"
            onPress={async () => {
              try { await Linking.openURL(actionUrl); setCampaign(null); } catch { /* Keep the popup open when the OS cannot open the URL. */ }
            }}
            style={({ pressed }) => [styles.action, { backgroundColor: colors.brand.primary, borderRadius: radii.md, opacity: pressed ? 0.75 : 1 }]}
          ><ExternalLink size={18} color={colors.ink.onBrand} /><Text style={[typography.label, { color: colors.ink.onBrand, flexShrink: 1 }]}>{campaign.buttonLabel || (campaign.type === 'video' ? t('engagement.openVideo') : t('engagement.openLink'))}</Text></Pressable> : null}
          <Pressable disabled={!canClose} onPress={dismiss} style={[styles.dismiss, { borderColor: colors.surface.border, borderRadius: radii.md, opacity: canClose ? 1 : 0.55 }]}>
            <Text style={[typography.label, { color: colors.ink.secondary }]}>{canClose ? t('engagement.close') : t('engagement.closeIn').replace('{seconds}', secondsLeft)}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { width: '100%', maxWidth: 500, maxHeight: '88%', overflow: 'hidden', borderWidth: 1, elevation: 18 },
  accent: { height: 4, width: '100%' },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  heading: { flex: 1, gap: 8 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  close: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, borderWidth: 1 },
  image: { width: '100%', aspectRatio: 1.25, borderRadius: 16 },
  video: { width: '100%', aspectRatio: 16 / 9, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000' },
  footer: { borderTopWidth: 1, gap: 10 },
  action: { minHeight: 50, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  dismiss: { minHeight: 44, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
