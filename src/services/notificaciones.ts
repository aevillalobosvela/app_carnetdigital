import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './api';
import { colores } from '../theme';

// Configurar comportamiento de la notificación en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Solicita permisos nativos, obtiene el push token de Expo y lo registra en el backend.
 */
export async function registrarNotificacionesPushAsync(userCi?: string): Promise<string | null> {
  let token: string | null = null;

  // Canal de notificaciones por defecto para Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: colores.primario,
    });
  }

  // Las notificaciones push requieren un dispositivo físico
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Push Carnet] Permiso de notificaciones no otorgado.');
      return null;
    }

    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const tokenData = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );
      token = tokenData.data;
      console.log('[Push Carnet] Expo Push Token obtenido:', token);

      await SecureStore.setItemAsync('push_token', token);

      // Enviar token al backend centralizado
      await api.post('notifications/register-token', {
        appId: 'carnet-digital',
        token,
        perfil: 'estudiante',
        roles: ['estudiantes'],
        userCi: userCi || null,
        deviceOs: Platform.OS,
      });
      console.log('[Push Carnet] Token registrado en el servidor backend.');
    } catch (error) {
      console.log('[Push Carnet] Error registrando push token:', error);
    }
  } else {
    console.log('[Push Carnet] Dispositivo virtual/emulador: no requiere registro de push token real.');
  }

  return token;
}
