/**
 * CarnetCard — Componente visual del Carnet Universitario Digital UTO.
 * Evoca visualmente un carnet universitario físico con colores institucionales.
 *
 * Tarea 5.1 — Fase 1 Demo Visual
 * Requisitos: 2.2, 2.3
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colores, tipografia, espaciado, bordes, sombras } from '../theme';


// ─── Assets ───────────────────────────────────────────────────────────────────

const logoUto = require('../assets/logo/logo_uto.png');
const logoDtic = require('../assets/logo/logo_dtic.webp');

const ABREVIATURAS_FACULTAD: Record<string, string> = {
  'Facultad de Arquitectura y Urbanismo': 'FAU',
  'Facultad de Derecho Ciencias Políticas y Sociales': 'FDCPS',
  'Facultad Nacional de Ingeniería': 'FNI',
  'Facultad de Ciencias Económicas Financieras y Administrativas': 'FCEFA',
  'Facultad de Ciencias Agrarias y Naturales': 'FCAN',
  'Facultad Técnica': 'FT',
  'Facultad de Ciencias de la Salud': 'FCS',
  'Unidad de Posgrado': 'POSGRADO',
  'Licenciaturas': 'LIC',
};

const obtenerAbreviaturaFacultad = (nombreFacultad: string | null | undefined): string => {
  if (!nombreFacultad) return '---';
  const nombreLimpio = nombreFacultad.trim();
  return ABREVIATURAS_FACULTAD[nombreLimpio] || nombreLimpio;
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CarnetCardProps {
  nombreCompleto: string;
  ci: string;
  codigoEstudiante: string;
  carrera: string;
  facultad: string;
  gestionActiva: string;
  fotoUrl: string | null;
  institucion: string;
  fechaActivacion: string | null;
  fechaExpiracion: string | null;
  correo: string | null;
  fecNacimiento: string | null;
  direccion: string | null;
  tipoEstudiante: string;
}

// ─── Sub-componentes internos ─────────────────────────────────────────────────

/** Marca de agua geométrica que simula líneas de seguridad físicas */
function SecurityWatermark(): React.JSX.Element {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <View style={[estilos.watermarkCirculo, { width: 320, height: 320, borderRadius: 160, top: -140, right: -120 }]} />
      <View style={[estilos.watermarkCirculo, { width: 220, height: 220, borderRadius: 110, bottom: -60, left: -60 }]} />
      <View style={[estilos.watermarkCirculo, { width: 440, height: 440, borderRadius: 220, top: 60, left: -190 }]} />
    </View>
  );
}

/** Fila de dato: etiqueta + valor acompañada de un icono minimalista */
function FilaDato({
  icono,
  etiqueta,
  valor,
  valorBold = false,
  valorColor = colores.grisTexto,
}: {
  icono: string;
  etiqueta: string;
  valor: string;
  valorBold?: boolean;
  valorColor?: string;
}): React.JSX.Element {
  return (
    <View style={estilos.filaDato}>
      <View style={estilos.filaDatoHeader}>
        <Ionicons name={icono as any} size={10} color={colores.primario} />
        <Text style={estilos.etiqueta}>{etiqueta}</Text>
      </View>
      <Text
        style={[
          estilos.valor,
          valorBold && estilos.valorBold,
          { color: valorColor },
        ]}
        numberOfLines={2}
      >
        {valor}
      </Text>
    </View>
  );
}

/** Logo UTO: imagen oficial desde assets */
function LogoUTO(): React.JSX.Element {
  return (
    <Image
      source={logoUto}
      style={estilos.logoImagen}
      resizeMode="contain"
      accessibilityLabel="Logo Universidad Técnica de Oruro"
    />
  );
}

/** Logo DTIC: imagen oficial desde assets */
function LogoDTIC(): React.JSX.Element {
  return (
    <Image
      source={logoDtic}
      style={estilos.logoImagen}
      resizeMode="contain"
      accessibilityLabel="Logo DTIC"
    />
  );
}

/** Foto del estudiante o placeholder si fotoUrl es null o falla al cargar */
function FotoEstudiante({ fotoUrl }: { fotoUrl: string | null }): React.JSX.Element {
  const [errorCarga, setErrorCarga] = React.useState(false);

  if (fotoUrl && !errorCarga) {
    return (
      <Image
        source={{ uri: fotoUrl }}
        style={estilos.foto}
        resizeMode="cover"
        accessibilityLabel="Fotografía del estudiante"
        onError={() => setErrorCarga(true)}
      />
    );
  }

  return (
    <View style={estilos.fotoPlaceholder} accessibilityLabel="Sin fotografía">
      <Ionicons name="person-outline" size={32} color={colores.grisDeshabilitado} />
      <Text style={estilos.fotoPlaceholderTexto}>Sin foto</Text>
    </View>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function CarnetCard({
  nombreCompleto,
  ci,
  carrera,
  facultad,
  gestionActiva,
  fotoUrl,
  institucion,
  fechaActivacion,
  fechaExpiracion,
  correo,
  fecNacimiento,
  direccion,
  tipoEstudiante,
}: CarnetCardProps): React.JSX.Element {
  const formatearFecha = (fechaStr: string | null) => {
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
  };

  return (
    <View style={estilos.tarjeta}>
      {/* Fondo de seguridad y brillo diagonal */}
      <SecurityWatermark />
      <View style={estilos.brilloTarjeta} />

      {/* ── Encabezado azul institucional ── */}
      <View style={estilos.encabezado}>
        <LogoUTO />
        <View style={estilos.encabezadoTextos}>
          <Text style={estilos.encabezadoInstitucion} numberOfLines={1}>
            {institucion.toUpperCase()}
          </Text>
          <Text style={estilos.encabezadoSubtitulo}>
            CARNET UNIVERSITARIO DIGITAL
          </Text>
        </View>
        <LogoDTIC />
      </View>

      {/* ── Cuerpo: foto + datos ── */}
      <View style={estilos.cuerpo}>

        {/* Foto del estudiante */}
        <View style={estilos.columnaFoto}>
          <View style={estilos.fotoMarco}>
            <FotoEstudiante fotoUrl={fotoUrl} />
          </View>
          <View style={estilos.badgeTipoEstudiante}>
            <Text style={estilos.textoTipoEstudiante} numberOfLines={1}>
              {tipoEstudiante}
            </Text>
          </View>
        </View>

        {/* Datos del estudiante */}
        <View style={estilos.columnaDatos}>
          <FilaDato
            icono="person"
            etiqueta="Estudiante"
            valor={nombreCompleto}
            valorBold
            valorColor={colores.primario}
          />
          <FilaDato icono="id-card-outline" etiqueta="C.I." valor={ci} />
          <FilaDato icono="school-outline" etiqueta="Carrera" valor={`${carrera} (${obtenerAbreviaturaFacultad(facultad)})`} />
          <FilaDato
            icono="calendar-outline"
            etiqueta="Vigencia"
            valor={`${formatearFecha(fechaActivacion)} - ${formatearFecha(fechaExpiracion)}`}
          />
          <FilaDato icono="mail-outline" etiqueta="Correo" valor={correo || '---'} />
          <FilaDato icono="gift-outline" etiqueta="Fec. Nacimiento" valor={formatearFecha(fecNacimiento)} />
          <FilaDato icono="location-outline" etiqueta="Dirección" valor={direccion || '---'} />
        </View>

      </View>

      {/* ── Franja inferior azul ── */}
      <View style={estilos.pieCarnet}>
        <Text style={estilos.pieGestion}>
          GESTIÓN: {gestionActiva}
        </Text>
        <View style={estilos.pieIndicador}>
          <Text style={estilos.pieIndicadorTexto}>● ACTIVO</Text>
        </View>
      </View>

    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  // Tarjeta contenedora
  tarjeta: {
    width: '100%',
    maxWidth: 380,
    borderRadius: bordes.radio.lg,
    borderWidth: 1.5,
    borderColor: colores.acento,
    backgroundColor: colores.primario,
    overflow: 'hidden',
    position: 'relative',
    ...sombras.carnet,
  },

  // Marca de agua
  watermarkCirculo: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.025)',
  },

  // Brillo del carnet
  brilloTarjeta: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 130,
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    transform: [{ rotate: '-12deg' }, { scale: 1.8 }, { translateY: -40 }],
  },

  // ── Encabezado ──
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: espaciado.md,
    paddingVertical: espaciado.sm + 2,
    gap: espaciado.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  encabezadoTextos: {
    flex: 1,
    alignItems: 'center',
  },
  encabezadoInstitucion: {
    color: colores.blanco,
    fontSize: 10,
    fontWeight: tipografia.pesos.bold,
    textAlign: 'center',
    letterSpacing: 0.8,
  },
  encabezadoSubtitulo: {
    color: colores.acento,
    fontSize: 9,
    fontWeight: tipografia.pesos.bold,
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: 0.6,
  },

  // Logos institucionales
  logoImagen: {
    width: 32,
    height: 32,
  },

  // ── Cuerpo ──
  cuerpo: {
    flexDirection: 'row',
    padding: espaciado.md,
    gap: espaciado.md,
    backgroundColor: colores.grisClaro,
  },

  // Columna de la foto
  columnaFoto: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  // Marco de la foto
  fotoMarco: {
    padding: 3,
    backgroundColor: colores.blanco,
    borderRadius: bordes.radio.md,
    borderWidth: 1,
    borderColor: colores.acento,
    ...sombras.md,
  },

  // Foto real
  foto: {
    width: 90,
    height: 115,
    borderRadius: bordes.radio.sm,
    backgroundColor: '#E5E8E8',
  },

  // Placeholder de foto
  fotoPlaceholder: {
    width: 90,
    height: 115,
    borderRadius: bordes.radio.sm,
    backgroundColor: '#E5E8E8',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaciado.xs,
  },
  fotoPlaceholderTexto: {
    fontSize: 10,
    color: colores.grisDeshabilitado,
    fontWeight: tipografia.pesos.medio,
  },

  // Columna de datos
  columnaDatos: {
    flex: 1,
    gap: 7,
  },

  // Fila de dato individual
  filaDato: {
    gap: 1,
  },
  filaDatoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  etiqueta: {
    fontSize: 8.5,
    fontWeight: tipografia.pesos.semibold,
    color: colores.grisSecundario,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  valor: {
    fontSize: 11.5,
    color: colores.grisTexto,
    fontWeight: tipografia.pesos.normal,
    lineHeight: 14,
  },
  valorBold: {
    fontWeight: tipografia.pesos.bold,
    fontSize: 13,
  },

  // ── Pie del carnet ──
  pieCarnet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espaciado.md,
    paddingVertical: espaciado.sm,
    position: 'relative',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  pieGestion: {
    color: colores.blanco,
    fontSize: 11,
    fontWeight: tipografia.pesos.bold,
    letterSpacing: 1.2,
    textAlign: 'center',
    flex: 1,
  },
  pieIndicador: {
    position: 'absolute',
    right: espaciado.md,
    backgroundColor: colores.exitoFondo,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: bordes.radio.circular,
  },
  pieIndicadorTexto: {
    color: '#4CAF50',
    fontSize: 9,
    fontWeight: tipografia.pesos.bold,
    letterSpacing: 0.5,
  },
  badgeTipoEstudiante: {
    marginTop: 8,
    paddingVertical: 3,
    paddingHorizontal: 6,
    backgroundColor: colores.primario,
    borderRadius: bordes.radio.sm,
    borderWidth: 1,
    borderColor: colores.acento,
    width: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoTipoEstudiante: {
    color: colores.blanco,
    fontSize: 8.5,
    fontWeight: tipografia.pesos.bold,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
