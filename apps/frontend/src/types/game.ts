export type UnitType = 'single' | 'double' | 'triple' | 'quadruple';

export type CellStatus = 'unknown' | 'empty' | 'unit' | 'hit' | 'miss';

export type GamePhase = 'lobby' | 'deployment' | 'battle' | 'ended';

export interface Position {
  row: number;
  col: number;
}

export interface Unit {
  id: string;
  type: UnitType;
  position: Position | null;
  health: number;
  deployed: boolean;
  owner: 'player' | 'opponent';
}

export interface Cell {
  position: Position;
  status: CellStatus;
  unitId?: string;
  visible: boolean;
}

export interface DetectionRange {
  single: number;
  double: number;
  triple: number;
  quadruple: number;
}

export interface Shot {
  position: Position;
  result: 'hit' | 'miss' | 'pending';
  unitType?: UnitType;
}

export interface GameEvent {
  id: string;
  timestamp: number;
  type: 'hit' | 'miss' | 'destroyed' | 'deployed' | 'moved' | 'turn' | 'info';
  message: string;
  position?: Position;
  unitType?: UnitType;
  player?: 'player' | 'opponent';
}

export interface VisibilityZone {
  unitId: string;
  center: Position;
  radius: number;
  affectedCells: Position[];
}

export interface UnitMovement {
  unitId: string;
  from: Position;
  to: Position;
  automatic: boolean;
}

export interface GameState {
  phase: GamePhase;
  currentTurn: number;
  timePerTurn: number; // seconds
  turnTimeRemaining: number;
  playerUnits: Unit[];
  opponentUnits: Unit[];
  playerBoard: Cell[][];
  opponentBoard: Cell[][];
  pendingShots: Position[];
  availableShots: number;
  currentDeploymentType: UnitType | null;
  eventLog: GameEvent[];
  selectedCell: Position | null;
  selectedUnitForMovement: string | null;
  playerVisibilityZones: VisibilityZone[];
  opponentVisibilityZones: VisibilityZone[];
  winner: 'player' | 'opponent' | null;
}

export interface Player {
  id: string;
  name: string;
  ready: boolean;
}

// Constants
export const BOARD_SIZE = 10;

export const UNIT_COUNTS: Record<UnitType, number> = {
  single: 4,
  double: 3,
  triple: 2,
  quadruple: 1,
};

export const UNIT_HEALTH: Record<UnitType, number> = {
  single: 1,
  double: 2,
  triple: 3,
  quadruple: 4,
};

export const DETECTION_RADIUS: Record<UnitType, number> = {
  single: 1,
  double: 2,
  triple: 3,
  quadruple: 4,
};

export const SHOTS_PER_UNIT: Record<UnitType, number> = {
  single: 1,
  double: 2,
  triple: 3,
  quadruple: 4,
};

export const DEPLOYMENT_ORDER: UnitType[] = ['single', 'double', 'triple', 'quadruple'];

export function getUnitTypeFromHealth(health: number): UnitType {
  switch (health) {
    case 1:
      return 'single';
    case 2:
      return 'double';
    case 3:
      return 'triple';
    case 4:
      return 'quadruple';
    default:
      return 'single';
  }
}

export function positionToString(pos: Position): string {
  return `${pos.row},${pos.col}`;
}

export function stringToPosition(str: string): Position {
  const [row, col] = str.split(',').map(Number);
  return { row, col };
}

export function getColumnLabel(col: number): string {
  return String.fromCharCode(65 + col); // A-J
}

export function getRowLabel(row: number): string {
  return String(row + 1); // 1-10
}

export function getCellLabel(pos: Position): string {
  return `${getColumnLabel(pos.col)}${getRowLabel(pos.row)}`;
}

export function isValidPosition(pos: Position): boolean {
  return pos.row >= 0 && pos.row < BOARD_SIZE && pos.col >= 0 && pos.col < BOARD_SIZE;
}

export function getAdjacentPositions(pos: Position, radius: number): Position[] {
  const positions: Position[] = [];

  for (let r = pos.row - radius; r <= pos.row + radius; r++) {
    for (let c = pos.col - radius; c <= pos.col + radius; c++) {
      if (r === pos.row && c === pos.col) continue;
      const newPos = { row: r, col: c };
      if (isValidPosition(newPos)) {
        positions.push(newPos);
      }
    }
  }

  return positions;
}

export function calculateDistance(pos1: Position, pos2: Position): number {
  return Math.max(Math.abs(pos1.row - pos2.row), Math.abs(pos1.col - pos2.col));
}

export function isPositionInDetectionRange(unitPos: Position, targetPos: Position, detectionRadius: number): boolean {
  return calculateDistance(unitPos, targetPos) <= detectionRadius;
}

