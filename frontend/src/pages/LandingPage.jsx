import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpaceAudio } from '../state/SpaceAudioContext.js';
import { celestialBodies } from '../data/celestialBodies.js';
import { getVisitedBodies } from '../utils/progress.js';

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (event) => setPrefersReducedMotion(event.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

function SpaceBackdrop() {
  const canvasRef = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    let animationFrame;
    let running = true;
    const asteroids = Array.from({ length: 80 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.0008 + 0.0002,
      drift: Math.random() * 0.0006 - 0.0003
    }));

    function resizeCanvas() {
      const { innerWidth, innerHeight } = window;
      canvas.width = innerWidth;
      canvas.height = innerHeight;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const starDensity = prefersReducedMotion ? 80 : 180;
    const stars = Array.from({ length: starDensity }, () => ({
      x: Math.random(),
      y: Math.random(),
      opacity: Math.random() * 0.7 + 0.2
    }));

    function render(time) {
      if (!running) return;
      const { width, height } = canvas;
      context.clearRect(0, 0, width, height);

      const gradient = context.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#03040f');
      gradient.addColorStop(1, '#090c2b');
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      context.save();
      context.globalCompositeOperation = 'lighter';
      stars.forEach((star) => {
        context.globalAlpha = star.opacity;
        context.fillStyle = '#aab9ff';
        context.beginPath();
        context.arc(star.x * width, star.y * height, prefersReducedMotion ? 0.6 : 1.2, 0, Math.PI * 2);
        context.fill();
      });
      context.restore();

      if (!prefersReducedMotion) {
        asteroids.forEach((asteroid, index) => {
          const speedMultiplier = 1 + index * 0.0008;
          asteroid.x += asteroid.speed * speedMultiplier;
          asteroid.y += asteroid.drift * speedMultiplier;
          if (asteroid.x > 1.1 || asteroid.y > 1.2 || asteroid.y < -0.2) {
            asteroid.x = -0.1;
            asteroid.y = Math.random();
          }

          context.save();
          context.translate(asteroid.x * width, asteroid.y * height);
          context.rotate((time * 0.0002 + index) % (Math.PI * 2));
          const gradient = context.createRadialGradient(0, 0, asteroid.size * 0.3, 0, 0, asteroid.size * 4);
          gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
          gradient.addColorStop(1, 'rgba(97, 126, 196, 0)');
          context.fillStyle = gradient;
          context.beginPath();
          context.ellipse(0, 0, asteroid.size * 6, asteroid.size * 2.2, 0, 0, Math.PI * 2);
          context.fill();
          context.restore();
        });
      }

      animationFrame = window.requestAnimationFrame(render);
    }

    animationFrame = window.requestAnimationFrame(render);

    return () => {
      running = false;
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [prefersReducedMotion]);

  return <canvas ref={canvasRef} className="landing-backdrop" aria-hidden="true" />;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { isPlaying, start, toggle } = useSpaceAudio();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [visitedBodies, setVisitedBodies] = useState(() => getVisitedBodies());

  useEffect(() => {
    setVisitedBodies(getVisitedBodies());
  }, []);

  const progress = useMemo(() => {
    const total = celestialBodies.length;
    const visited = visitedBodies.size;
    return { visited, total, percentage: Math.round((visited / total) * 100) };
  }, [visitedBodies]);

  function handleStart() {
    start();
    navigate('/explore');
  }

  const topTargets = celestialBodies.slice(0, 5);

  return (
    <div className="landing-root">
      <SpaceBackdrop />
      <div className="landing-gradient" aria-hidden="true" />
      <div className="landing-content" role="main">
        <header className="landing-header">
          <span className="landing-subtitle">Mission Control</span>
          <h1>Cosmoscope Expedition Program</h1>
          <p>
            Chart the solar system, earn mission patches, and unlock curated NASA datasets. The journey begins on our Kerbal-inspired
            flight deck where ambient synths hum and asteroids drift by.
          </p>
        </header>
        <div className="landing-actions">
          <button className="primary" onClick={handleStart}>
            Start Exploring
          </button>
          <button className="secondary" onClick={toggle}>
            {isPlaying ? 'Pause Ambient Audio' : 'Play Ambient Audio'}
          </button>
        </div>
        <section className="landing-progress" aria-live="polite">
          <h2>Mission Progress</h2>
          <p>
            Visited bodies: {progress.visited} / {progress.total} ({Number.isFinite(progress.percentage) ? progress.percentage : 0}% complete)
          </p>
          <ul>
            {topTargets.map((body) => (
              <li key={body.id} className={visitedBodies.has(body.id) ? 'visited' : ''}>
                <span>{body.name}</span>
                <span>{visitedBodies.has(body.id) ? '✓ Logged' : 'Awaiting Briefing'}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="landing-footer">
          <p>
            Prefer data-first reconnaissance? Dive into the{' '}
            <button className="link" onClick={() => navigate('/workbench')}>
              research workbench
            </button>{' '}
            to analyze NASA imagery layers directly.
          </p>
          {prefersReducedMotion && <p className="motion-note">Reduced motion mode enabled — animations are simplified.</p>}
        </section>
      </div>
    </div>
  );
}
