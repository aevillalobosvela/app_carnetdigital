# Guía: Transición de Entorno de Pruebas Locales a Producción (Carnet Digital)

Esta guía detalla los cambios temporales realizados en la aplicación móvil del **Carnet Digital** para posibilitar las pruebas internas sobre HTTP local, y explica cómo revertirlos o adaptarlos para el lanzamiento definitivo a producción en la Google Play Store.

---

## 1. Resumen de Cambios del Entorno de Pruebas

Para el correcto funcionamiento durante la fase de validación con el backend corriendo en tu laptop, se aplicaron dos configuraciones temporales:
1. **Permiso de Tráfico en Texto Plano (HTTP)** en el `app.json`.
2. **Inyección de la IP Local de Desarrollo** en el `eas.json` para las compilaciones.

> [!WARNING]
> **Aviso sobre la IP de Pruebas Locales**: La IP privada de la laptop/computadora de desarrollo (ej. `192.168.3.114`) es asignada de manera dinámica por el router (DHCP) y **no es una IP permanente**. Si la máquina se reconecta o cambia de red, la IP cambiará y requerirá actualizar la configuración antes de generar un nuevo binario para pruebas. Puedes consultar tu IP activa en cualquier momento con:
> ```bash
> hostname -I
> ```

---

## 2. Reversión y Configuración para Producción

Cuando el backend de Carnet Digital sea desplegado en un servidor de producción de la DTIC (con dominio público y certificado SSL), debes seguir estos pasos para dejar la app lista:

### Paso A: Desactivar Conexiones Inseguras (HTTP)

Android bloquea por defecto las conexiones HTTP para proteger la privacidad de los usuarios. Al pasar a producción con un backend HTTPS, debes deshabilitar el permiso de texto plano.

1. Abre el archivo [app.json](file://../app.json).
2. Localiza la sección de `plugins` y el plugin `expo-build-properties`.
3. Cambia la propiedad `usesCleartextTraffic` de `true` a `false` (o elimina esa sección del plugin si no tienes otras propiedades nativas):

```json
{
  "expo": {
    ...
    "plugins": [
      "expo-secure-store",
      [
        "expo-camera",
        {
          "cameraPermission": "Permite el acceso a la cámara..."
        }
      ],
      "expo-font",
      [
        "expo-build-properties",
        {
          "android": {
            "usesCleartextTraffic": false
          }
        }
      ]
    ]
  }
}
```

---

### Paso B: Configurar la URL del Backend de Producción

1. Abre el archivo [eas.json](file://../eas.json).
2. Bajo el bloque `"production"`, actualiza la variable `EXPO_PUBLIC_API_URL` para apuntar a la dirección web segura (`https`) asignada por la DTIC (por ejemplo, `https://carnet.uto.edu.bo/api/v1`):

```json
{
  "build": {
    "production": {
      "android": {
        "env": {
          "EXPO_PUBLIC_API_URL": "https://tu-servidor-produccion.uto.edu.bo/api/v1"
        }
      }
    }
  }
}
```

*Nota: También puedes mantener la IP de tu laptop en el perfil `"preview"` para seguir realizando compilaciones rápidas de prueba locales, y usar únicamente el perfil `"production"` con la URL de producción.*

---

## 3. Cambios Permanentes que NO Deben Revertirse

Las siguientes mejoras implementadas son totalmente compatibles con producción y se recomienda mantenerlas:

1. **Timeout de 30 Segundos (`api.ts`)**: Mantiene la tolerancia a conexiones móviles lentas en áreas universitarias de baja cobertura.
2. **Lógica de Re-intento Idempotente (`AuthEstudianteController` en el Backend)**: Previene que la aplicación falle al intentar reactivar una sesión cuyo token se perdió debido a micro-cortes de internet, protegiendo al estudiante de consumir valores o aranceles adicionales por error.
3. **Ausencia de `scheme` en `app.json`**: Se eliminó intencionalmente la propiedad `scheme` de `app.json` para evitar que EAS genere un Intent Filter en el `AndroidManifest.xml` (lo que causaba un crash grave con AGETIC). Esto se reemplazó por un `WebView` interceptor. (Ver `autenticacion_agetic.md` para más detalle).

---

## 4. Guía Completa de Comandos de Compilación Local

Aquí tienes los comandos listos para copiar y pegar según el tipo de paquete que necesites generar, limitando el uso de recursos para evitar congelamientos en tu laptop (16 GB RAM).

### A. Para Compilar APK (Instalación directa en celular / Pruebas)

#### 1. Versión de Desarrollo / Pruebas Locales (Apuntando a tu Laptop)
Utiliza la IP privada activa de tu laptop configurada en `eas.json` (o inyectada al vuelo):
```bash
ANDROID_HOME=$HOME/Android/Sdk GRADLE_OPTS="-Dorg.gradle.jvmargs=-Xmx3072m -Dorg.gradle.workers.max=4" EAS_BUILD_NO_EXPO_GO_WARNING=true npx eas-cli build --platform android --profile preview --local
```

#### 2. Versión de Producción (Apuntando al Servidor Real de la UTO)
Fuerza la inyección de la URL pública de producción directamente en el bundle:
```bash
EXPO_PUBLIC_API_URL=https://tu-servidor-produccion.uto.edu.bo/api/v1 ANDROID_HOME=$HOME/Android/Sdk GRADLE_OPTS="-Dorg.gradle.jvmargs=-Xmx3072m -Dorg.gradle.workers.max=4" EAS_BUILD_NO_EXPO_GO_WARNING=true npx eas-cli build --platform android --profile preview --local
```

---

### B. Para Compilar AAB (Android App Bundle - Subida a Google Play Console)

#### 1. Versión Limpia de Producción (Servidor Real de la UTO - Recomendado para la Tienda)
Utiliza la configuración oficial segura y de producción configurada en tu `eas.json` (asegúrate de haber completado el **Paso A** para desactivar HTTP):
```bash
ANDROID_HOME=$HOME/Android/Sdk GRADLE_OPTS="-Dorg.gradle.jvmargs=-Xmx3072m -Dorg.gradle.workers.max=4" EAS_BUILD_NO_EXPO_GO_WARNING=true npx eas-cli build --platform android --profile production --local --clear-cache
```

#### 2. Versión de Pruebas Cerradas Locales (Apuntando a la IP actual de tu Laptop)
Si necesitas subir un AAB temporal a la Play Store para pruebas internas y deseas que apunte a tu laptop (requiere mantener HTTP activado en `app.json` e incrementar `versionCode` en `app.json`):
```bash
EXPO_PUBLIC_API_URL=http://$(hostname -I | awk '{print $1}'):3333/api/v1 ANDROID_HOME=$HOME/Android/Sdk GRADLE_OPTS="-Dorg.gradle.jvmargs=-Xmx3072m -Dorg.gradle.workers.max=4" EAS_BUILD_NO_EXPO_GO_WARNING=true npx eas-cli build --platform android --profile production --local --clear-cache
```
