# Drive 🏎️💨

**Drive** es una aplicación móvil de alto rendimiento diseñada para el **control y manejo de señales y pulsos** en tiempo real mediante una conexión robusta **App-Bluetooth**. Optimizada para la interacción con microcontroladores (como Arduino), combina precisión técnica con una interfaz elegante y profesional.

![Badge Expo](https://img.shields.io/badge/Expo-52.0.0-blue?style=flat-square&logo=expo)
![Badge React Native](https://img.shields.io/badge/React_Native-0.76.9-61DAFB?style=flat-square&logo=react)
![Badge Bluetooth](https://img.shields.io/badge/Bluetooth-Classic-0082FC?style=flat-square&logo=bluetooth)

---

## 🌟 Características Principales

- **🎮 Control Intuitivo:** Interfaz limpia con controles direccionales para manejar el vehículo en tiempo real.
- **🔄 Giros de Precisión:** Botones dedicados para realizar giros exactos de 90° (Izquierda/Derecha).
- **📡 Conexión Inteligente:** Sistema de escaneo y conexión robusta con módulos Bluetooth (ej: HC-05).
- **🎨 Diseño Premium:** Estética "Elegant Dark" con botones dorados y rojos, optimizada para máxima legibilidad y estilo.
- **🛠️ Arquitectura Nativa:** Configurada para compilación local rápida en Android.

---

## 🚀 Capacidades y Funcionamiento

La app se comunica con el carro Arduino enviando comandos de un solo carácter por el puerto serial:

- **Flecha Arriba:** Envía comandos de movimiento hacia adelante.
- **Flechas Laterales:** Permiten el giro continuo.
- **Giros Especiales:** Ejecutan rutinas pre-programadas en el Arduino para rotar exactamente 90 grados.
- **Estado Visual:** Un panel superior indica si el dispositivo está conectado o desconectado con colores vibrantes.

---

## 🛠️ Guía de Desarrollo (Build Local)

Esta aplicación está optimizada para ser compilada directamente en un PC con Windows, evitando las colas de la nube.

### Requisitos:
- **Node.js** v18+
- **JDK 17** (Microsoft Build of OpenJDK recomendado)
- **Android SDK** (API 34+)
- **NDK 26.1.10909125** (Instalado vía Android Studio)

### Instalación:
1. Clona este repositorio.
2. Instala dependencias:
   ```bash
   npm install
   ```
3. Prepara los archivos nativos:
   ```bash
   npx expo prebuild
   ```

### Compilar APK localmente:
Para generar el archivo ejecutable en tu PC:
```powershell
cd android
./gradlew assembleRelease
```
El APK final se encontrará en: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🎨 Paleta de Colores "Elegant"
- **Fondo:** Dark Grey / Black (#212121)
- **Botones de Giro:** Gold (#D4AF37)
- **Botón Conexión:** Friendly Red (#D32F2F)
- **Texto:** Pure White (#FFFFFF)

---

## 📄 Créditos
Desarrollado con ❤️ para el control de hardware open-source.
