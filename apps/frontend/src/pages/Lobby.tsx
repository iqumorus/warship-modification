import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../hooks/useGameStore';
import './Lobby.css';

export default function Lobby() {
  const navigate = useNavigate();
  const connected = useGameStore((s) => s.connected);
  const initGame = useGameStore((s) => s.initGame);
  
  const handleStartGame = () => {
    initGame();
    navigate('/game');
  };
  
  const handleQuickPlay = () => {
    // For now, just start a local game
    initGame();
    navigate('/game');
  };
  
  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <h1>⚓ Морской Бой</h1>
        <p className="subtitle">Модифицированная версия классической игры</p>
      </div>
      
      <div className="connection-status">
        <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}></span>
        <span className="status-text">
          {connected ? 'Подключено к серверу' : 'Автономный режим'}
        </span>
      </div>
      
      <div className="lobby-content">
        <div className="game-info">
          <h2>📋 Правила игры</h2>
          <div className="rules-grid">
            <div className="rule-card">
              <div className="rule-icon">🎯</div>
              <h3>Цель</h3>
              <p>Уничтожить все корабли противника</p>
            </div>
            
            <div className="rule-card">
              <div className="rule-icon">🚢</div>
              <h3>Корабли</h3>
              <p>4 одинарных, 3 двойных, 2 тройных, 1 четверной</p>
            </div>
            
            <div className="rule-card">
              <div className="rule-icon">👁️</div>
              <h3>Обзор</h3>
              <p>Каждый корабль имеет радиус обзора (1-4 клетки)</p>
            </div>
            
            <div className="rule-card">
              <div className="rule-icon">💥</div>
              <h3>Атака</h3>
              <p>Количество выстрелов равно уровню корабля</p>
            </div>
            
            <div className="rule-card">
              <div className="rule-icon">🎲</div>
              <h3>Размещение</h3>
              <p>Корабли размещаются в первом ряду по очереди</p>
            </div>
            
            <div className="rule-card">
              <div className="rule-icon">⚡</div>
              <h3>Движение</h3>
              <p>Корабли автоматически движутся вперед каждый ход</p>
            </div>
          </div>
        </div>
        
        <div className="lobby-actions">
          <button className="play-button primary" onClick={handleQuickPlay}>
            <span className="button-icon">🎮</span>
            <span className="button-text">Быстрая игра</span>
          </button>
          
          <button className="play-button secondary" onClick={handleStartGame}>
            <span className="button-icon">🎯</span>
            <span className="button-text">Создать комнату</span>
          </button>
          
          <button className="play-button secondary" disabled>
            <span className="button-icon">🔍</span>
            <span className="button-text">Найти игру</span>
            <span className="coming-soon">(скоро)</span>
          </button>
        </div>
      </div>
      
      <div className="lobby-footer">
        <p>Версия 1.0.0 | Игра разработана с использованием React + TypeScript</p>
      </div>
    </div>
  );
}

