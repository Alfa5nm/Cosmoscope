import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getBodyById } from '../data/celestialBodies.js';
import { markBodyVisited } from '../utils/progress.js';
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

export default function BodyDetailPage() {
  const { bodyId } = useParams();
  const navigate = useNavigate();
  const body = useMemo(() => getBodyById(bodyId), [bodyId]);
  const { start } = useSpaceAudio();
  const datasetState = useDatasetsForBody(body?.datasetCategory);
  const mediaState = useMediaGallery(body?.nasaQuery);
  const [apodState, setApodState] = useState({ status: 'idle', data: null });

  useEffect(() => {
    start();
  }, [start]);

  useEffect(() => {
    if (!bodyId) return;
    markBodyVisited(bodyId);
  }, [bodyId]);

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
