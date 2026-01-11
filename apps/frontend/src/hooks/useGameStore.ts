import { create } from 'zustand';
import {
  GamePhase,
  TurnPhase,
  Unit,
  Cell,
  Position,
  UnitType,
  Shot,
  Player,
  GameEvent,
  VisibilityZone,
} from '../types/game';
import {
  createEmptyBoard,
  createInitialUnits,
  getNextUnitToDeploy,
  deployUnit,
  moveUnit,
  calculateAvailableShots,
  processShot,
  updateBoardVisibility,
  checkGameOver,
  autoMoveUnitForward,
  autoDeployUnit,
  isValidDeploymentPosition,
  getAvailableMovementCells,
  getShipSequenceByTurn,
} from '../utils/gameLogic';

interface GameStore {
  // Connection
  connected: boolean;
  setConnected: (v: boolean) => void;

  // Room & Players
  roomId: string | null;
  playerId: string | null;
  players: Player[];
  setRoomId: (id: string | null) => void;
  setPlayers: (players: Player[]) => void;

  // Game State
  phase: GamePhase;
  currentTurn: number;
  currentTurnPhase: TurnPhase;
  deploymentSequenceIndex: number;
  movementCompleted: boolean;
  timePerTurn: number;
  turnTimeRemaining: number;

  // Units
  playerUnits: Unit[];
  opponentUnits: Unit[];

  // Board
  gameBoard: Cell[][];

  // Actions
  pendingUnitDeployment: Unit | null;
  pendingShots: Position[];
  availableShots: number;
  availableMovementCells: Position[];
  selectedCell: Position | null;
  selectedUnitForMovement: string | null;
  justDeployedUnitId: string | null;
  movedUnitIds: string[]; // Track units moved manually this turn
  turnAction: 'movement' | 'attack' | null; // Track what action player chose this turn
  eventLog: GameEvent[];
  playerVisibilityZones: VisibilityZone[];
  opponentVisibilityZones: VisibilityZone[];
  winner: 'player' | 'opponent' | null;

  // Actions
  initGame: () => void;
  setPhase: (phase: GamePhase) => void;
  setTurnTimeRemaining: (time: number) => void;
  setTimePerTurn: (time: number) => void;

  // Deployment
  selectDeploymentCell: (pos: Position) => void;
  confirmDeployment: () => void;

  // Movement
  selectUnitToMove: (unitId: string) => void;
  moveSelectedUnit: (pos: Position) => void;

  // Shooting
  addShot: (pos: Position) => void;
  removeShot: (pos: Position) => void;
  clearShots: () => void;

  // Turn processing
  processTurn: () => void;
  completeTurn: () => void;
  handleTurnTimeout: () => void;
  nextTurn: () => void;

  // Update from server
  updateFromServer: (data: any) => void;

  // Reset
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  connected: false,
  roomId: null,
  playerId: null,
  players: [],
  phase: 'lobby',
  currentTurn: 0,
  currentTurnPhase: 'deployment',
  deploymentSequenceIndex: 0,
  movementCompleted: false,
  timePerTurn: 30,
  turnTimeRemaining: 30,
  playerUnits: [],
  opponentUnits: [],
  gameBoard: createEmptyBoard(),
  pendingUnitDeployment: null,
  pendingShots: [],
  availableShots: 0,
  availableMovementCells: [],
  selectedCell: null,
  selectedUnitForMovement: null,
  justDeployedUnitId: null,
  movedUnitIds: [],
  turnAction: null,
  eventLog: [],
  playerVisibilityZones: [],
  opponentVisibilityZones: [],
  winner: null,

  setConnected: (v: boolean) => set({ connected: v }),
  setRoomId: (id: string | null) => set({ roomId: id }),
  setPlayers: (players: Player[]) => set({ players }),
  setPhase: (phase: GamePhase) => set({ phase }),
  setTurnTimeRemaining: (time: number) => set({ turnTimeRemaining: time }),
  setTimePerTurn: (time: number) => set({ timePerTurn: time, turnTimeRemaining: time }),

  initGame: () => {
    const playerUnits = createInitialUnits('player');
    const opponentUnits = createInitialUnits('opponent');
    const gameBoard = createEmptyBoard();

    set({
      phase: 'prematch',
      currentTurn: 0,
      playerUnits,
      opponentUnits,
      gameBoard,
      pendingUnitDeployment: getNextUnitToDeploy(playerUnits),
      pendingShots: [],
      availableShots: 0,
    });
  },

  selectDeploymentCell: (pos: Position) => {
    const { pendingUnitDeployment, playerUnits, gameBoard, currentTurn } = get();


    if (!pendingUnitDeployment) return;

    if (!isValidDeploymentPosition(pos, playerUnits, true)) return;

    // Deploy the unit immediately
    const deployedUnit = deployUnit(pendingUnitDeployment, pos);
    const updatedUnits = playerUnits.map((u) =>
      u.id === deployedUnit.id ? deployedUnit : u
    );

    // Update board to show the unit
    const updatedBoard = gameBoard.map((row) =>
      row.map((cell) => ({ ...cell }))
    );
    updatedBoard[pos.row][pos.col].status = 'unit';
    updatedBoard[pos.row][pos.col].unitId = deployedUnit.id;

    // Get next unit to deploy
    const nextUnit = getNextUnitToDeploy(updatedUnits);

    // Calculate available shots from all deployed units
    const availableShots = calculateAvailableShots(updatedUnits);

    // After deploying a ship, transition to battle phase for this turn
    // Store the ID of the just-deployed unit so it can't be moved this turn
    set({
      playerUnits: updatedUnits,
      gameBoard: updatedBoard,
      pendingUnitDeployment: null, // Clear pending deployment
      selectedCell: null,
      availableShots,
      phase: 'battle', // Transition to battle phase
      currentTurnPhase: 'shooting',
      justDeployedUnitId: deployedUnit.id, // Track the just-deployed unit
      movedUnitIds: [], // Reset moved units for the new turn
      turnAction: null, // Reset action choice
    });
  },

  confirmDeployment: () => {
    const { selectedCell, pendingUnitDeployment, playerUnits } = get();

    if (!selectedCell || !pendingUnitDeployment) return;

    // Deploy the unit
    const deployedUnit = deployUnit(pendingUnitDeployment, selectedCell);
    const updatedUnits = playerUnits.map((u) =>
      u.id === deployedUnit.id ? deployedUnit : u
    );

    // Get next unit to deploy
    const nextUnit = getNextUnitToDeploy(updatedUnits);

    // If all units deployed, move to battle phase
    if (!nextUnit) {
      set({
        playerUnits: updatedUnits,
        pendingUnitDeployment: null,
        selectedCell: null,
        phase: 'battle',
        availableShots: calculateAvailableShots(updatedUnits),
      });
    } else {
      set({
        playerUnits: updatedUnits,
        pendingUnitDeployment: nextUnit,
        selectedCell: null,
      });
    }
  },

  selectUnitToMove: (unitId: string) => {
    const { playerUnits, selectedUnitForMovement, justDeployedUnitId, movedUnitIds } = get();

    // Cannot move the unit that was just deployed this turn
    if (unitId === justDeployedUnitId) {
      return;
    }

    // Cannot move a unit that has already moved this turn
    if (movedUnitIds.includes(unitId)) {
      return;
    }

    // If clicking the same unit, deselect it
    if (selectedUnitForMovement === unitId) {
      set({
        selectedUnitForMovement: null,
        availableMovementCells: [],
      });
      return;
    }

    // Find the unit
    const unit = playerUnits.find((u) => u.id === unitId);
    if (!unit || !unit.deployed) return;

    // Calculate available movement cells
    const movementCells = getAvailableMovementCells(unit, playerUnits);

    set({
      selectedUnitForMovement: unitId,
      availableMovementCells: movementCells,
    });
  },

  moveSelectedUnit: (pos: Position) => {
    const { selectedUnitForMovement, playerUnits, availableMovementCells, movedUnitIds, turnAction, gameBoard } = get();

    // Cannot move if already chose attack this turn
    if (turnAction === 'attack') {
      return;
    }

    if (!selectedUnitForMovement) return;

    // Check if position is in available movement cells
    const isValidMove = availableMovementCells.some(
      (p) => p.row === pos.row && p.col === pos.col
    );

    if (!isValidMove) return;

    // Find and move the unit
    const unit = playerUnits.find((u) => u.id === selectedUnitForMovement);
    if (!unit) return;

    const movedUnit = moveUnit(unit, pos, playerUnits);
    if (!movedUnit) return;

    // Update units
    const updatedUnits = playerUnits.map((u) =>
      u.id === movedUnit.id ? movedUnit : u
    );

    // Update board to reflect the movement
    const updatedBoard = gameBoard.map((row) =>
      row.map((cell) => ({ ...cell }))
    );

    // Clear old position
    if (unit.position) {
      updatedBoard[unit.position.row][unit.position.col].status = 'empty';
      updatedBoard[unit.position.row][unit.position.col].unitId = undefined;
    }

    // Set new position
    updatedBoard[pos.row][pos.col].status = 'unit';
    updatedBoard[pos.row][pos.col].unitId = movedUnit.id;

    set({
      playerUnits: updatedUnits,
      gameBoard: updatedBoard,
      selectedUnitForMovement: null,
      availableMovementCells: [],
      movementCompleted: true,
      movedUnitIds: [...movedUnitIds, movedUnit.id], // Mark unit as moved
      turnAction: 'movement', // Mark that movement was chosen
    });
  },

  addShot: (pos: Position) => {
    const { pendingShots, availableShots, turnAction } = get();

    // Cannot attack if already chose movement this turn
    if (turnAction === 'movement') {
      return;
    }

    if (pendingShots.length >= availableShots) return;

    // Check if position already targeted
    const alreadyTargeted = pendingShots.some(
      (p) => p.row === pos.row && p.col === pos.col
    );

    if (!alreadyTargeted) {
      set({
        pendingShots: [...pendingShots, pos],
        turnAction: 'attack', // Mark that attack was chosen
      });
    }
  },

  removeShot: (pos: Position) => {
    const { pendingShots } = get();

    set({
      pendingShots: pendingShots.filter(
        (p) => !(p.row === pos.row && p.col === pos.col)
      ),
    });
  },

  clearShots: () => {
    set({ pendingShots: [] });
  },

  processTurn: () => {
    const {
      playerUnits,
      opponentUnits,
      pendingShots,
      gameBoard,
      justDeployedUnitId,
      movedUnitIds,
    } = get();

    // Process shots
    let updatedOpponentUnits = [...opponentUnits];
    const updatedBoard = gameBoard.map((row) =>
      row.map((cell) => ({ ...cell }))
    );

    for (const shotPos of pendingShots) {
      const result = processShot(shotPos, updatedOpponentUnits, updatedBoard);

      if (result.hit && result.updatedUnit) {
        updatedOpponentUnits = updatedOpponentUnits.map((u) =>
          u.id === result.updatedUnit!.id ? result.updatedUnit! : u
        );
        updatedBoard[shotPos.row][shotPos.col].status = 'hit';
      } else {
        updatedBoard[shotPos.row][shotPos.col].status = 'miss';
      }
    }

    // Auto-move units forward ONLY if they haven't moved manually and aren't just deployed
    const updatedPlayerUnits = playerUnits.map((u) => {
      // Skip if unit is not deployed
      if (!u.deployed) return u;

      // Skip if unit was just deployed this turn (cannot move)
      if (u.id === justDeployedUnitId) return u;

      // Skip if unit has already moved manually
      if (movedUnitIds.includes(u.id)) return u;

      // Otherwise, auto-move forward
      return autoMoveUnitForward(u, playerUnits, true);
    });

    // Update visibility
    const visibleBoard = updateBoardVisibility(
      updatedBoard,
      updatedPlayerUnits,
      updatedOpponentUnits
    );

    // Check game over
    const gameResult = checkGameOver(updatedPlayerUnits, updatedOpponentUnits);

    set({
      playerUnits: updatedPlayerUnits,
      opponentUnits: updatedOpponentUnits,
      gameBoard: visibleBoard,
      pendingShots: [],
    });

    if (gameResult.isOver) {
      set({ phase: 'ended' });
    }
  },

  completeTurn: () => {
    const {
      playerUnits,
      opponentUnits,
      pendingShots,
      gameBoard,
      currentTurn,
      timePerTurn,
      movedUnitIds,
      justDeployedUnitId,
    } = get();

    // Process shots
    let updatedOpponentUnits = [...opponentUnits];
    const updatedBoard = gameBoard.map((row) =>
      row.map((cell) => ({ ...cell }))
    );

    for (const shotPos of pendingShots) {
      const result = processShot(shotPos, updatedOpponentUnits, updatedBoard);

      if (result.hit && result.updatedUnit) {
        updatedOpponentUnits = updatedOpponentUnits.map((u) =>
          u.id === result.updatedUnit!.id ? result.updatedUnit! : u
        );
        updatedBoard[shotPos.row][shotPos.col].status = 'hit';
      } else {
        updatedBoard[shotPos.row][shotPos.col].status = 'miss';
      }
    }

    // Auto-move units forward ONLY if they haven't moved manually and aren't just deployed
    const updatedPlayerUnits = playerUnits.map((u) => {
      // Skip if unit is not deployed
      if (!u.deployed) return u;

      // Skip if unit was just deployed this turn (cannot move)
      if (u.id === justDeployedUnitId) return u;

      // Skip if unit has already moved manually
      if (movedUnitIds.includes(u.id)) return u;

      // Otherwise, auto-move forward
      return autoMoveUnitForward(u, playerUnits, true);
    });

    // Update visibility
    const visibleBoard = updateBoardVisibility(
      updatedBoard,
      updatedPlayerUnits,
      updatedOpponentUnits
    );

    // Check game over
    const gameResult = checkGameOver(updatedPlayerUnits, updatedOpponentUnits);

    if (gameResult.isOver) {
      set({
        playerUnits: updatedPlayerUnits,
        opponentUnits: updatedOpponentUnits,
        gameBoard: visibleBoard,
        pendingShots: [],
        phase: 'ended',
      });
      return;
    }

    // Get next unit to deploy
    const nextUnit = getNextUnitToDeploy(updatedPlayerUnits);

    // If no more units to deploy, stay in battle phase
    if (!nextUnit) {
      set({
        playerUnits: updatedPlayerUnits,
        opponentUnits: updatedOpponentUnits,
        gameBoard: visibleBoard,
        pendingShots: [],
        currentTurn: currentTurn + 1,
        turnTimeRemaining: timePerTurn,
        availableShots: calculateAvailableShots(updatedPlayerUnits),
        movedUnitIds: [], // Reset moved units for next turn
        turnAction: null, // Reset action choice
      });
      return;
    }

    // Transition back to deployment phase for next ship
    set({
      playerUnits: updatedPlayerUnits,
      opponentUnits: updatedOpponentUnits,
      gameBoard: visibleBoard,
      pendingShots: [],
      phase: 'deployment',
      currentTurnPhase: 'deployment',
      pendingUnitDeployment: nextUnit,
      justDeployedUnitId: null,
      currentTurn: currentTurn + 1,
      turnTimeRemaining: timePerTurn,
      availableShots: 0,
      movedUnitIds: [], // Reset moved units for next turn
      turnAction: null, // Reset action choice
    });
  },

  handleTurnTimeout: () => {
    // When time runs out:
    // 1. Clear pending shots ("attack burns")
    // 2. Complete turn (which will auto-move unmoved units)
    set({ pendingShots: [] });
    get().completeTurn();
  },

  nextTurn: () => {
    const { currentTurn, timePerTurn, playerUnits } = get();

    set({
      currentTurn: currentTurn + 1,
      turnTimeRemaining: timePerTurn,
      availableShots: calculateAvailableShots(playerUnits),
    });
  },

  updateFromServer: (data: any) => {
    // TODO: Handle server updates
    set(data);
  },

  resetGame: () => {
    set({
      phase: 'lobby',
      currentTurn: 0,
      playerUnits: [],
      opponentUnits: [],
      gameBoard: createEmptyBoard(),
      pendingUnitDeployment: null,
      pendingShots: [],
      availableShots: 0,
      selectedCell: null,
      selectedUnitForMovement: null,
      justDeployedUnitId: null,
      movedUnitIds: [],
      turnAction: null,
      eventLog: [],
      playerVisibilityZones: [],
      opponentVisibilityZones: [],
      winner: null,
    });
  },
}));
