
import React from 'react';
import { ConnectionStatus } from '../types';
import { BluetoothIcon, PlugConnectedIcon, PlugDisconnectedIcon } from './Icons';

interface ConnectButtonProps {
  status: ConnectionStatus;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const ConnectButton: React.FC<ConnectButtonProps> = ({ status, onConnect, onDisconnect }) => {
  const isConnected = status === ConnectionStatus.CONNECTED;
  const isConnecting = status === ConnectionStatus.CONNECTING;

  const buttonStyles = `
    flex items-center justify-center px-4 py-2 rounded-md font-semibold
    transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 
    focus:ring-offset-gray-900 disabled:opacity-50
  `;

  const disconnectedStyles = "bg-cyan-500 text-white hover:bg-cyan-600 focus:ring-cyan-500";
  const connectedStyles = "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500";
  const connectingStyles = "bg-gray-600 text-gray-300 cursor-not-allowed";

  const getButtonClass = () => {
    if (isConnected) return `${buttonStyles} ${connectedStyles}`;
    if (isConnecting) return `${buttonStyles} ${connectingStyles}`;
    return `${buttonStyles} ${disconnectedStyles}`;
  };

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2 text-sm text-gray-400">
         {isConnected ? <PlugConnectedIcon className="w-5 h-5 text-green-400" /> : <PlugDisconnectedIcon className="w-5 h-5 text-red-400" />}
         <span>{status}</span>
      </div>
      <button
        onClick={isConnected ? onDisconnect : onConnect}
        disabled={isConnecting}
        className={getButtonClass()}
      >
        <BluetoothIcon className="w-5 h-5 mr-2" />
        {isConnected ? 'Disconnect' : (isConnecting ? 'Connecting...' : 'Connect')}
      </button>
    </div>
  );
};
   