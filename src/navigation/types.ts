/**
 * Tipos centralizados de navegación para la App_Movil.
 * Importar desde aquí en lugar de definir tipos localmente en cada pantalla.
 */

import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';

// ─── Parámetros del Stack Navigator raíz ─────────────────────────────────────

export type RootStackParamList = {
  /** Primera pantalla — visible mientras el dispositivo no esté activado */
  PantallaActivacion: undefined;
  /** Procesamiento de la activación OAuth — recibe el authCode */
  PantallaCargando: { authCode: string; codeVerifier: string };
  /** Navegador de pestañas — accesible solo con dispositivo activado */
  TabPrincipal: undefined;
};

// ─── Parámetros del Tab Navigator ────────────────────────────────────────────

export type TabParamList = {
  PantallaCarnet: undefined;
  PantallaAyuda: undefined;
  PantallaAjustes: undefined;
};

// ─── Tipos de navegación por pantalla ────────────────────────────────────────

/** Prop de navegación para PantallaActivacion (reemplaza NavegacionLogin) */
export type NavegacionActivacion = StackNavigationProp<RootStackParamList, 'PantallaActivacion'>;

/** Prop de navegación para PantallaCargando */
export type NavegacionCargando = StackNavigationProp<RootStackParamList, 'PantallaCargando'>;

/** Prop de ruta para PantallaCargando */
export type RoutePropCargando = RouteProp<RootStackParamList, 'PantallaCargando'>;

/** Prop de navegación para las pestañas */
export type NavegacionTab = BottomTabNavigationProp<TabParamList>;
