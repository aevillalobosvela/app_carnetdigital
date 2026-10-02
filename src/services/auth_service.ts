import * as SecureStore from 'expo-secure-store';
import { api, apiFetch } from './api';
import { registrarNotificacionesPushAsync } from './notificaciones';

// Función para generar un UUID v4 simple sin dependencias externas
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface CredentialSession {
  token: string;
  carnetId: number;
  carrera: string;
  facultad: string;
  periodoAcademico: string;
}

export class AuthService {
  /**
   * Obtiene o genera un identificador único persistente para este dispositivo móvil
   */
  async getDeviceToken(): Promise<string> {
    let deviceToken = await SecureStore.getItemAsync('device_token');
    if (!deviceToken) {
      deviceToken = generateUUID();
      await SecureStore.setItemAsync('device_token', deviceToken);
    }
    return deviceToken;
  }

  /**
   * Activa el carnet del estudiante vinculando el dispositivo móvil (Primera carrera)
   */
  async activar(authCode: string, codeVerifier: string) {
    const deviceToken = await this.getDeviceToken();

    const response = await api.post('app/activar', {
      authCode,
      codeVerifier,
      deviceToken,
    });

    // Guardar sesión activa del estudiante
    if (response.token) {
      await SecureStore.setItemAsync('student_token', response.token);
    }
    if (response.carnetId !== undefined) {
      await SecureStore.setItemAsync('carnet_id', String(response.carnetId));
    }

    // Obtener detalles de la carrera para guardarla en la lista de credenciales
    try {
      const details = await apiFetch('app/carnet');
      const session: CredentialSession = {
        token: response.token,
        carnetId: response.carnetId,
        carrera: details.carrera || 'Carrera Desconocida',
        facultad: details.facultad || 'Facultad Desconocida',
        periodoAcademico: details.periodoAcademico || 'N/A',
      };
      await SecureStore.setItemAsync('active_credentials', JSON.stringify([session]));
      
      // Vincular el Token Push al CI del estudiante recién logueado
      if (details.dip) {
        await registrarNotificacionesPushAsync(details.dip);
      }
    } catch (e) {
      console.warn('Error fetching carnet details for local session list:', e);
    }

    return response;
  }

  /**
   * Activa una carrera paralela vinculando el dispositivo móvil
   */
  async activarParalela(qrToken: string) {
    const deviceToken = await this.getDeviceToken();

    // Call special endpoint for parallel career
    const response = await api.post('app/activar-paralela', {
      qrToken,
      deviceToken,
    }, {
      skipLogoutOnError: true
    } as any);

    if (!response.token || response.carnetId === undefined) {
      throw new Error('Respuesta inválida del servidor al activar carrera paralela.');
    }

    // Obtener detalles específicos de esta nueva carrera con su token correspondiente
    try {
      const details = await apiFetch('app/carnet', {
        headers: {
          Authorization: `Bearer ${response.token}`,
        },
        skipLogoutOnError: true
      });

      const session: CredentialSession = {
        token: response.token,
        carnetId: response.carnetId,
        carrera: details.carrera || 'Carrera Desconocida',
        facultad: details.facultad || 'Facultad Desconocida',
        periodoAcademico: details.periodoAcademico || 'N/A',
      };

      const credentials = await this.getCredentials();
      const existsIndex = credentials.findIndex(c => c.carnetId === session.carnetId);
      if (existsIndex > -1) {
        credentials[existsIndex] = session;
      } else {
        credentials.push(session);
      }

      await SecureStore.setItemAsync('active_credentials', JSON.stringify(credentials));
      // Cambiar de inmediato a la nueva carrera activada
      await this.switchCredential(session.carnetId);

      // Vincular el Token Push al CI del estudiante
      if (details.dip) {
        await registrarNotificacionesPushAsync(details.dip);
      }
    } catch (e) {
      console.error('Error finalizando la activación paralela:', e);
      throw e;
    }

    return response;
  }

  /**
   * Cierra sesión por completo en todas las carreras y limpia todo
   */
  async logout() {
    const isDemo = await SecureStore.getItemAsync('is_demo_mode');
    try {
      if (isDemo !== 'true') {
        // Intentar avisar al backend de la desautorización de la sesión activa
        await api.post('app/logout');
      }
    } catch (e) {
      console.warn('Backend logout failed or was already revoked:', e);
    } finally {
      // Limpiar toda la sesión y credenciales guardadas localmente
      await SecureStore.deleteItemAsync('student_token');
      await SecureStore.deleteItemAsync('carnet_id');
      await SecureStore.deleteItemAsync('active_credentials');
      await SecureStore.deleteItemAsync('is_demo_mode');
      
      // Anonimizar el token Push (desvincular CI)
      await registrarNotificacionesPushAsync();
    }
  }

  /**
   * Cierra sesión y desvincula únicamente la carrera activa actual
   * Retorna true si era la última sesión (limpieza total), false si aún quedan otras carreras activas
   */
  async logoutCurrent(): Promise<boolean> {
    const isDemo = await SecureStore.getItemAsync('is_demo_mode');
    try {
      if (isDemo !== 'true') {
        await api.post('app/logout');
      }
    } catch (e) {
      console.warn('Backend logout failed for current career:', e);
    }

    if (isDemo === 'true') {
      await SecureStore.deleteItemAsync('student_token');
      await SecureStore.deleteItemAsync('carnet_id');
      await SecureStore.deleteItemAsync('active_credentials');
      await SecureStore.deleteItemAsync('is_demo_mode');
      return true; // Se deslogueó por completo
    }

    const credentials = await this.getCredentials();
    const currentCarnetId = await this.getCarnetId();
    
    const remaining = credentials.filter(c => c.carnetId !== currentCarnetId);

    if (remaining.length > 0) {
      await SecureStore.setItemAsync('active_credentials', JSON.stringify(remaining));
      // Cambiar al primero de la lista restante
      await this.switchCredential(remaining[0].carnetId);
      return false; // No se deslogueó por completo
    } else {
      await SecureStore.deleteItemAsync('student_token');
      await SecureStore.deleteItemAsync('carnet_id');
      await SecureStore.deleteItemAsync('active_credentials');
      await SecureStore.deleteItemAsync('is_demo_mode');
      
      // Anonimizar el token Push (desvincular CI)
      await registrarNotificacionesPushAsync();
      
      return true; // Se deslogueó por completo
    }
  }

  /**
   * Comprueba de manera asíncrona si hay una sesión activa de estudiante
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await SecureStore.getItemAsync('student_token');
    return token !== null && token !== '';
  }

  /**
   * Obtiene el ID del carnet activo
   */
  async getCarnetId(): Promise<number | null> {
    const carnetIdStr = await SecureStore.getItemAsync('carnet_id');
    if (!carnetIdStr) return null;
    const carnetId = parseInt(carnetIdStr, 10);
    return isNaN(carnetId) ? null : carnetId;
  }

  /**
   * Cambia el token y ID de carnet activos en el SecureStore
   */
  async switchCredential(carnetId: number): Promise<void> {
    const credentials = await this.getCredentials();
    const found = credentials.find(c => c.carnetId === carnetId);
    if (found) {
      await SecureStore.setItemAsync('student_token', found.token);
      await SecureStore.setItemAsync('carnet_id', String(found.carnetId));
    }
  }

  /**
   * Obtiene la lista de credenciales/carreras vinculadas en este dispositivo
   */
  async getCredentials(): Promise<CredentialSession[]> {
    const storedList = await SecureStore.getItemAsync('active_credentials');
    if (storedList) {
      try {
        return JSON.parse(storedList);
      } catch {
        // Fallback a reconstrucción si falla el parse
      }
    }

    // Reconstrucción / Migración retrocompatible (Legacy support)
    const token = await SecureStore.getItemAsync('student_token');
    const carnetIdStr = await SecureStore.getItemAsync('carnet_id');
    if (token && carnetIdStr) {
      try {
        const details = await apiFetch('app/carnet');
        const session: CredentialSession = {
          token,
          carnetId: parseInt(carnetIdStr, 10),
          carrera: details.carrera || 'Carrera Desconocida',
          facultad: details.facultad || 'Facultad Desconocida',
          periodoAcademico: details.periodoAcademico || 'N/A',
        };
        await SecureStore.setItemAsync('active_credentials', JSON.stringify([session]));
        return [session];
      } catch {
        return [];
      }
    }

    return [];
  }
}

export const authService = new AuthService();
