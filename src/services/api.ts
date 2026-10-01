import { Platform, NativeModules } from 'react-native';
import * as SecureStore from 'expo-secure-store';

let resolvedBaseUrl: string | null = null;

const getBaseUrl = () => {
  if (resolvedBaseUrl) {
    return resolvedBaseUrl;
  }

  // 1. Usar variable de entorno si está configurada (ideal para producción y compilaciones)
  if (process.env.EXPO_PUBLIC_API_URL) {
    resolvedBaseUrl = process.env.EXPO_PUBLIC_API_URL;
    console.log('[API] Conectado a URL de variable de entorno:', resolvedBaseUrl);
    return resolvedBaseUrl;
  }

  // 2. Intentar obtener la IP de la máquina de desarrollo desde el bundle de Expo (modo LAN)
  const scriptURL = NativeModules.SourceCode?.scriptURL;
  if (scriptURL) {
    const parts = scriptURL.split('://');
    if (parts[1]) {
      const hostPort = parts[1].split('/')[0];
      const host = hostPort.split(':')[0];
      if (
        host &&
        host !== 'localhost' &&
        host !== '127.0.0.1' &&
        !host.includes('expo.direct') &&
        !host.includes('ngrok')
      ) {
        resolvedBaseUrl = `http://${host}:3333/api/v1`;
        console.log('[API] Conectado dinámicamente a:', resolvedBaseUrl);
        return resolvedBaseUrl;
      }
    }
  }

  // Fallbacks de desarrollo
  resolvedBaseUrl = Platform.select({
    android: 'http://10.0.2.2:3333/api/v1',  // IP especial para emulador Android de vuelta a localhost
    ios: 'http://localhost:3333/api/v1',
    default: 'http://localhost:3333/api/v1',
  }) || 'http://localhost:3333/api/v1';

  console.log('[API] Conectado por fallback a:', resolvedBaseUrl);
  return resolvedBaseUrl;
};

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(status: number, message: string, data: any = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Callback global para forzar logout en caso de error 401/403
let onUnauthorizedCallback: (() => void) | null = null;

export function registerOnUnauthorized(callback: () => void) {
  onUnauthorizedCallback = callback;
}

export async function apiFetch(path: string, options: RequestInit & { skipLogoutOnError?: boolean } = {}) {
  const token = await SecureStore.getItemAsync('student_token');
  const headers = new Headers(options.headers || {});

  // Adjuntar token si existe y no es la ruta de activación pública (salvo que ya esté definido)
  if (token && path !== 'app/activar' && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Establecer content-type por defecto
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/${path.replace(/^\//, '')}`;

  // Configurar timeout de 15 segundos (como lo requiere Producción)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // 401 (Sesión inválida)
    if (response.status === 401) {
      if (!options.skipLogoutOnError) {
        await SecureStore.deleteItemAsync('student_token');
        await SecureStore.deleteItemAsync('carnet_id');
        
        if (onUnauthorizedCallback) {
          onUnauthorizedCallback();
        }
      }
      
      throw new ApiError(response.status, 'Sesión expirada');
    }

    const text = await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const errorMsg = data?.error || data?.message || 'Error de comunicación con el servidor';
      throw new ApiError(response.status, errorMsg, data);
    }

    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new ApiError(408, 'El servidor tardó demasiado en responder (Tiempo de espera agotado, máx 15s).');
    }
    
    // Detectar fallos de conexión (offline, dns, etc)
    if (error.message && error.message.includes('Network request failed')) {
      throw new ApiError(0, 'No tienes conexión a internet o el servidor está inaccesible. La conexión es obligatoria para poder usar el carnet.');
    }

    throw error;
  }
}

export const api = {
  get: (path: string, options?: RequestInit) => apiFetch(path, { ...options, method: 'GET' }),
  post: (path: string, body?: any, options?: RequestInit) =>
    apiFetch(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
};
