# Arquitectura de la App Móvil — Carnet Digital UTO

Este documento describe la arquitectura, estructura de directorios, routing, componentes y sistema de diseño de la aplicación móvil de Carnet Digital de la UTO.

---

## 1. Visión General e Integración

La aplicación móvil está dirigida a los estudiantes de la **Universidad Técnica de Oruro (UTO)**. Permite desplegar de forma digital su credencial universitaria y presentar los factores dinámicos necesarios para la verificación de identidad.

### 1.1. Arquitectura Online-First
La aplicación móvil funciona bajo una lógica estrictamente **online-first**:
*   Los datos del carnet no se almacenan localmente en bases de datos SQLite u offline cache.
*   En cada inicio de sesión o apertura de pantalla se realiza una petición al backend para consultar el estado del carnet en vivo y obtener la información académica actualizada.
*   Si el dispositivo no cuenta con conexión a internet al abrir la aplicación, se muestra una pantalla de error de conectividad bloqueando el acceso al carnet.
*   No existe exportación a PDF ni mecanismos de almacenamiento offline.

### 1.2. Gestión de Sesión
La sesión del estudiante se gestiona mediante tokens de acceso opacos (OAT) provistos por el backend con una vigencia de 2 años. Para garantizar la seguridad, el token se almacena de forma segura en el almacenamiento persistente del dispositivo utilizando `expo-secure-store`.

---

## 2. Stack Tecnológico

| Tecnología | Uso |
|---|---|
| React Native (0.81.x) | Framework base de renderizado nativo. |
| Expo (v54.x) | Toolchain de desarrollo, empaquetado y APIs nativas. |
| TypeScript | Tipado y robustez del código. |
| React Navigation (v6.x) | Stack y Tab navigators para el control de flujos de pantalla. |
| `expo-secure-store` | Almacenamiento seguro del token OAT y ID del carnet. |
| `@expo/vector-icons` (Ionicons) | Paquete de iconos vectoriales oficial. |

---

## 3. Estructura de Directorios

```
mobile/
├── App.tsx                        # Punto de entrada y cargador de Providers
├── app.json                       # Configuración general de Expo (identificadores, logos)
├── package.json                   # Dependencias y scripts npm
├── tsconfig.json                  # Configuración TypeScript
└── src/
    ├── assets/                    # Assets estáticos (iconos, splash, logotipos)
    │   ├── logo_uto.png           # Logotipo institucional
    │   └── logo_dtic.webp         # Isotipo DTIC
    ├── components/
    │   └── CarnetCard.tsx         # Renderiza la tarjeta del carnet (datos académicos)
    ├── navigation/
    │   ├── RootNavigator.tsx      # Stack Navigator para flujos globales (Auth/Main)
    │   ├── TabNavigator.tsx       # Bottom Tab Navigator para pestañas internas
    │   └── types.ts               # Tipado de rutas y parámetros
    ├── screens/
    │   ├── PantallaActivacion.tsx # Escaneo de QR de activación y bienvenida
    │   ├── PantallaCargando.tsx   # Pantalla intermedia de validación de tokens
    │   ├── PantallaCarnet.tsx     # Tarjeta de carnet, QR dinámico e input de 5 dígitos
    │   ├── PantallaAyuda.tsx      # FAQ, enlaces externos y contacto
    │   ├── PantallaAjustes.tsx    # Perfil y opción para desactivar dispositivo
    │   ├── PantallaBloqueo.tsx    # Pantalla informativa de error de conexión
    │   └── PantallaEstadoCarnet.tsx # Muestra avisos si el carnet está 'inactivo' o 'expirado'
    └── theme/
        └── index.ts               # Paleta de colores, tipografías y sombras
```

---

## 4. Routing y Flujo de Navegación

### 4.1. Stack Navigator (Raíz)
Controla el flujo según el estado de la sesión y conectividad:

*   `PantallaCargando`: Pantalla inicial que comprueba la existencia de un token local en `SecureStore` y verifica su validez contra el backend.
*   `PantallaActivacion`: Se muestra si el dispositivo no está registrado. Permite abrir la cámara para escanear el QR único de activación.
*   `PantallaEstadoCarnet`: Pantalla informativa que se muestra si el backend retorna `403` indicando que el carnet está `inactivo` o `expirado`.
*   `PantallaBloqueo`: Se muestra si no hay conexión a internet disponible.
*   `TabPrincipal`: Navegador de pestañas para estudiantes con carnet `activo`.

### 4.2. Tab Navigator (Pantallas de Estudiante Activo)
Una vez validada la sesión y que el carnet está `activo`:

1.  **`PantallaCarnet` (Mi Carnet):** Muestra el componente `CarnetCard` y los factores dinámicos rediseñados para una mejor experiencia de usuario:
    *   **QR de Verificación:** Código QR generado dinámicamente que se solicita y regenera automáticamente cada 9 minutos.
    *   **Panel de Verificación Manual:** Agrupa el **Número de carnet** y el **Código de acceso** (código alfanumérico temporal de 5 dígitos) en un solo panel gris neutro (`#F8F9F9`) con diseño de dos columnas (side-by-side) y divisor vertical. Este panel es puramente informativo (solo lectura) y evita la confusión de que sea un input.
    *   **Botón de Actualización Manual:** Permite refrescar los códigos temporalmente e incluye una animación de carga (`ActivityIndicator`) directamente dentro del botón cuando está actualizando.
    *   **Botón Flotante y Modal de Ayuda (FAB):** Un botón flotante de acción discreto con el ícono `?` que despliega un `Modal` animado con la **Guía de Uso Rápido** detallando el propósito de cada elemento de la aplicación.
2.  **`PantallaAyuda` (Contactos):** Pestaña renombrada de `'Ayuda'` a `'Contactos'` (utilizando el ícono `call-outline`). Proporciona accesos rápidos a trámites, compra de aranceles universitarios, grupo oficial de Telegram y datos de contacto de la DTIC.
3.  **`PantallaAjustes` (Ajustes):** Muestra iniciales del perfil, información del carnet y el botón de desactivar el dispositivo (que borra los tokens locales de `SecureStore` y redirige a la pantalla de bienvenida/activación).

### 4.3. Diseño Sin Cabecera (Headerless)
Para ofrecer una apariencia más limpia, fluida e integrada con la barra de navegación del sistema, se ha **removido por completo la barra azul superior (header)** que mostraba el título de la pantalla. Las pantallas principales se apoyan en `SafeAreaView` para respetar las zonas seguras (notches/cámaras frontales) sin requerir el header institucional.

---

## 5. Sistema de Diseño (Theme)

Estilos definidos centralizadamente en `src/theme/index.ts`:

*   **Color Primario:** Azul UTO `#003087` (Usado en Headers, fondos principales y Tabs).
*   **Color de Acento:** Rojo `#C0392B` (Usado para advertencias, errores y botón de desactivar).
*   **Gris Claro:** `#F5F5F5` (Fondo general de la aplicación).
*   **Bordes:** Radio `--border-radius-md` (`8px`) para botones y tarjetas.
*   **Sombras:** Elevaciones sutiles para tarjetas (`elevation: 4`).
