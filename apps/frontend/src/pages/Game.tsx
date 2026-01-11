import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../hooks/useGameStore';
import GameBoard from '../components/GameBoard';
import './Game.css';

export default function Game() {
  const navigate = useNavigate();
  const phase = useGameStore((s) => s.phase);
  const setPhase = useGameStore((s) => s.setPhase);
  const gameBoard = useGameStore((s) => s.gameBoard);
  const selectedCell = useGameStore((s) => s.selectedCell);
  const pendingShots = useGameStore((s) => s.pendingShots);
  const availableShots = useGameStore((s) => s.availableShots);
  const availableMovementCells = useGameStore((s) => s.availableMovementCells);
  const playerUnits = useGameStore((s) => s.playerUnits);
  const opponentUnits = useGameStore((s) => s.opponentUnits);
  const pendingUnitDeployment = useGameStore((s) => s.pendingUnitDeployment);
  const turnTimeRemaining = useGameStore((s) => s.turnTimeRemaining);
  const setTurnTimeRemaining = useGameStore((s) => s.setTurnTimeRemaining);
  const selectDeploymentCell = useGameStore((s) => s.selectDeploymentCell);
  const selectUnitToMove = useGameStore((s) => s.selectUnitToMove);
  const moveSelectedUnit = useGameStore((s) => s.moveSelectedUnit);
  const addShot = useGameStore((s) => s.addShot);
  const removeShot = useGameStore((s) => s.removeShot);
  const resetGame = useGameStore((s) => s.resetGame);
  const completeTurn = useGameStore((s) => s.completeTurn);
  const turnAction = useGameStore((s) => s.turnAction);

  // Timer state
  const [prematchCountdown, setPrematchCountdown] = useState(5);

  useEffect(() => {
    // Redirect to lobby if not in a valid game phase
    if (phase === 'lobby') {
      navigate('/');
    }
  }, [phase, navigate]);

  // Prematch countdown (5 seconds before game starts)
  useEffect(() => {
    if (phase === 'prematch') {
      setPrematchCountdown(5);
      const interval = setInterval(() => {
        setPrematchCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [phase]);

  // Transition to deployment when countdown reaches 0
  useEffect(() => {
    if (phase === 'prematch' && prematchCountdown === 0) {
      setPhase('deployment');
    }
  }, [phase, prematchCountdown, setPhase]);

  const handleTurnTimeout = useGameStore((s) => s.handleTurnTimeout);

  // Auto-complete turn after movement choice
  useEffect(() => {
    if (phase === 'battle' && turnAction === 'movement') {
      const timer = setTimeout(() => {
        completeTurn();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [phase, turnAction, completeTurn]);

  // Battle timer countdown
  useEffect(() => {
    if (phase === 'battle' || phase === 'deployment') {
      const interval = setInterval(() => {
        useGameStore.getState().setTurnTimeRemaining(
          useGameStore.getState().turnTimeRemaining - 1
        );
        if (useGameStore.getState().turnTimeRemaining <= 1) {
          // Timer expired - handle auto actions
          handleTurnTimeout();
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [phase, handleTurnTimeout]);

  const handleBoardClick = (pos: any) => {
    // Block clicks during prematch
    if (phase === 'prematch') {
      return;
    }

    if (phase === 'deployment') {
      // Check if clicking on a movement cell
      const isMovementClick = availableMovementCells.some(
        (p) => p.row === pos.row && p.col === pos.col
      );

      if (isMovementClick) {
        moveSelectedUnit(pos);
      } else {
        // Check if clicking on a deployed unit to move it
        const clickedUnit = playerUnits.find(
          (u) => u.deployed && u.position &&
            u.position.row === pos.row &&
            u.position.col === pos.col
        );

        if (clickedUnit) {
          selectUnitToMove(clickedUnit.id);
        } else {
          // Normal deployment
          selectDeploymentCell(pos);
        }
      }
    } else if (phase === 'battle') {
      // During battle phase:
      // - If clicking on movement cell, move the unit
      // - If clicking on player unit, select it for movement
      // - Otherwise, select cell for attack

      const isMovementClick = availableMovementCells.some(
        (p) => p.row === pos.row && p.col === pos.col
      );

      if (isMovementClick) {
        moveSelectedUnit(pos);
      } else {
        // Check if clicking on a deployed player unit to move it
        const clickedUnit = playerUnits.find(
          (u) => u.deployed && u.position &&
            u.position.row === pos.row &&
            u.position.col === pos.col
        );

        if (clickedUnit) {
          selectUnitToMove(clickedUnit.id);
        } else {
          // Select cell for attack
          const isSelected = pendingShots.some(
            (p) => p.row === pos.row && p.col === pos.col
          );

          if (isSelected) {
            removeShot(pos);
          } else {
            addShot(pos);
          }
        }
      }
    }
  };

  const handleCompleteTurn = () => {
    completeTurn();
  };

  const handleExitGame = () => {
    if (confirm('Вы уверены, что хотите выйти из игры?')) {
      resetGame();
      navigate('/');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (phase === 'ended') {
    return (
      <div className="game-container">
        <div className="game-over-screen">
          <h1>Игра окончена!</h1>
          <p className="game-over-message">Спасибо за игру!</p>
          <button className="menu-button" onClick={handleExitGame}>
            Вернуться в меню
          </button>
        </div>
      </div>
    );
  }

  // Display prematch countdown
  if (phase === 'prematch') {
    return (
      <div className="game-container">
        <div className="prematch-screen">
          <h1 className="prematch-title">Игра начнётся через</h1>
          <div className="prematch-countdown">{prematchCountdown}</div>
        </div>
        <button className="exit-button" onClick={handleExitGame}>
          Выход
        </button>
      </div>
    );
  }

  return (
    <div className="game-container">
      {(phase === 'battle' || phase === 'deployment') && (
        <>
          <div className="game-timer">
            {formatTime(turnTimeRemaining)}
          </div>

          {phase === 'deployment' && pendingUnitDeployment && (
            <div className="deployment-info">
              Разместите корабль: {pendingUnitDeployment.type} ({pendingUnitDeployment.health} {pendingUnitDeployment.health === 1 ? 'пушка' : 'пушки'})
            </div>
          )}

          {phase === 'battle' && (
            <>
              <div className="attack-counter">
                Доступно атак: {availableShots - pendingShots.length} / {availableShots}
              </div>
              {turnAction === 'movement' && (
                <div className="action-info">
                  Выбрано: Движение корабля (ход завершится автоматически)
                </div>
              )}
              {turnAction === 'attack' && (
                <div className="action-info">
                  Выбрано: Атака
                </div>
              )}
              {!turnAction && (
                <div className="action-info">
                  Выберите: Переместить корабль ИЛИ Атаковать
                </div>
              )}
            </>
          )}
        </>
      )}

      <div className="game-board-wrapper">
        <GameBoard
          board={gameBoard}
          isPlayerBoard={true}
          onCellClick={handleBoardClick}
          selectedCell={phase === 'deployment' ? selectedCell : null}
          highlightedCells={phase === 'battle' ? pendingShots : []}
          movementCells={availableMovementCells}
          showUnits={true}
          playerUnits={[...playerUnits, ...opponentUnits]}
        />
      </div>

      {phase === 'battle' && turnAction === 'attack' && (
        <div className="turn-actions">
          <button className="complete-turn-button" onClick={handleCompleteTurn}>
            Завершить ход
          </button>
        </div>
      )}

      <button className="exit-button" onClick={handleExitGame}>
        Выход
      </button>
    </div>
  );
}
