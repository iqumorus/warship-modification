import { Cell, Position, getColumnLabel, getRowLabel } from '../types/game';
import './GameBoard.css';

interface GameBoardProps {
  board: Cell[][];
  isPlayerBoard: boolean;
  onCellClick?: (pos: Position) => void;
  selectedCell?: Position | null;
  highlightedCells?: Position[];
  showUnits?: boolean;
}

export default function GameBoard({
  board,
  isPlayerBoard,
  onCellClick,
  selectedCell,
  highlightedCells = [],
  showUnits = false,
}: GameBoardProps) {
  const getCellClassName = (cell: Cell): string => {
    const classes = ['cell'];

    classes.push(`cell-${cell.status}`);

    if (
      selectedCell &&
      cell.position.row === selectedCell.row &&
      cell.position.col === selectedCell.col
    ) {
      classes.push('cell-selected');
    }

    const isHighlighted = highlightedCells.some(
      (p) => p.row === cell.position.row && p.col === cell.position.col
    );
    if (isHighlighted) {
      classes.push('cell-highlighted');
    }

    if (!isPlayerBoard && !cell.visible) {
      classes.push('cell-fog');
    }

    return classes.join(' ');
  };

  const handleCellClick = (pos: Position) => {
    if (onCellClick) {
      onCellClick(pos);
    }
  };

  return (
    <div className="game-board-container">
      <div className="board-title">{isPlayerBoard ? 'Ваше поле' : 'Поле противника'}</div>

      <div className="game-board">
        {/* Column headers */}
        <div className="board-row header-row">
          <div className="board-cell header-cell"></div>
          {Array.from({ length: 10 }).map((_, col) => (
            <div key={col} className="board-cell header-cell">
              {getColumnLabel(col)}
            </div>
          ))}
        </div>

        {/* Board rows */}
        {board.map((row, rowIdx) => (
          <div key={rowIdx} className="board-row">
            {/* Row header */}
            <div className="board-cell header-cell">{getRowLabel(rowIdx)}</div>

            {/* Cells */}
            {row.map((cell) => (
              <div
                key={`${cell.position.row}-${cell.position.col}`}
                className={`board-cell ${getCellClassName(cell)}`}
                onClick={() => handleCellClick(cell.position)}
              >
                {showUnits && cell.unitId && (
                  <div className="cell-unit">
                    {cell.status === 'unit' ? '🚢' : ''}
                  </div>
                )}
                {cell.status === 'hit' && <div className="cell-marker hit">💥</div>}
                {cell.status === 'miss' && <div className="cell-marker miss">💨</div>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

