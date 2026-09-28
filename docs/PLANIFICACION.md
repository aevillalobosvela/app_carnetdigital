# Planificación de la App Móvil — Carnet Digital UTO

Este documento define las fases y subtareas específicas para conectar la aplicación móvil en React Native (Expo) con el backend, adoptando la lógica online-first y el uso de factores de verificación temporales.

---

## Fases de Implementación

### Fase 1: Configuración de Autenticación Segura y Clientes
Establecer las conexiones base y la seguridad local del token.

*   [ ] **Tarea M1.1 — Cliente HTTP y Almacenamiento Seguro:**
    *   Instalar e integrar `react-native-keychain` para persistir el token opaco (OAT).
    *   Configurar cliente HTTP (usando fetch o axios) para adjuntar de manera automática el header `Authorization: Bearer <token>`.
    *   Configurar interceptor para redirigir a la pantalla de activación en caso de error `401`.
*   [ ] **Tarea M1.2 — Flujo de Inicialización (`PantallaCargando.tsx`):**
    *   Al abrir la app, verificar en `Keychain` si existe un token de sesión.
    *   Si no existe, redirigir a `PantallaActivacion`.
    *   Si existe, hacer un request rápido de validación al backend. Si es exitoso, redirigir a `TabPrincipal`; si falla por estado `expirado`/`inactivo` (error `403`), redirigir a `PantallaEstadoCarnet`; si no hay red, redirigir a `PantallaBloqueo`.

---

### Fase 2: Registro del Dispositivo (Activación)
Implementar la interfaz para el escaneo de códigos de activación.

*   [ ] **Tarea M2.1 — Lector de Códigos QR (`PantallaActivacion.tsx`):**
    *   Integrar lector de QR utilizando `expo-camera`.
    *   Al escanear el QR provisto por la DTIC, enviar el token al endpoint `POST /api/v1/app/activar`.
    *   Si la activación es válida, guardar el token OAT retornado en `Keychain` y redirigir a `TabPrincipal`.

---

### Fase 3: Visualización del Carnet en Vivo y Factores Dinámicos
Desarrollar la interfaz en tiempo real de la credencial y la renovación periódica de los factores de validación.

*   [ ] **Tarea M3.1 — Renderizado de Datos del Carnet (`PantallaCarnet.tsx`):**
    *   Consumir `GET /api/v1/app/carnet` al montar la pantalla para cargar la información académica del estudiante (con la foto como string vacío `""` y la facultad mapeada por el backend).
    *   Mostrar alerta destacada sobre la validez del carnet.
*   [ ] **Tarea M3.2 — Ciclo de Vida del QR Horario:**
    *   Consumir `GET /api/v1/app/carnet/qr` para renderizar el QR de verificación en base64.
    *   Establecer un temporizador en segundo plano (timer) para solicitar un nuevo QR de verificación automáticamente cada 55 minutos (margen de seguridad).
*   [ ] **Tarea M3.3 — Ciclo de Vida del Código de 5 Dígitos:**
    *   Consumir `GET /api/v1/app/carnet/codigo` para obtener el código alfanumérico.
    *   Implementar un temporizador visual de cuenta regresiva (de 10 a 0 minutos).
    *   Solicitar y actualizar el código automáticamente en el servidor y pantalla cada 9 minutos.
*   [ ] **Tarea M3.4 — Manejo de Desconexión de Red:**
    *   Si un ciclo de regeneración falla por conectividad, suspender el temporizador y forzar la pantalla a mostrar el error de red (`PantallaBloqueo`), bloqueando la visibilidad del carnet.

---

### Fase 4: Ajustes y Desactivación
Permitir al usuario cerrar sesión y desvincular el dispositivo.

*   [ ] **Tarea M4.1 — Datos del Perfil (`PantallaAjustes.tsx`):**
    *   Consumir los datos académicos cargados de la sesión para mostrar el perfil completo del estudiante.
*   [ ] **Tarea M4.2 — Desactivar Dispositivo:**
    *   Conectar el botón "Desactivar" para consumir el endpoint `POST /api/v1/app/logout` en el backend.
    *   Limpiar el token OAT de `Keychain` y redirigir a `PantallaActivacion`.
