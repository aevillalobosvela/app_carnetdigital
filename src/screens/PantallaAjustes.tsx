import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  RootStackParamList,
  TabParamList,
} from '../navigation/types';
import { colores, tipografia, espaciado, bordes, sombras } from '../theme';
import { carnetService, CarnetInfo } from '../services/carnet_service';
import { useAuth } from '../context/AuthContext';

// ─── Tipos de navegación ──────────────────────────────────────────────────────

type PantallaAjustesNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'PantallaAjustes'>,
  StackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: PantallaAjustesNavProp;
}

// ─── Utilidades ───────────────────────────────────────────────────────────────

/**
 * Calcula las iniciales del nombre completo (máximo 2 letras).
 * Toma la primera letra de cada palabra.
 */
function calcularIniciales(nombreCompleto: string): string {
  return nombreCompleto
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra.charAt(0).toUpperCase())
    .join('');
}

/**
 * Formatea una fecha ISO o string a DD/MM/YYYY
 */
function formatearFecha(fechaStr: string | null): string {
  if (!fechaStr) return '---';
  try {
    const date = new Date(fechaStr);
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const anio = date.getFullYear();
    return `${dia}/${mes}/${anio}`;
  } catch {
    return '---';
  }
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

interface FilaInfoProps {
  icono: React.ComponentProps<typeof Ionicons>['name'];
  etiqueta: string;
  valor: string;
}

function FilaInfo({ icono, etiqueta, valor }: FilaInfoProps): React.JSX.Element {
  return (
    <View style={estilos.filaInfo}>
      <Ionicons name={icono} size={20} color={colores.primario} style={estilos.filaIcono} />
      <View style={estilos.filaTextos}>
        <Text style={estilos.filaEtiqueta}>{etiqueta}</Text>
        <Text style={estilos.filaValor}>{valor}</Text>
      </View>
    </View>
  );
}

interface SeccionProps {
  titulo: string;
  children: React.ReactNode;
}

function Seccion({ titulo, children }: SeccionProps): React.JSX.Element {
  return (
    <View style={estilos.seccion}>
      <Text style={estilos.seccionTitulo}>{titulo}</Text>
      <View style={estilos.tarjeta}>{children}</View>
    </View>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function PantallaAjustes({ navigation }: Props): React.JSX.Element {
  const { logoutSession } = useAuth();
  const [datos, setDatos] = useState<CarnetInfo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fotoError, setFotoError] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmadoCheckbox, setConfirmadoCheckbox] = useState(false);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError(null);
    setFotoError(false);
    try {
      const res = await carnetService.obtenerCarnet();
      setDatos(res);
    } catch (err: any) {
      console.error('Error cargando datos para ajustes:', err);
      if (err.status === 403 || err.status === 401) {
        const fullyLoggedOut = await logoutSession();
        if (!fullyLoggedOut) {
          cargarDatos();
          return;
        }
      }
      setError(err.message || 'No se pudo cargar la información del estudiante.');
    } finally {
      setCargando(false);
    }
  }, [logoutSession]);

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [cargarDatos])
  );

  const iniciales = datos ? calcularIniciales(datos.nombreCompleto) : '';

  const handleDesactivarDispositivo = () => {
    setConfirmadoCheckbox(false);
    setModalVisible(true);
  };

  if (cargando && !datos) {
    return (
      <SafeAreaView style={estilos.safeArea} edges={['top']}>
        <View style={estilos.contenedorCargando}>
          <ActivityIndicator size="large" color={colores.primario} />
          <Text style={estilos.textoCargando}>Cargando ajustes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !datos) {
    return (
      <SafeAreaView style={estilos.safeArea} edges={['top']}>
        <View style={estilos.contenedorError}>
          <Ionicons name="cloud-offline-outline" size={60} color={colores.acento} />
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

  if (!datos) {
    return <View style={estilos.safeArea} />;
  }

  return (
    <SafeAreaView style={estilos.safeArea} edges={['top', 'left', 'right']}>

      {/* ── Contenido con scroll ── */}
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollContenido}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Sección: Perfil del estudiante ── */}
        <Seccion titulo="Perfil del estudiante">
          <View style={estilos.perfilContenedor}>
            {/* Foto o Avatar circular con iniciales */}
            {datos.digital && !fotoError ? (
              <Image
                source={{ uri: datos.digital }}
                style={estilos.fotoPerfil}
                onError={() => setFotoError(true)}
                resizeMode="cover"
              />
            ) : (
              <View style={estilos.avatar}>
                <Text style={estilos.avatarIniciales}>{iniciales}</Text>
              </View>
            )}
            {/* Datos del estudiante */}
            <Text style={estilos.perfilNombre}>
              {datos.nombreCompleto}
            </Text>
            <Text style={estilos.perfilCarrera}>{datos.carrera}</Text>
          </View>
        </Seccion>

        {/* ── Sección: Información académica ── */}
        <Seccion titulo="Información académica">
          <FilaInfo
            icono="business-outline"
            etiqueta="Facultad"
            valor={datos.facultad}
          />
          <View style={estilos.separador} />
          <FilaInfo
            icono="calendar-outline"
            etiqueta="Gestión activa"
            valor={datos.periodoAcademico || '---'}
          />
          <View style={estilos.separador} />
          <FilaInfo
            icono="card-outline"
            etiqueta="C.I."
            valor={datos.dip}
          />
        </Seccion>

        {/* ── Sección: Datos personales ── */}
        <Seccion titulo="Datos personales">
          <FilaInfo
            icono="mail-outline"
            etiqueta="Correo"
            valor={datos.correo || '---'}
          />
          <View style={estilos.separador} />
          <FilaInfo
            icono="gift-outline"
            etiqueta="Fecha de nacimiento"
            valor={formatearFecha(datos.fecNacimiento)}
          />
          <View style={estilos.separador} />
          <FilaInfo
            icono="location-outline"
            etiqueta="Dirección"
            valor={datos.direccion || '---'}
          />
        </Seccion>

        {/* ── Sección: Acerca de la app ── */}
        <Seccion titulo="Acerca de la app">
          <FilaInfo
            icono="phone-portrait-outline"
            etiqueta="Versión"
            valor="1.0.0 (Demo)"
          />
          <View style={estilos.separador} />
          <FilaInfo
            icono="school-outline"
            etiqueta="Institución"
            valor="Universidad Técnica de Oruro"
          />
          <View style={estilos.separador} />
          <FilaInfo
            icono="information-circle-outline"
            etiqueta="Sistema"
            valor="Carnet Digital UTO"
          />
        </Seccion>

        {/* ── Botón desactivar dispositivo ── */}
        <TouchableOpacity
          style={estilos.botonDesactivar}
          onPress={handleDesactivarDispositivo}
          activeOpacity={0.8}
          accessibilityLabel="Desactivar este dispositivo"
          accessibilityRole="button"
        >
          <Ionicons name="power-outline" size={20} color={colores.blanco} />
          <Text style={estilos.botonDesactivarTexto}>Desactivar dispositivo</Text>
        </TouchableOpacity>

        {/* Nota informativa sobre la desactivación */}
        <Text style={estilos.notaDesactivacion}>
          Al desactivar, deberás acudir a la DTIC para obtener un nuevo QR y reactivar la app.
        </Text>

        {/* Espacio inferior */}
        <View style={estilos.espacioInferior} />

      </ScrollView>

      {/* Modal de confirmación de desactivación */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={estilos.overlayModal}>
          <View style={estilos.contenidoModal}>
            <View style={estilos.modalHeader}>
              <Ionicons name="warning-outline" size={24} color={colores.acento} />
              <Text style={estilos.modalTitulo}>Confirmar Desactivación</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={estilos.botonCerrarModal}>
                <Ionicons name="close" size={20} color={colores.grisSecundario} />
              </TouchableOpacity>
            </View>

            <ScrollView style={estilos.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={estilos.tarjetaAdvertencia}>
                <Ionicons name="alert-circle-outline" size={20} color="#721C24" style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={estilos.tituloAdvertencia}>¡ADVERTENCIA IMPORTANTE!</Text>
              </View>
              <Text style={estilos.modalIntroduccion}>
                Al desactivar este dispositivo, se cerrará tu sesión de forma permanente y el carnet digital quedará <Text style={{ fontWeight: 'bold', color: colores.error }}>INACTIVO</Text> en el servidor.
              </Text>
              <Text style={estilos.modalConsecuencia}>
                Para reactivarlo en un nuevo teléfono o en este mismo, según las políticas de la universidad, deberás comprar un <Text style={{ fontWeight: 'bold' }}>NUEVO pago de reposición de carnet universitario</Text> y acudir a las oficinas de la DTIC.
              </Text>

              {/* Checkbox de confirmación */}
              <TouchableOpacity
                style={estilos.contenedorCheckbox}
                onPress={() => setConfirmadoCheckbox(prev => !prev)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={confirmadoCheckbox ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={confirmadoCheckbox ? colores.primario : colores.grisSecundario}
                />
                <Text style={estilos.textoCheckbox}>
                  Entiendo las consecuencias y acepto desactivar el dispositivo.
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={estilos.modalAcciones}>
              <TouchableOpacity
                style={estilos.botonCancelarModal}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={estilos.textoBotonCancelar}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  estilos.botonConfirmarModal,
                  !confirmadoCheckbox && estilos.botonConfirmarModalDeshabilitado
                ]}
                onPress={async () => {
                  setModalVisible(false);
                  const fullyLoggedOut = await logoutSession();
                  if (!fullyLoggedOut) {
                    await cargarDatos();
                  }
                }}
                disabled={!confirmadoCheckbox}
                activeOpacity={0.8}
              >
                <Text style={estilos.textoBotonConfirmar}>Desactivar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colores.grisClaro,
  },

  // Header
  header: {
    backgroundColor: colores.primario,
    paddingHorizontal: espaciado.lg,
    paddingVertical: espaciado.md,
    alignItems: 'center',
  },
  headerTitulo: {
    color: colores.blanco,
    fontSize: tipografia.tamanios.xl,
    fontWeight: tipografia.pesos.bold,
    letterSpacing: 0.3,
  },

  // ScrollView
  scroll: {
    flex: 1,
    backgroundColor: colores.grisClaro,
  },
  scrollContenido: {
    paddingHorizontal: espaciado.md,
    paddingTop: espaciado.lg,
  },

  // Secciones
  seccion: {
    marginBottom: espaciado.md,
  },
  seccionTitulo: {
    fontSize: tipografia.tamanios.sm,
    fontWeight: tipografia.pesos.semibold,
    color: colores.grisSecundario,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: espaciado.sm,
    marginLeft: espaciado.xs,
  },
  tarjeta: {
    backgroundColor: colores.blanco,
    borderRadius: bordes.radio.lg,
    paddingHorizontal: espaciado.md,
    paddingVertical: espaciado.sm,
    ...sombras.sm,
  },

  // Perfil del estudiante
  perfilContenedor: {
    alignItems: 'center',
    paddingVertical: espaciado.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: bordes.radio.circular,
    backgroundColor: colores.primario,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espaciado.md,
    ...sombras.sm,
  },
  avatarIniciales: {
    fontSize: tipografia.tamanios.xxl,
    fontWeight: tipografia.pesos.bold,
    color: colores.blanco,
  },
  fotoPerfil: {
    width: 80,
    height: 80,
    borderRadius: bordes.radio.circular,
    backgroundColor: colores.grisMedio,
    marginBottom: espaciado.md,
  },
  perfilNombre: {
    fontSize: tipografia.tamanios.lg,
    fontWeight: tipografia.pesos.bold,
    color: colores.grisTexto,
    textAlign: 'center',
    marginBottom: espaciado.xs,
  },
  perfilCarrera: {
    fontSize: tipografia.tamanios.sm,
    color: colores.grisSecundario,
    textAlign: 'center',
    marginBottom: espaciado.xs,
  },
  perfilCodigo: {
    fontSize: tipografia.tamanios.sm,
    color: colores.grisDeshabilitado,
    textAlign: 'center',
  },

  // Filas de información
  filaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: espaciado.sm,
  },
  filaIcono: {
    marginRight: espaciado.md,
    width: 28,
    textAlign: 'center',
  },
  filaTextos: {
    flex: 1,
  },
  filaEtiqueta: {
    fontSize: tipografia.tamanios.xs,
    color: colores.grisSecundario,
    marginBottom: 2,
  },
  filaValor: {
    fontSize: tipografia.tamanios.md,
    color: colores.grisTexto,
    fontWeight: tipografia.pesos.medio,
  },

  // Separador entre filas
  separador: {
    height: 1,
    backgroundColor: colores.grisMedio,
    marginLeft: 44, // alinear con el texto, después del ícono
  },

  // Botón desactivar dispositivo
  botonDesactivar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaciado.sm,
    backgroundColor: colores.error,
    borderRadius: bordes.radio.md,
    paddingVertical: espaciado.md,
    paddingHorizontal: espaciado.lg,
    marginTop: espaciado.sm,
    ...sombras.sm,
  },
  botonDesactivarTexto: {
    fontSize: tipografia.tamanios.md,
    fontWeight: tipografia.pesos.bold,
    color: colores.blanco,
    letterSpacing: 0.3,
  },
  notaDesactivacion: {
    fontSize: tipografia.tamanios.xs,
    color: colores.grisSecundario,
    textAlign: 'center',
    paddingHorizontal: espaciado.md,
    marginBottom: espaciado.md,
    lineHeight: tipografia.tamanios.xs * tipografia.alturaLinea.normal,
  },

  // Espacio inferior
  espacioInferior: {
    height: espaciado.lg,
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
  // Estilos del Modal de Desactivación
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
  tarjetaAdvertencia: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8D7DA',
    borderColor: '#F5C6CB',
    borderWidth: 1,
    borderRadius: bordes.radio.md,
    padding: espaciado.sm,
    marginBottom: espaciado.sm,
  },
  tituloAdvertencia: {
    fontSize: 11,
    fontWeight: tipografia.pesos.bold,
    color: '#721C24',
    letterSpacing: 0.5,
  },
  modalIntroduccion: {
    fontSize: 12,
    color: colores.grisTexto,
    lineHeight: 16,
    marginBottom: espaciado.sm,
  },
  modalConsecuencia: {
    fontSize: 11,
    color: colores.grisSecundario,
    lineHeight: 15,
    marginBottom: espaciado.md,
  },
  contenedorCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
    backgroundColor: '#F8F9F9',
    borderColor: '#E5E8E8',
    borderWidth: 1,
    borderRadius: bordes.radio.md,
    padding: espaciado.sm,
    marginBottom: espaciado.md,
  },
  textoCheckbox: {
    flex: 1,
    fontSize: 11,
    color: colores.grisTexto,
    lineHeight: 14,
  },
  modalAcciones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: espaciado.sm,
    borderTopWidth: 1,
    borderTopColor: '#E5E8E8',
    paddingTop: espaciado.sm,
  },
  botonCancelarModal: {
    paddingVertical: espaciado.sm,
    paddingHorizontal: espaciado.md,
    borderRadius: bordes.radio.md,
    borderWidth: 1,
    borderColor: colores.grisSecundario,
  },
  textoBotonCancelar: {
    color: colores.grisSecundario,
    fontSize: tipografia.tamanios.sm,
    fontWeight: tipografia.pesos.semibold,
  },
  botonConfirmarModal: {
    backgroundColor: colores.error,
    paddingVertical: espaciado.sm,
    paddingHorizontal: espaciado.md,
    borderRadius: bordes.radio.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonConfirmarModalDeshabilitado: {
    backgroundColor: colores.grisDeshabilitado,
    opacity: 0.6,
  },
  textoBotonConfirmar: {
    color: colores.blanco,
    fontSize: tipografia.tamanios.sm,
    fontWeight: tipografia.pesos.bold,
  },
});
