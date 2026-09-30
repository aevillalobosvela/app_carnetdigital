# Integración con Ciudadanía Digital (AGETIC) - Post Mortem y Arquitectura Actual

Este documento detalla el historial de integración, los problemas estructurales enfrentados con la plataforma de Ciudadanía Digital (AGETIC) y la solución definitiva implementada en la aplicación. **Esta documentación es crítica** para entender por qué no se utilizan flujos estándar de `AuthSession` ni `Chrome Custom Tabs`.

---

## 1. El Problema de la "Única Barra" (Single Slash)

AGETIC provee autenticación mediante OAuth2 con PKCE. Durante la integración, se identificó un conflicto fundamental entre los estándares de seguridad de Android Moderno y la plataforma web de AGETIC.

### El Conflicto
Para devolver el flujo de autenticación a la aplicación móvil (Deep Linking), se requiere registrar un **URI de Redirección**.
- **El Estándar (Android/Expo):** Exige el formato clásico con doble barra `esquema://ruta` (ej. `bo.edu.uto.carnetdigital://oauth2redirect`).
- **La Restricción AGETIC:** La plataforma de registro de AGETIC contiene una validación estricta (Regex) que bloquea el registro de URLs con doble barra (arrojando el error *"No es un bundle válido"*). Obliga a usar **una sola barra**: `bo.edu.uto.carnetdigital:/oauth2redirect`.

### El Crash Nativo
Al utilizar el flujo estándar (Chrome Custom Tabs) y solicitar la redirección a una URL con una sola barra, ocurren dos cosas:
1. Chrome emite la orden (Intent) hacia el sistema operativo Android.
2. Android detecta que el paquete `bo.edu.uto.carnetdigital` está asociado a ese esquema y despierta la aplicación.
3. El módulo nativo de enlaces de React Native / Expo (`expo-linking`) intenta parsear la URL recibida.
4. Al estar malformada (según los estándares C++ de parseo de URLs de internet), **lanza una excepción fatal que provoca el crash (cierre forzado) inmediato de la aplicación.**

---

## 2. Soluciones Intentadas (Fallidas)

Se realizaron pruebas exhaustivas antes de abandonar el flujo estándar:

1. **Forzar la doble barra en la App:** Modificamos el cliente para que pidiera `://`, pero AGETIC rechazó el token en la petición inicial con un error de *"Redirect URI Mismatch"*.
2. **Escuchador de Intercepción Nativa (Fuerza Bruta):** Se inyectó un `Linking.addEventListener` intentando capturar la URL y cerrar el navegador antes de que crasheara. Falló porque el crash nativo (C++) ocurre antes de que el ciclo de eventos de JavaScript reciba el mensaje.

---

## 3. La Solución Definitiva: Intercepción mediante WebView (Hack Arquitectónico)

Para resolver el problema sin requerir modificaciones en los servidores de AGETIC (lo cual estaba fuera de nuestro control), implementamos una arquitectura híbrida en `PantallaActivacion.tsx`.

### 3.1. Reemplazo de Chrome por un Navegador Integrado
En lugar de lanzar `AuthSession.promptAsync()` (que abre Chrome), utilizamos `AuthSession` **únicamente** para generar la URL segura (con `code_challenge` PKCE). Luego, inyectamos esa URL en un `<WebView>` invisible (o contenido en un Modal).

### 3.2. La "Trampa" del Intent Filter
Para evitar que el analizador de URLs de Android y Expo crashearan, realizamos dos modificaciones maestras:

1. **Eliminación del Intent Filter en `AndroidManifest.xml`:**
   Borramos la declaración que le indicaba a Android que la aplicación se encargaba del esquema `bo.edu.uto.carnetdigital`. Esto significa que el sistema operativo *no sabe* qué hacer con la URL malformada de AGETIC.
2. **Excepción Silenciosa en el WebView (`onError`):**
   Como Android no puede manejar la URL, el motor de navegación del `<WebView>` falla nativamente intentando cargar una URL que ningún sistema entiende. Esta falla dispara el evento `onError` del WebView arrojando un error tipo `ERR_UNKNOWN_URL_SCHEME`.
3. **Extracción en Aire:**
   Atrapamos ese error (`onError={...}`). Dentro del objeto de error viene la URL malformada. La leemos como simple texto, usamos Expresiones Regulares (`.match`) para extraer el `code=...`, cerramos el WebView y pasamos el código al Backend sin que el usuario note ningún fallo.

Adicionalmente, se configuró `originWhitelist={['*']}` para que el WebView no bloquee las peticiones hacia esquemas personalizados antes de siquiera intentar cargarlas.

---

## 4. Cambios en el Backend (AuthEstudianteController)

La integración también conllevó cambios importantes en la validación en el backend:

- **Se abandonó la dependencia del estado manual 'pendiente':** Anteriormente un administrador DTIC debía pre-aprobar el carnet.
- **Validación Automática (`matricula.pagos`):** Al recibir el código de AGETIC, el backend ahora verifica automáticamente contra la tabla `public.estudiantes` y `matricula.pagos`. Si el estudiante tiene la matrícula pagada para la gestión actual, la emisión y activación del carnet se hace instantáneamente.
- **Extracción de CI mediante `/me`:** Descubrimos que el `id_token` inicial no incluye la cédula de identidad, solo un UUID interno. El backend realiza una segunda petición OAuth al endpoint `https://proveedor.../me` para obtener el perfil completo, extrayendo el CI del nodo `profile.documento_identidad.numero_documento`.
- **Idempotencia:** Se agregó lógica para que, si el estudiante formatea su celular, pueda volver a escanear el carnet en el mismo dispositivo sin consumir otro cobro de arancel.

---

## 5. Resumen Técnico a Recordar

- **No usar `promptAsync()` de AuthSession**.
- **No registrar el scheme en `app.json`** ni en `AndroidManifest.xml`.
- Si se actualizan módulos nativos de Expo, asegurarse de **no reinyectar** el bloque de intent-filter por accidente, o el crash regresará.
- La `REDIRECT_URI` configurada tanto en el frontend (`PantallaActivacion.tsx`) como en el backend (`.env` AGETIC_REDIRECT_URI) debe tener estrictamente **una sola barra** (`:/`).
