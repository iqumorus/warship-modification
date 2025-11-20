import { useEffect } from 'react';
import { useGameStore } from '../hooks/useGameStore';
import './TurnTimer.css';

export default function TurnTimer() {
  const currentTurn = useGameStore((s) => s.currentTurn);
  const turnTimeRemaining = useGameStore((s) => s.turnTimeRemaining);
  const setTurnTimeRemaining = useGameStore((s) => s.setTurnTimeRemaining);
  const processTurn = useGameStore((s) => s.processTurn);
  const nextTurn = useGameStore((s) => s.nextTurn);
  const phase = useGameStore((s) => s.phase);
  
  useEffect(() => {
    if (phase !== 'battle') return;
    
    const interval = setInterval(() => {
      if (turnTimeRemaining > 0) {
        setTurnTimeRemaining(turnTimeRemaining - 1);
      } else {
        // Time's up, process turn
        processTurn();
        nextTurn();
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [turnTimeRemaining, phase, setTurnTimeRemaining, processTurn, nextTurn]);
  
  const getTimerClass = () => {
    if (turnTimeRemaining <= 5) return 'timer-critical';
    if (turnTimeRemaining <= 10) return 'timer-warning';
    return 'timer-normal';
  };
  
  if (phase !== 'battle') return null;
  
  return (
    <div className="turn-timer">
      <div className="turn-info">
        <span className="turn-label">Ход:</span>
        <span className="turn-number">{currentTurn + 1}</span>
      </div>
      
      <div className={`timer ${getTimerClass()}`}>
        <div className="timer-label">Время:</div>
        <div className="timer-value">{turnTimeRemaining}с</div>
      </div>
      
      <div className="timer-bar-container">
        <div
          className="timer-bar"
          style={{
            width: `${(turnTimeRemaining / 30) * 100}%`,
          }}
        ></div>
      </div>
    </div>
  );
}

