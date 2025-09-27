import { useEffect, useMemo, useState } from 'react';

const FILTER_DEFINITIONS = [
  {
    value: 'all',
    label: 'All Destinations',
    predicate: () => true
  },
  {
    value: 'inner-worlds',
    label: 'Inner Worlds',
    predicate: (body) =>
      ['mercury', 'venus', 'earth', 'moon', 'mars'].includes(body.id)
  },
  {
    value: 'outer-giants',
    label: 'Gas & Ice Giants',
    predicate: (body) =>
      ['jupiter', 'saturn', 'uranus', 'neptune'].includes(body.id)
  },
  {
    value: 'stellar',
    label: 'Stellar Targets',
    predicate: (body) => body.id === 'sun'
  }
];

const VISITED_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'visited', label: 'Visited' },
  { value: 'unvisited', label: 'Unvisited' }
];

function computeDailyChallenge(bodies) {
  if (!bodies.length) return null;
  const today = new Date().toISOString().slice(0, 10);
  const hash = today
    .split('')
    .reduce((accumulator, char) => accumulator + char.charCodeAt(0), 0);
  return bodies[hash % bodies.length];
}

export default function NavigationConsole({
  bodies = [],
  selectedBodyId,
  visitedBodies,
  onSelectBody,
  onMarkVisited,
  onBeginExploration
}) {
  const [filterValue, setFilterValue] = useState('all');
  const [visitFilter, setVisitFilter] = useState('all');

  const visitedSet = useMemo(() => {
    if (visitedBodies instanceof Set) return visitedBodies;
    if (Array.isArray(visitedBodies)) return new Set(visitedBodies);
    return new Set();
  }, [visitedBodies]);

  const filteredBodies = useMemo(() => {
    const filterDefinition =
      FILTER_DEFINITIONS.find((definition) => definition.value === filterValue) || FILTER_DEFINITIONS[0];

    return bodies
      .filter((body) => filterDefinition.predicate(body))
      .filter((body) => {
        if (visitFilter === 'visited') {
          return visitedSet.has(body.id);
        }
        if (visitFilter === 'unvisited') {
          return !visitedSet.has(body.id);
        }
        return true;
      })
      .sort((a, b) => (a.semiMajorAxis ?? 0) - (b.semiMajorAxis ?? 0));
  }, [bodies, filterValue, visitFilter, visitedSet]);

  const selectedBody = useMemo(
    () => bodies.find((body) => body.id === selectedBodyId) || null,
    [bodies, selectedBodyId]
  );

  useEffect(() => {
    if (!filteredBodies.length) {
      return;
    }
    const isSelectedInFilter = filteredBodies.some((body) => body.id === selectedBodyId);
    if (!isSelectedInFilter) {
      onSelectBody(filteredBodies[0].id);
    }
  }, [filteredBodies, onSelectBody, selectedBodyId]);

  function handleCycle(step) {
    if (!filteredBodies.length) return;
    const currentIndex = filteredBodies.findIndex((body) => body.id === selectedBodyId);
    const safeIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextIndex = (safeIndex + step + filteredBodies.length) % filteredBodies.length;
    onSelectBody(filteredBodies[nextIndex].id);
  }

  const challengeBody = useMemo(() => computeDailyChallenge(bodies), [bodies]);
  const challengeCompleted = challengeBody ? visitedSet.has(challengeBody.id) : false;

  return (
    <section className="navigation-console" aria-label="Navigation Console">
      <header>
        <h2>Navigation Console</h2>
        <p>Filter your flight plan and keep tabs on your exploration streak.</p>
      </header>

      <label className="console-filter">
        Destination filter
        <select value={filterValue} onChange={(event) => setFilterValue(event.target.value)}>
          {FILTER_DEFINITIONS.map((definition) => (
            <option key={definition.value} value={definition.value}>
              {definition.label}
            </option>
          ))}
        </select>
      </label>

      <div className="console-toggle" role="group" aria-label="Visited filter">
        {VISITED_FILTERS.map((filterOption) => (
          <button
            key={filterOption.value}
            type="button"
            className={visitFilter === filterOption.value ? 'active' : ''}
            onClick={() => setVisitFilter(filterOption.value)}
          >
            {filterOption.label}
          </button>
        ))}
      </div>

      <div className="console-active">
        <div>
          <h3>Active destination</h3>
          <p>{selectedBody ? selectedBody.name : 'Select a celestial body'}</p>
        </div>
        <div className="console-actions">
          <button type="button" onClick={() => handleCycle(-1)} disabled={!filteredBodies.length}>
            ◂ Previous
          </button>
          <button type="button" onClick={() => handleCycle(1)} disabled={!filteredBodies.length}>
            Next ▸
          </button>
          <button
            type="button"
            className="primary"
            onClick={() => selectedBody && onBeginExploration(selectedBody.id)}
            disabled={!selectedBody}
          >
            Launch mission
          </button>
        </div>
      </div>

      <div className="console-manifest">
        <h4>Filtered manifest</h4>
        {filteredBodies.length ? (
          <ul>
            {filteredBodies.map((body) => (
              <li key={body.id}>
                <button
                  type="button"
                  className={body.id === selectedBodyId ? 'active' : ''}
                  onClick={() => onSelectBody(body.id)}
                >
                  <span>{body.name}</span>
                  {visitedSet.has(body.id) && <span className="badge">Visited</span>}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="console-empty">No bodies match the current filters.</p>
        )}
      </div>

      {challengeBody && (
        <article className={`console-card ${challengeCompleted ? 'complete' : ''}`}>
          <header>
            <h3>Daily Challenge</h3>
            <span>{challengeCompleted ? 'Complete' : 'Pending'}</span>
          </header>
          <p>
            Plot a course to <strong>{challengeBody.name}</strong> to keep your streak going.
          </p>
          <div className="console-card__actions">
            <button type="button" onClick={() => onSelectBody(challengeBody.id)}>
              Focus target
            </button>
            <button
              type="button"
              className="primary"
              onClick={() =>
                challengeCompleted ? onBeginExploration(challengeBody.id) : onMarkVisited(challengeBody.id)
              }
            >
              {challengeCompleted ? 'Review mission data' : 'Mark visited'}
            </button>
          </div>
        </article>
      )}
    </section>
  );
}
