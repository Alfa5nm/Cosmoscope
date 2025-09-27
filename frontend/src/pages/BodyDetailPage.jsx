import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getBodyById } from '../data/celestialBodies.js';
import { getVisitedBodies, markBodyVisited } from '../utils/progress.js';
import { useSpaceAudio } from '../state/SpaceAudioContext.js';

function useDatasetsForBody(datasetCategory) {
  const [state, setState] = useState({ status: 'idle', datasets: [] });

  useEffect(() => {
    let cancelled = false;
    async function loadDatasets() {
      setState({ status: 'loading', datasets: [] });
      try {
        const response = await fetch('/api/datasets');
        if (!response.ok) {
          throw new Error('Failed to load datasets');
        }
        const data = await response.json();
        const datasets = Array.isArray(data.datasets) ? data.datasets : [];
        const filtered = datasets.filter((dataset) => {
          if (!datasetCategory) return false;
          if (dataset.category === datasetCategory) return true;
          if (datasetCategory === 'earth' && dataset.category === 'moon') return false;
          return dataset.id?.includes(datasetCategory);
        });
        if (!cancelled) {
          setState({ status: 'success', datasets: filtered });
        }
      } catch (error) {
        if (!cancelled) {
          setState({ status: 'error', datasets: [], error: error.message });
        }
      }
    }

    if (datasetCategory) {
      loadDatasets();
    } else {
      setState({ status: 'success', datasets: [] });
    }

    return () => {
      cancelled = true;
    };
  }, [datasetCategory]);

  return state;
}

function useMediaGallery(query) {
  const [state, setState] = useState({ status: 'idle', items: [] });

  useEffect(() => {
    if (!query) {
      setState({ status: 'success', items: [] });
      return;
    }

    let cancelled = false;
    async function loadMedia() {
      setState({ status: 'loading', items: [] });
      try {
        const response = await fetch(
          `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image&year_start=2000&year_end=2024`
        );
        if (!response.ok) {
          throw new Error('Failed to load media');
        }
        const data = await response.json();
        const items = data.collection?.items?.slice(0, 6) || [];
        const mapped = items
          .map((item) => ({
            id: item.data?.[0]?.nasa_id || item.href,
            title: item.data?.[0]?.title || 'NASA Imagery',
            description: item.data?.[0]?.description || '',
            href: item.links?.[0]?.href || item.href
          }))
          .filter((item) => Boolean(item.href));
        if (!cancelled) {
          setState({ status: 'success', items: mapped });
        }
      } catch (error) {
        if (!cancelled) {
          setState({ status: 'error', items: [], error: error.message });
        }
      }
    }

    loadMedia();
    return () => {
      cancelled = true;
    };
  }, [query]);

  return state;
}

const TAB_CONFIG = [
  { id: 'datasets', label: 'Datasets', description: 'Mission telemetry & research feeds' },
  { id: 'media', label: 'Media Gallery', description: 'Imagery and highlights from NASA archives' },
  { id: 'missions', label: 'Missions', description: 'Run recon checklists to mark this world explored' }
];

export default function BodyDetailPage() {
  const { bodyId } = useParams();
  const navigate = useNavigate();
  const body = useMemo(() => getBodyById(bodyId), [bodyId]);
  const { start } = useSpaceAudio();
  const datasetState = useDatasetsForBody(body?.datasetCategory);
  const mediaState = useMediaGallery(body?.nasaQuery);
  const [apodState, setApodState] = useState({ status: 'idle', data: null });
  const [activeTab, setActiveTab] = useState('datasets');
  const [missions, setMissions] = useState([]);
  const [isFullyExplored, setIsFullyExplored] = useState(false);

  const missionTemplates = useMemo(() => {
    if (!body) return [];

    const genericMissions = [
      {
        id: 'scan-poles',
        title: 'Scan the poles',
        description: `Sweep ${body.name}'s polar regions for volatile deposits and hidden terrain features.`,
        objectives: ['Calibrate orbital sensors', 'Execute north pole sweep', 'Execute south pole sweep']
      },
      {
        id: 'terrain-map',
        title: 'Compile landing zones',
        description: `Assemble a hazard map of ${body.name}'s surface to brief landing teams and rover pilots.`,
        objectives: ['Deploy surveyor drones', 'Stitch terrain mosaics', 'Flag hazards for mission control']
      },
      {
        id: 'anomaly-pass',
        title: 'Log anomaly pass',
        description: `Record atmospheric or magnetospheric anomalies encountered near ${body.name}.`,
        objectives: ['Run environmental diagnostics', 'Capture anomaly telemetry', 'Transmit findings to Deep Space Network']
      }
    ];

    const specializedMissions = {
      sun: [
        {
          id: 'coronal-weather',
          title: 'Profile coronal weather',
          description: 'Tune coronagraphs to isolate active regions driving solar wind streams.',
          objectives: ['Stabilize spacecraft attitude', 'Capture coronal mass imagery', 'Update heliophysics forecast']
        },
        {
          id: 'solar-flare-watch',
          title: 'Solar flare watch',
          description: 'Monitor x-ray flux for eruptive events that could impact communication arrays.',
          objectives: ['Prime flare monitors', 'Log X-class candidates', 'Alert Deep Space Network teams']
        },
        {
          id: 'magnetics',
          title: 'Trace magnetic ribbons',
          description: 'Model the twisting magnetic ribbons feeding the next flare cycle.',
          objectives: ['Collect magnetogram series', 'Simulate flux emergence', 'Upload modeling results']
        }
      ],
      moon: [
        {
          id: 'shadow-mapping',
          title: 'Shadow crater mapping',
          description: 'Illuminate permanently shadowed craters to confirm water-ice reservoirs.',
          objectives: ['Point reflector arrays', 'Ping Shackleton rim', 'Catalog reflectance anomalies']
        },
        {
          id: 'relay-test',
          title: 'Artemis relay test',
          description: 'Verify that the near-rectilinear halo orbit relay maintains downlink coverage.',
          objectives: ['Align relay antennas', 'Test bandwidth thresholds', 'Report readiness to Gateway']
        },
        {
          id: 'regolith',
          title: 'Regolith sample rehearsal',
          description: 'Practice the sampling choreography for upcoming crewed sorties.',
          objectives: ['Position sample arm', 'Collect regolith simulant', 'Secure cache pods']
        }
      ]
    };

    return specializedMissions[body.id] ?? genericMissions;
  }, [body]);

  useEffect(() => {
    start();
  }, [start]);

  useEffect(() => {
    if (!bodyId || missionTemplates.length === 0) return;

    const visited = getVisitedBodies();
    const alreadyExplored = visited.has(bodyId);

    setIsFullyExplored(alreadyExplored);
    setMissions(
      missionTemplates.map((mission) => ({
        ...mission,
        objectives: mission.objectives.map((objective, index) => ({
          id: `${mission.id}-${index}`,
          label: objective,
          completed: alreadyExplored
        }))
      }))
    );
  }, [bodyId, missionTemplates]);

  useEffect(() => {
    if (!bodyId || missions.length === 0) return;

    const allComplete = missions.every((mission) => mission.objectives.every((objective) => objective.completed));
    if (allComplete && !isFullyExplored) {
      markBodyVisited(bodyId);
      setIsFullyExplored(true);
    }
  }, [missions, bodyId, isFullyExplored]);

  useEffect(() => {
    if (!body || body.id !== 'sun') {
      setApodState({ status: 'success', data: null });
      return;
    }

    let cancelled = false;
    async function loadApod() {
      setApodState({ status: 'loading', data: null });
      try {
        const response = await fetch('/api/apod');
        if (!response.ok) {
          throw new Error('Unable to load Astronomy Picture of the Day');
        }
        const data = await response.json();
        if (!cancelled) {
          setApodState({ status: 'success', data });
        }
      } catch (error) {
        if (!cancelled) {
          setApodState({ status: 'error', data: null, error: error.message });
        }
      }
    }

    loadApod();
    return () => {
      cancelled = true;
    };
  }, [body]);

  if (!body) {
    return (
      <div className="body-detail missing">
        <h1>Unknown Destination</h1>
        <p>The selected celestial body is not in our registry.</p>
        <button className="primary" onClick={() => navigate('/explore')}>
          Return to Navigator
        </button>
      </div>
    );
  }

  const handleObjectiveToggle = (missionId, objectiveId) => {
    if (isFullyExplored) return;
    setMissions((prev) =>
      prev.map((mission) => {
        if (mission.id !== missionId) return mission;
        return {
          ...mission,
          objectives: mission.objectives.map((objective) =>
            objective.id === objectiveId ? { ...objective, completed: !objective.completed } : objective
          )
        };
      })
    );
  };

  const handleAutoComplete = (missionId) => {
    setMissions((prev) =>
      prev.map((mission) => {
        if (mission.id !== missionId) return mission;
        return {
          ...mission,
          objectives: mission.objectives.map((objective) => ({ ...objective, completed: true }))
        };
      })
    );
  };

  return (
    <div className="body-detail">
      <header>
        <button onClick={() => navigate('/explore')}>⟵ Back to Solar System</button>
        <h1>{body.name} Exploration Brief</h1>
      </header>
      <section className="body-summary">
        <p>{body.description}</p>
        <ul>
          {body.highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      </section>
      <section className="intel-tabs" aria-label="Exploration intelligence panels">
        <div className="intel-tabs__list" role="tablist" aria-orientation="horizontal">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`${tab.id}-tab`}
              className={`tab-button${activeTab === tab.id ? ' is-active' : ''}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-button__label">{tab.label}</span>
              <span className="tab-button__hint">{tab.description}</span>
            </button>
          ))}
        </div>
        <div className="intel-tabs__panels">
          <div
            role="tabpanel"
            id="datasets-panel"
            aria-labelledby="datasets-tab"
            aria-hidden={activeTab !== 'datasets'}
            tabIndex={activeTab === 'datasets' ? 0 : -1}
            className={`tab-panel${activeTab === 'datasets' ? ' is-active' : ''}`}
          >
            <section className="body-datasets">
              <h2>NASA Datasets</h2>
              {datasetState.status === 'loading' && <p>Retrieving datasets…</p>}
              {datasetState.status === 'error' && <p className="error">{datasetState.error}</p>}
              {datasetState.status === 'success' && datasetState.datasets.length === 0 && (
                <p>No mission datasets yet — check back soon for new telemetry.</p>
              )}
              <div className="dataset-grid">
                {datasetState.datasets.map((dataset) => (
                  <article key={dataset.id}>
                    <h3>{dataset.name}</h3>
                    <p>{dataset.description}</p>
                    {dataset.attribution && <p className="attribution">{dataset.attribution}</p>}
                  </article>
                ))}
              </div>
            </section>
          </div>
          <div
            role="tabpanel"
            id="media-panel"
            aria-labelledby="media-tab"
            aria-hidden={activeTab !== 'media'}
            tabIndex={activeTab === 'media' ? 0 : -1}
            className={`tab-panel${activeTab === 'media' ? ' is-active' : ''}`}
          >
            <section className="body-media">
              <h2>NASA Media Gallery</h2>
              {mediaState.status === 'loading' && <p>Loading mission gallery…</p>}
              {mediaState.status === 'error' && <p className="error">{mediaState.error}</p>}
              {mediaState.status === 'success' && mediaState.items.length === 0 && <p>No imagery found for this target.</p>}
              <div className="media-grid">
                {mediaState.items.map((item) => (
                  <a key={item.id} href={item.href} target="_blank" rel="noreferrer" className="media-card">
                    <img src={item.href} alt={item.title} loading="lazy" />
                    <div>
                      <h3>{item.title}</h3>
                      {item.description && <p>{item.description.slice(0, 120)}…</p>}
                    </div>
                  </a>
                ))}
              </div>
            </section>
          </div>
          <div
            role="tabpanel"
            id="missions-panel"
            aria-labelledby="missions-tab"
            aria-hidden={activeTab !== 'missions'}
            tabIndex={activeTab === 'missions' ? 0 : -1}
            className={`tab-panel${activeTab === 'missions' ? ' is-active' : ''}`}
          >
            <section className="body-missions">
              <h2>Mission Checklists</h2>
              <p>
                Complete each objective to simulate the reconnaissance routines for {body.name}. When every checklist item is
                verified, the body is flagged as fully explored in your mission log.
              </p>
              {missions.length > 0 ? (
                <ul className="mission-list">
                  {missions.map((mission) => {
                    const completedObjectives = mission.objectives.filter((objective) => objective.completed).length;
                    const statusLabel =
                      completedObjectives === mission.objectives.length
                        ? 'Completed'
                        : completedObjectives > 0
                        ? 'In progress'
                        : 'Awaiting launch';

                    return (
                      <li key={mission.id} className={`mission-card mission-card--${statusLabel.replace(/\s+/g, '-').toLowerCase()}`}>
                        <header>
                          <h3>{mission.title}</h3>
                          <span className="mission-status">{statusLabel}</span>
                        </header>
                        <p>{mission.description}</p>
                        <div className="mission-objectives" role="group" aria-label={`${mission.title} objectives`}>
                          {mission.objectives.map((objective) => (
                            <label key={objective.id} className={objective.completed ? 'is-complete' : ''}>
                              <input
                                type="checkbox"
                                disabled={isFullyExplored}
                                checked={objective.completed}
                                onChange={() => handleObjectiveToggle(mission.id, objective.id)}
                              />
                              <span>{objective.label}</span>
                            </label>
                          ))}
                        </div>
                        {!isFullyExplored && completedObjectives < mission.objectives.length && (
                          <button type="button" className="secondary" onClick={() => handleAutoComplete(mission.id)}>
                            Run quick simulation
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="muted">Mission control is loading tailored objectives…</p>
              )}
              {isFullyExplored && (
                <div className="mission-complete">
                  <strong>✅ Fully explored.</strong> {body.name} is archived as complete in your mission history.
                </div>
              )}
            </section>
          </div>
        </div>
      </section>
      {body.id === 'sun' && (
        <section className="body-apod">
          <h2>Astronomy Picture of the Day</h2>
          {apodState.status === 'loading' && <p>Loading featured solar imagery…</p>}
          {apodState.status === 'error' && <p className="error">{apodState.error}</p>}
          {apodState.status === 'success' && apodState.data && (
            <article>
              <img src={apodState.data.url} alt={apodState.data.title} loading="lazy" />
              <div>
                <h3>{apodState.data.title}</h3>
                <p>{apodState.data.explanation}</p>
              </div>
            </article>
          )}
        </section>
      )}
      <footer className="body-footer">
        <button className="secondary" onClick={() => navigate('/workbench')}>
          Launch Advanced Research Workbench
        </button>
      </footer>
    </div>
  );
}
