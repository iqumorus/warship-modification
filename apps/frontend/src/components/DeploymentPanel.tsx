import { useGameStore } from '../hooks/useGameStore';
import { UnitType } from '../types/game';
import './DeploymentPanel.css';

const unitEmojis: Record<UnitType, string> = {
  single: '🚤',
  double: '⛵',
  triple: '🚢',
  quadruple: '🛳️',
};

const unitNames: Record<UnitType, string> = {
  single: 'Одинарный корабль',
  double: 'Двойной корабль',
  triple: 'Тройной корабль',
  quadruple: 'Четверной корабль',
};

export default function DeploymentPanel() {
  const pendingUnit = useGameStore((s) => s.pendingUnitDeployment);
  const selectedCell = useGameStore((s) => s.selectedCell);
  const confirmDeployment = useGameStore((s) => s.confirmDeployment);
  
  if (!pendingUnit) {
    return (
      <div className="deployment-panel">
        <h3>Размещение завершено!</h3>
        <p>Ожидание начала битвы...</p>
      </div>
    );
  }
  
  return (
    <div className="deployment-panel">
      <h3>Размещение кораблей</h3>
      
      <div className="current-unit">
        <div className="unit-display">
          <span className="unit-emoji-large">{unitEmojis[pendingUnit.type]}</span>
          <div className="unit-details">
            <h4>{unitNames[pendingUnit.type]}</h4>
            <div className="unit-stats">
              <div className="stat">
                <span className="stat-label">Жизни:</span>
                <span className="stat-value">{pendingUnit.health}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Радиус обзора:</span>
                <span className="stat-value">{pendingUnit.health}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Выстрелов:</span>
                <span className="stat-value">{pendingUnit.health}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="deployment-instructions">
        <p>Выберите клетку в первом ряду для размещения корабля</p>
      </div>
      
      <button
        className="deploy-button"
        disabled={!selectedCell}
        onClick={confirmDeployment}
      >
        {selectedCell ? 'Разместить корабль' : 'Выберите клетку'}
      </button>
    </div>
  );
}

