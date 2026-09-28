import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  AppState,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colores, tipografia, espaciado, bordes, sombras } from '../theme';
import { CarnetCard } from '../components/CarnetCard';
import { carnetService, CarnetInfo } from '../services/carnet_service';
import { authService, type CredentialSession } from '../services/auth_service';
import { useAuth } from '../context/AuthContext';
import * as ScreenCapture from 'expo-screen-capture';

const { width } = Dimensions.get('window');

export function PantallaCarnet(): React.JSX.Element {
  const [datos, setDatos] = useState<CarnetInfo | null>(null);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<string>('Nunca');
  const [segundosRestantes, setSegundosRestantes] = useState(540);
  const [error403, setError403] = useState(false);
  const [mensajeError403, setMensajeError403] = useState<string | null>(null);

  // Estados del carrusel de credenciales
  const [listaSesiones, setListaSesiones] = useState<CredentialSession[]>([]);
  const [indiceSesionActiva, setIndiceSesionActiva] = useState(0);
  const [cargandoSilencioso, setCargandoSilencioso] = useState(false);

  // Estados del escáner para carrera paralela
  const [escanearParalela, setEscanearParalela] = useState(false);
  const [permisoCamara, requestPermisoCamara] = useCameraPermissions();
  const haEscaneadoParalelaRef = useRef(false);
  const [procesandoActivacionParalela, setProcesandoActivacionParalela] = useState(false);

  const carruselRef = useRef<ScrollView>(null);
  const ultimoFetchTimestampRef = useRef<number>(0);
  const cargandoRef = useRef<boolean>(false);
  const { logoutSession } = useAuth();

  // Formatear segundos a MM:SS
  const formatearTiempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = Math.floor(segundos % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Pista visual: rebota levemente el carrusel a la derecha para indicar que se puede deslizar
  const ejecutarRebotePista = useCallback(async (customIndex?: number) => {
    setTimeout(async () => {
      if (!carruselRef.current) return;
      let activeIndex = customIndex;
      if (activeIndex === undefined) {
        const activeCarnetId = await authService.getCarnetId();
        const creds = await authService.getCredentials();
        if (activeCarnetId && creds.length > 0) {
          const idx = creds.findIndex(c => c.carnetId === activeCarnetId);
          if (idx > -1) activeIndex = idx;
        }
      }
      const idxToUse = activeIndex || 0;

      // Deslizar 70px a la derecha para mostrar la siguiente tarjeta/opción
      carruselRef.current.scrollTo({
        x: idxToUse * width + 70,
        animated: true,
      });

      // Retornar a la posición inicial después de 350ms
      setTimeout(() => {
        if (carruselRef.current) {
          carruselRef.current.scrollTo({
            x: idxToUse * width,
            animated: true,
          });
        }
      }, 350);
    }, 800);
  }, []);

  // Función para cargar todos los datos en paralelo
  const cargarDatos = useCallback(async () => {
    if (cargandoRef.current) {
      console.log('[PantallaCarnet] Carga ya en curso, ignorando llamada duplicada.');
      return;
    }
    cargandoRef.current = true;
    setCargando(true);
    setError(null);
    setError403(false);
    setMensajeError403(null);
    try {
      // 1. Obtener lista de credenciales vinculadas en SecureStore
      const creds = await authService.getCredentials();
      setListaSesiones(creds);

      // 2. Determinar cuál es el carnet_id activo
      const activeCarnetId = await authService.getCarnetId();
      let activeIndex = 0;
      if (activeCarnetId && creds.length > 0) {
        const idx = creds.findIndex(c => c.carnetId === activeCarnetId);
        if (idx > -1) {
          setIndiceSesionActiva(idx);
          activeIndex = idx;
        }
      }

      // 3. Carga paralela de los tres endpoints utilizando Promise.all
      const [infoRes, qrRes, codigoRes] = await Promise.all([
        carnetService.obtenerCarnet(),
        carnetService.obtenerQr(),
        carnetService.obtenerCodigo(),
      ]);

      setDatos(infoRes);
      setQrBase64(qrRes);
      setCodigo(codigoRes);

      // Formatear hora de actualización
      const ahora = new Date();
      const horas = String(ahora.getHours()).padStart(2, '0');
      const minutos = String(ahora.getMinutes()).padStart(2, '0');
      setUltimaActualizacion(`${horas}:${minutos}`);

      ultimoFetchTimestampRef.current = ahora.getTime();
      setSegundosRestantes(540); // Restablecer a 9 minutos

      // Ejecutar animación de rebote para guiar al usuario
      ejecutarRebotePista(activeIndex);
    } catch (err: any) {
      console.error('Error cargando datos del carnet:', err);
      if (err.status === 403 || err.status === 401) {
        const fullyLoggedOut = await logoutSession();
        if (!fullyLoggedOut) {
          cargarDatos();
          return;
        }
      } else {
        setError(
          err.message || 'No se pudo establecer conexión con el servidor de la universidad.'
        );
      }
    } finally {
      setCargando(false);
      cargandoRef.current = false;
    }
  }, [ejecutarRebotePista]);

  const cargarDatosSilencioso = async () => {
    setCargandoSilencioso(true);
    try {
      const [infoRes, qrRes, codigoRes] = await Promise.all([
        carnetService.obtenerCarnet(),
        carnetService.obtenerQr(),
        carnetService.obtenerCodigo(),
      ]);

      setDatos(infoRes);
      setQrBase64(qrRes);
      setCodigo(codigoRes);

      const ahora = new Date();
      const horas = String(ahora.getHours()).padStart(2, '0');
      const minutos = String(ahora.getMinutes()).padStart(2, '0');
      setUltimaActualizacion(`${horas}:${minutos}`);

      ultimoFetchTimestampRef.current = ahora.getTime();
      setSegundosRestantes(540);
    } catch (err: any) {
      console.error('Error cargando datos en segundo plano al deslizar:', err);
      if (err.status === 403 || err.status === 401) {
        const fullyLoggedOut = await logoutSession();
        if (!fullyLoggedOut) {
          cargarDatos();
          return;
        }
      }
    } finally {
      setCargandoSilencioso(false);
    }
  };

  // Al cambiar de tarjeta en el carrusel horizontal
  const alCambiarFilaCarrusel = async (e: any) => {
    const contentOffset = e.nativeEvent.contentOffset.x;
    const layoutWidth = e.nativeEvent.layoutMeasurement.width || width;
    const index = Math.round(contentOffset / layoutWidth);

    if (index >= 0 && index < listaSesiones.length) {
      if (index !== indiceSesionActiva) {
        setIndiceSesionActiva(index);
        const sesion = listaSesiones[index];
        await authService.switchCredential(sesion.carnetId);
        await cargarDatosSilencioso();
      }
    } else if (index === listaSesiones.length) {
      setIndiceSesionActiva(index);
    }
  };

  // Abrir scanner para vincular segunda carrera (paralela)
  const handleAbrirScannerParalela = async () => {
    haEscaneadoParalelaRef.current = false;
    if (!permisoCamara) return;
    if (!permisoCamara.granted) {
      const response = await requestPermisoCamara();
      if (!response.granted) {
        Alert.alert(
          'Permiso de Cámara Requerido',
          'Es necesario acceder a la cámara para poder escanear el código QR de activación de carrera paralela.',
          [{ text: 'Entendido' }]
        );
        return;
      }
    }
    setEscanearParalela(true);
  };

  // Mantener sincronizado el carrusel con la sesión activa
  useEffect(() => {
    if (carruselRef.current && listaSesiones.length > 0 && indiceSesionActiva < listaSesiones.length) {
      carruselRef.current.scrollTo({
        x: indiceSesionActiva * width,
        animated: false,
      });
    }
  }, [listaSesiones, indiceSesionActiva]);

  // Controlar timers e intervalos por enfoque de pantalla (evita llamadas en background)
  useFocusEffect(
    useCallback(() => {
      // Activar bloqueo de capturas de pantalla al enfocar la pantalla
      ScreenCapture.preventScreenCaptureAsync();

      const ahora = Date.now();
      const ts = ultimoFetchTimestampRef.current;
      const tiempoTranscurrido = ts ? Math.floor((ahora - ts) / 1000) : 9999;

      if (tiempoTranscurrido >= 540) {
        cargarDatos();
      } else {
        // Continuar la cuenta regresiva desde el tiempo restante
        setSegundosRestantes(540 - tiempoTranscurrido);
        // Mostrar rebote de pista visual si ya está cargado
        ejecutarRebotePista();
      }

      // Intervalo de 1 segundo para la cuenta regresiva
      const intervalId = setInterval(() => {
        setSegundosRestantes((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Limpieza del timer al perder foco
      return () => {
        clearInterval(intervalId);
        // Desactivar bloqueo de capturas de pantalla al salir de la pantalla
        ScreenCapture.allowScreenCaptureAsync();
      };
    }, [cargarDatos, ejecutarRebotePista])
  );

  // Regeneración automática cuando el temporizador llega a 0 (evita efectos secundarios en el renderizado/Strict Mode)
  useEffect(() => {
    if (segundosRestantes === 0) {
      setSegundosRestantes(540);
      cargarDatos();
    }
  }, [segundosRestantes, cargarDatos]);

  // Escuchar cuando la app vuelve del segundo plano (background -> active)
  useEffect(() => {
    const alCambiarEstadoApp = (siguienteEstadoApp: string) => {
      if (siguienteEstadoApp === 'active') {
        const ahora = Date.now();
        const ts = ultimoFetchTimestampRef.current;
        if (ts) {
          const tiempoTranscurrido = Math.floor((ahora - ts) / 1000);
          if (tiempoTranscurrido >= 540) {
            cargarDatos();
          } else {
            // Ajustar los segundos restantes omitiendo el tiempo en segundo plano
            setSegundosRestantes(540 - tiempoTranscurrido);
          }
        } else {
          cargarDatos();
        }
      }
    };

    const suscripcion = AppState.addEventListener('change', alCambiarEstadoApp);

    return () => {
      suscripcion.remove();
    };
  }, [cargarDatos]);

  // Renderizar el código manual OTP de 5 casillas individuales
  const renderCodigoOtp = (cod: string | null) => {
    const digitos = (cod || '-----').split('');
    return (
      <View style={estilos.otpContenedor}>
        {digitos.map((digito, index) => (
          <View key={index} style={estilos.otpCasilla}>
            <Text style={estilos.otpTexto}>{digito}</Text>
          </View>
        ))}
      </View>
    );
  };

  // Pantalla de error 403 (Carnet inactivo/expirado)
  if (error403) {
    return (
      <SafeAreaView style={estilos.safeArea} edges={['top', 'bottom']}>
        <View style={estilos.contenedorError403}>
          <Ionicons name="ban-outline" size={80} color={colores.acento} style={estilos.iconoError403} />

          <Text style={estilos.tituloError403}>Credencial Inactiva / Expirada</Text>

          <Text style={estilos.mensajeError403}>{mensajeError403}</Text>

          <View style={estilos.tarjetaInstrucciones}>
            <Text style={estilos.tituloInstrucciones}>¿Qué debes hacer?</Text>
            <View style={estilos.pasoInstruccion}>
              <Ionicons name="chevron-forward-circle" size={18} color={colores.primario} style={estilos.iconoPaso} />
              <Text style={estilos.textoInstruccion}>
                Dirígete a las oficinas de la DTIC (Dirección de Tecnologías de Información y Comunicación) para regularizar tu estado académico y de matrícula.
              </Text>
            </View>
            <View style={estilos.pasoInstruccion}>
              <Ionicons name="chevron-forward-circle" size={18} color={colores.primario} style={estilos.iconoPaso} />
              <Text style={estilos.textoInstruccion}>
                Verifica que el pago de matrícula y carnetización en el sistema de cobros no tenga observaciones.
              </Text>
            </View>
            <View style={estilos.pasoInstruccion}>
              <Ionicons name="chevron-forward-circle" size={18} color={colores.primario} style={estilos.iconoPaso} />
              <Text style={estilos.textoInstruccion}>
                Una vez activado por el personal autorizado, presiona el botón de abajo para escanear el nuevo código QR.
              </Text>
            </View>
          </View>

          <TouchableOpacity style={estilos.botonReactivar} onPress={logoutSession} activeOpacity={0.8}>
            <Ionicons name="qr-code-outline" size={20} color={colores.blanco} />
            <Text style={estilos.textoBotonReactivar}>Volver a activar (Escanear QR)</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Pantalla de carga inicial
  if (cargando && !datos) {
    return (
      <SafeAreaView style={estilos.safeArea} edges={['top']}>
        <View style={estilos.contenedorCargando}>
          <ActivityIndicator size="large" color={colores.primario} />
          <Text style={estilos.textoCargando}>Cargando credenciales...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Pantalla de error (Sin conexión)
  if (error && !datos) {
    return (
      <SafeAreaView style={estilos.safeArea} edges={['top']}>
        <View style={estilos.contenedorError}>
          <Ionicons name="cloud-offline-outline" size={60} color={colores.error} />
          <Text style={estilos.tituloError}>Error de Conexión</Text>
          <Text style={estilos.mensajeError}>{error}</Text>
          <TouchableOpacity style={estilos.botonReintentar} onPress={cargarDatos}>
            <Ionicons name="refresh" size={18} color={colores.blanco} />
            <Text style={estilos.textoBotonReintentar}>Reintentar conexión</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={estilos.safeArea} edges={['top', 'left', 'right']}>

      {/* Cabecera superior integrada */}
      <View style={estilos.cabeceraSuperior}>
        <View style={estilos.cabeceraSuperiorInfo}>
          <Text style={estilos.cabeceraSuperiorSubtitulo}>Universidad Técnica de Oruro</Text>
          <Text style={estilos.cabeceraSuperiorTitulo}>Carnet Digital</Text>
        </View>
        <View style={estilos.cabeceraSuperiorAcciones}>
          <TouchableOpacity
            style={estilos.cabeceraBotonAccion}
            onPress={() => setMostrarAyuda(true)}
            activeOpacity={0.7}
            accessibilityLabel="Ayuda de uso"
          >
            <Ionicons name="help-circle-outline" size={24} color={colores.primario} />
          </TouchableOpacity>
          <TouchableOpacity
            style={estilos.cabeceraBotonAccion}
            onPress={cargarDatos}
            disabled={cargando}
            activeOpacity={0.7}
            accessibilityLabel="Actualizar"
          >
            {cargando ? (
              <ActivityIndicator size="small" color={colores.primario} />
            ) : (
              <Ionicons name="sync-outline" size={20} color={colores.primario} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Banner de error de conexión en segundo plano */}
      {error && datos && (
        <View style={estilos.bannerErrorOffline}>
          <Ionicons name="cloud-offline-outline" size={16} color={colores.error} />
          <Text style={estilos.textoBannerOffline}>
            Sin conexión. Mostrando códigos anteriores ({ultimaActualizacion}).
          </Text>
        </View>
      )}

      {/* ── Contenido con scroll ── */}
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollContenido}
        showsVerticalScrollIndicator={false}
      >
        {/* Carrusel Horizontal de Credenciales */}
        <View style={estilos.contenedorCarrusel}>
          <ScrollView
            ref={carruselRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={alCambiarFilaCarrusel}
            contentContainerStyle={{ paddingVertical: 10 }}
          >
            {listaSesiones.map((sesion, index) => (
              <View key={sesion.carnetId} style={{ width: width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
                <CarnetCard
                  nombreCompleto={datos?.nombreCompleto || ''}
                  ci={datos?.dip || ''}
                  codigoEstudiante={String(sesion.carnetId)}
                  carrera={sesion.carrera}
                  facultad={sesion.facultad}
                  gestionActiva={sesion.periodoAcademico}
                  fotoUrl={datos?.digital || null}
                  institucion="Universidad Técnica de Oruro"
                  fechaActivacion={datos?.activadoEn || null}
                  fechaExpiracion={datos?.expiraEn || null}
                  correo={datos?.correo || null}
                  fecNacimiento={datos?.fecNacimiento || null}
                  direccion={datos?.direccion || null}
                  tipoEstudiante={datos?.tipoEstudiante || 'EST. REGULAR'}
                />
              </View>
            ))}

            {/* Tarjeta para vincular carrera paralela */}
            <View style={{ width: width, alignItems: 'center', justifyContent: 'center' }}>
              <View style={estilos.tarjetaNuevaCarrera}>
                <View style={estilos.tarjetaNuevaCarreraBorde}>
                  <Ionicons name="add-circle-outline" size={40} color={colores.primario} />
                  <Text style={estilos.tarjetaNuevaCarreraTitulo}>Carrera Paralela</Text>
                  <Text style={estilos.tarjetaNuevaCarreraDesc}>
                    ¿Tienes otra carrera activa? Adquiere tu pago de reposición de carnet universitario en SAGA y escanea tu QR DTIC aquí.
                  </Text>
                  <TouchableOpacity
                    style={estilos.botonVincularParalela}
                    onPress={handleAbrirScannerParalela}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="camera-outline" size={16} color={colores.blanco} />
                    <Text style={estilos.botonVincularParalelaTexto}>Escanear QR</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Puntos Indicadores */}
          {listaSesiones.length > 1 && (
            <View style={estilos.indicadoresContenedor}>
              {Array.from({ length: listaSesiones.length + 1 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    estilos.indicadorPunto,
                    i === indiceSesionActiva && estilos.indicadorPuntoActivo,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* ── Panel de Validación (QR + Código Manual) ── */}
        <View style={estilos.tarjetaValidacion}>
          <Text style={estilos.tituloValidacion}>Código de Validación Temporal</Text>
          <Text style={estilos.descripcionValidacion}>
            Presenta este código QR o digita el código de 5 dígitos ante el verificador institucional.
          </Text>

          {/* Renderizado de QR con esquinas de escaneo */}
          <View style={estilos.qrWrapper}>
            <View style={[estilos.scanCorner, estilos.scanCornerTopLeft]} />
            <View style={[estilos.scanCorner, estilos.scanCornerTopRight]} />
            <View style={[estilos.scanCorner, estilos.scanCornerBottomLeft]} />
            <View style={[estilos.scanCorner, estilos.scanCornerBottomRight]} />
            <View style={estilos.qrBox}>
              {cargandoSilencioso ? (
                <ActivityIndicator size="large" color={colores.primario} />
              ) : qrBase64 ? (
                <Image source={{ uri: qrBase64 }} style={estilos.qrImagen} resizeMode="contain" />
              ) : (
                <View style={estilos.qrPlaceholder}>
                  <Ionicons name="qr-code-outline" size={48} color={colores.grisDeshabilitado} />
                </View>
              )}
            </View>
          </View>

          {/* Panel de Verificación Manual (OTP) */}
          <View style={estilos.panelVerificacionManual}>
            <View style={estilos.columnaIdentificador}>
              <Text style={estilos.manualEtiqueta}>Identificador</Text>
              <Text style={estilos.manualValor}>{datos?.carnetId || '---'}</Text>
            </View>

            <View style={estilos.divisorVerticalManual} />

            <View style={estilos.columnaOtp}>
              <Text style={estilos.manualEtiqueta}>Código de acceso</Text>
              {renderCodigoOtp(codigo)}
            </View>
          </View>

          {/* Cuenta regresiva de expiración */}
          <View style={estilos.contenedorCountdown}>
            <Ionicons name="hourglass-outline" size={13} color="#2980B9" style={estilos.iconoCountdown} />
            <Text style={estilos.textoCountdown}>
              Se regenera en:{' '}
              <Text style={estilos.tiempoCountdown}>{formatearTiempo(segundosRestantes)}</Text>
            </Text>
          </View>

          {/* Botón de actualizar manual */}
          <TouchableOpacity
            style={estilos.botonActualizar}
            onPress={cargarDatos}
            disabled={cargando}
            activeOpacity={0.8}
          >
            {cargando ? (
              <ActivityIndicator size="small" color={colores.primario} style={{ marginRight: 4 }} />
            ) : (
              <Ionicons name="refresh-circle-outline" size={16} color={colores.primario} />
            )}
            <Text style={estilos.textoBotonActualizar}>
              {cargando ? 'Actualizando...' : 'Actualizar ahora'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Aviso institucional ── */}
        <View style={estilos.avisoValidez}>
          <Ionicons name="shield-checkmark" size={24} color="#1B5E20" style={estilos.avisoValidezIcono} />
          <View style={estilos.avisoValidezTextos}>
            <Text style={estilos.avisoValidezTitulo}>
              Documento oficial habilitado
            </Text>
            <Text style={estilos.avisoValidezDetalle}>
              Este carnet digital tiene plena vigencia legal en todas las facultades de la UTO.
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* ── Indicador de actualización ── */}
      <View style={estilos.barraOffline}>
        <Ionicons name="time-outline" size={14} color={colores.grisSecundario} />
        <Text style={estilos.barraOfflineTexto}>
          Actualizado: {ultimaActualizacion}
        </Text>
      </View>

      {/* ── Modal de Ayuda / Guía de Uso Rápido ── */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={mostrarAyuda}
        onRequestClose={() => setMostrarAyuda(false)}
      >
        <View style={estilos.overlayModal}>
          <View style={estilos.contenidoModal}>
            <View style={estilos.modalHeader}>
              <Ionicons name="help-circle-outline" size={24} color={colores.primario} />
              <Text style={estilos.modalTitulo}>Guía de Uso Rápido</Text>
              <TouchableOpacity onPress={() => setMostrarAyuda(false)} style={estilos.botonCerrarModal}>
                <Ionicons name="close" size={20} color={colores.grisSecundario} />
              </TouchableOpacity>
            </View>

            <ScrollView style={estilos.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={estilos.modalIntroduccion}>
                Bienvenido al sistema de Carnet Digital de la Universidad Técnica de Oruro.
              </Text>

              <View style={estilos.itemGuia}>
                <Ionicons name="card-outline" size={20} color={colores.primario} style={estilos.iconoItemGuia} />
                <View style={estilos.textosItemGuia}>
                  <Text style={estilos.tituloItemGuia}>Carnet Digital (Tarjeta)</Text>
                  <Text style={estilos.descItemGuia}>
                    Es tu credencial universitaria oficial. Muestra tus datos personales, carrera, facultad y tu fotografía.
                  </Text>
                </View>
              </View>

              <View style={estilos.itemGuia}>
                <Ionicons name="qr-code-outline" size={20} color={colores.primario} style={estilos.iconoItemGuia} />
                <View style={estilos.textosItemGuia}>
                  <Text style={estilos.tituloItemGuia}>Código QR de Validación</Text>
                  <Text style={estilos.descItemGuia}>
                    Se utiliza para escanear en los puntos de control de acceso físico de la universidad. Por seguridad, se regenera cada 9 minutos.
                  </Text>
                </View>
              </View>

              <View style={estilos.itemGuia}>
                <Ionicons name="keypad-outline" size={20} color={colores.primario} style={estilos.iconoItemGuia} />
                <View style={estilos.textosItemGuia}>
                  <Text style={estilos.tituloItemGuia}>Verificación Manual</Text>
                  <Text style={estilos.descItemGuia}>
                    Si el lector de código QR no funciona, puedes dictar tu "Identificador" y "Código de acceso" de 5 dígitos al personal de control.
                  </Text>
                </View>
              </View>

              <View style={estilos.itemGuia}>
                <Ionicons name="refresh-circle-outline" size={20} color={colores.primario} style={estilos.iconoItemGuia} />
                <View style={estilos.textosItemGuia}>
                  <Text style={estilos.tituloItemGuia}>Actualizar Códigos</Text>
                  <Text style={estilos.descItemGuia}>
                    Puedes presionar "Actualizar códigos" para forzar la renovación inmediata del código QR y código de acceso.
                  </Text>
                </View>
              </View>

              <View style={estilos.itemGuia}>
                <Ionicons name="shield-checkmark-outline" size={20} color={colores.exito} style={estilos.iconoItemGuia} />
                <View style={estilos.textosItemGuia}>
                  <Text style={estilos.tituloItemGuia}>Seguridad y Validez</Text>
                  <Text style={estilos.descItemGuia}>
                    Este carnet es personal e intransferible. El sistema requiere conexión periódica para mantener activos tus códigos de validación.
                  </Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity style={estilos.botonEntendido} onPress={() => setMostrarAyuda(false)}>
              <Text style={estilos.textoBotonEntendido}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de escaneo de carrera paralela */}
      <Modal
        visible={escanearParalela}
        animationType="slide"
        onRequestClose={() => setEscanearParalela(false)}
      >
        <View style={StyleSheet.absoluteFillObject}>
          {permisoCamara?.granted && (
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              onBarcodeScanned={async ({ data }) => {
                if (data && !haEscaneadoParalelaRef.current) {
                  haEscaneadoParalelaRef.current = true;
                  setEscanearParalela(false);

                  setProcesandoActivacionParalela(true);
                  try {
                    await authService.activarParalela(data);
                    await cargarDatos();

                    Alert.alert(
                      'Activación Exitosa',
                      'Tu carrera paralela ha sido vinculada correctamente.',
                      [{ text: '¡Excelente!' }]
                    );
                  } catch (err: any) {
                    Alert.alert(
                      'Error de Activación',
                      err.message || 'No se pudo vincular la carrera paralela. Verifica el código QR.',
                      [{ text: 'Entendido' }]
                    );
                  } finally {
                    setProcesandoActivacionParalela(false);
                  }
                }
              }}
            >
              <SafeAreaView style={estilos.scannerOverlayContainer}>
                <View style={estilos.scannerHeader}>
                  <Text style={estilos.scannerTitulo}>Vincular Carrera Paralela</Text>
                  <TouchableOpacity
                    style={estilos.botonCerrarScanner}
                    onPress={() => setEscanearParalela(false)}
                  >
                    <Ionicons name="close" size={28} color={colores.blanco} />
                  </TouchableOpacity>
                </View>

                <View style={estilos.scannerTargetContainer}>
                  <View style={estilos.scannerTargetBox}>
                    <View style={[estilos.scannerEsquina, estilos.esquinaTL]} />
                    <View style={[estilos.scannerEsquina, estilos.esquinaTR]} />
                    <View style={[estilos.scannerEsquina, estilos.esquinaBL]} />
                    <View style={[estilos.scannerEsquina, estilos.esquinaBR]} />
                    <View style={estilos.scannerLaser} />
                  </View>
                </View>

                <Text style={estilos.scannerInstruccionesText}>
                  Apunte la cámara al código QR de activación de carrera paralela
                </Text>
              </SafeAreaView>
            </CameraView>
          )}
        </View>
      </Modal>

      {/* Overlay de Carga de Activación Paralela */}
      {procesandoActivacionParalela && (
        <Modal transparent visible>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: colores.blanco, padding: 24, borderRadius: 12, alignItems: 'center', gap: 12 }}>
              <ActivityIndicator size="large" color={colores.primario} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: colores.grisTexto }}>Vinculando carrera paralela...</Text>
            </View>
          </View>
        </Modal>
      )}

    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const estilos = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colores.grisClaro,
  },

  // Cabecera superior fija corporativa
  cabeceraSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: espaciado.lg,
    paddingVertical: espaciado.sm + 2,
    backgroundColor: colores.blanco,
    borderBottomWidth: 1,
    borderBottomColor: colores.grisMedio,
    ...sombras.sm,
  },
  cabeceraSuperiorInfo: {
    flexDirection: 'column',
  },
  cabeceraSuperiorSubtitulo: {
    fontSize: 9,
    fontWeight: tipografia.pesos.bold,
    color: colores.grisSecundario,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cabeceraSuperiorTitulo: {
    fontSize: tipografia.tamanios.lg,
    fontWeight: tipografia.pesos.extrabold,
    color: colores.primario,
  },
  cabeceraSuperiorAcciones: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
  },
  cabeceraBotonAccion: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F2F4F4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E8E8',
  },

  // Carga
  contenedorCargando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: espaciado.md,
  },
  textoCargando: {
    fontSize: tipografia.tamanios.md,
    color: colores.grisSecundario,
  },

  // Error
  contenedorError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: espaciado.xl,
    gap: espaciado.md,
  },
  tituloError: {
    fontSize: tipografia.tamanios.xl,
    fontWeight: tipografia.pesos.bold,
    color: colores.grisTexto,
  },
  mensajeError: {
    fontSize: tipografia.tamanios.sm,
    color: colores.grisSecundario,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: espaciado.md,
  },
  botonReintentar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colores.primario,
    borderRadius: bordes.radio.md,
    paddingVertical: espaciado.md,
    paddingHorizontal: espaciado.xl,
    gap: espaciado.sm,
    ...sombras.sm,
  },
  textoBotonReintentar: {
    color: colores.blanco,
    fontSize: tipografia.tamanios.md,
    fontWeight: tipografia.pesos.bold,
  },

  // ScrollView
  scroll: {
    flex: 1,
  },
  scrollContenido: {
    alignItems: 'center',
    paddingTop: espaciado.md,
    paddingBottom: espaciado.lg,
    gap: espaciado.md,
  },

  // Tarjeta de Validación
  tarjetaValidacion: {
    backgroundColor: colores.blanco,
    borderRadius: bordes.radio.lg,
    padding: espaciado.md,
    width: width - 48,
    maxWidth: 380,
    alignItems: 'center',
    gap: espaciado.sm,
    ...sombras.md,
    borderWidth: 1,
    borderColor: colores.grisMedio,
  },
  tituloValidacion: {
    fontSize: tipografia.tamanios.sm,
    fontWeight: tipografia.pesos.bold,
    color: colores.primario,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  descripcionValidacion: {
    fontSize: 11,
    color: colores.grisSecundario,
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: espaciado.xs,
  },
  qrWrapper: {
    position: 'relative',
    padding: 8,
    marginVertical: espaciado.xs,
  },
  scanCorner: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderColor: colores.acento,
    borderWidth: 2.5,
  },
  scanCornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 6,
  },
  scanCornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 6,
  },
  scanCornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 6,
  },
  scanCornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 6,
  },
  qrBox: {
    width: 160,
    height: 160,
    borderRadius: bordes.radio.md,
    backgroundColor: colores.grisClaro,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colores.grisMedio,
  },
  qrImagen: {
    width: 144,
    height: 144,
  },
  qrPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelVerificacionManual: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9F9',
    borderColor: '#E5E8E8',
    borderWidth: 1,
    borderRadius: bordes.radio.md,
    paddingVertical: espaciado.sm,
    paddingHorizontal: espaciado.md,
    width: '100%',
    maxWidth: 340,
    marginVertical: espaciado.xs,
  },
  columnaIdentificador: {
    flex: 0.35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnaOtp: {
    flex: 0.65,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divisorVerticalManual: {
    width: 1,
    height: 38,
    backgroundColor: '#D5D8D8',
    marginHorizontal: espaciado.sm,
  },
  manualEtiqueta: {
    fontSize: 9,
    fontWeight: tipografia.pesos.bold,
    color: colores.grisSecundario,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  manualValor: {
    fontSize: 16,
    fontWeight: tipografia.pesos.bold,
    color: colores.grisTexto,
  },
  otpContenedor: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 2,
  },
  otpCasilla: {
    width: 24,
    height: 28,
    borderRadius: 4,
    backgroundColor: colores.blanco,
    borderColor: '#BDC3C7',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...sombras.sm,
  },
  otpTexto: {
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
    fontSize: 14,
    fontWeight: '700',
    color: colores.primario,
  },
  botonActualizar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(11, 37, 69, 0.05)',
    marginTop: espaciado.xs,
  },
  textoBotonActualizar: {
    color: colores.primario,
    fontSize: 10,
    fontWeight: tipografia.pesos.semibold,
  },

  // Aviso de validez
  avisoValidez: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: bordes.radio.lg,
    borderWidth: 1,
    borderColor: colores.exito,
    paddingVertical: espaciado.sm,
    paddingHorizontal: espaciado.md,
    width: width - 48,
    maxWidth: 380,
    gap: espaciado.sm,
  },
  avisoValidezIcono: {
    marginTop: 2,
  },
  avisoValidezTextos: {
    flex: 1,
  },
  avisoValidezTitulo: {
    fontSize: tipografia.tamanios.sm,
    fontWeight: tipografia.pesos.bold,
    color: '#1B5E20',
  },
  avisoValidezDetalle: {
    fontSize: 11,
    color: '#2E7D32',
    lineHeight: 14,
    marginTop: 1,
  },

  // Barra de actualización inferior
  barraOffline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colores.blanco,
    paddingVertical: espaciado.xs,
    paddingHorizontal: espaciado.md,
    borderTopWidth: 1,
    borderTopColor: colores.grisMedio,
    borderRadius: bordes.radio.sm,
    marginHorizontal: espaciado.md,
    marginBottom: espaciado.sm,
    gap: espaciado.xs,
    ...sombras.sm,
  },
  barraOfflineTexto: {
    fontSize: tipografia.tamanios.xs - 1,
    color: colores.grisSecundario,
    fontWeight: tipografia.pesos.medio,
    textAlign: 'center',
  },

  // Estilos de Cuenta Regresiva (Countdown)
  contenedorCountdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaciado.xs,
    marginVertical: espaciado.xs,
    backgroundColor: '#EBF5FB',
    paddingVertical: 4,
    paddingHorizontal: espaciado.sm,
    borderRadius: bordes.radio.sm,
  },
  iconoCountdown: {
    marginTop: 1,
  },
  textoCountdown: {
    fontSize: 11,
    color: '#2980B9',
  },
  tiempoCountdown: {
    fontWeight: tipografia.pesos.bold,
    color: '#1F618D',
  },

  overlayModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: espaciado.lg,
  },
  contenidoModal: {
    backgroundColor: colores.blanco,
    borderRadius: bordes.radio.lg,
    padding: espaciado.md,
    width: '100%',
    maxWidth: 350,
    maxHeight: '80%',
    ...sombras.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E8E8',
    paddingBottom: espaciado.sm,
    marginBottom: espaciado.sm,
    position: 'relative',
    gap: espaciado.xs,
  },
  modalTitulo: {
    fontSize: tipografia.tamanios.md,
    fontWeight: tipografia.pesos.bold,
    color: colores.grisTexto,
  },
  botonCerrarModal: {
    position: 'absolute',
    right: 0,
    top: -2,
    padding: 4,
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalIntroduccion: {
    fontSize: 12,
    color: colores.grisSecundario,
    lineHeight: 16,
    marginBottom: espaciado.md,
    textAlign: 'center',
  },
  itemGuia: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espaciado.sm,
    marginBottom: espaciado.md,
  },
  iconoItemGuia: {
    marginTop: 2,
    width: 22,
  },
  textosItemGuia: {
    flex: 1,
  },
  tituloItemGuia: {
    fontSize: 12,
    fontWeight: tipografia.pesos.bold,
    color: colores.grisTexto,
    marginBottom: 2,
  },
  descItemGuia: {
    fontSize: 11,
    color: colores.grisSecundario,
    lineHeight: 15,
  },
  botonEntendido: {
    backgroundColor: colores.primario,
    borderRadius: bordes.radio.md,
    paddingVertical: espaciado.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: espaciado.sm,
    ...sombras.sm,
  },
  textoBotonEntendido: {
    color: colores.blanco,
    fontSize: tipografia.tamanios.sm,
    fontWeight: tipografia.pesos.bold,
  },

  // Banner Offline en segundo plano
  bannerErrorOffline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDF2F2',
    borderColor: '#FADBD8',
    borderWidth: 1,
    paddingVertical: espaciado.sm,
    paddingHorizontal: espaciado.md,
    gap: espaciado.sm,
    width: '100%',
  },
  textoBannerOffline: {
    fontSize: 12,
    color: colores.error,
    fontWeight: tipografia.pesos.medio,
    textAlign: 'center',
  },

  // Pantalla de error 403 (Carnet inactivo/expirado)
  contenedorError403: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: espaciado.xl,
    backgroundColor: colores.grisClaro,
    gap: espaciado.md,
  },
  iconoError403: {
    marginBottom: espaciado.sm,
  },
  tituloError403: {
    fontSize: tipografia.tamanios.lg,
    fontWeight: tipografia.pesos.bold,
    color: colores.grisTexto,
    textAlign: 'center',
  },
  mensajeError403: {
    fontSize: tipografia.tamanios.sm,
    color: colores.grisSecundario,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: espaciado.xs,
  },
  tarjetaInstrucciones: {
    backgroundColor: colores.blanco,
    borderRadius: bordes.radio.lg,
    borderWidth: 1,
    borderColor: colores.grisMedio,
    padding: espaciado.md,
    width: '100%',
    maxWidth: 380,
    gap: espaciado.sm,
    ...sombras.sm,
  },
  tituloInstrucciones: {
    fontSize: tipografia.tamanios.sm,
    fontWeight: tipografia.pesos.bold,
    color: colores.primario,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: espaciado.xs,
  },
  pasoInstruccion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espaciado.sm,
    marginVertical: 2,
  },
  iconoPaso: {
    marginTop: 2,
  },
  textoInstruccion: {
    flex: 1,
    fontSize: 12,
    color: colores.grisTexto,
    lineHeight: 16,
  },
  botonReactivar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colores.primario,
    borderRadius: bordes.radio.md,
    paddingVertical: espaciado.md,
    paddingHorizontal: espaciado.xl,
    gap: espaciado.sm,
    width: '100%',
    maxWidth: 380,
    marginTop: espaciado.md,
    ...sombras.sm,
  },
  textoBotonReactivar: {
    color: colores.blanco,
    fontSize: tipografia.tamanios.md,
    fontWeight: tipografia.pesos.bold,
  },
  contenedorCarrusel: {
    width: width,
    height: 360,
    alignItems: 'center',
  },
  indicadoresContenedor: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicadorPunto: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#BDC3C7',
  },
  indicadorPuntoActivo: {
    width: 14,
    backgroundColor: colores.primario,
  },
  tarjetaNuevaCarrera: {
    width: width - 40,
    maxWidth: 380,
    height: 247,
    backgroundColor: colores.blanco,
    borderRadius: bordes.radio.lg,
    padding: espaciado.md,
    ...sombras.carnet,
    borderWidth: 1.5,
    borderColor: colores.grisMedio,
  },
  tarjetaNuevaCarreraBorde: {
    flex: 1,
    borderWidth: 2,
    borderColor: colores.primario,
    borderStyle: 'dashed',
    borderRadius: bordes.radio.md,
    justifyContent: 'center',
    alignItems: 'center',
    padding: espaciado.md,
    gap: espaciado.xs,
  },
  tarjetaNuevaCarreraTitulo: {
    fontSize: 15,
    fontWeight: tipografia.pesos.bold,
    color: colores.primario,
    marginTop: 2,
  },
  tarjetaNuevaCarreraDesc: {
    fontSize: 11,
    color: colores.grisSecundario,
    textAlign: 'center',
    lineHeight: 14,
    marginVertical: 4,
    paddingHorizontal: 20,
  },
  botonVincularParalela: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colores.primario,
    borderRadius: bordes.radio.md,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 6,
    marginTop: 4,
    ...sombras.sm,
  },
  botonVincularParalelaTexto: {
    color: colores.blanco,
    fontSize: 12,
    fontWeight: tipografia.pesos.bold,
  },
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
