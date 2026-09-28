/**
 * Navegador de pestañas principal (autenticado).
 * Contiene las pestañas: PantallaCarnet, PantallaAyuda y PantallaAjustes.
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colores, tipografia, espaciado } from '../theme';
import { TabParamList } from './types';

import { PantallaCarnet } from '../screens/PantallaCarnet';
import { PantallaAyuda } from '../screens/PantallaAyuda';
import { PantallaAjustes } from '../screens/PantallaAjustes';

// Re-exportar para compatibilidad con pantallas que ya importan desde aquí
export type { TabParamList };

const Tab = createBottomTabNavigator<TabParamList>();

// ─── Componente ───────────────────────────────────────────────────────────────

export function TabNavigator(): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          estilos.tabBar,
          {
            height: 60 + insets.bottom,
            paddingBottom: espaciado.sm + insets.bottom,
          }
        ],
        tabBarActiveTintColor: colores.blanco,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
        tabBarLabelStyle: estilos.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="PantallaCarnet"
        component={PantallaCarnet}
        options={{
          tabBarLabel: 'Mi Carnet',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="id-card-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="PantallaAyuda"
        component={PantallaAyuda}
        options={{
          tabBarLabel: 'Contactos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="call-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="PantallaAjustes"
        component={PantallaAjustes}
        options={{
          tabBarLabel: 'Ajustes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  tabBar: {
    backgroundColor: colores.primario,
    borderTopWidth: 0,
    height: 60,
    paddingBottom: espaciado.sm,
    paddingTop: espaciado.xs,
  },
  tabBarLabel: {
    fontSize: tipografia.tamanios.xs,
    fontWeight: tipografia.pesos.semibold,
  },
});
