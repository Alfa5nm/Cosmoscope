import { Suspense, forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';
import { celestialBodies, getBodyById } from '../data/celestialBodies.js';
import { getVisitedBodies, markBodyVisited } from '../utils/progress.js';
import { useSpaceAudio } from '../state/SpaceAudioContext.js';
import NavigationConsole from '../components/NavigationConsole.jsx';
import { useBodyTextureMaps } from '../utils/textureRegistry.js';

const OrbitRing = forwardRef(function OrbitRing({ semiMajor, semiMinor, inclination = 0 }, ref) {
  const points = useMemo(() => {
    if (!semiMajor || !semiMinor) return [];
    const segments = 128;
    const pts = [];
    const inclinationRad = THREE.MathUtils.degToRad(inclination);
    const cosInc = Math.cos(inclinationRad);
    const sinInc = Math.sin(inclinationRad);
    for (let i = 0; i <= segments; i += 1) {
      const theta = (i / segments) * Math.PI * 2;
      const x = semiMajor * Math.cos(theta);
      const z = semiMinor * Math.sin(theta);
      const y = z * sinInc;
      const zInclined = z * cosInc;
      pts.push(new THREE.Vector3(x, y, zInclined));
    }
    return pts;
  }, [semiMajor, semiMinor, inclination]);

  if (!points.length) {
    return null;
  }

  return (
    <group ref={ref}>
      <lineLoop>
        <bufferGeometry attach="geometry" setFromPoints={points} />
        <lineBasicMaterial attach="material" color="#3b4262" linewidth={1} />
      </lineLoop>
    </group>
  );
});

function CelestialBody({ body, isSelected, onSelect, onExplore, onPositionUpdate, getBodyPosition }) {
  const groupRef = useRef();
  const meshRef = useRef();
  const tiltGroupRef = useRef();
  const orbitRingRef = useRef();
  const worldPosition = useRef(new THREE.Vector3());
  const orbitalPosition = useRef(new THREE.Vector3());
  const orbitAngle = useRef(Math.random() * Math.PI * 2);
  const textureMaps = useBodyTextureMaps(body);

  const ringTexture = useMemo(() => {
    if (!body.rings) return null;
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, size * 0.2, size / 2, size / 2, size / 2);
    body.rings.colorStops.forEach((stop) => {
      gradient.addColorStop(stop.offset, stop.color);
    });
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, [body.rings]);

  useEffect(() => {
    if (!ringTexture) return undefined;
    return () => {
      ringTexture.dispose();
    };
  }, [ringTexture]);

  useEffect(() => {
    if (tiltGroupRef.current) {
      tiltGroupRef.current.rotation.z = THREE.MathUtils.degToRad(body.axialTilt || 0);
    }
  }, [body.axialTilt]);

  useFrame(({ clock }) => {
    const delta = clock.getDelta();
    orbitAngle.current += body.orbitRate * delta;
    const angle = orbitAngle.current;
    const x = body.semiMajorAxis * Math.cos(angle);
    const z = body.semiMinorAxis * Math.sin(angle);
    const inclinationRad = body.inclinationRad || 0;
    const y = z * Math.sin(inclinationRad);
    const zInclined = z * Math.cos(inclinationRad);

    orbitalPosition.current.set(x, y, zInclined);
    let parentCoords = null;

    if (body.parentId && getBodyPosition) {
      const parent = getBodyPosition(body.parentId);
      if (parent) {
        parentCoords = parent;
        orbitalPosition.current.x += parent[0];
        orbitalPosition.current.y += parent[1];
        orbitalPosition.current.z += parent[2];
      }
    }

    if (groupRef.current) {
      groupRef.current.position.copy(orbitalPosition.current);
    }

    if (onPositionUpdate) {
      onPositionUpdate(body.id, orbitalPosition.current);
    }

    if (meshRef.current) {
      meshRef.current.rotation.y += body.rotationRate * delta;
    }

    if (orbitRingRef.current) {
      if (parentCoords) {
        orbitRingRef.current.position.set(parentCoords[0], parentCoords[1], parentCoords[2]);
      } else {
        orbitRingRef.current.position.set(0, 0, 0);
      }
    }
  });

  return (
    <>
      {body.semiMajorAxis > 0 && (
        <OrbitRing
          ref={orbitRingRef}
          semiMajor={body.semiMajorAxis}
          semiMinor={body.semiMinorAxis}
          inclination={body.inclination}
        />
      )}
      <group ref={groupRef}>
        <group ref={tiltGroupRef}>
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
            <meshStandardMaterial
              color={body.color}
              emissive={body.id === 'sun' ? '#c96f15' : '#111'}
              emissiveIntensity={body.id === 'sun' ? 0.35 : 0.2}
              map={textureMaps?.map}
              normalMap={textureMaps?.normalMap}
              emissiveMap={textureMaps?.emissiveMap}
            />
            {body.rings && ringTexture && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[body.rings.innerRadius, body.rings.outerRadius, 128]} />
                <meshStandardMaterial
                  map={ringTexture}
                  transparent
                  opacity={0.85}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                />
              </mesh>
            )}
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
      </group>
    </>
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
    return initial ? [initial.semiMajorAxis, 0, 0] : [0, 0, 0];
  });
  const [visitedBodies, setVisitedBodies] = useState(() => getVisitedBodies());
  const { start } = useSpaceAudio();
  const bodyPositionsRef = useRef(new Map());

  useEffect(() => {
    start();
  }, [start]);

  const handlePositionUpdate = useCallback((bodyId, position) => {
    bodyPositionsRef.current.set(bodyId, [position.x, position.y, position.z]);
  }, []);

  const handleConsoleSelect = useCallback((bodyId) => {
    const body = getBodyById(bodyId);
    if (!body) return;
    setSelectedBodyId(bodyId);
    const stored = bodyPositionsRef.current.get(bodyId);
    if (stored) {
      setFocusPosition([stored[0], stored[1], stored[2]]);
    } else {
      setFocusPosition([body.semiMajorAxis, 0, 0]);
    }
  }, []);

  const getBodyPosition = useCallback((bodyId) => bodyPositionsRef.current.get(bodyId), []);

  const handleMarkVisited = useCallback((bodyId) => {
    const updated = markBodyVisited(bodyId);
    setVisitedBodies(updated);
  }, []);

  const handleSelect = useCallback((body, worldPosition) => {
    setSelectedBodyId(body.id);
    setFocusPosition([worldPosition.x, worldPosition.y, worldPosition.z]);
  }, []);

  const handleExplore = useCallback(
    (body) => {
      handleMarkVisited(body.id);
      navigate(`/explore/${body.id}`);
    },
    [handleMarkVisited, navigate]
  );

  const handleBeginExploration = useCallback(
    (bodyId) => {
      const body = getBodyById(bodyId);
      if (body) {
        handleExplore(body);
      }
    },
    [handleExplore]
  );

  const selectedBody = getBodyById(selectedBodyId);

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
        <section className="solar-stage">
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
                  onPositionUpdate={handlePositionUpdate}
                  getBodyPosition={getBodyPosition}
                />
              ))}
              <CameraRig focusPosition={focusPosition} />
              <OrbitControls enablePan={false} enableZoom enableDamping dampingFactor={0.1} minDistance={6} maxDistance={120} />
            </Canvas>
          </Suspense>
        </section>
        <div className="solar-sidebar">
          <NavigationConsole
            bodies={celestialBodies}
            selectedBodyId={selectedBodyId}
            visitedBodies={visitedBodies}
            onSelectBody={handleConsoleSelect}
            onMarkVisited={handleMarkVisited}
            onBeginExploration={handleBeginExploration}
          />
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
        </div>
      </main>
    </div>
  );
}
