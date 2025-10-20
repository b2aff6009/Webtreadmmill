import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FITNESS_MACHINE_CONTROL_POINT_UUID,
  FTMS_SERVICE_UUID,
  HEART_RATE_MEASUREMENT_CHARACTERISTIC_UUID,
  HEART_RATE_SERVICE_UUID,
  TREADMILL_DATA_CHARACTERISTIC_UUID
} from '../constants';
import type { TreadmillData } from '../types';
import { ConnectionStatus } from '../types';

interface FtmsHookProps {
  onData?: (data: { speed: number; incline: number; heartRate?: number }) => void;
  testMode?: boolean;
}

export const useFtms = ({ onData, testMode = false }: FtmsHookProps) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [treadmillData, setTreadmillData] = useState<TreadmillData>({ speed: 0, incline: 0, distance: 0 });

  const deviceRef = useRef<any | null>(null);
  const controlPointCharRef = useRef<any | null>(null);
  const heartRateRef = useRef<number | undefined>(undefined);

  const [commandQueue, setCommandQueue] = useState<Uint8Array[]>([]);
  const isSendingCommandRef = useRef(false);

  // --- Test Mode Refs ---
  const testModeTargetSpeedRef = useRef(0);
  const testModeTargetInclineRef = useRef(0);
  const simulationIntervalRef = useRef<number | null>(null);

  const handleTreadmillData = useCallback((event: Event) => {
    const value = (event.target as any).value;
    if (!value) return;

    const dataView = new DataView(value.buffer);
    const flags = dataView.getUint16(0, true);

    let offset = 2;
    const speed = (flags & 0x02) ? dataView.getUint16(offset, true) * 0.01 : 0;
    offset += (flags & 0x02) ? 2 : 0;
    offset += (flags & 0x04) ? 2 : 0; // avg speed
    const distance = (flags & 0x08) ? dataView.getUint32(offset, true) * 0.1 : treadmillData.distance / 1000;
    offset += (flags & 0x08) ? 4 : 0;
    const incline = (flags & 0x10) ? dataView.getInt16(offset, true) * 0.1 : 0;

    const newData = { speed, incline, distance, heartRate: heartRateRef.current };
    setTreadmillData(newData);
    onData?.({ speed, incline, heartRate: heartRateRef.current });
  }, [onData, treadmillData.distance]);

  const handleHeartRateData = useCallback((event: Event) => {
    const value = (event.target as any).value;
    if (!value) return;

    const dataView = new DataView(value.buffer);
    const flags = dataView.getUint8(0);
    const hrFormat = (flags & 0x01) ? 'UINT16' : 'UINT8';
    heartRateRef.current = (hrFormat === 'UINT8') ? dataView.getUint8(1) : dataView.getUint16(1, true);
  }, []);

  const disconnect = useCallback(() => {
    if (testMode) {
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
      setTreadmillData({ speed: 0, incline: 0, distance: 0 });
      console.log('[TEST MODE] Disconnected');
    } else {
      deviceRef.current?.gatt?.disconnect();
    }
    setConnectionStatus(ConnectionStatus.DISCONNECTED);
    deviceRef.current = null;
    controlPointCharRef.current = null;
    setCommandQueue([]);
    isSendingCommandRef.current = false;
  }, [testMode]);

  useEffect(() => {
    if (isSendingCommandRef.current || commandQueue.length === 0 || connectionStatus !== ConnectionStatus.CONNECTED || testMode) {
      return;
    }

    const processNextCommand = async () => {
      isSendingCommandRef.current = true;
      const command = commandQueue[0];
      try {
        await controlPointCharRef.current?.writeValue(command);
      } catch (error) {
        console.error("Failed to send command:", error);
      } finally {
        isSendingCommandRef.current = false;
        setCommandQueue(prev => prev.slice(1));
      }
    };

    processNextCommand();
  }, [commandQueue, connectionStatus, testMode]);

  // Data simulator for test mode
  useEffect(() => {
    if (testMode && connectionStatus === ConnectionStatus.CONNECTED) {
      simulationIntervalRef.current = window.setInterval(() => {
        setTreadmillData(prev => {
          let newSpeed = prev.speed;
          const speedDiff = testModeTargetSpeedRef.current - prev.speed;
          if (Math.abs(speedDiff) < 0.1) newSpeed = testModeTargetSpeedRef.current;
          else newSpeed += Math.sign(speedDiff) * 0.1;

          let newIncline = prev.incline;
          const inclineDiff = testModeTargetInclineRef.current - prev.incline;
          if (Math.abs(inclineDiff) < 0.1) newIncline = testModeTargetInclineRef.current;
          else newIncline += Math.sign(inclineDiff) * 0.1;

          const newDistance = prev.distance + (newSpeed / 3600); // km per second

          const updatedData = {
            ...prev,
            speed: Math.round(newSpeed * 10) / 10,
            incline: Math.round(newIncline * 10) / 10,
            distance: newDistance,
          };
          onData?.({ speed: updatedData.speed, incline: updatedData.incline, heartRate: prev.heartRate });
          return updatedData;
        });
      }, 100);
    } else {
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    }
    return () => {
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    };
  }, [testMode, connectionStatus, onData]);


  const connect = useCallback(async () => {
    if (testMode) {
      setConnectionStatus(ConnectionStatus.CONNECTING);
      setTimeout(() => {
        setConnectionStatus(ConnectionStatus.CONNECTED);
        console.log('[TEST MODE] Connected');
      }, 500);
      return;
    }
    try {
      setConnectionStatus(ConnectionStatus.CONNECTING);
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: [FTMS_SERVICE_UUID] }],
        optionalServices: [HEART_RATE_SERVICE_UUID]
      });
      deviceRef.current = device;
      device.addEventListener('gattserverdisconnected', disconnect);

      const server = await device.gatt?.connect();
      if (!server) throw new Error("GATT Server not found");

      const ftmsService = await server.getPrimaryService(FTMS_SERVICE_UUID);
      const treadmillDataChar = await ftmsService.getCharacteristic(TREADMILL_DATA_CHARACTERISTIC_UUID);
      controlPointCharRef.current = await ftmsService.getCharacteristic(FITNESS_MACHINE_CONTROL_POINT_UUID);

      await treadmillDataChar.startNotifications();
      treadmillDataChar.addEventListener('characteristicvaluechanged', handleTreadmillData);

      try {
        const hrService = await server.getPrimaryService(HEART_RATE_SERVICE_UUID);
        const hrChar = await hrService.getCharacteristic(HEART_RATE_MEASUREMENT_CHARACTERISTIC_UUID);
        await hrChar.startNotifications();
        hrChar.addEventListener('characteristicvaluechanged', handleHeartRateData);
      } catch (e) {
        console.warn("Heart rate service not found on this device.");
      }

      await controlPointCharRef.current.writeValue(new Uint8Array([0x00])); // Request Control
      setConnectionStatus(ConnectionStatus.CONNECTED);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotFoundError') {
        setConnectionStatus(ConnectionStatus.DISCONNECTED);
      } else {
        console.error("Bluetooth connection failed:", error);
        setConnectionStatus(ConnectionStatus.ERROR);
        setTimeout(() => setConnectionStatus(ConnectionStatus.DISCONNECTED), 3000);
      }
    }
  }, [disconnect, handleHeartRateData, handleTreadmillData, testMode]);

  const sendCommand = useCallback((command: Uint8Array) => {
    if (testMode) {
      // In test mode, we just log the command
      console.log('[TEST MODE] Command Sent:', command);
      return;
    }
    setCommandQueue(prevQueue => [...prevQueue, command]);
  }, [testMode]);

  const setTargetSpeed = useCallback((speed: number) => {
    if (testMode) {
      testModeTargetSpeedRef.current = speed;
      console.log(`[TEST MODE] Set Target Speed: ${speed} km/h`);
      return;
    }
    const buffer = new ArrayBuffer(3);
    const view = new DataView(buffer);
    view.setUint8(0, 0x02); // Set Target Speed
    view.setUint16(1, speed * 100, true);
    sendCommand(new Uint8Array(buffer));
  }, [sendCommand, testMode]);

  const setTargetIncline = useCallback((incline: number) => {
    if (testMode) {
      testModeTargetInclineRef.current = incline;
      console.log(`[TEST MODE] Set Target Incline: ${incline}%`);
      return;
    }
    const buffer = new ArrayBuffer(3);
    const view = new DataView(buffer);
    view.setUint8(0, 0x03); // Set Target Inclination
    view.setInt16(1, incline * 10, true);
    sendCommand(new Uint8Array(buffer));
  }, [sendCommand, testMode]);

  const startWorkout = useCallback(() => {
    if (testMode) {
      console.log('[TEST MODE] Start Workout');
      testModeTargetSpeedRef.current = 2.0; // Start at a slow walk
      return;
    }
    sendCommand(new Uint8Array([0x07, 0x02]));
  }, [sendCommand, testMode]);

  const stopWorkout = useCallback(() => {
    if (testMode) {
      console.log('[TEST MODE] Stop Workout');
      testModeTargetSpeedRef.current = 0;
      testModeTargetInclineRef.current = 0;
      return;
    }
    // 0x01 is pause, 0x02 is stop
    sendCommand(new Uint8Array([0x08, 0x02]));
  }, [sendCommand, testMode]);

  return {
    connectionStatus,
    treadmillData,
    connect,
    disconnect,
    setTargetSpeed,
    setTargetIncline,
    startWorkout,
    stopWorkout,
  };
};