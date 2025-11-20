import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../hooks/useGameStore';
import GameBoard from '../components/GameBoard';
import UnitInfo from '../components/UnitInfo';
import TurnTimer from '../components/TurnTimer';
import DeploymentPanel from '../components/DeploymentPanel';
import BattlePanel from '../components/BattlePanel';
import TopPanel from '../components/TopPanel';
import EventLog from '../components/EventLog';
import './Game.css';

export default function Game() {
  const navigate = useNavigate();
  const phase = useGameStore((s) => s.phase);
  const playerUnits = useGameStore((s) => s.playerUnits);
  const opponentUnits = useGameStore((s) => s.opponentUnits);
  const playerBoard = useGameStore((s) => s.playerBoard);
  const opponentBoard = useGameStore((s) => s.opponentBoard);
  const selectedCell = useGameStore((s) => s.selectedCell);
  const pendingShots = useGameStore((s) => s.pendingShots);
  const selectDeploymentCell = useGameStore((s) => s.selectDeploymentCell);
  const addShot = useGameStore((s) => s.addShot);
  const removeShot = useGameStore((s) => s.removeShot);
  const resetGame = useGameStore((s) => s.resetGame);

  useEffect(() => {
    // Redirect to lobby if not in a valid game phase
    if (phase === 'lobby') {
      navigate('/');
    }
  }, [phase, navigate]);

  const handlePlayerCellClick = (pos: any) => {
    if (phase === 'deployment') {
      selectDeploymentCell(pos);
    }
  };

  const handleOpponentCellClick = (pos: any) => {
    if (phase === 'battle') {
      // Check if already selected
      const isSelected = pendingShots.some(
        (p) => p.row === pos.row && p.col === pos.col
      );

      if (isSelected) {
        removeShot(pos);
      } else {
        addShot(pos);
      }
    }
  };

  const handleExitGame = () => {
    if (confirm('Вы уверены, что хотите выйти из игры?')) {
      resetGame();
      navigate('/');
    }
  };

  if (phase === 'ended') {
    return (
      <div className="game-container">
        <div className="game-over-screen">
          <h1>🏆 Игра окончена!</h1>
          <p className="game-over-message">
            {/* We'll need to add winner info to state */}
            Спасибо за игру!
          </p>
          <button className="menu-button" onClick={handleExitGame}>
            Вернуться в меню
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <h1 className="game-title">⚓ МОРСКОЙ БОЙ</h1>
        <button className="exit-button" onClick={handleExitGame}>
          ❌ Выход
        </button>
      </div>

      <TopPanel />

      <div className="game-content">
        <div className="game-main">
          <div className="boards-container">
            <GameBoard
              board={playerBoard}
              isPlayerBoard={true}
              onCellClick={handlePlayerCellClick}
              selectedCell={phase === 'deployment' ? selectedCell : null}
              showUnits={true}
            />

            <GameBoard
              board={opponentBoard}
              isPlayerBoard={false}
              onCellClick={handleOpponentCellClick}
              highlightedCells={pendingShots}
              showUnits={false}
            />
          </div>
        </div>

        <div className="game-sidebar">
          <UnitInfo units={playerUnits} title="Ваши корабли" />

          {phase === 'deployment' && <DeploymentPanel />}
          {phase === 'battle' && <BattlePanel />}

          <EventLog />
        </div>
      </div>
    </div>
  );
}
