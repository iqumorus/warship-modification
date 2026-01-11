import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../hooks/useGameStore';
import './Lobby.css';

interface TimeControl {
  id: string;
  label: string;
  timePerMove: number; // seconds
}

const TIME_CONTROLS: TimeControl[] = [
  { id: '30s', label: '30 сек', timePerMove: 30 },
  { id: '1m', label: '1 мин', timePerMove: 60 },
  { id: '2m', label: '2 мин', timePerMove: 120 },
  { id: '3m', label: '3 мин', timePerMove: 180 },
  { id: '5m', label: '5 мин', timePerMove: 300 },
  { id: '10m', label: '10 мин', timePerMove: 600 },
  { id: 'unlimited', label: 'Без ограничений', timePerMove: 0 },
];

export default function Lobby() {
  const navigate = useNavigate();
  const initGame = useGameStore((s) => s.initGame);
  const setTimePerTurn = useGameStore((s) => s.setTimePerTurn);

  const handleTimeControlClick = (timeControl: TimeControl) => {
    // Set time per turn based on selection
    if (timeControl.timePerMove > 0) {
      setTimePerTurn(timeControl.timePerMove);
    } else {
      setTimePerTurn(9999); // Unlimited time
    }
    initGame();
    navigate('/game');
  };

  return (
    <div className="lobby-container">
      <h1 className="lobby-title">Морской Бой</h1>

      <div className="time-controls-grid">
        {TIME_CONTROLS.map((tc) => (
          <button
            key={tc.id}
            className="time-control-card"
            onClick={() => handleTimeControlClick(tc)}
          >
            <div className="time-label">{tc.label}</div>
            <div className="time-description">на ход</div>
          </button>
        ))}
      </div>
    </div>
  );
}

