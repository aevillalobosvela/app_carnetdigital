# Guía: Compilación Local de Android (.AAB / .APK) con EAS Build Local

Compilar de manera local utilizando la opción `--local` de EAS CLI es una alternativa excelente para evitar las colas del plan gratuito de Expo y el límite de 30 builds mensuales. El proceso se realiza en tu propia laptop con Linux Mint, utilizando tu hardware, lo que agiliza el desarrollo y despliegue de las apps de la UTO.

---

## 1. Requisitos Previos en tu Laptop (Linux Mint)

Para poder compilar de forma nativa en tu computadora, necesitas tener configurado el entorno de desarrollo de Android.

### A. Instalar Java Development Kit (JDK 17)
React Native y Gradle (para Expo SDK 54) requieren **Java 17**. Instálalo abriendo tu terminal y ejecutando:

```bash
sudo apt update
sudo apt install openjdk-17-jdk -y
```

Verifica la instalación y versión con:
```bash
java -version
```

### B. Instalar Android SDK (a través de Android Studio)
La forma más sencilla de instalar y mantener las herramientas de compilación de Android en Linux Mint es instalar **Android Studio**:

1. Descarga e instala Android Studio para Linux.
2. Durante el asistente de inicio (Setup Wizard), selecciona la instalación estándar; esto instalará automáticamente:
   - **Android SDK** (por defecto se guarda en `~/Android/Sdk`).
   - **Android SDK Command-line Tools**.
   - **Android SDK Build-Tools**.

### C. Configurar Variables de Entorno de Android
EAS local necesita saber dónde están las herramientas de compilación. Abre tu archivo de configuración de terminal `~/.bashrc`:

```bash
nano ~/.bashrc
```

Al final del archivo, agrega las siguientes líneas (asumiendo que tu SDK está en la ruta por defecto):

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/build-tools
```

Guarda el archivo (`Ctrl + O`, `Enter`) y sal (`Ctrl + X`). Luego, recarga la configuración ejecutando:

```bash
source ~/.bashrc
```

---

## 2. Comandos de Compilación Local

Una vez tengas configurados los requisitos, ya puedes compilar de forma local.

### A. Compilar para Producción (Archivo .AAB para Play Store)
Este comando descarga de tu cuenta de Expo las credenciales seguras de firma (Keystore) guardadas en la nube, pero compila el código en tu procesador local:

```bash
EAS_BUILD_NO_EXPO_GO_WARNING=true npx eas-cli build --platform android --profile production --local
```

* **Resultado**: Al finalizar la tarea, verás el archivo binario `.aab` generado directamente en la carpeta raíz de tu proyecto local, listo para subirse a la Google Play Console.

### B. Compilar para Pruebas Internas (Archivo .APK para tu Celular)
Si quieres generar rápidamente un archivo `.apk` instalable directamente por cable en tu celular para que lo prueben en la DTIC sin pasar por Play Store:

```bash
EAS_BUILD_NO_EXPO_GO_WARNING=true npx eas-cli build --platform android --profile preview --local
```

---

## 3. Resolución de Problemas Frecuentes

* **Error: `ANDROID_HOME is not set`**: Asegúrate de haber agregado correctamente las variables en tu `~/.bashrc` y de haber corrido `source ~/.bashrc` en la terminal donde estás ejecutando la compilación.
* **Error de memoria (Gradle OutOfMemory)**: Si tu laptop se congela o Gradle da error de memoria, puedes limitar el consumo de RAM de la compilación creando un archivo `android/gradle.properties` (si tienes el proyecto ejectuado) o configurando variables del sistema, aunque normalmente con 8GB-16GB de RAM compila de forma holgada.
* **Versión de Java incorrecta**: Si tienes múltiples versiones de Java instaladas, puedes definir la versión correcta para la compilación local agregando esto a tu `~/.bashrc`:
  ```bash
  export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
  ```
