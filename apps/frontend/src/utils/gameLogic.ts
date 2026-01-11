import {
  BOARD_SIZE,
  Cell,
  CellStatus,
  DETECTION_RADIUS,
  Position,
  SHOTS_PER_UNIT,
  Unit,
  UNIT_COUNTS,
  UNIT_HEALTH,
  UnitType,
  DEPLOYMENT_ORDER,
  isValidPosition,
  isPositionInDetectionRange,
  positionToString,
} from '../types/game';

// Initialize empty board
export function createEmptyBoard(): Cell[][] {
  const board: Cell[][] = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    board[row] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      board[row][col] = {
        position: { row, col },
        status: 'unknown',
        visible: false,
      };
    }
  }

  return board;
}

// Initialize player's units
export function createInitialUnits(owner: 'player' | 'opponent'): Unit[] {
  const units: Unit[] = [];
  let id = 0;

  for (const [type, count] of Object.entries(UNIT_COUNTS)) {
    for (let i = 0; i < count; i++) {
      units.push({
        id: `${owner}-${type}-${id++}`,
        type: type as UnitType,
        position: null,
        health: UNIT_HEALTH[type as UnitType],
        deployed: false,
        owner,
      });
    }
  }

  return units;
}

// Get next unit to deploy
export function getNextUnitToDeploy(units: Unit[]): Unit | null {
  for (const type of DEPLOYMENT_ORDER) {
    const unit = units.find((u) => u.type === type && !u.deployed);
    if (unit) return unit;
  }
  return null;
}

// Check if position is valid for deployment (first row only)
export function isValidDeploymentPosition(pos: Position, units: Unit[], isPlayerBoard: boolean): boolean {
  // Must be in first row (row 0 for player, row 9 for opponent)
  const validRow = isPlayerBoard ? 0 : BOARD_SIZE - 1;
  if (pos.row !== validRow) return false;

  // Check if position is already occupied
  const occupied = units.some((u) =>
    u.deployed &&
    u.position &&
    u.position.row === pos.row &&
    u.position.col === pos.col
  );

  return !occupied;
}

// Deploy a unit to a position
export function deployUnit(unit: Unit, position: Position): Unit {
  return {
    ...unit,
    position,
    deployed: true,
  };
}

// Move a unit to a new position
export function moveUnit(unit: Unit, newPosition: Position, units: Unit[]): Unit | null {
  if (!unit.position) return null;

  // Check if movement is only 1 cell
  const rowDiff = Math.abs(newPosition.row - unit.position.row);
  const colDiff = Math.abs(newPosition.col - unit.position.col);

  if (rowDiff > 1 || colDiff > 1 || (rowDiff === 0 && colDiff === 0)) {
    return null; // Invalid move
  }

  // Check if position is occupied
  const occupied = units.some((u) =>
    u.id !== unit.id &&
    u.deployed &&
    u.position &&
    u.position.row === newPosition.row &&
    u.position.col === newPosition.col
  );

  if (occupied) return null;

  return {
    ...unit,
    position: newPosition,
  };
}

// Auto-move unit forward (towards opponent)
export function autoMoveUnitForward(unit: Unit, units: Unit[], isPlayer: boolean): Unit {
  if (!unit.position) return unit;

  const direction = isPlayer ? 1 : -1; // Player moves down, opponent moves up
  const newPosition: Position = {
    row: unit.position.row + direction,
    col: unit.position.col,
  };

  // Check if new position is valid and not occupied
  if (!isValidPosition(newPosition)) return unit;

  const occupied = units.some((u) =>
    u.id !== unit.id &&
    u.deployed &&
    u.position &&
    u.position.row === newPosition.row &&
    u.position.col === newPosition.col
  );

  if (occupied) return unit;

  return {
    ...unit,
    position: newPosition,
  };
}

// Calculate total available shots for deployed units
export function calculateAvailableShots(units: Unit[]): number {
  return units
    .filter((u) => u.deployed)
    .reduce((total, u) => total + SHOTS_PER_UNIT[u.type], 0);
}

// Process a shot
export function processShot(
  position: Position,
  targetUnits: Unit[],
  targetBoard: Cell[][]
): { hit: boolean; unitHit?: Unit; updatedUnit?: Unit } {
  const cell = targetBoard[position.row][position.col];

  // Find if there's a unit at this position
  const unitHit = targetUnits.find((u) =>
    u.deployed &&
    u.position &&
    u.position.row === position.row &&
    u.position.col === position.col
  );

  if (unitHit) {
    // Hit! Reduce unit health
    const newHealth = unitHit.health - 1;
    const updatedUnit: Unit = {
      ...unitHit,
      health: newHealth,
      type: newHealth > 0 ? (['single', 'double', 'triple', 'quadruple'][newHealth - 1] as UnitType) : unitHit.type,
    };

    // If health reaches 0, unit is destroyed
    if (newHealth <= 0) {
      updatedUnit.deployed = false;
      updatedUnit.position = null;
    }

    return { hit: true, unitHit, updatedUnit };
  }

  return { hit: false };
}

// Update board visibility based on detection ranges
export function updateBoardVisibility(
  board: Cell[][],
  ownUnits: Unit[],
  opponentUnits: Unit[]
): Cell[][] {
  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));

  // Reveal cells within detection range of own units
  for (const unit of ownUnits) {
    if (!unit.deployed || !unit.position) continue;

    const radius = DETECTION_RADIUS[unit.type];

    for (let r = unit.position.row - radius; r <= unit.position.row + radius; r++) {
      for (let c = unit.position.col - radius; c <= unit.position.col + radius; c++) {
        if (!isValidPosition({ row: r, col: c })) continue;

        const cell = newBoard[r][c];
        cell.visible = true;

        // Check if there's an opponent unit at this position
        const opponentUnit = opponentUnits.find((u) =>
          u.deployed &&
          u.position &&
          u.position.row === r &&
          u.position.col === c
        );

        if (opponentUnit) {
          cell.status = 'unit';
          cell.unitId = opponentUnit.id;
        } else if (cell.status === 'unknown') {
          cell.status = 'empty';
        }
      }
    }
  }

  return newBoard;
}

// Check if game is over
export function checkGameOver(playerUnits: Unit[], opponentUnits: Unit[]): {
  isOver: boolean;
  winner?: 'player' | 'opponent';
} {
  // Check if any player has deployed units
  const playerHasDeployed = playerUnits.some((u) => u.deployed);
  const opponentHasDeployed = opponentUnits.some((u) => u.deployed);

  // Game is not over if no one has deployed yet
  if (!playerHasDeployed && !opponentHasDeployed) {
    return { isOver: false };
  }

  // Check if any player has alive units (health > 0)
  const playerAlive = playerUnits.some((u) => u.deployed && u.health > 0);
  const opponentAlive = opponentUnits.some((u) => u.deployed && u.health > 0);

  // If player has deployed but has no alive units, opponent wins
  if (playerHasDeployed && !playerAlive) {
    return { isOver: true, winner: 'opponent' };
  }

  // If opponent has deployed but has no alive units, player wins
  if (opponentHasDeployed && !opponentAlive) {
    return { isOver: true, winner: 'player' };
  }

  return { isOver: false };
}

// Auto-deploy unit to first available position
export function autoDeployUnit(unit: Unit, units: Unit[], isPlayer: boolean): Unit {
  const row = isPlayer ? 0 : BOARD_SIZE - 1;

  for (let col = 0; col < BOARD_SIZE; col++) {
    const pos: Position = { row, col };
    if (isValidDeploymentPosition(pos, units, isPlayer)) {
      return deployUnit(unit, pos);
    }
  }

  return unit; // No available position (should not happen)
}

// Get available movement cells for a unit (all adjacent cells)
export function getAvailableMovementCells(unit: Unit, allUnits: Unit[]): Position[] {
  if (!unit.position) return [];

  const positions: Position[] = [];
  const { row, col } = unit.position;

  // All 8 adjacent positions (including diagonals)
  const offsets = [
    { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
    { row: 0, col: -1 }, { row: 0, col: 1 },
    { row: 1, col: -1 }, { row: 1, col: 0 }, { row: 1, col: 1 },
  ];

  for (const offset of offsets) {
    const newPos: Position = {
      row: row + offset.row,
      col: col + offset.col,
    };

    // Check if position is valid
    if (!isValidPosition(newPos)) continue;

    // Check if position is occupied
    const occupied = allUnits.some((u) =>
      u.id !== unit.id &&
      u.deployed &&
      u.position &&
      u.position.row === newPos.row &&
      u.position.col === newPos.col
    );

    if (!occupied) {
      positions.push(newPos);
    }
  }

  return positions;
}

// Get which ship to deploy based on turn number (0-indexed turn)
export function getShipSequenceByTurn(turnNumber: number): { type: UnitType; index: number } | null {
  // Turn 0-3: single-cannon ships (4 total)
  if (turnNumber < 4) {
    return { type: 'single', index: turnNumber };
  }
  // Turn 4-6: double-cannon ships (3 total)
  if (turnNumber < 7) {
    return { type: 'double', index: turnNumber - 4 };
  }
  // Turn 7-8: triple-cannon ships (2 total)
  if (turnNumber < 9) {
    return { type: 'triple', index: turnNumber - 7 };
  }
  // Turn 9: quadruple-cannon ship (1 total)
  if (turnNumber === 9) {
    return { type: 'quadruple', index: 0 };
  }

  return null; // All ships deployed
}

