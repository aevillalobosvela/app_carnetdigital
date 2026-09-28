import { carnetService } from './carnet_service';

// Mock de SecureStore
jest.mock('expo-secure-store', () => {
  return {
    getItemAsync: jest.fn(async () => 'fake-student-token'),
    setItemAsync: jest.fn(async () => {}),
    deleteItemAsync: jest.fn(async () => {}),
  };
});

describe('CarnetService (Mobile)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe recuperar los datos del carnet en vivo', async () => {
    const fakeInfo = {
      nombreCompleto: 'JUAN CARLOS PEREZ LOPEZ',
      dip: '1234567',
      codigo: '1001',
      carrera: 'Ingeniería de Sistemas',
      facultad: 'Facultad Nacional de Ingeniería',
      digital: '',
      estado: 'activo',
      expiraEn: null,
      carnetId: 1,
    };

    global.fetch = jest.fn().mockImplementation(async () => {
      return {
        status: 200,
        ok: true,
        text: async () => JSON.stringify(fakeInfo),
      };
    });

    const res = await carnetService.obtenerCarnet();
    expect(res).toEqual(fakeInfo);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/app/carnet'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('debe recuperar la imagen QR de verificación en formato base64', async () => {
    const fakeQrResponse = { qr: 'data:image/png;base64,fake-qr-code' };

    global.fetch = jest.fn().mockImplementation(async () => {
      return {
        status: 200,
        ok: true,
        text: async () => JSON.stringify(fakeQrResponse),
      };
    });

    const qr = await carnetService.obtenerQr();
    expect(qr).toBe(fakeQrResponse.qr);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/app/carnet/qr'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('debe recuperar el código manual de 5 dígitos', async () => {
    const fakeCodeResponse = { codigo: 'ABCDE' };

    global.fetch = jest.fn().mockImplementation(async () => {
      return {
        status: 200,
        ok: true,
        text: async () => JSON.stringify(fakeCodeResponse),
      };
    });

    const codigo = await carnetService.obtenerCodigo();
    expect(codigo).toBe(fakeCodeResponse.codigo);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/app/carnet/codigo'),
      expect.objectContaining({ method: 'GET' })
    );
  });
});
