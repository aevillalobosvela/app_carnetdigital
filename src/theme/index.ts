/**
 * Sistema de tema visual — Carnet Digital UTO
 * Colores, tipografías, espaciados y estilos institucionales de la
 * Universidad Técnica de Oruro (UTO).
 */

// ─── Colores institucionales ────────────────────────────────────────────────

export const colores = {
  /** Azul institucional UTO - Marino profundo */
  primario: '#0B2545',
  /** Variante más clara del azul institucional */
  primarioClaro: '#134074',
  /** Dorado — color de acento principal (Oro UTO) */
  acento: '#D4AF37',
  /** Variante más oscura del dorado acento */
  acentoOscuro: '#AA861E',
  /** Blanco puro — color secundario */
  blanco: '#FFFFFF',
  /** Gris claro para fondos */
  grisClaro: '#F8F9FA',
  /** Gris medio para bordes y separadores */
  grisMedio: '#E5E8E8',
  /** Gris oscuro para texto principal */
  grisTexto: '#1C2833',
  /** Gris para texto secundario */
  grisSecundario: '#566573',
  /** Gris para texto deshabilitado / placeholders */
  grisDeshabilitado: '#A6ACAF',
  /** Rojo para acciones destructivas o errores */
  error: '#C0392B',
  /** Verde para estados activos / éxito */
  exito: '#2E7D32',
  /** Verde translúcido para fondos / resplandores */
  exitoFondo: 'rgba(46, 125, 50, 0.12)',
  /** Naranja para advertencias */
  advertencia: '#D35400',
  /** Fondo oscuro semitransparente para overlays */
  overlay: 'rgba(0, 0, 0, 0.5)',
} as const;

// ─── Tipografías ─────────────────────────────────────────────────────────────

export const tipografia = {
  tamanios: {
    /** 12px — etiquetas pequeñas, notas al pie */
    xs: 12,
    /** 14px — texto secundario, subtítulos pequeños */
    sm: 14,
    /** 16px — texto de cuerpo principal */
    md: 16,
    /** 18px — subtítulos, campos destacados */
    lg: 18,
    /** 22px — títulos de sección */
    xl: 22,
    /** 28px — títulos principales de pantalla */
    xxl: 28,
  },
  pesos: {
    normal: '400' as const,
    medio: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  alturaLinea: {
    ajustada: 1.2,
    normal: 1.5,
    relajada: 1.75,
  },
} as const;

// ─── Espaciados ───────────────────────────────────────────────────────────────

export const espaciado = {
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 16px */
  md: 16,
  /** 24px */
  lg: 24,
  /** 32px */
  xl: 32,
  /** 48px */
  xxl: 48,
} as const;

// ─── Bordes ───────────────────────────────────────────────────────────────────

export const bordes = {
  radio: {
    /** 4px — bordes sutiles */
    sm: 4,
    /** 8px — tarjetas y botones */
    md: 8,
    /** 16px — tarjetas prominentes */
    lg: 16,
    /** 24px — elementos redondeados */
    xl: 24,
    /** 9999px — completamente circular */
    circular: 9999,
  },
  grosor: {
    delgado: 1,
    normal: 2,
    grueso: 3,
  },
} as const;

// ─── Sombras ──────────────────────────────────────────────────────────────────

export const sombras = {
  /** Sombra sutil para elementos elevados levemente */
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  /** Sombra estándar para tarjetas */
  md: {
    shadowColor: '#1C2833',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  /** Sombra pronunciada para el carnet digital */
  lg: {
    shadowColor: '#1C2833',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  /** Sombra del carnet con tinte azul institucional profundo */
  carnet: {
    shadowColor: '#0B2545',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 12,
  },
} as const;

// ─── Tema completo ────────────────────────────────────────────────────────────

export const tema = {
  colores,
  tipografia,
  espaciado,
  bordes,
  sombras,
} as const;

export type Tema = typeof tema;
export type Colores = typeof colores;
export type Tipografia = typeof tipografia;
export type Espaciado = typeof espaciado;
export type Bordes = typeof bordes;
export type Sombras = typeof sombras;

export default tema;
