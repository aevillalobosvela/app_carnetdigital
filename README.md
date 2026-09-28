# UTO — Aplicación Móvil (Estudiante)

Esta es la aplicación móvil para los estudiantes del sistema de **Carnet Digital de la Universidad Técnica de Oruro (UTO)**. Está desarrollada utilizando **React Native** con el framework **Expo**, TypeScript y componentes de navegación segura. Permite al estudiante visualizar su credencial virtual en vivo, generar códigos QR dinámicos y códigos alfanuméricos temporales para verificación.

---

## 🚀 Entorno de Desarrollo (Dev Setup)

### 📋 Requisitos Previos
Asegúrate de tener instalado:
- **Node.js** >= 18.x
- **NPM** >= 9.x
- **Expo Go** instalado en tu dispositivo móvil físico (disponible en Google Play Store o Apple App Store).
- *(Opcional)* Android Studio instalado y configurado con un emulador virtual (AVD) o Xcode configurado para simulador de iOS.

### 🛠️ Configuración e Instalación

1. **Instalar Dependencias:**
   Navega al directorio `mobile/` y ejecuta:
   ```bash
   npm install
   ```

2. **Resolución Automática del API (Conexión al Backend):**
   La aplicación móvil necesita comunicarse con el servidor backend. 
   - El código en [api.ts](file:///home/vivealed/proy/carnetdigitalsg/mobile/src/services/api.ts) intenta detectar de forma automática la dirección IP de tu máquina de desarrollo leyendo la URL de compilación de Metro.
   - **Requisito de red:** Para que tu dispositivo móvil físico pueda comunicarse con el backend de desarrollo, ambos deben estar conectados a la **misma red Wi-Fi (LAN)**.
   - Si la detección automática falla, la app utilizará los fallbacks configurados en `api.ts`. Asegúrate de que el firewall de tu sistema de desarrollo tenga abiertos los puertos del Metro Bundler (`8081`) y de tu backend (`3333`).

3. **Iniciar el Servidor Metro:**
   Lanza el bundle compiler de Expo:
   ```bash
   npx expo start
   ```

4. **Ejecutar en un Dispositivo o Emulador:**
   - **Dispositivo Físico:** Escanea el código QR que se muestra en tu terminal usando la cámara de tu celular (en iOS) o desde la aplicación Expo Go (en Android).
   - **Emulador Android:** Presiona `a` en la terminal (requiere tener el emulador de Android Studio abierto).
   - **Simulador iOS:** Presiona `i` en la terminal (requiere macOS con Xcode configurado).

---

## 📦 Compilación y Generación de Binarios para Producción (EAS Build)

Para publicar la aplicación en Google Play Store / Apple App Store o generar instaladores independientes (`.apk` / `.ipa`), se utiliza **EAS (Expo Application Services)**.

### 1. Configurar la URL del Backend de Producción
Antes de compilar, abre el archivo [api.ts](file:///home/vivealed/proy/carnetdigitalsg/mobile/src/services/api.ts) y ajusta la dirección base de producción en el método `getBaseUrl()` para que apunte a tu backend de producción (por ejemplo: `https://tu-api.uto.edu.bo/api/v1`).

### 2. Instalar EAS CLI de Forma Global
```bash
npm install -g eas-cli
```

### 3. Iniciar Sesión en Expo
Debes tener una cuenta en [expo.dev](https://expo.dev) e iniciar sesión desde la terminal:
```bash
eas login
```

### 4. Configurar EAS en el Proyecto
Si es la primera vez que vas a compilar, genera el archivo `eas.json` de configuración:
```bash
eas build:configure
```

### 5. Compilar Binarios
Ejecuta la compilación en la nube para la plataforma seleccionada:

- **Compilar para Android (APK para pruebas o AAB para Play Store):**
  ```bash
  eas build --platform android
  ```
  *(Puedes seguir el progreso en tu consola y descargar el `.apk` / `.aab` resultante directamente desde tu cuenta de Expo)*.

- **Compilar para iOS (IPA):**
  ```bash
  eas build --platform ios
  ```

- **Compilar Android Localmente (si dispones de Android SDK instalado localmente):**
  ```bash
  eas build --platform android --local
  ```
