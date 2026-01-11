import { Cell, Position, getColumnLabel, getRowLabel } from '../types/game';
import './GameBoard.css';

interface GameBoardProps {
  board: Cell[][];
  isPlayerBoard: boolean;
  onCellClick?: (pos: Position) => void;
  selectedCell?: Position | null;
  highlightedCells?: Position[];
  movementCells?: Position[];
  showUnits?: boolean;
  playerUnits?: any[];
}

export default function GameBoard({
  board,
  isPlayerBoard,
  onCellClick,
  selectedCell,
  highlightedCells = [],
  movementCells = [],
  showUnits = false,
  playerUnits = [],
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

    const isMovementCell = movementCells.some(
      (p) => p.row === cell.position.row && p.col === cell.position.col
    );
    if (isMovementCell) {
      classes.push('cell-movement');
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
      <div className="game-board">
        {/* Column headers */}
        <div className="board-row header-row">
          <div className="board-cell header-cell corner-cell"></div>
          {Array.from({ length: 10 }).map((_, col) => (
            <div key={col} className="board-cell header-cell">
              {getColumnLabel(col)}
            </div>
          ))}
        </div>

        {/* Board rows */}
        {board.map((row, rowIdx) => (
          <div key={rowIdx} className="board-row">
            {/* Row header on the left */}
            <div className="board-cell header-cell">{getRowLabel(rowIdx)}</div>

            {/* Cells */}
            {row.map((cell) => (
              <div
                key={`${cell.position.row}-${cell.position.col}`}
                className={`board-cell ${getCellClassName(cell)}`}
                onClick={() => handleCellClick(cell.position)}
              >
                {showUnits && cell.unitId && cell.status === 'unit' && (() => {
                  const unit = playerUnits.find((u: any) => u.id === cell.unitId);
                  if (unit) {
                    return (
                      <div className="ship-cannon-count">
                        {unit.health}
                      </div>
                    );
                  }
                  return null;
                })()}
                {cell.status === 'hit' && <div className="cell-marker hit">X</div>}
                {cell.status === 'miss' && <div className="cell-marker miss">•</div>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

