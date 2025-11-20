import { create } from 'zustand';
import {
  GamePhase,
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
  timePerTurn: number;
  turnTimeRemaining: number;

  // Units
  playerUnits: Unit[];
  opponentUnits: Unit[];

  // Boards
  playerBoard: Cell[][];
  opponentBoard: Cell[][];

  // Actions
  pendingUnitDeployment: Unit | null;
  pendingShots: Position[];
  availableShots: number;
  selectedCell: Position | null;
  selectedUnitForMovement: string | null;
  eventLog: GameEvent[];
  playerVisibilityZones: VisibilityZone[];
  opponentVisibilityZones: VisibilityZone[];
  winner: 'player' | 'opponent' | null;

  // Actions
  initGame: () => void;
  setPhase: (phase: GamePhase) => void;
  setTurnTimeRemaining: (time: number) => void;

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
  timePerTurn: 30,
  turnTimeRemaining: 30,
  playerUnits: [],
  opponentUnits: [],
  playerBoard: createEmptyBoard(),
  opponentBoard: createEmptyBoard(),
  pendingUnitDeployment: null,
  pendingShots: [],
  availableShots: 0,
  selectedCell: null,
  selectedUnitForMovement: null,
  eventLog: [],
  playerVisibilityZones: [],
  opponentVisibilityZones: [],
  winner: null,

  setConnected: (v: boolean) => set({ connected: v }),
  setRoomId: (id: string | null) => set({ roomId: id }),
  setPlayers: (players: Player[]) => set({ players }),
  setPhase: (phase: GamePhase) => set({ phase }),
  setTurnTimeRemaining: (time: number) => set({ turnTimeRemaining: time }),

  initGame: () => {
    const playerUnits = createInitialUnits('player');
    const opponentUnits = createInitialUnits('opponent');
    const playerBoard = createEmptyBoard();
    const opponentBoard = createEmptyBoard();

    set({
      phase: 'deployment',
      currentTurn: 0,
      playerUnits,
      opponentUnits,
      playerBoard,
      opponentBoard,
      pendingUnitDeployment: getNextUnitToDeploy(playerUnits),
      pendingShots: [],
      availableShots: 0,
    });
  },

  selectDeploymentCell: (pos: Position) => {
    const { pendingUnitDeployment, playerUnits } = get();

    if (!pendingUnitDeployment) return;

    if (isValidDeploymentPosition(pos, playerUnits, true)) {
      set({ selectedCell: pos });
    }
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
    // TODO: Implement unit selection for movement
  },

  moveSelectedUnit: (pos: Position) => {
    // TODO: Implement unit movement
  },

  addShot: (pos: Position) => {
    const { pendingShots, availableShots } = get();

    if (pendingShots.length >= availableShots) return;

    // Check if position already targeted
    const alreadyTargeted = pendingShots.some(
      (p) => p.row === pos.row && p.col === pos.col
    );

    if (!alreadyTargeted) {
      set({ pendingShots: [...pendingShots, pos] });
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
      opponentBoard,
      playerBoard,
    } = get();

    // Process shots
    let updatedOpponentUnits = [...opponentUnits];
    const updatedOpponentBoard = opponentBoard.map((row) =>
      row.map((cell) => ({ ...cell }))
    );

    for (const shotPos of pendingShots) {
      const result = processShot(shotPos, updatedOpponentUnits, updatedOpponentBoard);

      if (result.hit && result.updatedUnit) {
        updatedOpponentUnits = updatedOpponentUnits.map((u) =>
          u.id === result.updatedUnit!.id ? result.updatedUnit! : u
        );
        updatedOpponentBoard[shotPos.row][shotPos.col].status = 'hit';
      } else {
        updatedOpponentBoard[shotPos.row][shotPos.col].status = 'miss';
      }
    }

    // Auto-move units forward
    const updatedPlayerUnits = playerUnits.map((u) =>
      u.deployed ? autoMoveUnitForward(u, playerUnits, true) : u
    );

    // Update visibility
    const visibleOpponentBoard = updateBoardVisibility(
      updatedOpponentBoard,
      updatedPlayerUnits,
      updatedOpponentUnits
    );

    // Check game over
    const gameResult = checkGameOver(updatedPlayerUnits, updatedOpponentUnits);

    set({
      playerUnits: updatedPlayerUnits,
      opponentUnits: updatedOpponentUnits,
      opponentBoard: visibleOpponentBoard,
      pendingShots: [],
    });

    if (gameResult.isOver) {
      set({ phase: 'ended' });
    }
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
      playerBoard: createEmptyBoard(),
      opponentBoard: createEmptyBoard(),
      pendingUnitDeployment: null,
      pendingShots: [],
      availableShots: 0,
      selectedCell: null,
      selectedUnitForMovement: null,
      eventLog: [],
      playerVisibilityZones: [],
      opponentVisibilityZones: [],
      winner: null,
    });
  },
}));
