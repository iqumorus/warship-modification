import { useGameStore } from '../hooks/useGameStore';
import './BattlePanel.css';

export default function BattlePanel() {
  const availableShots = useGameStore((s) => s.availableShots);
  const pendingShots = useGameStore((s) => s.pendingShots);
  const clearShots = useGameStore((s) => s.clearShots);
  const processTurn = useGameStore((s) => s.processTurn);
  const nextTurn = useGameStore((s) => s.nextTurn);
  
  const handleConfirmTurn = () => {
    processTurn();
    nextTurn();
  };
  
  return (
    <div className="battle-panel">
      <h3>Панель действий</h3>
      
      <div className="shots-info">
        <div className="shots-available">
          <span className="shots-label">Доступно выстрелов:</span>
          <span className="shots-value">{availableShots}</span>
        </div>
        
        <div className="shots-selected">
          <span className="shots-label">Выбрано целей:</span>
          <span className="shots-value selected">{pendingShots.length}</span>
        </div>
      </div>
      
      <div className="shots-progress">
        <div
          className="shots-progress-bar"
          style={{
            width: `${(pendingShots.length / Math.max(availableShots, 1)) * 100}%`,
          }}
        ></div>
      </div>
      
      <div className="battle-instructions">
        <p>Выберите клетки на поле противника для атаки</p>
        {pendingShots.length > 0 && (
          <p className="targets-list">
            Цели: {pendingShots.map((p) => `${String.fromCharCode(65 + p.col)}${p.row + 1}`).join(', ')}
          </p>
        )}
      </div>
      
      <div className="battle-actions">
        <button
          className="clear-button"
          disabled={pendingShots.length === 0}
          onClick={clearShots}
        >
          Очистить
        </button>
        
        <button
          className="confirm-button"
          disabled={pendingShots.length === 0}
          onClick={handleConfirmTurn}
        >
          Подтвердить ход
        </button>
      </div>
      
      <div className="battle-tips">
        <h4>💡 Подсказки:</h4>
        <ul>
          <li>Корабли автоматически движутся вперед каждый ход</li>
          <li>Попадание по кораблю уменьшает его уровень</li>
          <li>Каждый корабль имеет радиус обзора</li>
        </ul>
      </div>
    </div>
  );
}

