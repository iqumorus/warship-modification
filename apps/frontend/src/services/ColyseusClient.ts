// @ts-ignore - colyseus.js may not be installed yet
import type { Client, Room } from 'colyseus.js';
import { GamePhase, Unit, Cell } from '../types/game';

export interface GameRoomState {
  phase: GamePhase;
  currentTurn: number;
  timePerTurn: number;
  turnTimeRemaining: number;
  players: {
    [sessionId: string]: {
      id: string;
      name: string;
      ready: boolean;
    };
  };
}

export class ColyseusClient {
  private client: any;
  private room: any = null;
  private onStateChangeCallback?: (state: any) => void;
  private onConnectedCallback?: (roomId: string) => void;
  private onDisconnectedCallback?: () => void;

  constructor(serverUrl: string = 'ws://localhost:2567') {
    try {
      // @ts-ignore
      const { Client } = require('colyseus.js');
      this.client = new Client(serverUrl);
    } catch (e) {
      console.warn('Colyseus.js not installed. Multiplayer features disabled.');
      this.client = null;
    }
  }

  async createRoom(roomName: string = 'warship_room'): Promise<string> {
    if (!this.client) {
      throw new Error('Colyseus client not initialized');
    }
    
    try {
      this.room = await this.client.create(roomName, {
        // Room options
      });

      this.setupRoomHandlers();
      return this.room.id;
    } catch (error) {
      console.error('Failed to create room:', error);
      throw error;
    }
  }

  async joinRoom(roomId: string): Promise<void> {
    if (!this.client) {
      throw new Error('Colyseus client not initialized');
    }
    
    try {
      this.room = await this.client.joinById(roomId, {
        // Join options
      });

      this.setupRoomHandlers();
    } catch (error) {
      console.error('Failed to join room:', error);
      throw error;
    }
  }

  async joinOrCreate(roomName: string = 'warship_room'): Promise<string> {
    if (!this.client) {
      throw new Error('Colyseus client not initialized');
    }
    
    try {
      this.room = await this.client.joinOrCreate(roomName, {
        // Room options
      });

      this.setupRoomHandlers();
      return this.room.id;
    } catch (error) {
      console.error('Failed to join or create room:', error);
      throw error;
    }
  }

  private setupRoomHandlers(): void {
    if (!this.room) return;

    // Handle state changes
    this.room.onStateChange((state: any) => {
      console.log('Room state changed:', state);
      if (this.onStateChangeCallback) {
        this.onStateChangeCallback(state);
      }
    });

    // Handle messages
    this.room.onMessage('turn_start', (message: any) => {
      console.log('Turn started:', message);
    });

    this.room.onMessage('shot_result', (message: any) => {
      console.log('Shot result:', message);
    });

    this.room.onMessage('game_over', (message: any) => {
      console.log('Game over:', message);
    });

    // Handle errors
    this.room.onError((code: any, message: any) => {
      console.error('Room error:', code, message);
    });

    // Handle leave
    this.room.onLeave((code: any) => {
      console.log('Left room:', code);
      if (this.onDisconnectedCallback) {
        this.onDisconnectedCallback();
      }
    });

    if (this.onConnectedCallback) {
      this.onConnectedCallback(this.room.id);
    }
  }

  // Send actions to server
  deployUnit(unitId: string, position: { row: number; col: number }): void {
    if (!this.room) return;
    this.room.send('deploy_unit', { unitId, position });
  }

  moveUnit(unitId: string, position: { row: number; col: number }): void {
    if (!this.room) return;
    this.room.send('move_unit', { unitId, position });
  }

  shoot(positions: { row: number; col: number }[]): void {
    if (!this.room) return;
    this.room.send('shoot', { positions });
  }

  confirmTurn(): void {
    if (!this.room) return;
    this.room.send('confirm_turn', {});
  }

  setReady(ready: boolean): void {
    if (!this.room) return;
    this.room.send('set_ready', { ready });
  }

  // Event handlers
  onStateChange(callback: (state: any) => void): void {
    this.onStateChangeCallback = callback;
  }

  onConnected(callback: (roomId: string) => void): void {
    this.onConnectedCallback = callback;
  }

  onDisconnected(callback: () => void): void {
    this.onDisconnectedCallback = callback;
  }

  // Leave room
  async leave(): Promise<void> {
    if (this.room) {
      await this.room.leave();
      this.room = null;
    }
  }

  // Get room info
  getRoomId(): string | null {
    return this.room?.id || null;
  }

  getSessionId(): string | null {
    return this.room?.sessionId || null;
  }

  isConnected(): boolean {
    return this.room !== null && this.client !== null;
  }
}

// Singleton instance
let colyseusClient: ColyseusClient | null = null;

export function getColyseusClient(): ColyseusClient {
  if (!colyseusClient) {
    const serverUrl = import.meta.env.VITE_COLYSEUS_URL || 'ws://localhost:2567';
    colyseusClient = new ColyseusClient(serverUrl);
  }
  return colyseusClient;
}

