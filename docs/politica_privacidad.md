# POLÍTICA DE PRIVACIDAD DE LA APLICACIÓN "CARNET DIGITAL UTO"
Última revisión: 17 de julio de 2026

## 1. RESPONSABILIDAD
La aplicación móvil "Carnet Digital UTO" es una herramienta tecnológica oficial de identificación institucional y académica, desarrollada, gestionada y mantenida por la Dirección de Tecnologías de la Información y Comunicación (DTIC) de la Universidad Técnica de Oruro (UTO), Bolivia.

## 2. RECOPILACIÓN Y TRATAMIENTO DE DATOS
Para cumplir con su función primordial de identificación del estudiante, la aplicación interactúa con los servidores académicos de la universidad y procesa los siguientes datos:
- **Datos de Identidad Escolar**: Nombre completo, cédula de identidad (C.I.), número de matrícula universitaria, fotografía institucional, facultad, carrera y periodo académico activo.
- **Identificador de Dispositivo**: Genera y almacena un token único de dispositivo (`device_token`) de manera interna. Este identificador se transmite de forma cifrada al servidor únicamente durante la fase de activación para vincular la credencial digital a un solo teléfono móvil físico y prevenir la suplantación de identidad o duplicidad de cuentas.

*Declaramos explícitamente que:*
- Toda la información estudiantil se consulta directamente desde los sistemas centrales oficiales de la UTO.
- **NO** compartimos, vendemos ni transferimos información personal de los usuarios con terceras personas ni empresas externas.

## 3. USO DE ALMACENAMIENTO LOCAL SEGURO
La aplicación utiliza el almacenamiento local seguro del dispositivo móvil (`SecureStore` encriptado por hardware) de forma exclusiva para:
- Almacenar el token de sesión de estudiante (`student_token`) necesario para validar la sesión activa contra el servidor.
- Guardar la información básica de la credencial (carrera, facultad, número de carnet) para permitir el inicio rápido y la visualización de la credencial en pantalla.
- Almacenar el identificador de dispositivo único.

## 4. PERMISOS DEL DISPOSITIVO
Para garantizar su operatividad y seguridad, la aplicación requiere autorización para acceder a los siguientes componentes del dispositivo:
- **Acceso a Internet / Red**: Requerido exclusivamente para comunicarse con la API oficial del backend de la UTO con el fin de activar la credencial, validar su estado en tiempo real y renovar sesiones.
- **Cámara**: Requerido con el único propósito de escanear el código QR de activación único generado en el portal administrativo de la universidad. La aplicación no captura, almacena ni transmite fotografías o videos del entorno del usuario a través de este permiso.
- **Protección de Capturas de Pantalla**: La aplicación bloquea de forma activa la toma de capturas de pantalla, grabaciones de video de pantalla o duplicación inalámbrica mientras se muestra la credencial digital, como medida estricta de seguridad contra falsificaciones.

## 5. MODIFICACIONES EN ESTA POLÍTICA
Esta Política de Privacidad puede actualizarse periódicamente para reflejar mejoras técnicas, de seguridad o cambios en las normativas de la tienda de aplicaciones. Toda actualización será reflejada en este documento indicando la fecha de revisión.

**Contacto de Soporte**: dtic@uto.edu.bo
**Dirección Física**: Av. 6 de Octubre #5715 entre Cochabamba y Ayacucho, Oruro, Bolivia.
