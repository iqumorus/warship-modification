import { useEffect, useState } from 'react';
import { useGameStore } from './useGameStore';
import { getColyseusClient } from '../services/ColyseusClient';

export function useColyseus() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setConnected = useGameStore((s) => s.setConnected);
  const setRoomId = useGameStore((s) => s.setRoomId);
  const updateFromServer = useGameStore((s) => s.updateFromServer);

  const client = getColyseusClient();

  useEffect(() => {
    client.onConnected((roomId) => {
      setConnected(true);
      setRoomId(roomId);
      setIsConnecting(false);
      setError(null);
    });

    client.onDisconnected(() => {
      setConnected(false);
      setRoomId(null);
    });

    client.onStateChange((state) => {
      updateFromServer(state);
    });

    return () => {
      client.leave();
    };
  }, [client, setConnected, setRoomId, updateFromServer]);

  const createRoom = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const roomId = await client.createRoom();
      return roomId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
      setIsConnecting(false);
      throw err;
    }
  };

  const joinRoom = async (roomId: string) => {
    setIsConnecting(true);
    setError(null);
    try {
      await client.joinRoom(roomId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
      setIsConnecting(false);
      throw err;
    }
  };

  const joinOrCreate = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const roomId = await client.joinOrCreate();
      return roomId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join or create room');
      setIsConnecting(false);
      throw err;
    }
  };

  const leaveRoom = async () => {
    try {
      await client.leave();
    } catch (err) {
      console.error('Error leaving room:', err);
    }
  };

  return {
    client,
    isConnecting,
    error,
    createRoom,
    joinRoom,
    joinOrCreate,
    leaveRoom,
  };
}

