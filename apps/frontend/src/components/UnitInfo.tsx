import { Unit, UnitType, UNIT_COUNTS } from '../types/game';
import './UnitInfo.css';

interface UnitInfoProps {
  units: Unit[];
  title: string;
}

const unitEmojis: Record<UnitType, string> = {
  single: '🚤',
  double: '⛵',
  triple: '🚢',
  quadruple: '🛳️',
};

const unitNames: Record<UnitType, string> = {
  single: 'Одинарный',
  double: 'Двойной',
  triple: 'Тройной',
  quadruple: 'Четверной',
};

export default function UnitInfo({ units, title }: UnitInfoProps) {
  const getUnitsByType = (type: UnitType) => {
    return units.filter((u) => u.type === type);
  };
  
  const getDeployedCount = (type: UnitType) => {
    return units.filter((u) => u.type === type && u.deployed).length;
  };
  
  const getTotalCount = (type: UnitType) => {
    return UNIT_COUNTS[type];
  };
  
  const getAliveCount = (type: UnitType) => {
    return units.filter((u) => u.type === type && u.deployed && u.health > 0).length;
  };
  
  return (
    <div className="unit-info">
      <h3 className="unit-info-title">{title}</h3>
      
      <div className="unit-list">
        {Object.keys(UNIT_COUNTS).map((type) => {
          const unitType = type as UnitType;
          const deployed = getDeployedCount(unitType);
          const total = getTotalCount(unitType);
          const alive = getAliveCount(unitType);
          
          return (
            <div key={type} className="unit-type-row">
              <span className="unit-emoji">{unitEmojis[unitType]}</span>
              <span className="unit-name">{unitNames[unitType]}</span>
              <span className="unit-count">
                {alive}/{total}
              </span>
              {deployed < total && (
                <span className="unit-status pending">
                  (осталось: {total - deployed})
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

