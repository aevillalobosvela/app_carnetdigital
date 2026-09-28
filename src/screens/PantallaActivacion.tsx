import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as SecureStore from 'expo-secure-store';
import { colores, tipografia, espaciado, bordes, sombras } from '../theme';
import { NavegacionActivacion } from '../navigation/types';
import { useAuth } from '../context/AuthContext';

// ─── Assets ───────────────────────────────────────────────────────────────────
const logoUto = require('../assets/logo/logo_uto.png');

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Props {
  navigation: NavegacionActivacion;
}

// ─── Componente ───────────────────────────────────────────────────────────────
export function PantallaActivacion({ navigation }: Props): React.JSX.Element {
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const hasScannedRef = useRef(false);

  const { activarSession } = useAuth();
  const tapCountRef = useRef(0);
  const lastTapRef = useRef(0);

  const handleLogoPress = async () => {
    const now = Date.now();
    if (now - lastTapRef.current > 1500) {
      tapCountRef.current = 1;
    } else {
      tapCountRef.current += 1;
    }
    lastTapRef.current = now;

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      try {
        const mockSession = {
          token: 'demo_token_123',
          carnetId: 999999,
          carrera: 'Ingeniería de Sistemas',
          facultad: 'Facultad Nacional de Ingeniería',
          periodoAcademico: '2/2026',
        };
        await SecureStore.setItemAsync('is_demo_mode', 'true');
        await SecureStore.setItemAsync('student_token', 'demo_token_123');
        await SecureStore.setItemAsync('carnet_id', '999999');
        await SecureStore.setItemAsync('active_credentials', JSON.stringify([mockSession]));

        Alert.alert(
          'Modo Demo Activado',
          'Ingresando a la aplicación en modo de revisión de Google Play sin restricciones.',
          [
            {
              text: 'Aceptar',
              onPress: async () => {
                await activarSession();
              },
            },
          ]
        );
      } catch (error) {
        console.error('Error al activar modo demo:', error);
      }
    }
  };

  const handleEscanearQR = async () => {
    hasScannedRef.current = false;
    // 1. Verificar y solicitar permisos de cámara
    if (!permission) {
      // Estado de carga inicial de permisos
      return;
    }

    if (!permission.granted) {
      const response = await requestPermission();
      if (!response.granted) {
        Alert.alert(
          'Permiso de Cámara Requerido',
          'Es necesario acceder a la cámara para poder escanear el código QR de activación emitido por la DTIC.',
          [{ text: 'Entendido' }]
        );
        return;
      }
    }

    // 2. Activar la cámara en pantalla completa
    setScanning(true);
  };

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={estilos.safeArea} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={colores.grisClaro} />

        {/* ── Encabezado institucional ── */}
        <View style={estilos.encabezado}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={handleLogoPress}
            style={estilos.logoContenedor}
          >
            <Image
              source={logoUto}
              style={estilos.logoImagen}
              resizeMode="contain"
              accessibilityLabel="Logo Universidad Técnica de Oruro"
            />
          </TouchableOpacity>
          <Text style={estilos.nombreInstitucion}>
            Universidad Técnica de Oruro
          </Text>
          <Text style={estilos.subtitulo}>Carnet Digital Universitario</Text>
        </View>

        {/* ── Separador ── */}
        <View style={estilos.separadorContenedor}>
          <View style={estilos.separadorLinea} />
        </View>

        {/* ── Instrucciones de activación ── */}
        <View style={estilos.seccionInstrucciones}>
          {/* Ícono de activación */}
          <View style={estilos.iconoActivacionContenedor}>
            <Ionicons name="qr-code-outline" size={36} color={colores.blanco} />
          </View>

          <Text style={estilos.instruccionesTitulo}>
            Activa tu carnet digital
          </Text>

          {/* Pasos numerados */}
          <View style={estilos.pasos}>
            <PasoActivacion numero="1" texto="Acude a las oficinas de la DTIC con tu carnet de identidad." />
            <PasoActivacion numero="2" texto="El personal de la DTIC generará un código QR vinculado a tu carnet." />
            <PasoActivacion numero="3" texto="Escanea el QR con el botón de abajo para activar la app en este dispositivo." />
          </View>

          <View style={estilos.notaGratuidadContenedor}>
            <Ionicons name="sparkles" size={15} color={colores.primario} style={{ marginRight: 6 }} />
            <Text style={estilos.notaGratuidadTexto}>
              La primera emisión de tu carnet digital es <Text style={{ fontWeight: '700' }}>gratuita y única por estudiante</Text>. Las reactivaciones o carreras paralelas requieren el pago de reposición de carnet universitario.
            </Text>
          </View>
        </View>

        {/* ── Botón escanear QR ── */}
        <View style={estilos.seccionBoton}>
          <TouchableOpacity
            style={estilos.botonEscanear}
            onPress={handleEscanearQR}
            activeOpacity={0.82}
            accessibilityLabel="Escanear código QR de activación"
            accessibilityRole="button"
          >
            <Ionicons name="camera-outline" size={22} color={colores.blanco} />
            <Text style={estilos.botonTexto}>Escanear QR de activación</Text>
          </TouchableOpacity>

          <Text style={estilos.notaActivacion}>
            El QR es de un solo uso y es generado exclusivamente por la DTIC
          </Text>
        </View>

        {/* ── Footer ── */}
        <View style={estilos.footer}>
          <Text style={estilos.footerTexto}>
            © 2026 DTIC - Universidad Técnica de Oruro
          </Text>
        </View>
      </SafeAreaView>

      {/* ── Lector de Cámara overlay ── */}
      {scanning && permission?.granted && (
        <View style={StyleSheet.absoluteFillObject}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={({ data }) => {
              if (data && !hasScannedRef.current) {
                hasScannedRef.current = true;
                setScanning(false);
                navigation.navigate('PantallaCargando', { qrToken: data });
              }
            }}
          >
            <SafeAreaView style={estilos.scannerOverlayContainer}>
              {/* Header inside scanner */}
              <View style={estilos.scannerHeader}>
                <Text style={estilos.scannerTitulo}>Activación UTO</Text>
                <TouchableOpacity
                  style={estilos.botonCerrarScanner}
                  onPress={() => setScanning(false)}
                >
                  <Ionicons name="close" size={28} color={colores.blanco} />
                </TouchableOpacity>
              </View>

              {/* Viewfinder target */}
              <View style={estilos.scannerTargetContainer}>
                <View style={estilos.scannerTargetBox}>
                  {/* Esquinas del scanner */}
                  <View style={[estilos.scannerEsquina, estilos.esquinaTL]} />
                  <View style={[estilos.scannerEsquina, estilos.esquinaTR]} />
                  <View style={[estilos.scannerEsquina, estilos.esquinaBL]} />
                  <View style={[estilos.scannerEsquina, estilos.esquinaBR]} />

                  {/* Láser simulado */}
                  <View style={estilos.scannerLaser} />
                </View>
              </View>

              <Text style={estilos.scannerInstruccionesText}>
                Apunte la cámara al código QR generado en el panel administrativo
              </Text>
            </SafeAreaView>
          </CameraView>
        </View>
      )}
    </View>
  );
}

// ─── Sub-componente: paso numerado ───────────────────────────────────────────
interface PasoActivacionProps {
  numero: string;
  texto: string;
}

function PasoActivacion({ numero, texto }: PasoActivacionProps): React.JSX.Element {
  return (
    <View style={estilos.paso}>
      <View style={estilos.pasoBurbuja}>
        <Text style={estilos.pasoNumero}>{numero}</Text>
      </View>
      <Text style={estilos.pasoTexto}>{texto}</Text>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const estilos = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colores.grisClaro,
    paddingHorizontal: espaciado.xl,
    paddingVertical: espaciado.lg,
    justifyContent: 'space-between',
  },

  // ── Encabezado ──
  encabezado: {
    alignItems: 'center',
    paddingTop: espaciado.md,
  },
  logoContenedor: {
    marginBottom: espaciado.md,
    ...sombras.lg,
  },
  logoImagen: {
    width: 90,
    height: 90,
  },
  nombreInstitucion: {
    fontSize: tipografia.tamanios.lg,
    fontWeight: tipografia.pesos.bold,
    color: colores.primario,
    textAlign: 'center',
    marginBottom: espaciado.xs,
  },
  subtitulo: {
    fontSize: tipografia.tamanios.sm,
    fontWeight: tipografia.pesos.medio,
    color: colores.acento,
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  // ── Separador ──
  separadorContenedor: {
    paddingVertical: espaciado.md,
  },
  separadorLinea: {
    height: 1,
    backgroundColor: colores.grisMedio,
  },

  // ── Instrucciones ──
  seccionInstrucciones: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: espaciado.md,
  },
  iconoActivacionContenedor: {
    width: 72,
    height: 72,
    borderRadius: bordes.radio.circular,
    backgroundColor: colores.primario,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espaciado.xs,
    ...sombras.md,
  },
  instruccionesTitulo: {
    fontSize: tipografia.tamanios.xl,
    fontWeight: tipografia.pesos.bold,
    color: colores.primario,
    textAlign: 'center',
  },
  pasos: {
    width: '100%',
    gap: espaciado.sm,
    marginTop: espaciado.xs,
  },
  paso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espaciado.md,
  },
  pasoBurbuja: {
    width: 28,
    height: 28,
    borderRadius: bordes.radio.circular,
    backgroundColor: colores.primario,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  pasoNumero: {
    fontSize: tipografia.tamanios.sm,
    fontWeight: tipografia.pesos.bold,
    color: colores.blanco,
  },
  pasoTexto: {
    flex: 1,
    fontSize: tipografia.tamanios.sm,
    color: colores.grisTexto,
    lineHeight: tipografia.tamanios.sm * tipografia.alturaLinea.normal,
  },
  notaGratuidadContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 48, 135, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0, 48, 135, 0.15)',
    paddingVertical: espaciado.sm + 2,
    paddingHorizontal: espaciado.md,
    borderRadius: bordes.radio.md,
    marginTop: espaciado.md,
    width: '100%',
  },
  notaGratuidadTexto: {
    flex: 1,
    fontSize: tipografia.tamanios.xs + 0.5,
    color: colores.primario,
    lineHeight: (tipografia.tamanios.xs + 0.5) * tipografia.alturaLinea.normal,
    fontWeight: tipografia.pesos.medio,
  },

  // ── Botón ──
  seccionBoton: {
    alignItems: 'center',
    gap: espaciado.md,
    paddingBottom: espaciado.sm,
  },
  botonEscanear: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colores.primario,
    borderRadius: bordes.radio.lg,
    paddingVertical: espaciado.md,
    paddingHorizontal: espaciado.xl,
    width: '100%',
    gap: espaciado.sm,
    ...sombras.md,
  },
  botonTexto: {
    fontSize: tipografia.tamanios.md,
    fontWeight: tipografia.pesos.semibold,
    color: colores.blanco,
  },
  notaActivacion: {
    fontSize: tipografia.tamanios.xs,
    color: colores.grisSecundario,
    textAlign: 'center',
    paddingHorizontal: espaciado.md,
    lineHeight: tipografia.tamanios.xs * tipografia.alturaLinea.normal,
  },

  // ── Footer ──
  footer: {
    alignItems: 'center',
    paddingTop: espaciado.sm,
  },
  footerTexto: {
    fontSize: tipografia.tamanios.xs,
    color: colores.grisDeshabilitado,
    textAlign: 'center',
  },

  // ── Scanner overlay ──
  scannerOverlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'space-between',
    paddingHorizontal: espaciado.xl,
    paddingVertical: espaciado.lg,
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: espaciado.md,
  },
  scannerTitulo: {
    fontSize: tipografia.tamanios.md,
    fontWeight: tipografia.pesos.bold,
    color: colores.blanco,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  botonCerrarScanner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerTargetContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerTargetBox: {
    width: 250,
    height: 250,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  scannerEsquina: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#00e676',
    borderWidth: 0,
  },
  esquinaTL: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  esquinaTR: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  esquinaBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  esquinaBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scannerLaser: {
    height: 3,
    backgroundColor: '#00e676',
    width: '100%',
    top: '50%',
    position: 'absolute',
    opacity: 0.6,
  },
  scannerInstruccionesText: {
    fontSize: tipografia.tamanios.sm,
    color: colores.blanco,
    textAlign: 'center',
    marginBottom: espaciado.lg,
    paddingHorizontal: espaciado.md,
    lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
