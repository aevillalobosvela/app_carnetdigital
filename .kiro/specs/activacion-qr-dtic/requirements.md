# Documento de Requisitos — Activación QR DTIC

## Introducción

Esta funcionalidad reemplaza el flujo de autenticación con Google OAuth por un mecanismo de
activación de dispositivo basado en un código QR generado por el personal de la DTIC en sus
oficinas. El QR actúa como llave de activación de un solo uso: contiene el `dip` del estudiante
(identificador del C.I. en la base de datos de la DTIC) junto con una firma digital que garantiza
que el QR fue emitido por la DTIC y no puede ser falsificado. La app usa el `dip` para obtener y
almacenar localmente los datos del carnet universitario. Una vez activada, la app funciona en modo
offline-first y no requiere conexión para mostrar el carnet.

El `dip` extraído del QR se gestiona mediante un estado global de la app (Context de React) para
evitar pasarlo como parámetro de navegación entre pantallas.

Este cambio afecta el flujo principal de la App_Movil: la `PantallaLogin` es reemplazada por la
`PantallaActivacion`, y la `PantallaCargando` pasa a ser la pantalla de procesamiento de la
activación. El `RootNavigator` y los tipos de navegación deben actualizarse en consecuencia.

---

## Glosario

- **App_Movil**: Aplicación React Native + Expo "Carnet Digital UTO" instalada en el dispositivo del estudiante.
- **DTIC**: Dirección de Tecnologías de Información y Comunicación de la UTO. Personal responsable de generar los QR de activación.
- **Backend**: Servidor AdonisJS v6 de la UTO que expone la API de datos del carnet.
- **QR_Activacion**: Código QR de un solo uso generado por el personal de la DTIC, que contiene el `dip` del estudiante y una firma digital HMAC-SHA256 que garantiza su autenticidad.
- **dip**: Identificador del número de C.I. del estudiante en la base de datos de la DTIC. Es el dato clave contenido en el QR_Activacion.
- **Firma_QR**: Firma digital HMAC-SHA256 incluida en el payload del QR_Activacion, calculada por el Backend con una clave secreta compartida. Permite a la App_Movil verificar que el QR fue emitido por la DTIC antes de enviarlo al Backend.
- **Clave_Secreta_QR**: Clave secreta compartida entre el Backend y la App_Movil, usada para verificar la Firma_QR. Embebida en la app como constante de compilación.
- **EstadoActivacion_Global**: Estado en memoria gestionado por el Context de React que expone el `dip` escaneado y el estado de activación a todas las pantallas sin necesidad de pasarlo como parámetro de navegación.
- **Almacenamiento_Local**: Base de datos SQLite local en el dispositivo, gestionada por `expo-sqlite`.
- **PantallaActivacion**: Primera pantalla visible de la App_Movil cuando el dispositivo no está activado. Reemplaza a `PantallaLogin`.
- **PantallaCargando**: Pantalla de procesamiento que se muestra durante la activación (llamada al backend, almacenamiento de datos).
- **TabNavigator**: Navegador de pestañas que muestra el carnet y los ajustes una vez que el dispositivo está activado.
- **EstadoActivacion**: Estado persistido en el Almacenamiento_Local que indica si el dispositivo ya fue activado (`activado` o `no_activado`).
- **DatosCarnet**: Conjunto de datos del estudiante retornados por el Backend y almacenados en el Almacenamiento_Local.
- **Escaner_QR**: Módulo de la App_Movil que accede a la cámara del dispositivo para leer el QR_Activacion.
- **Sincronizador**: Módulo de la App_Movil responsable de detectar conectividad y actualizar los DatosCarnet desde el Backend.

---

## Requisitos

---

### Requisito 1: Pantalla de activación como punto de entrada

**User Story:** Como estudiante con la app recién instalada, quiero ver una pantalla de activación
clara al abrir la app, para saber que debo ir a la DTIC a obtener mi QR de activación.

#### Criterios de aceptación

1. WHEN la App_Movil se inicia y el EstadoActivacion es `no_activado`, THE App_Movil SHALL mostrar la PantallaActivacion como primera pantalla visible.
2. WHEN la App_Movil se inicia y el EstadoActivacion es `activado`, THE App_Movil SHALL navegar directamente al TabNavigator sin mostrar la PantallaActivacion.
3. THE PantallaActivacion SHALL mostrar instrucciones que indiquen al estudiante que debe acudir a las oficinas de la DTIC para obtener su QR_Activacion.
4. THE PantallaActivacion SHALL mostrar un botón para iniciar el escaneo del QR_Activacion.
5. WHILE el EstadoActivacion es `no_activado`, THE App_Movil SHALL impedir el acceso al TabNavigator.

---

### Requisito 2: Escaneo y verificación del QR de activación

**User Story:** Como estudiante en las oficinas de la DTIC, quiero escanear el QR que me entrega
el personal, para activar mi app sin necesidad de recordar contraseñas ni cuentas, con la
garantía de que solo QR emitidos por la DTIC son aceptados.

#### Criterios de aceptación

1. WHEN el estudiante presiona el botón de escaneo en la PantallaActivacion, THE Escaner_QR SHALL solicitar permiso de acceso a la cámara del dispositivo.
2. IF el permiso de cámara es denegado, THEN THE App_Movil SHALL mostrar un mensaje que indique que el permiso de cámara es necesario para escanear el QR_Activacion.
3. WHEN el Escaner_QR detecta un código QR en el visor de la cámara, THE App_Movil SHALL extraer el payload del QR y verificar la Firma_QR usando la Clave_Secreta_QR embebida en la app.
4. IF la verificación de la Firma_QR falla, THEN THE App_Movil SHALL mostrar un mensaje de error que indique que el QR no es un QR de activación válido emitido por la DTIC y SHALL permitir al estudiante intentar el escaneo nuevamente, sin enviar ningún dato al Backend.
5. IF el payload del QR no contiene un `dip` con formato válido, THEN THE App_Movil SHALL mostrar un mensaje de error que indique que el QR no es reconocido y SHALL permitir al estudiante intentar el escaneo nuevamente.
6. WHEN la Firma_QR es válida y el `dip` tiene formato correcto, THE App_Movil SHALL almacenar el `dip` en el EstadoActivacion_Global y SHALL navegar a la PantallaCargando para iniciar el proceso de activación.

---

### Requisito 3: Proceso de activación con el backend

**User Story:** Como estudiante que acaba de escanear el QR, quiero que la app obtenga mis datos
automáticamente del backend, para no tener que ingresar ningún dato manualmente.

#### Criterios de aceptación

1. WHEN la PantallaCargando se monta, THE App_Movil SHALL leer el `dip` desde el EstadoActivacion_Global y SHALL realizar una llamada HTTP al Backend usando el `dip` como parámetro de identificación.
2. WHEN el Backend retorna los DatosCarnet con código HTTP 200, THE App_Movil SHALL almacenar los DatosCarnet en el Almacenamiento_Local.
3. WHEN los DatosCarnet son almacenados exitosamente en el Almacenamiento_Local, THE App_Movil SHALL establecer el EstadoActivacion como `activado` en el Almacenamiento_Local.
4. WHEN el EstadoActivacion es establecido como `activado`, THE App_Movil SHALL navegar al TabNavigator usando `navigation.replace()` para impedir el retorno a la PantallaActivacion.
5. IF el Backend retorna un código HTTP 404, THEN THE App_Movil SHALL mostrar un mensaje que indique que el `dip` no fue encontrado y SHALL retornar a la PantallaActivacion.
6. IF el Backend retorna un código HTTP distinto de 200 o 404, THEN THE App_Movil SHALL mostrar un mensaje de error genérico con el código de error y SHALL retornar a la PantallaActivacion.
7. IF la llamada al Backend falla por ausencia de conexión a internet, THEN THE App_Movil SHALL mostrar un mensaje que indique que se requiere conexión a internet para la activación inicial y SHALL retornar a la PantallaActivacion.
8. THE PantallaCargando SHALL mostrar un indicador de progreso visible durante toda la duración de la llamada al Backend.

---

### Requisito 4: Uso único del QR de activación

**User Story:** Como administrador de la DTIC, quiero que cada QR de activación solo pueda usarse
una vez, para evitar que un QR interceptado active múltiples dispositivos.

#### Criterios de aceptación

1. WHEN el Backend recibe una solicitud de activación con un `dip`, THE Backend SHALL marcar el QR_Activacion asociado a ese `dip` como utilizado.
2. IF el Backend recibe una segunda solicitud de activación con el mismo `dip` de un QR_Activacion ya utilizado, THEN THE Backend SHALL retornar un código HTTP 410 (Gone).
3. IF la App_Movil recibe un código HTTP 410 del Backend, THEN THE App_Movil SHALL mostrar un mensaje que indique que el QR ya fue utilizado y que el estudiante debe solicitar uno nuevo en la DTIC.

---

### Requisito 5: Funcionamiento offline-first tras la activación

**User Story:** Como estudiante con la app activada, quiero poder ver mi carnet sin necesidad de
conexión a internet, para usarlo en cualquier lugar sin depender de la red.

#### Criterios de aceptación

1. WHEN la App_Movil se inicia con EstadoActivacion `activado` y sin conexión a internet, THE App_Movil SHALL mostrar el carnet usando los DatosCarnet almacenados en el Almacenamiento_Local.
2. THE App_Movil SHALL mostrar el carnet en menos de 2 segundos desde el inicio cuando los DatosCarnet están disponibles en el Almacenamiento_Local.
3. WHILE la App_Movil está en ejecución y el Sincronizador detecta conexión a internet disponible, THE Sincronizador SHALL intentar obtener DatosCarnet actualizados del Backend.
4. WHEN el Backend retorna DatosCarnet actualizados, THE Sincronizador SHALL reemplazar los DatosCarnet en el Almacenamiento_Local con los datos actualizados.
5. IF la sincronización en segundo plano falla, THE App_Movil SHALL continuar mostrando los DatosCarnet del Almacenamiento_Local sin mostrar un mensaje de error al estudiante.

---

### Requisito 6: Seguridad opcional del dispositivo

**User Story:** Como estudiante, quiero poder proteger mi carnet digital con PIN o huella dactilar,
para que nadie más pueda acceder a él si pierdo mi dispositivo.

#### Criterios de aceptación

1. WHERE el dispositivo soporta autenticación biométrica, THE App_Movil SHALL ofrecer al estudiante la opción de habilitar el desbloqueo por huella dactilar.
2. WHERE el dispositivo soporta PIN de aplicación, THE App_Movil SHALL ofrecer al estudiante la opción de configurar un PIN de 4 a 6 dígitos para proteger el acceso.
3. THE App_Movil SHALL tratar la configuración de seguridad del dispositivo como opcional; la ausencia de configuración de seguridad no SHALL impedir el acceso al carnet.
4. WHEN el estudiante habilita la autenticación biométrica o PIN, THE App_Movil SHALL solicitar la autenticación configurada en cada apertura de la app.
5. IF la autenticación biométrica falla 3 veces consecutivas, THEN THE App_Movil SHALL ofrecer al estudiante la opción de ingresar el PIN como alternativa.

---

### Requisito 7: Cambio de dispositivo y reactivación

**User Story:** Como estudiante que cambió de dispositivo o extravió el anterior, quiero poder
reactivar la app en mi nuevo dispositivo acudiendo a la DTIC, para recuperar el acceso a mi
carnet digital, y que el dispositivo anterior quede bloqueado de inmediato.

#### Criterios de aceptación

1. WHEN el personal de la DTIC genera un nuevo QR_Activacion para un estudiante, THE Backend SHALL invalidar todos los QR_Activacion anteriores asociados al mismo `dip`.
2. WHEN el estudiante activa la app en un nuevo dispositivo con un nuevo QR_Activacion, THE Backend SHALL registrar el nuevo dispositivo como el dispositivo activo para ese `dip` e SHALL invalidar la activación del dispositivo anterior de forma inmediata.
3. WHEN el Backend invalida la activación de un dispositivo anterior, THE Backend SHALL retornar HTTP 401 con código `DISPOSITIVO_REVOCADO` en cualquier llamada de sincronización proveniente de ese dispositivo.
4. WHEN la App_Movil recibe HTTP 401 con código `DISPOSITIVO_REVOCADO` durante una sincronización, THE App_Movil SHALL limpiar el Almacenamiento_Local, SHALL establecer el EstadoActivacion como `no_activado` y SHALL mostrar la PantallaActivacion con un mensaje que indique que el dispositivo fue desvinculado.
5. THE revocación SHALL ser efectiva en el Backend en el momento en que el nuevo dispositivo completa su activación, sin esperar a que el dispositivo anterior intente sincronizar.

---

### Requisito 9: Integridad y autenticidad del QR de activación

**User Story:** Como administrador de la DTIC, quiero que solo los QR generados por nuestros
sistemas sean aceptados por la app, para evitar que alguien fabrique QR falsos y active la app
con datos no autorizados.

#### Criterios de aceptación

1. THE Backend SHALL generar el payload del QR_Activacion como un objeto JSON con al menos los campos `dip` (string) y `exp` (timestamp Unix de expiración), y SHALL calcular una Firma_QR usando HMAC-SHA256 sobre ese JSON con la Clave_Secreta_QR.
2. THE QR_Activacion SHALL codificar el payload JSON y la Firma_QR en formato `<payload_base64>.<firma_hex>` para permitir la verificación offline en la App_Movil.
3. THE App_Movil SHALL verificar la Firma_QR localmente antes de enviar cualquier dato al Backend; un QR con firma inválida SHALL ser rechazado sin contactar al Backend.
4. THE QR_Activacion SHALL incluir un timestamp de expiración (`exp`); IF el timestamp actual supera el `exp` del QR, THEN THE App_Movil SHALL rechazar el QR y SHALL mostrar un mensaje que indique que el QR ha expirado y que el estudiante debe solicitar uno nuevo.
5. THE Clave_Secreta_QR SHALL ser embebida en la App_Movil como constante de compilación y no SHALL aparecer en texto plano en el código fuente del repositorio (se usará una variable de entorno en tiempo de build).

---



### Requisito 8: Actualización del flujo de navegación y estado global

**User Story:** Como desarrollador de la App_Movil, quiero que el sistema de navegación y el
estado global reflejen el nuevo flujo de activación QR, para que la arquitectura de la app sea
coherente con el nuevo modelo de negocio.

#### Criterios de aceptación

1. THE RootNavigator SHALL reemplazar la ruta `PantallaLogin` por la ruta `PantallaActivacion` en el Stack Navigator.
2. THE RootNavigator SHALL determinar la `initialRouteName` en función del EstadoActivacion leído del Almacenamiento_Local al iniciar la app.
3. THE archivo `src/navigation/types.ts` SHALL definir el tipo `NavegacionActivacion` como `StackNavigationProp<RootStackParamList, 'PantallaActivacion'>` en reemplazo de `NavegacionLogin`.
4. THE App_Movil SHALL implementar un `ActivacionContext` (React Context) que exponga el `dip` escaneado y una función `establecerDip(dip: string)` accesible desde cualquier pantalla sin necesidad de parámetros de navegación.
5. THE `ActivacionContext` SHALL ser montado en `App.tsx` como provider que envuelva al `RootNavigator`.
6. THE PantallaCargando SHALL leer el `dip` desde el `ActivacionContext` en lugar de recibirlo como parámetro de ruta.
