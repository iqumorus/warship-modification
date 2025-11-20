import { useGameStore } from '../hooks/useGameStore';
import './EventLog.css';

export default function EventLog() {
    const eventLog = useGameStore((s) => s.eventLog || []);

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'hit': return '💥';
            case 'miss': return '💨';
            case 'destroyed': return '☠️';
            case 'deployed': return '⚓';
            case 'moved': return '➡️';
            case 'turn': return '🔄';
            default: return 'ℹ️';
        }
    };

    const getEventClass = (type: string) => {
        switch (type) {
            case 'hit':
            case 'destroyed':
                return 'event-danger';
            case 'deployed':
                return 'event-success';
            case 'turn':
                return 'event-info';
            default:
                return 'event-default';
        }
    };

    return (
        <div className="event-log glass-panel">
            <div className="event-log-header">
                <h3>📜 Журнал событий</h3>
            </div>
            <div className="event-log-content">
                {eventLog.length === 0 ? (
                    <div className="event-log-empty">
                        <p>События появятся здесь...</p>
                    </div>
                ) : (
                    <div className="event-log-list">
                        {[...eventLog].reverse().map((event) => (
                            <div
                                key={event.id}
                                className={`event-item ${getEventClass(event.type)}`}
                            >
                                <span className="event-icon">{getEventIcon(event.type)}</span>
                                <span className="event-message">{event.message}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
