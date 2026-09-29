import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Animated,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { RoutePropCargando, NavegacionCargando } from '../navigation/types';
import { authService } from '../services/auth_service';
import { useAuth } from '../context/AuthContext';
import { colores, tipografia, espaciado, sombras } from '../theme';

// ─── Assets ───────────────────────────────────────────────────────────────────
const logoUto = require('../assets/logo/logo_uto.png');

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Props {
  navigation: NavegacionCargando;
}

// ─── Componente ───────────────────────────────────────────────────────────────
export function PantallaCargando({ navigation }: Props): React.JSX.Element {
  const route = useRoute<RoutePropCargando>();
  const { authCode, codeVerifier } = route.params;
  const { activarSession } = useAuth();

  // Animación de pulso del logo
  const pulsoAnim = useRef(new Animated.Value(1)).current;

  // Texto de estado dinámico
  const [mensajeEstado, setMensajeEstado] = useState('Procesando código de activación...');

  // Puntos animados (0 = ninguno, 1 = ".", 2 = "..", 3 = "...")
  const [puntos, setPuntos] = useState(0);

  const activacionIniciada = useRef(false);

  useEffect(() => {
    if (activacionIniciada.current) return;
    activacionIniciada.current = true;

    // ── Animación de pulso (fade in/out continuo) ──
    const animacionPulso = Animated.loop(
      Animated.sequence([
        Animated.timing(pulsoAnim, {
          toValue: 0.55,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulsoAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animacionPulso.start();

    // ── Puntos animados secuenciales ──
    const intervaloPuntos = setInterval(() => {
      setPuntos(prev => (prev + 1) % 4);
    }, 400);

    // ── Ejecutar activación real en el Backend ──
    async function realizarActivacion() {
      try {
        setMensajeEstado('Vinculando dispositivo...');
        
        // Petición POST al backend
        await authService.activar(authCode, codeVerifier);
        
        setMensajeEstado('Activación exitosa. Cargando...');
        
        // Un pequeño retraso visual antes del salto para excelente UX
        setTimeout(async () => {
          await activarSession();
          // Nota: activarSession cambia la propiedad isAuthenticated, lo cual hace que
          // el RootNavigator desmonte PantallaCargando y monte TabPrincipal automáticamente.
        }, 1200);

      } catch (err: any) {
        console.error('Error durante la activación:', err);
        
        // Detener animaciones locales
        animacionPulso.stop();
        clearInterval(intervaloPuntos);

        Alert.alert(
          'Error de Activación',
          err.message || 'No se pudo conectar con el servidor universitario. Intente nuevamente.',
          [
            {
              text: 'Regresar',
              onPress: () => navigation.goBack(),
            },
          ],
          { cancelable: false }
        );
      }
    }

    realizarActivacion();

    // Cleanup al desmontar
    return () => {
      animacionPulso.stop();
      clearInterval(intervaloPuntos);
    };
  }, [qrToken, navigation, pulsoAnim, activarSession]);

  // Construye la cadena de puntos según el estado actual
  const puntosTexto = '.'.repeat(puntos);

  return (
    <SafeAreaView style={estilos.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={colores.grisClaro} />

      <View style={estilos.contenedor}>
        {/* ── Logo UTO con animación de pulso ── */}
        <Animated.View style={[estilos.logoContenedor, { opacity: pulsoAnim }]}>
          <Image
            source={logoUto}
            style={estilos.logoImagen}
            resizeMode="contain"
            accessibilityLabel="Logo Universidad Técnica de Oruro"
          />
        </Animated.View>

        {/* ── Nombre de la institución ── */}
        <Text style={estilos.nombreInstitucion}>
          Universidad Técnica de Oruro
        </Text>

        {/* ── Indicador de actividad nativo ── */}
        <ActivityIndicator
          size="large"
          color={colores.primario}
          style={estilos.indicador}
        />

        {/* ── Texto de estado con puntos animados ── */}
        <View style={estilos.mensajeContenedor}>
          <Text style={estilos.mensajeEstado}>
            {mensajeEstado}
            <Text style={estilos.puntos}>{puntosTexto}</Text>
          </Text>
        </View>
      </View>

      {/* ── Footer ── */}
      <View style={estilos.footer}>
        <Text style={estilos.footerTexto}>
          © 2026 DTIC - Universidad Técnica de Oruro
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const estilos = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colores.grisClaro,
  },
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espaciado.xl,
    gap: espaciado.lg,
  },

  // ── Logo ──
  logoContenedor: {
    marginBottom: espaciado.sm,
    ...sombras.lg,
  },
  logoImagen: {
    width: 110,
    height: 110,
  },

  // ── Nombre institución ──
  nombreInstitucion: {
    fontSize: tipografia.tamanios.lg,
    fontWeight: tipografia.pesos.semibold,
    color: colores.primario,
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // ── Indicador ──
  indicador: {
    marginVertical: espaciado.sm,
  },

  // ── Mensaje de estado ──
  mensajeContenedor: {
    minWidth: 250,
    alignItems: 'center',
  },
  mensajeEstado: {
    fontSize: tipografia.tamanios.md,
    fontWeight: tipografia.pesos.medio,
    color: colores.grisSecundario,
    textAlign: 'center',
  },
  puntos: {
    color: colores.primario,
    fontWeight: tipografia.pesos.bold,
  },

  // ── Footer ──
  footer: {
    paddingBottom: espaciado.lg,
    alignItems: 'center',
  },
  footerTexto: {
    fontSize: tipografia.tamanios.xs,
    color: colores.grisDeshabilitado,
    textAlign: 'center',
  },
});
