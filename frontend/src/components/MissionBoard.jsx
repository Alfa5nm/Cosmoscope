import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { celestialBodies } from '../data/celestialBodies.js';
import { getVisitedBodies } from '../utils/progress.js';

const FEATURED_MISSIONS = celestialBodies.slice(0, 5);

function deriveInitialMission(visitedSet) {
  const nextTarget = FEATURED_MISSIONS.find((body) => !visitedSet.has(body.id));
  return nextTarget ? nextTarget.id : FEATURED_MISSIONS[0]?.id ?? '';
}

function makeBadgeStyle(color) {
  return {
    background: `radial-gradient(circle at 30% 30%, ${color}, rgba(8, 13, 28, 0.9))`,
    boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.05), 0 16px 34px rgba(4, 8, 20, 0.55)'
  };
}

export default function MissionBoard({ visitedBodies, onMissionComplete }) {
  const [localVisited, setLocalVisited] = useState(() => visitedBodies ?? getVisitedBodies());
  const [activeMission, setActiveMission] = useState(() => deriveInitialMission(localVisited));

  useEffect(() => {
    if (!visitedBodies) return;
    setLocalVisited(visitedBodies);
  }, [visitedBodies]);

  useEffect(() => {
    setActiveMission((previous) => {
      if (previous && FEATURED_MISSIONS.some((body) => body.id === previous)) {
        return previous;
      }
      return deriveInitialMission(localVisited);
    });
  }, [localVisited]);

  const missionDetails = useMemo(() => FEATURED_MISSIONS, []);

  function handleMissionSelect(event) {
    setActiveMission(event.target.value);
  }

  function handleCompleteMission(missionId) {
    if (localVisited.has(missionId)) return;
    if (onMissionComplete) {
      const result = onMissionComplete(missionId);
      if (result instanceof Set) {
        setLocalVisited(result);
        return;
      }
    }
    setLocalVisited((prev) => {
      const next = new Set(prev);
      next.add(missionId);
      return next;
    });
  }

  return (
    <div className="mission-board" aria-label="Mission control board">
      <div className="mission-board-console">
        <label htmlFor="active-mission-select" className="mission-board-label">
          Active mission
        </label>
        <div className="mission-board-select">
          <select
            id="active-mission-select"
            value={activeMission}
            onChange={handleMissionSelect}
            aria-describedby="mission-status"
          >
            {missionDetails.map((body) => (
              <option key={body.id} value={body.id}>
                {body.name}
              </option>
            ))}
          </select>
          <span id="mission-status" className="mission-board-status">
            {localVisited.has(activeMission) ? 'Mission logged' : 'Awaiting deployment'}
          </span>
        </div>
      </div>
      <div className="mission-card-grid">
        {missionDetails.map((body) => {
          const isActive = activeMission === body.id;
          const isCompleted = localVisited.has(body.id);
          const missionTag = (body.datasetCategory ?? body.id).toUpperCase();
          const badgeInitials = body.name
            .split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 3)
            .toUpperCase();

          return (
            <article
              key={body.id}
              className={`mission-card${isActive ? ' active' : ''}${isCompleted ? ' completed' : ''}`}
            >
              <div className="mission-card-badge" style={makeBadgeStyle(body.color)} aria-hidden="true">
                <span className="mission-card-initials">{badgeInitials}</span>
              </div>
              <div className="mission-card-body">
                <header>
                  <h3>{body.name}</h3>
                  <span className="mission-card-status">
                    {isCompleted ? 'Mission Complete' : isActive ? 'Standing By' : 'Queued'}
                  </span>
                </header>
                <p>{body.highlights?.[0] ?? body.description}</p>
                <footer className="mission-card-actions">
                  <span className="mission-card-tag">Mission Tag: {missionTag}</span>
                  <button
                    type="button"
                    onClick={() => handleCompleteMission(body.id)}
                    disabled={isCompleted}
                    className="mission-card-button"
                  >
                    {isCompleted ? 'Logged' : 'Mark Complete'}
                  </button>
                </footer>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

MissionBoard.propTypes = {
  visitedBodies: PropTypes.instanceOf(Set),
  onMissionComplete: PropTypes.func
};

MissionBoard.defaultProps = {
  visitedBodies: undefined,
  onMissionComplete: undefined
};
