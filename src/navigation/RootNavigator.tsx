/**
 * Navegador raíz de la App_Movil.
 * Stack Navigator principal que contiene el flujo completo:
 * PantallaActivacion → PantallaCargando → TabNavigator
 *
 * En Fase 2: la initialRouteName se determinará dinámicamente
 * según el EstadoActivacion leído del Almacenamiento_Local (SQLite).
 * Requisito 8.2
 */

import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { colores } from '../theme';
import { RootStackParamList } from './types';
import { useAuth } from '../context/AuthContext';

import { PantallaActivacion } from '../screens/PantallaActivacion';
import { PantallaCargando } from '../screens/PantallaCargando';
import { TabNavigator } from './TabNavigator';

// Re-exportar para compatibilidad con pantallas que ya importan desde aquí
export type { RootStackParamList };

const Stack = createStackNavigator<RootStackParamList>();

// ─── Componente ───────────────────────────────────────────────────────────────

export function RootNavigator(): React.JSX.Element {
  const { isAuthenticated, cargandoSession } = useAuth();

  if (cargandoSession) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colores.grisClaro }}>
        <ActivityIndicator size="large" color={colores.primario} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: colores.grisClaro },
        }}
      >
        {isAuthenticated ? (
          /* Área principal — accesible solo con dispositivo activado */
          <Stack.Screen name="TabPrincipal" component={TabNavigator} />
        ) : (
          <>
            {/* Pantalla de activación — visible hasta que el dispositivo sea activado */}
            <Stack.Screen name="PantallaActivacion" component={PantallaActivacion} />

            {/* Procesamiento de la activación QR */}
            <Stack.Screen name="PantallaCargando" component={PantallaCargando} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
