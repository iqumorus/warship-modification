import { useGameStore } from '../hooks/useGameStore';
import { UNIT_COUNTS, UnitType } from '../types/game';
import './TopPanel.css';

export default function TopPanel() {
    const phase = useGameStore((s) => s.phase);
    const currentTurn = useGameStore((s) => s.currentTurn);
    const turnTimeRemaining = useGameStore((s) => s.turnTimeRemaining);
    const playerUnits = useGameStore((s) => s.playerUnits);
    const availableShots = useGameStore((s) => s.availableShots);

    const getUnitCounts = () => {
        const counts: Record<UnitType, { total: number; deployed: number; alive: number }> = {
            single: { total: UNIT_COUNTS.single, deployed: 0, alive: 0 },
            double: { total: UNIT_COUNTS.double, deployed: 0, alive: 0 },
            triple: { total: UNIT_COUNTS.triple, deployed: 0, alive: 0 },
            quadruple: { total: UNIT_COUNTS.quadruple, deployed: 0, alive: 0 },
        };

        playerUnits.forEach((unit) => {
            if (unit.deployed) {
                counts[unit.type].deployed++;
                if (unit.health > 0) {
                    counts[unit.type].alive++;
                }
            }
        });

        return counts;
    };

    const unitCounts = getUnitCounts();

    const getUnitIcon = (type: UnitType) => {
        switch (type) {
            case 'single': return '⛵';
            case 'double': return '🚤';
            case 'triple': return '🛥️';
            case 'quadruple': return '🚢';
            default: return '⚓';
        }
    };

    const getUnitLabel = (type: UnitType) => {
        switch (type) {
            case 'single': return 'Одинарный';
            case 'double': return 'Двойной';
            case 'triple': return 'Тройной';
            case 'quadruple': return 'Четверной';
            default: return type;
        }
    };

    return (
        <div className="top-panel glass-panel">
            <div className="top-panel-section">
                <div className="panel-stat">
                    <span className="stat-label">Ход</span>
                    <span className="stat-value neon-text">{currentTurn}</span>
                </div>

                {phase === 'battle' && (
                    <>
                        <div className="panel-stat">
                            <span className="stat-label">Время</span>
                            <span className="stat-value neon-text timer">{turnTimeRemaining}s</span>
                        </div>
                        <div className="panel-stat">
                            <span className="stat-label">Выстрелов</span>
                            <span className="stat-value neon-text">{availableShots}</span>
                        </div>
                    </>
                )}
            </div>

            <div className="top-panel-divider"></div>

            <div className="units-overview">
                <h4 className="units-title">Флот</h4>
                <div className="units-grid">
                    {(Object.keys(UNIT_COUNTS) as UnitType[]).map((type) => (
                        <div key={type} className="unit-card">
                            <span className="unit-icon">{getUnitIcon(type)}</span>
                            <span className="unit-label">{getUnitLabel(type)}</span>
                            <span className="unit-count">
                                {unitCounts[type].alive}/{unitCounts[type].total}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
