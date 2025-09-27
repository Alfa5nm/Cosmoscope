import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';
import { celestialBodies, getBodyById } from '../data/celestialBodies.js';
import { getVisitedBodies, markBodyVisited } from '../utils/progress.js';
import { useSpaceAudio } from '../state/SpaceAudioContext.js';

function OrbitRing({ radius }) {
  const points = useMemo(() => {
    const segments = 64;
    const pts = [];
    for (let i = 0; i <= segments; i += 1) {
      const theta = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
    }
    return pts;
  }, [radius]);

  return (
    <lineLoop>
      <bufferGeometry attach="geometry" setFromPoints={points} />
      <lineBasicMaterial attach="material" color="#3b4262" linewidth={1} />
    </lineLoop>
  );
}

function CelestialBody({ body, isSelected, onSelect, onExplore }) {
  const groupRef = useRef();
  const meshRef = useRef();
  const worldPosition = useRef(new THREE.Vector3());

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    const orbitAngle = elapsed * body.orbitSpeed;
    const x = Math.cos(orbitAngle) * body.orbitRadius;
    const z = Math.sin(orbitAngle) * body.orbitRadius;
    if (groupRef.current) {
      groupRef.current.position.set(x, 0, z);
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += body.rotationSpeed;
    }
  });

  return (
    <group ref={groupRef}>
      {body.orbitRadius > 0 && <OrbitRing radius={body.orbitRadius} />}
      <mesh
        ref={meshRef}
        position={[0, 0, 0]}
        onClick={(event) => {
          event.stopPropagation();
          if (groupRef.current) {
            onSelect(body, groupRef.current.getWorldPosition(worldPosition.current.clone()));
          } else {
            onSelect(body, new THREE.Vector3());
          }
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        <sphereGeometry args={[body.size, 32, 32]} />
        <meshStandardMaterial color={body.color} emissive={body.id === 'sun' ? '#c96f15' : '#111'} emissiveIntensity={0.2} />
        {isSelected && (
          <Html distanceFactor={12} transform position={[0, body.size * 1.4, 0]}>
            <article className="body-tooltip">
              <h3>{body.name}</h3>
              <p>{body.description}</p>
              <button onClick={() => onExplore(body)}>Explore</button>
            </article>
          </Html>
        )}
      </mesh>
    </group>
  );
}

function CameraRig({ focusPosition }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(...focusPosition));
  const desiredPosition = useRef(new THREE.Vector3());

  useEffect(() => {
    target.current.set(focusPosition[0], focusPosition[1], focusPosition[2]);
  }, [focusPosition]);

  useFrame(() => {
    desiredPosition.current.copy(target.current);
    desiredPosition.current.add(
      new THREE.Vector3(0, focusPosition[0] === 0 ? 12 : 6, focusPosition[0] === 0 ? 25 : 14)
    );
    camera.position.lerp(desiredPosition.current, 0.05);
    camera.lookAt(target.current);
  });

  return null;
}

export default function SolarSystemPage() {
  const navigate = useNavigate();
  const [selectedBodyId, setSelectedBodyId] = useState('earth');
  const [focusPosition, setFocusPosition] = useState(() => {
    const initial = getBodyById('earth');
    return initial ? [initial.orbitRadius, 0, 0] : [0, 0, 0];
  });
  const [visitedBodies, setVisitedBodies] = useState(() => getVisitedBodies());
  const { start } = useSpaceAudio();

  useEffect(() => {
    start();
  }, [start]);

  const selectedBody = getBodyById(selectedBodyId);

  function handleSelect(body, worldPosition) {
    setSelectedBodyId(body.id);
    setFocusPosition([worldPosition.x, worldPosition.y, worldPosition.z]);
  }

  function handleExplore(body) {
    const updated = markBodyVisited(body.id);
    setVisitedBodies(updated);
    navigate(`/explore/${body.id}`);
  }

  const progressPercentage = Math.round((visitedBodies.size / celestialBodies.length) * 100);

  return (
    <div className="solar-root">
      <header className="solar-hud">
        <button onClick={() => navigate('/')}>⟵ Mission Control</button>
        <div className="solar-status">
          <h1>Solar System Navigator</h1>
          <p>{selectedBody ? `${selectedBody.name} briefing loaded.` : 'Select a body to begin.'}</p>
          <p>
            Progress: {visitedBodies.size} / {celestialBodies.length} bodies ({Number.isFinite(progressPercentage) ? progressPercentage : 0}% tracked)
          </p>
        </div>
        <button onClick={() => navigate('/workbench')} className="secondary">
          Open Research Workbench
        </button>
      </header>
      <main className="solar-main">
        <Suspense fallback={<div className="solar-loading">Preparing star charts…</div>}>
          <Canvas camera={{ position: [0, 12, 55], fov: 50 }} shadows>
            <color attach="background" args={[0x02030f]} />
            <ambientLight intensity={0.2} />
            <pointLight position={[0, 0, 0]} intensity={2.5} color="#ffdca8" />
            <Stars radius={120} depth={40} count={3000} factor={6} saturation={0} fade speed={0.5} />
            {celestialBodies.map((body) => (
              <CelestialBody
                key={body.id}
                body={body}
                isSelected={body.id === selectedBodyId}
                onSelect={handleSelect}
                onExplore={handleExplore}
              />
            ))}
            <CameraRig focusPosition={focusPosition} />
            <OrbitControls enablePan={false} enableZoom enableDamping dampingFactor={0.1} minDistance={6} maxDistance={120} />
          </Canvas>
        </Suspense>
        <aside className="solar-briefing" aria-live="polite">
          {selectedBody ? (
            <div>
              <h2>{selectedBody.name} Mission Briefing</h2>
              <p>{selectedBody.description}</p>
              <ul>
                {selectedBody.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
              <button className="primary" onClick={() => handleExplore(selectedBody)}>
                Explore NASA Data
              </button>
            </div>
          ) : (
            <p>Select a body to view its briefing.</p>
          )}
        </aside>
      </main>
    </div>
  );
}
