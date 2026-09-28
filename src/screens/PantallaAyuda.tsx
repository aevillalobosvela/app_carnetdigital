/**
 * PantallaAyuda — Información de la app, contactos institucionales y
 * accesos rápidos a trámites y servicios de la UTO.
 *
 * Fase 1 Demo Visual
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colores, tipografia, espaciado, bordes, sombras } from '../theme';

// ─── Constantes ───────────────────────────────────────────────────────────────

const URLS = {
  tramites: 'https://www.uto.edu.bo/informaciones/',
  compraValores: 'https://estudiantes.uto.edu.bo/principal/login',
} as const;

const qrAyuda = require('../assets/logo/qr_ayuda.png');

// ─── Utilidades ───────────────────────────────────────────────────────────────

async function abrirEnlace(url: string, etiqueta: string): Promise<void> {
  try {
    const soportado = await Linking.canOpenURL(url);
    if (soportado) {
      await Linking.openURL(url);
    } else {
      Alert.alert(
        'No se pudo abrir el enlace',
        `Visita manualmente: ${url}`,
        [{ text: 'Entendido' }],
      );
    }
  } catch {
    Alert.alert('Error', `No se pudo abrir "${etiqueta}".`, [{ text: 'Cerrar' }]);
  }
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

/** Tarjeta contenedora con título de sección */
function Seccion({
  titulo,
  icono,
  children,
}: {
  titulo: string;
  icono: React.ComponentProps<typeof Ionicons>['name'];
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <View style={estilos.seccion}>
      <View style={estilos.seccionEncabezado}>
        <Ionicons name={icono} size={18} color={colores.primario} />
        <Text style={estilos.seccionTitulo}>{titulo}</Text>
      </View>
      <View style={estilos.tarjeta}>{children}</View>
    </View>
  );
}

/** Fila de contacto con ícono, etiqueta y valor */
function FilaContacto({
  icono,
  etiqueta,
  valor,
}: {
  icono: React.ComponentProps<typeof Ionicons>['name'];
  etiqueta: string;
  valor: string;
}): React.JSX.Element {
  return (
    <View style={estilos.filaContacto}>
      <View style={estilos.filaContactoIcono}>
        <Ionicons name={icono} size={18} color={colores.primario} />
      </View>
      <View style={estilos.filaContactoTextos}>
        <Text style={estilos.filaContactoEtiqueta}>{etiqueta}</Text>
        <Text style={estilos.filaContactoValor}>{valor}</Text>
      </View>
    </View>
  );
}

/** Separador fino entre filas */
function Separador(): React.JSX.Element {
  return <View style={estilos.separador} />;
}

/** Botón de acceso rápido a un enlace externo */
function BotonEnlace({
  icono,
  titulo,
  descripcion,
  color,
  url,
}: {
  icono: React.ComponentProps<typeof Ionicons>['name'];
  titulo: string;
  descripcion: string;
  color: string;
  url: string;
}): React.JSX.Element {
  return (
    <TouchableOpacity
      style={[estilos.botonEnlace, { borderLeftColor: color }]}
      onPress={() => abrirEnlace(url, titulo)}
      activeOpacity={0.78}
      accessibilityLabel={titulo}
      accessibilityRole="link"
    >
      <View style={[estilos.botonEnlaceIcono, { backgroundColor: color }]}>
        <Ionicons name={icono} size={22} color={colores.blanco} />
      </View>
      <View style={estilos.botonEnlaceTextos}>
        <Text style={estilos.botonEnlaceTitulo}>{titulo}</Text>
        <Text style={estilos.botonEnlaceDescripcion}>{descripcion}</Text>
      </View>
      <Ionicons name="open-outline" size={18} color={colores.grisDeshabilitado} />
    </TouchableOpacity>
  );
}

/** Código QR para el grupo de Telegram */
function QRTelegram(): React.JSX.Element {
  const telegramUrl = 'https://t.me/dtic_informaciones';

  return (
    <View style={estilos.qrContenedor}>
      {/* Marco del QR como botón táctil */}
      <TouchableOpacity
        style={estilos.qrMarco}
        onPress={() => abrirEnlace(telegramUrl, 'Grupo de Telegram')}
        activeOpacity={0.82}
        accessibilityLabel="Unirse al grupo de Telegram"
        accessibilityRole="link"
      >
        <Image
          source={qrAyuda}
          style={estilos.qrImagen}
          resizeMode="contain"
          accessibilityLabel="Código QR para unirse al grupo de Telegram"
        />
      </TouchableOpacity>
      <Text style={estilos.qrEtiqueta}>Escanea o presiona para unirte</Text>
      <Text style={estilos.qrSubetiqueta}>
        Grupo oficial de ayuda estudiantil en Telegram
      </Text>
    </View>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function PantallaAyuda(): React.JSX.Element {
  return (
    <SafeAreaView style={estilos.safeArea} edges={['top', 'left', 'right']}>

      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollContenido}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Descripción de la app ── */}
        <View style={estilos.descripcionContenedor}>
          <View style={estilos.descripcionIcono}>
            <Ionicons name="id-card" size={32} color={colores.blanco} />
          </View>
          <View style={estilos.descripcionTextos}>
            <Text style={estilos.descripcionTitulo}>Carnet Digital UTO</Text>
            <Text style={estilos.descripcionCuerpo}>
              Tu carnet universitario siempre disponible en el celular.
              Funciona con internet y tiene el mismo valor que el carnet físico
              para trámites y servicios dentro de la universidad.
            </Text>
          </View>
        </View>

        {/* ── Accesos rápidos ── */}
        <Seccion titulo="Servicios estudiantiles" icono="globe-outline">
          <BotonEnlace
            icono="document-text-outline"
            titulo="Trámites universitarios"
            descripcion="Consulta requisitos y procedimientos para trámites en la UTO"
            color={colores.primario}
            url={URLS.tramites}
          />
          <Separador />
          <BotonEnlace
            icono="card-outline"
            titulo="Compra de valores estudiantiles"
            descripcion="Adquiere tus valores para inscripciones, certificados y más"
            color="#1565C0"
            url={URLS.compraValores}
          />
        </Seccion>

        {/* ── Grupo de ayuda Telegram ── */}
        <Seccion titulo="Grupo de ayuda en Telegram" icono="paper-plane-outline">
          <Text style={estilos.telegramDescripcion}>
            ¿Tienes dudas sobre tu carnet digital? Únete al grupo oficial de
            estudiantes en Telegram para recibir soporte de la DTIC.
          </Text>
          <QRTelegram />
        </Seccion>

        {/* ── Contacto DTIC ── */}
        <Seccion titulo="Contacto DTIC" icono="call-outline">
          <FilaContacto
            icono="business-outline"
            etiqueta="Oficina"
            valor="Dirección de Tecnologías de Información y Comunicación"
          />
          <Separador />
          <FilaContacto
            icono="location-outline"
            etiqueta="Ubicación"
            valor="Av. 6 de Octubre #5715 entre Cochabamba y Ayacucho"
          />
          <Separador />
          <FilaContacto
            icono="time-outline"
            etiqueta="Horario de atención"
            valor="Lunes a viernes, 8:30 – 12:00 y 14:30 – 18:30"
          />
          <Separador />
          <FilaContacto
            icono="mail-outline"
            etiqueta="Correo"
            valor="dtic@uto.edu.bo"
          />
        </Seccion>

        {/* ── Versión ── */}
        <Text style={estilos.versionTexto}>
          Carnet Digital UTO v1.0.0 · © 2026 DTIC - Universidad Técnica de Oruro
        </Text>

      </ScrollView>
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
  },
  scrollContenido: {
    paddingHorizontal: espaciado.md,
    paddingTop: espaciado.lg,
    paddingBottom: espaciado.xl,
    gap: espaciado.md,
  },

  // ── Descripción de la app ──
  descripcionContenedor: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colores.primario,
    borderRadius: bordes.radio.lg,
    padding: espaciado.md,
    gap: espaciado.md,
    ...sombras.md,
  },
  descripcionIcono: {
    width: 56,
    height: 56,
    borderRadius: bordes.radio.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  descripcionTextos: {
    flex: 1,
    gap: espaciado.xs,
  },
  descripcionTitulo: {
    fontSize: tipografia.tamanios.lg,
    fontWeight: tipografia.pesos.bold,
    color: colores.blanco,
  },
  descripcionCuerpo: {
    fontSize: tipografia.tamanios.sm,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
  },

  // ── Secciones ──
  seccion: {
    gap: espaciado.sm,
  },
  seccionEncabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.xs,
    paddingLeft: espaciado.xs,
  },
  seccionTitulo: {
    fontSize: tipografia.tamanios.sm,
    fontWeight: tipografia.pesos.semibold,
    color: colores.grisSecundario,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  tarjeta: {
    backgroundColor: colores.blanco,
    borderRadius: bordes.radio.lg,
    paddingHorizontal: espaciado.md,
    paddingVertical: espaciado.sm,
    ...sombras.sm,
  },

  // ── Botones de enlace ──
  botonEnlace: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: espaciado.md,
    gap: espaciado.md,
    borderLeftWidth: 3,
    paddingLeft: espaciado.sm,
    marginLeft: -espaciado.sm,   // compensa el padding para alinear con el borde de la tarjeta
  },
  botonEnlaceIcono: {
    width: 44,
    height: 44,
    borderRadius: bordes.radio.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  botonEnlaceTextos: {
    flex: 1,
    gap: 3,
  },
  botonEnlaceTitulo: {
    fontSize: tipografia.tamanios.md,
    fontWeight: tipografia.pesos.semibold,
    color: colores.grisTexto,
  },
  botonEnlaceDescripcion: {
    fontSize: tipografia.tamanios.xs,
    color: colores.grisSecundario,
    lineHeight: 17,
  },

  // ── Telegram / QR ──
  telegramDescripcion: {
    fontSize: tipografia.tamanios.sm,
    color: colores.grisSecundario,
    lineHeight: 20,
    paddingVertical: espaciado.sm,
  },
  qrContenedor: {
    alignItems: 'center',
    paddingVertical: espaciado.md,
    gap: espaciado.sm,
  },
  qrMarco: {
    borderWidth: 2,
    borderColor: colores.grisMedio,
    borderRadius: bordes.radio.md,
    padding: espaciado.sm,
    backgroundColor: colores.grisClaro,
  },
  qrImagen: {
    width: 160,
    height: 160,
  },
  qrEtiqueta: {
    fontSize: tipografia.tamanios.md,
    fontWeight: tipografia.pesos.semibold,
    color: colores.grisTexto,
  },
  qrSubetiqueta: {
    fontSize: tipografia.tamanios.xs,
    color: colores.grisSecundario,
    textAlign: 'center',
  },

  // ── Contacto ──
  filaContacto: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: espaciado.sm,
    gap: espaciado.md,
  },
  filaContactoIcono: {
    width: 28,
    alignItems: 'center',
    paddingTop: 2,
  },
  filaContactoTextos: {
    flex: 1,
    gap: 2,
  },
  filaContactoEtiqueta: {
    fontSize: tipografia.tamanios.xs,
    color: colores.grisSecundario,
  },
  filaContactoValor: {
    fontSize: tipografia.tamanios.sm,
    color: colores.grisTexto,
    fontWeight: tipografia.pesos.medio,
    lineHeight: 20,
  },

  // Separador
  separador: {
    height: 1,
    backgroundColor: colores.grisMedio,
    marginLeft: 44,
  },

  // Versión
  versionTexto: {
    fontSize: tipografia.tamanios.xs,
    color: colores.grisDeshabilitado,
    textAlign: 'center',
    paddingTop: espaciado.sm,
  },
});
