import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { colores, tipografia, espaciado, bordes, sombras } from '../theme';
import { NavegacionActivacion } from '../navigation/types';

// Completa la sesión web si la app fue abierta desde el navegador
try {
  WebBrowser.maybeCompleteAuthSession();
} catch (e) {
  console.log('Error en maybeCompleteAuthSession:', e);
}

// Endpoint de la AGETIC (Entorno de pruebas)
const discovery = {
  authorizationEndpoint: 'https://proveedor.ciudadania.demo.agetic.gob.bo/auth',
  tokenEndpoint: 'https://proveedor.ciudadania.demo.agetic.gob.bo/token',
};

const CLIENT_ID = 'JYTTEsTy6sNkI6dw0QA6KvJMkSL1CNKBXee-wb7mSm2';
const REDIRECT_URI = 'bo.edu.uto.carnetdigital:/oauth2redirect';

// ─── Assets ───────────────────────────────────────────────────────────────────
const logoUto = require('../assets/logo/logo_uto.png');

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Props {
  navigation: NavegacionActivacion;
}

export function PantallaActivacion({ navigation }: Props): React.JSX.Element {
  const [loading, setLoading] = useState(false);
  
  // Hook de AuthSession
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: ['openid', 'profile', 'offline_access'],
      redirectUri: REDIRECT_URI,
      responseType: AuthSession.ResponseType.Code,
    },
    discovery
  );

  // Listener nativo de fuerza bruta para lidiar con el formato exigido por AGETIC (una sola barra)
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url;
      if (url && url.includes('bo.edu.uto.carnetdigital:/oauth2redirect')) {
        // Cerramos el navegador interno a la fuerza
        WebBrowser.dismissBrowser();
        
        // Extraemos el código secreto
        const codeMatch = url.match(/[?&]code=([^&]+)/);
        if (codeMatch && codeMatch[1]) {
          const code = codeMatch[1];
          const codeVerifier = request?.codeVerifier || '';
          handleProcesarCodigo(code, codeVerifier);
        }
      }
    };

    const sub = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => sub.remove();
  }, [request]);

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      const codeVerifier = request?.codeVerifier || '';
      handleProcesarCodigo(code, codeVerifier);
    } else if (response?.type === 'error') {
      Alert.alert('Error', 'No se pudo completar la autenticación con Ciudadanía Digital.');
    }
  }, [response]);

  const handleProcesarCodigo = async (code: string, codeVerifier: string) => {
    setLoading(true);
    try {
      // Navegamos a PantallaCargando enviando el código de autorización
      // @ts-ignore
      navigation.navigate('PantallaCargando', { authCode: code, codeVerifier });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Hubo un problema al procesar el acceso.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={estilos.safeArea} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={colores.grisClaro} />

        {/* ── Encabezado institucional ── */}
        <View style={estilos.encabezado}>
          <View style={estilos.logoContenedor}>
            <Image
              source={logoUto}
              style={estilos.logoImagen}
              resizeMode="contain"
              accessibilityLabel="Logo Universidad Técnica de Oruro"
            />
          </View>
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
          <View style={estilos.iconoActivacionContenedor}>
            <Ionicons name="finger-print-outline" size={36} color={colores.blanco} />
          </View>

          <Text style={estilos.instruccionesTitulo}>
            Activa tu carnet digital
          </Text>

          <View style={estilos.pasos}>
            <PasoActivacion numero="1" texto="Presiona el botón 'Ingresar con Ciudadanía Digital'." />
            <PasoActivacion numero="2" texto="Inicia sesión con tus credenciales del Estado." />
            <PasoActivacion numero="3" texto="Autoriza a la UTO para emitir tu carnet digital." />
          </View>
        </View>

        {/* ── Botón Ciudadania Digital ── */}
        <View style={estilos.seccionBoton}>
          <TouchableOpacity
            style={[estilos.botonEscanear, (!request || loading) && estilos.botonDeshabilitado]}
            onPress={async () => {
              try {
                // Intentar abrir el navegador seguro embebido (Chrome Custom Tabs)
                const result = await promptAsync();
                // Si el usuario cancela o hay un problema que no tira excepcion, intentamos atraparlo
                if (result.type !== 'success' && result.type !== 'cancel') {
                  throw new Error('El navegador embebido falló.');
                }
              } catch (e: any) {
                // Si el dispositivo no soporta navegadores embebidos o falla, ofrecemos abrir externamente
                Alert.alert(
                  'Aviso de Navegador',
                  'Tu dispositivo tiene problemas usando el navegador interno seguro. ¿Deseas abrir la página de activación en tu navegador externo (Chrome, Firefox, etc.)?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { 
                      text: 'Abrir Externamente', 
                      onPress: () => {
                        if (request?.url) {
                          Linking.openURL(request.url).catch(err => {
                            Alert.alert('Error', 'No se pudo abrir ningún navegador.');
                          });
                        }
                      }
                    }
                  ]
                );
              }
            }}
            disabled={!request || loading}
            activeOpacity={0.82}
          >
            {loading ? (
              <ActivityIndicator color={colores.blanco} />
            ) : (
              <>
                <Ionicons name="person-circle-outline" size={24} color={colores.blanco} />
                <Text style={estilos.botonTexto}>Ingresar con Ciudadanía Digital</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={estilos.notaActivacion}>
            La validación se realiza mediante la Agencia de Gobierno Electrónico (AGETIC)
          </Text>
        </View>

        {/* ── Footer ── */}
        <View style={estilos.footer}>
          <Text style={estilos.footerTexto}>
            © 2026 DTIC - Universidad Técnica de Oruro
          </Text>
        </View>
      </SafeAreaView>
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
  encabezado: { alignItems: 'center', paddingTop: espaciado.md },
  logoContenedor: { marginBottom: espaciado.md, ...sombras.lg },
  logoImagen: { width: 90, height: 90 },
  nombreInstitucion: { fontSize: tipografia.tamanios.lg, fontWeight: tipografia.pesos.bold, color: colores.primario, textAlign: 'center', marginBottom: espaciado.xs },
  subtitulo: { fontSize: tipografia.tamanios.sm, fontWeight: tipografia.pesos.medio, color: colores.acento, textAlign: 'center', letterSpacing: 0.5 },
  separadorContenedor: { paddingVertical: espaciado.md },
  separadorLinea: { height: 1, backgroundColor: colores.grisMedio },
  seccionInstrucciones: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: espaciado.md },
  iconoActivacionContenedor: { width: 72, height: 72, borderRadius: bordes.radio.circular, backgroundColor: colores.primario, alignItems: 'center', justifyContent: 'center', marginBottom: espaciado.xs, ...sombras.md },
  instruccionesTitulo: { fontSize: tipografia.tamanios.xl, fontWeight: tipografia.pesos.bold, color: colores.primario, textAlign: 'center' },
  pasos: { width: '100%', gap: espaciado.sm, marginTop: espaciado.xs },
  paso: { flexDirection: 'row', alignItems: 'flex-start', gap: espaciado.md },
  pasoBurbuja: { width: 28, height: 28, borderRadius: bordes.radio.circular, backgroundColor: colores.primario, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  pasoNumero: { fontSize: tipografia.tamanios.sm, fontWeight: tipografia.pesos.bold, color: colores.blanco },
  pasoTexto: { flex: 1, fontSize: tipografia.tamanios.sm, color: colores.grisTexto, lineHeight: tipografia.tamanios.sm * tipografia.alturaLinea.normal },
  seccionBoton: { alignItems: 'center', gap: espaciado.md, paddingBottom: espaciado.sm },
  botonEscanear: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0054A6', borderRadius: bordes.radio.lg, paddingVertical: espaciado.md, paddingHorizontal: espaciado.xl, width: '100%', gap: espaciado.sm, ...sombras.md },
  botonDeshabilitado: { opacity: 0.6 },
  botonTexto: { fontSize: tipografia.tamanios.md, fontWeight: tipografia.pesos.semibold, color: colores.blanco },
  notaActivacion: { fontSize: tipografia.tamanios.xs, color: colores.grisSecundario, textAlign: 'center', paddingHorizontal: espaciado.md, lineHeight: tipografia.tamanios.xs * tipografia.alturaLinea.normal },
  footer: { alignItems: 'center', paddingTop: espaciado.sm },
  footerTexto: { fontSize: tipografia.tamanios.xs, color: colores.grisDeshabilitado, textAlign: 'center' },
});
