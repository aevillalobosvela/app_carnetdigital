import { api, registerOnUnauthorized, ApiError } from './api';
import * as SecureStore from 'expo-secure-store';

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

describe('ApiService (api.ts)', () => {
  beforeEach(() => {
    for (const key in mockStore) {
      delete mockStore[key];
    }
    jest.clearAllMocks();
  });

  it('debe propagar respuestas exitosas de GET', async () => {
    const fakeData = { foo: 'bar' };
    global.fetch = jest.fn().mockImplementation(async () => {
      return {
        status: 200,
        ok: true,
        text: async () => JSON.stringify(fakeData),
      };
    });

    const res = await api.get('test-path');
    expect(res).toEqual(fakeData);
  });

  it('debe limpiar sesion y llamar callback en error 401', async () => {
    mockStore['student_token'] = 'token-activo';
    mockStore['carnet_id'] = '12';

    const onUnauthorized = jest.fn();
    registerOnUnauthorized(onUnauthorized);

    global.fetch = jest.fn().mockImplementation(async () => {
      return {
        status: 401,
        ok: false,
        text: async () => JSON.stringify({ error: 'Token invalido' }),
      };
    });

    await expect(api.get('test-path')).rejects.toThrow(ApiError);
    
    expect(onUnauthorized).toHaveBeenCalled();
    expect(mockStore['student_token']).toBeUndefined();
    expect(mockStore['carnet_id']).toBeUndefined();
  });

  it('debe lanzar ApiError pero NO desloguear en error 403', async () => {
    mockStore['student_token'] = 'token-activo';
    mockStore['carnet_id'] = '12';

    const onUnauthorized = jest.fn();
    registerOnUnauthorized(onUnauthorized);

    const errorMessage = 'Tu carnet digital ha expirado y requiere ser reactivado en la DTIC';
    global.fetch = jest.fn().mockImplementation(async () => {
      return {
        status: 403,
        ok: false,
        text: async () => JSON.stringify({ error: errorMessage }),
      };
    });

    let errorThrown: ApiError | null = null;
    try {
      await api.get('test-path');
    } catch (e: any) {
      errorThrown = e;
    }

    expect(errorThrown).toBeInstanceOf(ApiError);
    expect(errorThrown?.status).toBe(403);
    expect(errorThrown?.message).toBe(errorMessage);

    // No debe haber limpiado sesión ni llamado al callback
    expect(onUnauthorized).not.toHaveBeenCalled();
    expect(mockStore['student_token']).toBe('token-activo');
    expect(mockStore['carnet_id']).toBe('12');
  });
});
