import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';
import { celestialBodies, getBodyById } from '../data/celestialBodies.js';
import { buildTextureSet } from '../utils/textureGenerators.js';
import { getVisitedBodies, markBodyVisited } from '../utils/progress.js';
import { useSpaceAudio } from '../state/SpaceAudioContext.js';
import NavigationConsole from '../components/NavigationConsole.jsx';

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

function CelestialBody({ body, isSelected, onSelect, onExplore, onPositionUpdate }) {
  const groupRef = useRef();
  const meshRef = useRef();
  const worldPosition = useRef(new THREE.Vector3());
  const orbitalPosition = useRef(new THREE.Vector3());
  const { gl } = useThree();

  const textureMaps = useMemo(
    () =>
      buildTextureSet({
        textureKey: body.textureKey,
        normalMapKey: body.normalMapKey,
        emissiveMapKey: body.emissiveMapKey
      }),
    [body.emissiveMapKey, body.normalMapKey, body.textureKey]
  );

  useEffect(() => {
    const textures = Object.values(textureMaps);
    return () => {
      textures.forEach((texture) => {
        texture?.dispose();
      });
    };
  }, [textureMaps]);

  useEffect(() => {
    const maxAnisotropy = Math.min(gl.capabilities.getMaxAnisotropy(), 16);
    if (textureMaps.map) {
      textureMaps.map.anisotropy = maxAnisotropy;
      textureMaps.map.colorSpace = THREE.SRGBColorSpace;
      textureMaps.map.needsUpdate = true;
    }
    if (textureMaps.emissiveMap) {
      textureMaps.emissiveMap.anisotropy = maxAnisotropy;
      textureMaps.emissiveMap.colorSpace = THREE.SRGBColorSpace;
      textureMaps.emissiveMap.needsUpdate = true;
    }
    if (textureMaps.normalMap) {
      textureMaps.normalMap.anisotropy = maxAnisotropy;
      textureMaps.normalMap.needsUpdate = true;
    }
  }, [gl, textureMaps]);

  const rimColor = useMemo(() => {
    const color = new THREE.Color(body.color);
    const rim = color.clone().lerp(new THREE.Color('#ffffff'), 0.35);
    return `#${rim.getHexString()}`;
  }, [body.color]);

  const emissiveColor = body.id === 'sun' ? '#f8a04a' : '#090b1a';
  const emissiveIntensity = body.id === 'sun' ? 1.15 : 0.08;

  const atmosphereScale = body.id === 'sun' ? 1 : 1.05;
  const showAtmosphere = body.id !== 'sun';

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    const orbitAngle = elapsed * body.orbitSpeed;
    const x = Math.cos(orbitAngle) * body.orbitRadius;
    const z = Math.sin(orbitAngle) * body.orbitRadius;
    if (groupRef.current) {
      groupRef.current.position.set(x, 0, z);
    }
    orbitalPosition.current.set(x, 0, z);
    if (onPositionUpdate) {
      onPositionUpdate(body.id, orbitalPosition.current);
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
        <meshStandardMaterial
          color={body.color}
          map={textureMaps.map}
          normalMap={textureMaps.normalMap}
          emissive={emissiveColor}
          emissiveMap={textureMaps.emissiveMap}
          emissiveIntensity={emissiveIntensity}
          roughness={0.85}
          metalness={0.1}
        />
        {showAtmosphere && (
          <mesh scale={atmosphereScale} frustumCulled={false}>
            <sphereGeometry args={[body.size, 32, 32]} />
            <meshPhongMaterial
              color={rimColor}
              emissive={rimColor}
              emissiveIntensity={0.35}
              transparent
              opacity={0.18}
              blending={THREE.AdditiveBlending}
              side={THREE.BackSide}
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
      setFocusPosition([body.orbitRadius, 0, 0]);
    }
  }, []);

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
              <ambientLight intensity={0.28} color="#1a2134" />
              <hemisphereLight skyColor="#45648f" groundColor="#05060d" intensity={0.35} />
              <pointLight position={[0, 0, 0]} intensity={3} distance={280} decay={2} color="#ffd39c" castShadow />
              <Stars radius={120} depth={40} count={3000} factor={6} saturation={0} fade speed={0.5} />
              {celestialBodies.map((body) => (
                <CelestialBody
                  key={body.id}
                  body={body}
                  isSelected={body.id === selectedBodyId}
                  onSelect={handleSelect}
                  onExplore={handleExplore}
                  onPositionUpdate={handlePositionUpdate}
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
