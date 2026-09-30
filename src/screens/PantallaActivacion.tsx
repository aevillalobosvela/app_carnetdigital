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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { WebView } from 'react-native-webview';
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
const logoCiudadania = require('../assets/logo/logo_ciudadania.png');

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Props {
  navigation: NavegacionActivacion;
}

export function PantallaActivacion({ navigation }: Props): React.JSX.Element {
  const [loading, setLoading] = useState(false);
  const [showWebview, setShowWebview] = useState(false);
  
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: ['openid', 'profile', 'offline_access'],
      redirectUri: REDIRECT_URI,
      responseType: AuthSession.ResponseType.Code,
      extraParams: {
        prompt: 'login'
      }
    },
    discovery
  );

  // Ya no usamos el Listener nativo propenso a errores porque el WebView lo hará todo de forma segura
  


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
            <View style={estilos.logoSeparador} />
            <Image
              source={logoCiudadania}
              style={estilos.logoAgetic}
              resizeMode="contain"
              accessibilityLabel="Logo Ciudadanía Digital"
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
          <View style={estilos.pasos}>
            <InfoActivacion 
              icono="person-outline" 
              texto="Debes contar previamente con un registro activo en Ciudadanía Digital." 
            />
            <InfoActivacion 
              icono="shield-checkmark-outline" 
              texto="¿Por qué la universidad requiere esto de mí? Para garantizar de forma oficial e inequívoca tu identidad estudiantil." 
            />
            <InfoActivacion 
              icono="lock-closed-outline" 
              texto="Tu carnet digital será emitido y vinculado exclusivamente a este dispositivo una vez ingreses." 
            />
          </View>
        </View>

        {/* ── Botón Ciudadania Digital ── */}
        <View style={estilos.seccionBoton}>
          <TouchableOpacity
            style={[estilos.botonEscanear, (!request || loading) && estilos.botonDeshabilitado]}
            onPress={() => {
              if (request?.url) {
                setShowWebview(true);
              } else {
                Alert.alert('Info', 'La plataforma de Ciudadanía Digital está cargando. Por favor, intenta en unos segundos.');
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

        {/* ── Modal con WebView (Para interceptar a AGETIC con total control) ── */}
        <Modal visible={showWebview} animationType="slide" onRequestClose={() => setShowWebview(false)}>
          <SafeAreaView style={{ flex: 1, backgroundColor: colores.grisClaro }} edges={['top', 'bottom']}>
            <View style={estilos.webviewHeader}>
              <TouchableOpacity onPress={() => setShowWebview(false)} style={estilos.webviewBotonCerrar}>
                <Ionicons name="close" size={28} color={colores.primario} />
                <Text style={estilos.webviewBotonTexto}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={estilos.webviewTitulo}>Ciudadanía Digital</Text>
              <View style={{ width: 60 }} />
            </View>
            <WebView
              source={{ uri: request?.url || '' }}
              originWhitelist={['*']}
              incognito={true}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                if (nativeEvent.url && nativeEvent.url.includes('bo.edu.uto.carnetdigital:/oauth2redirect')) {
                  const codeMatch = nativeEvent.url.match(/[?&]code=([^&]+)/);
                  if (codeMatch && codeMatch[1]) {
                    const code = codeMatch[1];
                    const codeVerifier = request?.codeVerifier || '';
                    setShowWebview(false);
                    handleProcesarCodigo(code, codeVerifier);
                  }
                }
              }}
              onNavigationStateChange={(navState) => {
                const { url } = navState;
                if (url && url.includes('bo.edu.uto.carnetdigital:/oauth2redirect')) {
                  const codeMatch = url.match(/[?&]code=([^&]+)/);
                  if (codeMatch && codeMatch[1]) {
                    const code = codeMatch[1];
                    const codeVerifier = request?.codeVerifier || '';
                    setShowWebview(false);
                    handleProcesarCodigo(code, codeVerifier);
                  }
                }
              }}
              onShouldStartLoadWithRequest={(event) => {
                const { url } = event;
                
                // ¡LA MAGIA! Interceptamos la URL malformada de una sola barra ANTES de que colapse
                if (url.includes('bo.edu.uto.carnetdigital:/oauth2redirect')) {
                  const codeMatch = url.match(/[?&]code=([^&]+)/);
                  if (codeMatch && codeMatch[1]) {
                    const code = codeMatch[1];
                    const codeVerifier = request?.codeVerifier || '';
                    setShowWebview(false); // Cerramos el WebView instantáneamente
                    handleProcesarCodigo(code, codeVerifier);
                  }
                  return false; // Evita que el WebView siga intentando cargar la URL rota
                }
                
                return true; // Si es la página normal de AGETIC, que siga cargando
              }}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={estilos.webviewCargando}>
                  <ActivityIndicator size="large" color={colores.primario} />
                </View>
              )}
            />
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

// ─── Sub-componente: paso numerado ───────────────────────────────────────────
interface InfoActivacionProps {
  icono: keyof typeof Ionicons.glyphMap;
  texto: string;
}

function InfoActivacion({ icono, texto }: InfoActivacionProps): React.JSX.Element {
  return (
    <View style={estilos.paso}>
      <View style={estilos.pasoBurbuja}>
        <Ionicons name={icono} size={18} color={colores.blanco} />
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
  logoContenedor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: espaciado.md },
  logoImagen: { width: 90, height: 90 },
  logoAgetic: { width: 140, height: 55 },
  logoSeparador: { width: 1, height: 60, backgroundColor: colores.grisMedio, marginHorizontal: espaciado.md },
  nombreInstitucion: { fontSize: tipografia.tamanios.lg, fontWeight: tipografia.pesos.bold, color: colores.primario, textAlign: 'center', marginBottom: espaciado.xs },
  subtitulo: { fontSize: tipografia.tamanios.sm, fontWeight: tipografia.pesos.medio, color: colores.acento, textAlign: 'center', letterSpacing: 0.5 },
  separadorContenedor: { paddingVertical: espaciado.sm },
  separadorLinea: { height: 1, backgroundColor: colores.grisMedio },
  seccionInstrucciones: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: espaciado.md },
  pasos: { width: '100%', gap: espaciado.md, marginTop: espaciado.xs },
  paso: { flexDirection: 'row', alignItems: 'flex-start', gap: espaciado.md, backgroundColor: colores.blanco, padding: espaciado.md, borderRadius: bordes.radio.md, ...sombras.sm },
  pasoBurbuja: { width: 34, height: 34, borderRadius: bordes.radio.circular, backgroundColor: colores.primario, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  pasoTexto: { flex: 1, fontSize: tipografia.tamanios.sm, color: colores.texto, lineHeight: tipografia.tamanios.sm * tipografia.alturaLinea.normal },
  seccionBoton: { alignItems: 'center', gap: espaciado.md, paddingBottom: espaciado.sm },
  botonEscanear: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0054A6', borderRadius: bordes.radio.lg, paddingVertical: espaciado.md, paddingHorizontal: espaciado.xl, width: '100%', gap: espaciado.sm, ...sombras.md },
  botonDeshabilitado: { opacity: 0.6 },
  botonTexto: { fontSize: tipografia.tamanios.md, fontWeight: tipografia.pesos.semibold, color: colores.blanco },
  notaActivacion: { fontSize: tipografia.tamanios.xs, color: colores.grisSecundario, textAlign: 'center', paddingHorizontal: espaciado.md, lineHeight: tipografia.tamanios.xs * tipografia.alturaLinea.normal },
  footer: { alignItems: 'center', paddingTop: espaciado.sm },
  footerTexto: { fontSize: tipografia.tamanios.xs, color: colores.grisDeshabilitado, textAlign: 'center' },
  webviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: espaciado.md, backgroundColor: colores.blanco, borderBottomWidth: 1, borderBottomColor: colores.grisMedio },
  webviewBotonCerrar: { flexDirection: 'row', alignItems: 'center' },
  webviewBotonTexto: { color: colores.primario, fontSize: tipografia.tamanios.md, marginLeft: 4 },
  webviewTitulo: { fontSize: tipografia.tamanios.md, fontWeight: tipografia.pesos.bold, color: colores.texto },
  webviewCargando: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.8)' },
});
