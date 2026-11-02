import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Switch,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobal } from '../../contexts/GlobalContext';
import { useSettings, useAppTheme, AppTheme } from '../../contexts/SettingsContext';
import {
  User, Palette, Play, Bell, ChevronRight, ArrowLeft,
  LogOut, RefreshCw, Check, Smartphone,
} from 'lucide-react-native';
import type { AccentColor, VideoQuality, AppLanguage, BackgroundColor } from '../../services/appSettings';
import { isLightBackground } from '../../services/appSettings';

// ─── Color palettes ──────────────────────────────────────────────────────────

const ACCENT_COLORS: { color: AccentColor; label: string }[] = [
  { color: '#e50914', label: 'Rojo' },
  { color: '#f97316', label: 'Naranja' },
  { color: '#3b82f6', label: 'Azul' },
  { color: '#10b981', label: 'Verde' },
  { color: '#8b5cf6', label: 'Morado' },
  { color: '#ec4899', label: 'Rosa' },
];

const DARK_BACKGROUNDS: { color: BackgroundColor; label: string }[] = [
  { color: '#0d0d0d', label: 'Carbón' },
  { color: '#000000', label: 'Negro' },
  { color: '#0f172a', label: 'Azul noche' },
  { color: '#111827', label: 'Gris oscuro' },
  { color: '#1a0a00', label: 'Marrón' },
  { color: '#0a0a1a', label: 'Índigo' },
];

const LIGHT_BACKGROUNDS: { color: BackgroundColor; label: string }[] = [
  { color: '#ffffff', label: 'Blanco' },
  { color: '#f3f4f6', label: 'Gris claro' },
  { color: '#fef9f0', label: 'Crema' },
  { color: '#e0f2fe', label: 'Azul claro' },
  { color: '#f0fdf4', label: 'Verde menta' },
  { color: '#fdf4ff', label: 'Lavanda' },
];

const VIDEO_QUALITIES: { value: VideoQuality; label: string; sub?: string }[] = [
  { value: 'auto',  label: 'Automática', sub: 'El reproductor elige la mejor opción disponible' },
  { value: '1080p', label: '1080p · Full HD' },
  { value: '720p',  label: '720p · HD' },
  { value: '480p',  label: '480p · SD' },
  { value: '360p',  label: '360p · Bajo consumo' },
];

const APP_LANGUAGES: { value: AppLanguage; label: string }[] = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
];

// ─── Modal shell ──────────────────────────────────────────────────────────────

function SettingModal({ visible, onClose, title, children }: {
  visible: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  const t = useAppTheme();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.modalRoot, { backgroundColor: t.bg }]} edges={['top']}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.modalBackBtn, {
              backgroundColor: t.isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.15)',
              borderColor: t.isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.35)',
            }]}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={t.text} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: t.text }]}>{title}</Text>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── CUENTA ──────────────────────────────────────────────────────────────────

function CuentaModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { user, logout } = useGlobal();
  const t = useAppTheme();

  const confirmLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => { onClose(); setTimeout(logout, 300); } },
    ]);
  };

  const expiryDate = user?.expiresAt
    ? new Date(user.expiresAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;
  const daysLeft = user?.daysRemaining;
  const createdDate = (user as any)?.createdAt
    ? new Date((user as any).createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  return (
    <SettingModal visible={visible} onClose={onClose} title="Cuenta">
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { borderColor: t.accent, backgroundColor: t.cardBg }]}>
          <Text style={[styles.avatarInitial, { color: t.accent }]}>
            {(user?.username || 'U')[0].toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.avatarName, { color: t.text }]}>{user?.username || '—'}</Text>
        <View style={[styles.planBadge, { backgroundColor: `${t.accent}22`, borderColor: `${t.accent}55` }]}>
          <Text style={[styles.planBadgeText, { color: t.accent }]}>
            {user?.role === 'admin' ? '★ Administrador' : '● Suscriptor'}
          </Text>
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: t.labelColor }]}>INFORMACIÓN DE CUENTA</Text>
      <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
        <InfoRow label="Usuario" value={user?.username || '—'} t={t} />
        <InfoRow label="Rol" value={user?.role === 'admin' ? 'Administrador' : 'Usuario'} t={t} />
        <InfoRow label="Estado" value={user?.isActive ? 'Activo ✓' : 'Inactivo'} valueColor={user?.isActive ? '#10b981' : '#e50914'} t={t} />
        {typeof user?.maxDevices === 'number' && (
          <InfoRow label="Dispositivos máx." value={String(user.maxDevices)} t={t} />
        )}
        {createdDate && <InfoRow label="Miembro desde" value={createdDate} t={t} />}
      </View>

      {(expiryDate || daysLeft != null) && (
        <>
          <Text style={[styles.sectionLabel, { color: t.labelColor }]}>SUSCRIPCIÓN</Text>
          <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
            {expiryDate && <InfoRow label="Vence el" value={expiryDate} t={t} />}
            {daysLeft != null && (
              <InfoRow label="Días restantes" value={daysLeft > 0 ? `${daysLeft} días` : 'Vencido'}
                valueColor={daysLeft < 7 ? '#f97316' : undefined} t={t} last />
            )}
          </View>
        </>
      )}

      <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8} onPress={confirmLogout}>
        <LogOut size={18} color="#e50914" />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </SettingModal>
  );
}

// ─── APARIENCIA ───────────────────────────────────────────────────────────────

function ColorSwatch({ color, label, selected, onPress, shape = 'circle', selectedBorderColor }: {
  color: string; label: string; selected: boolean; onPress: () => void;
  shape?: 'circle' | 'rounded'; selectedBorderColor?: string;
}) {
  const t = useAppTheme();
  const isLight = isLightBackground(color);
  const checkColor = isLight ? '#000' : '#fff';
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.swatchWrapper}>
      <View style={[
        shape === 'circle' ? styles.colorSwatch : styles.bgSwatch,
        { backgroundColor: color },
        selected && { borderWidth: 2.5, borderColor: selectedBorderColor || t.accent },
        !selected && shape === 'rounded' && { borderWidth: 1.5, borderColor: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)' },
      ]}>
        {selected && <Check size={16} color={checkColor} />}
      </View>
      <Text style={[styles.swatchLabel, { color: selected ? t.accent : t.textMuted }]} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );
}

function AparienciaModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { settings, updateSettings } = useSettings();
  const t = useAppTheme();

  return (
    <SettingModal visible={visible} onClose={onClose} title="Apariencia">
      {/* Color de acento */}
      <Text style={[styles.sectionLabel, { color: t.labelColor }]}>COLOR DE ACENTO</Text>
      <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
        <View style={styles.colorGrid}>
          {ACCENT_COLORS.map(({ color, label }) => (
            <ColorSwatch
              key={color} color={color} label={label}
              selected={settings.accentColor === color}
              onPress={() => updateSettings({ accentColor: color as AccentColor })}
              shape="circle"
            />
          ))}
        </View>
      </View>

      {/* Fondo — Oscuro */}
      <Text style={[styles.sectionLabel, { color: t.labelColor }]}>FONDO OSCURO</Text>
      <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
        <View style={styles.colorGrid}>
          {DARK_BACKGROUNDS.map(({ color, label }) => (
            <ColorSwatch
              key={color} color={color} label={label}
              selected={settings.backgroundColor === color}
              onPress={() => updateSettings({ backgroundColor: color as BackgroundColor })}
              shape="rounded"
            />
          ))}
        </View>
      </View>

      {/* Fondo — Claro */}
      <Text style={[styles.sectionLabel, { color: t.labelColor }]}>FONDO CLARO</Text>
      <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
        <View style={styles.colorGrid}>
          {LIGHT_BACKGROUNDS.map(({ color, label }) => (
            <ColorSwatch
              key={color} color={color} label={label}
              selected={settings.backgroundColor === color}
              onPress={() => updateSettings({ backgroundColor: color as BackgroundColor })}
              shape="rounded"
            />
          ))}
        </View>
        {isLightBackground(settings.backgroundColor) && (
          <View style={[styles.lightNote, { borderTopColor: t.divider }]}>
            <Text style={{ color: t.textSub, fontSize: 12, lineHeight: 17 }}>
              ⚠ Fondo claro activo. Algunas imágenes y secciones pueden verse mejor con fondo oscuro.
            </Text>
          </View>
        )}
      </View>

      {/* Idioma */}
      <Text style={[styles.sectionLabel, { color: t.labelColor }]}>IDIOMA DE LA INTERFAZ</Text>
      <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
        {APP_LANGUAGES.map(({ value, label }, i, arr) => (
          <TouchableOpacity
            key={value}
            style={[styles.optionRow, { borderBottomColor: t.divider }, i === arr.length - 1 && { borderBottomWidth: 0 }]}
            activeOpacity={0.7}
            onPress={() => updateSettings({ appLanguage: value })}
          >
            <Text style={[styles.optionText, { color: t.text }]}>{label}</Text>
            {settings.appLanguage === value && <View style={[styles.dot, { backgroundColor: t.accent }]} />}
          </TouchableOpacity>
        ))}
      </View>
    </SettingModal>
  );
}

// ─── REPRODUCCIÓN ─────────────────────────────────────────────────────────────

function ReproduccionModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { settings, updateSettings } = useSettings();
  const t = useAppTheme();

  return (
    <SettingModal visible={visible} onClose={onClose} title="Reproducción">
      <Text style={[styles.sectionLabel, { color: t.labelColor }]}>COMPORTAMIENTO</Text>
      <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
        <SwitchRow
          label="Reproducción automática" t={t}
          sub="Al terminar un episodio, continuar con el siguiente automáticamente"
          value={settings.autoplayNext}
          onToggle={(v) => updateSettings({ autoplayNext: v })}
        />
        <SwitchRow
          label="Ventana flotante de TV" t={t}
          sub="Al salir de la sección TV, el canal sigue en una ventana pequeña movible"
          value={settings.miniPlayerEnabled}
          onToggle={(v) => updateSettings({ miniPlayerEnabled: v })}
          last
        />
      </View>

      <Text style={[styles.sectionLabel, { color: t.labelColor }]}>SUBTÍTULOS</Text>
      <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
        <SwitchRow
          label="Activar subtítulos automáticamente" t={t}
          sub="Si el contenido los tiene disponibles, se activarán al reproducir"
          value={settings.subtitlesAuto}
          onToggle={(v) => updateSettings({ subtitlesAuto: v })}
          last
        />
      </View>
      <Text style={[styles.hint, { color: t.textMuted }]}>
        No todo el contenido incluye subtítulos. Depende de cada título.
      </Text>

      <Text style={[styles.sectionLabel, { color: t.labelColor }]}>CALIDAD PREFERIDA</Text>
      <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
        {VIDEO_QUALITIES.map(({ value, label, sub }, i, arr) => (
          <TouchableOpacity
            key={value}
            style={[styles.optionRow, { borderBottomColor: t.divider }, i === arr.length - 1 && { borderBottomWidth: 0 }]}
            activeOpacity={0.7}
            onPress={() => updateSettings({ videoQuality: value })}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionText, { color: t.text }]}>{label}</Text>
              {sub && <Text style={[styles.optionSub, { color: t.textMuted }]}>{sub}</Text>}
            </View>
            {settings.videoQuality === value && <View style={[styles.dot, { backgroundColor: t.accent }]} />}
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[styles.hint, { color: t.textMuted }]}>
        Si la calidad elegida no está en el contenido, el reproductor usará la mejor disponible.
      </Text>
    </SettingModal>
  );
}

// ─── NOTIFICACIONES ───────────────────────────────────────────────────────────

function NotificacionesModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { settings, updateSettings } = useSettings();
  const t = useAppTheme();

  return (
    <SettingModal visible={visible} onClose={onClose} title="Notificaciones">
     
      <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
        <SwitchRow label="Nuevo contenido" t={t}
          sub="Avisos cuando se añadan nuevos estrenos"
          value={settings.notifyNewContent}
          onToggle={(v) => updateSettings({ notifyNewContent: v })} />
        <SwitchRow label="Recomendaciones" t={t}
          sub="Sugerencias personalizadas según tu actividad"
          value={settings.notifyRecommendations}
          onToggle={(v) => updateSettings({ notifyRecommendations: v })} />
        <SwitchRow label="Actualizaciones de la app" t={t}
          sub="Aviso cuando haya una nueva versión disponible"
          value={settings.notifyAppUpdates}
          onToggle={(v) => updateSettings({ notifyAppUpdates: v })}
          last />
      </View>
    </SettingModal>
  );
}

// ─── ACTUALIZACIONES ─────────────────────────────────────────────────────────

function ActualizacionesModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useAppTheme();
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const handleCheck = async () => {
    setChecking(true);
    setResult(null);
    try {
      const res = await fetch('https://nubatv-api.unixxtech.online/api/version', {
        signal: AbortSignal.timeout(6000),
      });
      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch {}
      const latest = data?.version ?? data?.latestVersion ?? null;
      setLastChecked(new Date().toLocaleTimeString('es-ES'));
      setResult(latest ? `Nueva versión disponible: ${latest}` : 'Estás usando la última versión.');
    } catch {
      setLastChecked(new Date().toLocaleTimeString('es-ES'));
      setResult('No se pudo verificar. Revisa tu conexión.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <SettingModal visible={visible} onClose={onClose} title="Actualizaciones">
      <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
        <InfoRow label="Versión actual" value="1.0.0" t={t} />
        <InfoRow label="Plataforma" value={Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web'} t={t} />
        {lastChecked && <InfoRow label="Última verificación" value={lastChecked} t={t} />}
        {result
          ? <InfoRow label="Resultado" value={result} t={t} last valueColor={result.includes('Nueva') ? '#10b981' : undefined} />
          : <View style={[styles.optionRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.optionSub, { color: t.textMuted }]}>Toca el botón para buscar actualizaciones.</Text>
            </View>
        }
      </View>

      <TouchableOpacity
        style={[styles.actionBtn, { backgroundColor: t.accent }, checking && { opacity: 0.6 }]}
        activeOpacity={0.8} onPress={handleCheck} disabled={checking}
      >
        {checking ? <ActivityIndicator size="small" color="#fff" /> : <RefreshCw size={18} color="#fff" />}
        <Text style={styles.actionBtnText}>{checking ? 'Verificando...' : 'Buscar actualizaciones'}</Text>
      </TouchableOpacity>
    </SettingModal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { user } = useGlobal();
  const { settings } = useSettings();
  const t = useAppTheme();

  const [showCuenta, setShowCuenta] = useState(false);
  const [showApariencia, setShowApariencia] = useState(false);
  const [showReproduccion, setShowReproduccion] = useState(false);
  const [showNotificaciones, setShowNotificaciones] = useState(false);
  const [showActualizaciones, setShowActualizaciones] = useState(false);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.bg }]} edges={['top']}>
      <CuentaModal visible={showCuenta} onClose={() => setShowCuenta(false)} />
      <AparienciaModal visible={showApariencia} onClose={() => setShowApariencia(false)} />
      <ReproduccionModal visible={showReproduccion} onClose={() => setShowReproduccion(false)} />
      <NotificacionesModal visible={showNotificaciones} onClose={() => setShowNotificaciones(false)} />
      <ActualizacionesModal visible={showActualizaciones} onClose={() => setShowActualizaciones(false)} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.pageTitle, { color: t.text }]}>Configuración</Text>

        {/* CUENTA */}
        <Text style={[styles.sectionLabel, { color: t.labelColor }]}>CUENTA</Text>
        <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
          <SettingRow
            icon={User} label="Cuenta" accent={t.accent} t={t}
            sub={user ? `@${user.username} · ${user.role === 'admin' ? 'Administrador' : 'Suscriptor'}` : 'Información de cuenta y cerrar sesión.'}
            onPress={() => setShowCuenta(true)} last
          />
        </View>

        {/* GENERAL */}
        <Text style={[styles.sectionLabel, { color: t.labelColor }]}>GENERAL</Text>
        <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
          <SettingRow
            icon={Palette} label="Apariencia" accent={t.accent} t={t}
            sub="Color de acento, fondo e idioma de la interfaz."
            onPress={() => setShowApariencia(true)}
            previewColor={t.accent}
          />
          <SettingRow
            icon={Play} label="Reproducción" accent={t.accent} t={t}
            sub={`Calidad: ${settings.videoQuality === 'auto' ? 'Automática' : settings.videoQuality} · Subtítulos: ${settings.subtitlesAuto ? 'Auto' : 'Off'} · Autoplay: ${settings.autoplayNext ? 'Sí' : 'No'}`}
            onPress={() => setShowReproduccion(true)}
          />
          <SettingRow
            icon={Bell} label="Notificaciones" accent={t.accent} t={t}
            sub={`${[settings.notifyNewContent, settings.notifyRecommendations, settings.notifyAppUpdates].filter(Boolean).length} de 3 activadas`}
            onPress={() => setShowNotificaciones(true)} last
          />
        </View>

        {/* ACTUALIZACIONES */}
        <Text style={[styles.sectionLabel, { color: t.labelColor }]}>ACTUALIZACIONES</Text>
        <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.cardBorder }]}>
          <SettingRow
            icon={Smartphone} label="Buscar actualizaciones" accent={t.accent} t={t}
            sub="Verificar si hay una nueva versión de la app disponible."
            onPress={() => setShowActualizaciones(true)} last
          />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerApp, { color: t.accent }]}>NUBA TV</Text>
          <Text style={[styles.footerVer, { color: t.textMuted }]}>Versión 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

type Theme = AppTheme;

function SettingRow({ icon: Icon, label, sub, onPress, last = false, accent, t, badge, previewColor }: {
  icon: any; label: string; sub: string; onPress: () => void;
  last?: boolean; accent: string; t: Theme; badge?: string; previewColor?: string;
}) {
  return (
    <TouchableOpacity style={[styles.row, !last && { borderBottomWidth: 1, borderBottomColor: t.divider }]} activeOpacity={0.75} onPress={onPress}>
      <View style={[styles.iconBox, { backgroundColor: accent }]}>
        <Icon size={20} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: t.text }]}>{label}</Text>
        <Text style={[styles.rowSub, { color: t.textSub }]} numberOfLines={2}>{sub}</Text>
      </View>
      {previewColor
        ? <View style={[styles.colorDot, { backgroundColor: previewColor }]} />
        : badge
          ? <View style={[styles.badge, { backgroundColor: `${accent}22`, borderColor: `${accent}55` }]}>
              <Text style={[styles.badgeText, { color: accent }]}>{badge}</Text>
            </View>
          : <ChevronRight size={18} color={t.textMuted} />
      }
    </TouchableOpacity>
  );
}

function SwitchRow({ label, sub, value, onToggle, t, last = false }: {
  label: string; sub: string; value: boolean; onToggle: (v: boolean) => void; t: Theme; last?: boolean;
}) {
  return (
    <View style={[styles.switchRow, { borderBottomColor: t.divider }, last && { borderBottomWidth: 0 }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.switchLabel, { color: t.text }]}>{label}</Text>
        <Text style={[styles.switchSub, { color: t.textSub }]}>{sub}</Text>
      </View>
      <Switch
        value={value} onValueChange={onToggle}
        trackColor={{ false: 'rgba(128,128,128,0.3)', true: t.accent }}
        thumbColor="#fff"
        ios_backgroundColor="rgba(128,128,128,0.3)"
      />
    </View>
  );
}

function InfoRow({ label, value, last = false, valueColor, t }: {
  label: string; value: string; last?: boolean; valueColor?: string; t: Theme;
}) {
  return (
    <View style={[styles.infoRow, { borderBottomColor: t.divider }, last && { borderBottomWidth: 0 }]}>
      <Text style={[styles.infoLabel, { color: t.textSub }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: valueColor || t.text }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 120 },
  pageTitle: { fontSize: 32, fontWeight: '800', marginBottom: 20, letterSpacing: -0.5 },

  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8, marginTop: 4, marginLeft: 4 },
  hint: { fontSize: 12, lineHeight: 18, marginTop: -12, marginBottom: 16, marginHorizontal: 4 },

  card: { borderRadius: 16, marginBottom: 20, borderWidth: 1, overflow: 'hidden' },

  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, gap: 14 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  rowSub: { fontSize: 12, lineHeight: 17 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  colorDot: { width: 18, height: 18, borderRadius: 9 },

  infoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1,
  },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },

  switchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  switchLabel: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  switchSub: { fontSize: 12, lineHeight: 17 },

  optionRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  optionText: { fontSize: 15, fontWeight: '500', flex: 1 },
  optionSub: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  dot: { width: 10, height: 10, borderRadius: 5, marginLeft: 8 },

  // Color swatches
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 14, gap: 10, justifyContent: 'space-around' },
  swatchWrapper: { alignItems: 'center', width: 52 },
  colorSwatch: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  bgSwatch: { width: 46, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  swatchLabel: { fontSize: 10, textAlign: 'center', marginTop: 4, width: 52 },

  lightNote: { borderTopWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },

  avatarContainer: { alignItems: 'center', paddingVertical: 24 },
  avatar: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 2, marginBottom: 12 },
  avatarInitial: { fontSize: 36, fontWeight: '900' },
  avatarName: { fontSize: 20, fontWeight: '700' },
  planBadge: { marginTop: 10, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1 },
  planBadgeText: { fontWeight: '700', fontSize: 12 },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 20, paddingVertical: 16, borderRadius: 14, backgroundColor: 'rgba(229,9,20,0.12)', borderWidth: 1, borderColor: 'rgba(229,9,20,0.3)' },
  logoutText: { color: '#e50914', fontWeight: '700', fontSize: 15 },

  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 16, paddingVertical: 16, borderRadius: 14 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  footer: { alignItems: 'center', marginTop: 8, paddingBottom: 8 },
  footerApp: { fontSize: 18, fontWeight: '900', letterSpacing: 3 },
  footerVer: { fontSize: 12, marginTop: 4 },

  modalRoot: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 6, gap: 12,marginTop:16, },
  modalBackBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  modalTitle: { fontSize: 22, fontWeight: '800' },
});
