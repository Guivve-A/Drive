import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Alert,
  TouchableOpacity,
  Modal,
  FlatList,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {
  Provider as PaperProvider,
  Button,
  Title,
  Card,
  ActivityIndicator,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import RNBluetoothClassic from 'react-native-bluetooth-classic';

// --- CONFIGURACIÓN DE COMANDOS ---
// Estos deben coincidir con tu código de Arduino
const COMMANDS = {
  FORWARD: 'F',
  BACKWARD: 'B',
  LEFT: 'L',
  RIGHT: 'R',
  STOP: 'S',
  TURN_90_LEFT: 'G',
  TURN_90_RIGHT: 'H',
};

// --- SERVICIO DE BLUETOOTH CLASSIC ---
const BluetoothService = {
  connectedDevice: null,

  /** Solicitar permisos Bluetooth en Android 12+ */
  requestPermissions: async () => {
    if (Platform.OS !== 'android') return true;

    try {
      // Android 12 (API 31) y superior requiere permisos nuevos
      if (Platform.Version >= 31) {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        const allGranted = Object.values(granted).every(
          (result) => result === PermissionsAndroid.RESULTS.GRANTED
        );

        if (!allGranted) {
          Alert.alert(
            'Permisos necesarios',
            'Se necesitan permisos de Bluetooth y ubicación para conectar al carro.'
          );
          return false;
        }
      } else {
        // Android < 12 solo necesita ubicación
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Permiso de Ubicación',
            message:
              'Se necesita permiso de ubicación para buscar dispositivos Bluetooth.',
            buttonPositive: 'Aceptar',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Permiso denegado',
            'No se puede buscar dispositivos sin permiso de ubicación.'
          );
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error solicitando permisos:', error);
      return false;
    }
  },

  /** Verificar si el Bluetooth está habilitado */
  isBluetoothEnabled: async () => {
    try {
      return await RNBluetoothClassic.isBluetoothEnabled();
    } catch (error) {
      console.error('Error verificando Bluetooth:', error);
      return false;
    }
  },

  /** Obtener lista de dispositivos emparejados */
  getBondedDevices: async () => {
    try {
      const devices = await RNBluetoothClassic.getBondedDevices();
      return devices;
    } catch (error) {
      console.error('Error obteniendo dispositivos emparejados:', error);
      return [];
    }
  },

  /** Conectar a un dispositivo específico */
  connectToDevice: async (device) => {
    try {
      const connection = await device.connect({
        delimiter: '\n',
      });

      if (connection) {
        BluetoothService.connectedDevice = device;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error conectando al dispositivo:', error);
      return false;
    }
  },

  /** Desconectar del dispositivo actual */
  disconnect: async () => {
    try {
      if (BluetoothService.connectedDevice) {
        await BluetoothService.connectedDevice.disconnect();
        BluetoothService.connectedDevice = null;
      }
    } catch (error) {
      console.error('Error desconectando:', error);
      BluetoothService.connectedDevice = null;
    }
  },

  /** Enviar un comando (carácter) al dispositivo conectado */
  sendCommand: async (command) => {
    try {
      if (BluetoothService.connectedDevice) {
        await BluetoothService.connectedDevice.write(command);
        console.log(`Comando enviado: ${command}`);
      }
    } catch (error) {
      console.error(`Error enviando comando '${command}':`, error);
    }
  },
};

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedDeviceName, setConnectedDeviceName] = useState('');
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [bondedDevices, setBondedDevices] = useState([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);

  /** Buscar dispositivos emparejados y mostrar modal */
  const handleSearchDevices = async () => {
    if (isConnecting) return;

    // Si ya está conectado, desconectar
    if (isConnected) {
      await BluetoothService.disconnect();
      setIsConnected(false);
      setConnectedDeviceName('');
      Alert.alert('Bluetooth', 'Desconectado del carro.');
      return;
    }

    setIsLoadingDevices(true);

    // 1. Solicitar permisos
    const hasPermissions = await BluetoothService.requestPermissions();
    if (!hasPermissions) {
      setIsLoadingDevices(false);
      return;
    }

    // 2. Verificar que Bluetooth está encendido
    const btEnabled = await BluetoothService.isBluetoothEnabled();
    if (!btEnabled) {
      setIsLoadingDevices(false);
      Alert.alert(
        'Bluetooth apagado',
        'Por favor, enciende el Bluetooth desde los ajustes del dispositivo.'
      );
      return;
    }

    // 3. Obtener dispositivos emparejados
    const devices = await BluetoothService.getBondedDevices();
    setIsLoadingDevices(false);

    if (devices.length === 0) {
      Alert.alert(
        'Sin dispositivos',
        'No se encontraron dispositivos emparejados. ' +
          'Empareja el módulo HC-05 desde Ajustes > Bluetooth (PIN: 1234 o 0000).'
      );
      return;
    }

    setBondedDevices(devices);
    setShowDeviceModal(true);
  };

  /** Conectar al dispositivo seleccionado del modal */
  const handleSelectDevice = async (device) => {
    setShowDeviceModal(false);
    setIsConnecting(true);

    const success = await BluetoothService.connectToDevice(device);
    setIsConnecting(false);

    if (success) {
      setIsConnected(true);
      setConnectedDeviceName(device.name || device.address);
      Alert.alert(
        'Bluetooth',
        `Conectado exitosamente a: ${device.name || device.address}`
      );
    } else {
      Alert.alert(
        'Error de conexión',
        `No se pudo conectar a ${device.name || device.address}. ` +
          'Asegúrate de que el módulo HC-05 esté encendido.'
      );
    }
  };

  // Función genérica para enviar comandos cuando se presiona/suelta
  const sendControlCommand = useCallback(
    (command, type) => {
      if (!isConnected) return;

      if (type === 'press') {
        BluetoothService.sendCommand(command);
      } else if (type === 'release') {
        BluetoothService.sendCommand(COMMANDS.STOP);
      }
    },
    [isConnected]
  );

  // Botón de control direccional reusable
  const DirectionButton = ({ icon, command }) => (
    <TouchableOpacity
      onPressIn={() => sendControlCommand(command, 'press')}
      onPressOut={() => sendControlCommand(command, 'release')}
      disabled={!isConnected}
      style={[styles.controlButton, !isConnected && styles.disabledButton]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={50}
        color={isConnected ? 'white' : '#A0A0A0'}
      />
    </TouchableOpacity>
  );

  // Botón de giro reusable (onPress simple, no pressHold)
  const TurnButton = ({ icon, command, label }) => (
    <Button
      mode="contained"
      onPress={() => sendControlCommand(command, 'press')}
      disabled={!isConnected}
      style={styles.turnButton}
      contentStyle={{ flexDirection: 'row-reverse' }}
      icon={({ size, color }) => (
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      )}
    >
      {label}
    </Button>
  );

  // Renderizar un dispositivo en la lista del modal
  const renderDeviceItem = ({ item }) => (
    <TouchableOpacity
      style={styles.deviceItem}
      onPress={() => handleSelectDevice(item)}
    >
      <View style={styles.deviceInfo}>
        <MaterialCommunityIcons
          name="bluetooth"
          size={24}
          color="#6200EE"
          style={{ marginRight: 12 }}
        />
        <View>
          <Text style={styles.deviceName}>
            {item.name || 'Dispositivo sin nombre'}
          </Text>
          <Text style={styles.deviceAddress}>{item.address}</Text>
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
    </TouchableOpacity>
  );

  return (
    <PaperProvider>
      <View style={styles.container}>
        <Title style={styles.headerTitle}>Control de Carro Arduino</Title>

        {/* --- Sección de Conexión --- */}
        <Card style={styles.card}>
          <Card.Content style={styles.connectionSection}>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isConnected ? '#4CAF50' : '#F44336' },
                ]}
              />
              <View>
                <Text style={styles.statusText}>
                  {isConnected ? 'Conectado' : 'Desconectado'}
                </Text>
                {isConnected && connectedDeviceName ? (
                  <Text style={styles.deviceConnectedName}>
                    {connectedDeviceName}
                  </Text>
                ) : null}
              </View>
            </View>
            <Button
              mode="contained"
              onPress={handleSearchDevices}
              loading={isConnecting || isLoadingDevices}
              disabled={isConnecting || isLoadingDevices}
              style={[
                styles.connectButton,
                isConnected ? styles.disconnectBtn : styles.connectBtn,
              ]}
            >
              {isConnecting
                ? 'Conectando...'
                : isLoadingDevices
                ? 'Buscando...'
                : isConnected
                ? 'Desconectar'
                : 'Conectar'}
            </Button>
          </Card.Content>
        </Card>

        {/* --- Sección de Controles --- */}
        <View style={styles.controlsContainer}>
          {/* Fila Arriba */}
          <View style={styles.rowCentered}>
            <DirectionButton icon="arrow-up-bold" command={COMMANDS.FORWARD} />
          </View>

          {/* Fila Medio */}
          <View style={styles.rowSpaced}>
            <DirectionButton icon="arrow-left-bold" command={COMMANDS.LEFT} />
            {/* Botón Stop Central */}
            <TouchableOpacity
              onPress={() => sendControlCommand(COMMANDS.STOP, 'press')}
              disabled={!isConnected}
              style={[
                styles.stopButton,
                !isConnected && styles.disabledButton,
              ]}
            >
              <MaterialCommunityIcons
                name="stop-circle"
                size={60}
                color={isConnected ? '#F44336' : '#A0A0A0'}
              />
            </TouchableOpacity>
            <DirectionButton icon="arrow-right-bold" command={COMMANDS.RIGHT} />
          </View>

          {/* Fila Abajo */}
          <View style={styles.rowCentered}>
            <DirectionButton
              icon="arrow-down-bold"
              command={COMMANDS.BACKWARD}
            />
          </View>
        </View>

        {/* --- Sección de Giros 90º --- */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.subTitle}>Giros Especiales</Title>
            <View style={styles.rowSpaced}>
              <TurnButton
                icon="rotate-left"
                command={COMMANDS.TURN_90_LEFT}
                label="Giro 90º I"
              />
              <TurnButton
                icon="rotate-right"
                command={COMMANDS.TURN_90_RIGHT}
                label="Giro 90º D"
              />
            </View>
          </Card.Content>
        </Card>

        {/* --- Modal de Selección de Dispositivos --- */}
        <Modal
          visible={showDeviceModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDeviceModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Title style={styles.modalTitle}>
                  Dispositivos Emparejados
                </Title>
                <TouchableOpacity onPress={() => setShowDeviceModal(false)}>
                  <MaterialCommunityIcons name="close" size={28} color="#333" />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalSubtitle}>
                Selecciona el módulo HC-05 de tu carro
              </Text>
              <FlatList
                data={bondedDevices}
                renderItem={renderDeviceItem}
                keyExtractor={(item) => item.address}
                style={styles.deviceList}
                ItemSeparatorComponent={() => (
                  <View style={styles.deviceSeparator} />
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    No se encontraron dispositivos
                  </Text>
                }
              />
              <Button
                mode="outlined"
                onPress={() => setShowDeviceModal(false)}
                style={styles.cancelButton}
              >
                Cancelar
              </Button>
            </View>
          </View>
        </Modal>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 24,
    color: '#333',
  },
  card: {
    marginBottom: 20,
    elevation: 4,
    borderRadius: 10,
  },
  subTitle: {
    fontSize: 18,
    marginBottom: 10,
    color: '#666',
  },
  connectionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  deviceConnectedName: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
  },
  connectButton: {
    minWidth: 150,
  },
  connectBtn: {
    backgroundColor: '#6200EE',
  },
  disconnectBtn: {
    backgroundColor: '#757575',
  },
  controlsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  rowCentered: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  rowSpaced: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
  },
  controlButton: {
    backgroundColor: '#6200EE',
    padding: 15,
    borderRadius: 50,
    elevation: 5,
  },
  stopButton: {
    padding: 10,
  },
  turnButton: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: '#03DAC6',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
    elevation: 0,
  },
  // --- Estilos del Modal ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  deviceList: {
    maxHeight: 300,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  deviceAddress: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  deviceSeparator: {
    height: 1,
    backgroundColor: '#EEEEEE',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
  },
  cancelButton: {
    marginTop: 12,
  },
});
