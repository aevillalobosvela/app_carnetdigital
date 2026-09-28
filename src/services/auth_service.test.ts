import { authService } from './auth_service';
import * as SecureStore from 'expo-secure-store';

// Mock de expo-secure-store en memoria
const mockStore: Record<string, string> = {};
jest.mock('expo-secure-store', () => {
  return {
    getItemAsync: jest.fn(async (key: string) => mockStore[key] || null),
    setItemAsync: jest.fn(async (key: string, val: string) => {
      mockStore[key] = val;
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      delete mockStore[key];
    }),
  };
});

describe('AuthService (Mobile)', () => {
  beforeEach(() => {
    // Limpiar almacenamiento mock y mocks de fetch
    for (const key in mockStore) {
      delete mockStore[key];
    }
    jest.clearAllMocks();
  });

  it('debe generar y persistir un deviceToken único en la primera consulta', async () => {
    const token1 = await authService.getDeviceToken();
    expect(token1).toBeDefined();
    expect(token1.length).toBeGreaterThan(20); // formato UUID

    // La segunda consulta debe retornar el mismo token persistido
    const token2 = await authService.getDeviceToken();
    expect(token2).toBe(token1);
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('device_token');
  });

  it('debe realizar la activación y almacenar el token de sesión y carnetId', async () => {
    const fakeQrToken = '1001:1780436733805:cc71935c6953cebaf5b26b859058011ec4b';
    const fakeSessionToken = 'oat_session_token_123';
    const fakeCarnetId = 42;

    // Mockear la respuesta del fetch HTTP
    global.fetch = jest.fn().mockImplementation(async () => {
      return {
        status: 200,
        ok: true,
        text: async () => JSON.stringify({
          token: fakeSessionToken,
          carnetId: fakeCarnetId,
          estado: 'activo',
        }),
      };
    });

    const result = await authService.activar(fakeQrToken);

    // Verificar respuesta
    expect(result.token).toBe(fakeSessionToken);
    expect(result.carnetId).toBe(fakeCarnetId);

    // Verificar que se guardó en SecureStore
    const savedToken = await SecureStore.getItemAsync('student_token');
    const savedCarnetId = await SecureStore.getItemAsync('carnet_id');

    expect(savedToken).toBe(fakeSessionToken);
    expect(savedCarnetId).toBe(String(fakeCarnetId));
  });

  it('debe limpiar las credenciales locales en caso de logout', async () => {
    // Pre-llenar almacenamiento mock
    mockStore['student_token'] = 'token_viejo';
    mockStore['carnet_id'] = '10';

    global.fetch = jest.fn().mockImplementation(async () => {
      return {
        status: 200,
        ok: true,
        text: async () => JSON.stringify({ message: 'OK' }),
      };
    });

    await authService.logout();

    // Las credenciales deben haber sido eliminadas
    const savedToken = await SecureStore.getItemAsync('student_token');
    const savedCarnetId = await SecureStore.getItemAsync('carnet_id');

    expect(savedToken).toBeNull();
    expect(savedCarnetId).toBeNull();
  });
});
