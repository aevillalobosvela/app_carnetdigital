import * as SecureStore from 'expo-secure-store';
import { api } from './api';

export interface CarnetInfo {
  nombreCompleto: string;
  dip: string;
  codigo: string; // Registro Universitario
  carrera: string;
  facultad: string;
  digital: string;
  estado: 'inactivo' | 'pendiente' | 'activo' | 'expirado';
  activadoEn: string | null;
  expiraEn: string | null;
  carnetId: number;
  correo: string | null;
  fecNacimiento: string | null;
  direccion: string | null;
  periodoAcademico: string | null;
  tipoEstudiante: string;
}

export class CarnetService {
  /**
   * Obtiene la información del carnet en vivo del estudiante autenticado
   */
  async obtenerCarnet(): Promise<CarnetInfo> {
    const isDemo = await SecureStore.getItemAsync('is_demo_mode');
    if (isDemo === 'true') {
      return {
        nombreCompleto: 'JUAN PÉREZ VALDEZ',
        dip: '1234567 OR',
        codigo: '2022093842',
        carrera: 'Ingeniería de Sistemas',
        facultad: 'Facultad Nacional de Ingeniería',
        digital: 'true',
        estado: 'activo',
        activadoEn: '2026-07-17T09:00:00Z',
        expiraEn: '2028-07-17T09:00:00Z',
        carnetId: 999999,
        correo: 'juan.perez@uto.edu.bo',
        fecNacimiento: '2001-05-15',
        direccion: 'Av. Cívica #123, Oruro',
        periodoAcademico: '2/2026',
        tipoEstudiante: 'REGULAR',
      };
    }
    return api.get('app/carnet');
  }

  /**
   * Obtiene la imagen QR de verificación en base64 (vigente por 1 hora)
   */
  async obtenerQr(): Promise<string> {
    const isDemo = await SecureStore.getItemAsync('is_demo_mode');
    if (isDemo === 'true') {
      return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    }
    const res = await api.get('app/carnet/qr');
    return res.qr;
  }

  /**
   * Obtiene el código alfanumérico de 5 dígitos para verificación manual (vigente por 10 min)
   */
  async obtenerCodigo(): Promise<string> {
    const isDemo = await SecureStore.getItemAsync('is_demo_mode');
    if (isDemo === 'true') {
      return 'DEMO5';
    }
    const res = await api.get('app/carnet/codigo');
    return res.codigo;
  }
}

export const carnetService = new CarnetService();
