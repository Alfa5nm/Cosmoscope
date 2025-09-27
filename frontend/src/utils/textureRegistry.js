import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';

const textureModules = import.meta.glob('../assets/textures/*.{jpg,jpeg,png}', {
  import: 'default'
});

const loader = new THREE.TextureLoader();
const textureCache = new Map();
const pendingTextures = new Map();

function normalizeKey(key) {
  return typeof key === 'string' ? key.trim().toLowerCase() : '';
}

const importerRegistry = new Map(
  Object.entries(textureModules).map(([path, importer]) => {
    const fileName = path.split('/').pop() ?? '';
    const baseName = fileName.replace(/\.[^.]+$/, '');
    return [normalizeKey(baseName), importer];
  })
);

async function loadTextureFromImporter(importer) {
  try {
    const module = await importer();
    const url = module?.default ?? module;
    return await new Promise((resolve, reject) => {
      loader.load(
        url,
        (texture) => resolve(texture),
        undefined,
        (error) => reject(error)
      );
    });
  } catch (error) {
    console.warn('Failed to import texture asset', error);
    return null;
  }
}

async function getTextureByKey(key) {
  const normalized = normalizeKey(key);
  if (!normalized) {
    return null;
  }

  if (textureCache.has(normalized)) {
    return textureCache.get(normalized);
  }

  if (pendingTextures.has(normalized)) {
    return pendingTextures.get(normalized);
  }

  const importer = importerRegistry.get(normalized);
  if (!importer) {
    textureCache.set(normalized, null);
    return null;
  }

  const texturePromise = loadTextureFromImporter(importer)
    .then((texture) => {
      if (!texture) {
        textureCache.set(normalized, null);
        return null;
      }

      textureCache.set(normalized, texture);
      return texture;
    })
    .finally(() => {
      pendingTextures.delete(normalized);
    });

  pendingTextures.set(normalized, texturePromise);
  return texturePromise;
}

export async function buildTextureMapsForBody(body) {
  if (!body) {
    return {};
  }

  const textureRequests = [
    ['map', body.textureKey],
    ['normalMap', body.normalMapKey],
    ['emissiveMap', body.emissiveMapKey]
  ].filter(([, key]) => Boolean(key));

  if (!textureRequests.length) {
    return {};
  }

  const entries = await Promise.all(
    textureRequests.map(async ([slot, key]) => {
      const texture = await getTextureByKey(key);
      if (!texture) {
        return null;
      }

      if (slot === 'map' || slot === 'emissiveMap') {
        texture.colorSpace = THREE.SRGBColorSpace;
      }

      texture.needsUpdate = true;
      return [slot, texture];
    })
  );

  return entries.filter(Boolean).reduce((acc, [slot, texture]) => {
    acc[slot] = texture;
    return acc;
  }, {});
}

export function useBodyTextureMaps(body) {
  const [textureMaps, setTextureMaps] = useState(null);

  const { signature, hasKeys } = useMemo(() => {
    if (!body) {
      return { signature: '', hasKeys: false };
    }
    const keys = [body.textureKey ?? '', body.normalMapKey ?? '', body.emissiveMapKey ?? ''];
    return {
      signature: keys.join('::'),
      hasKeys: keys.some((value) => Boolean(value))
    };
  }, [body]);

  useEffect(() => {
    let cancelled = false;

    if (!body || !hasKeys) {
      setTextureMaps(null);
      return () => {
        cancelled = true;
      };
    }

    setTextureMaps(null);

    buildTextureMapsForBody(body)
      .then((maps) => {
        if (cancelled) {
          return;
        }

        if (maps && Object.keys(maps).length > 0) {
          setTextureMaps(maps);
        } else {
          setTextureMaps(null);
        }
      })
      .catch((error) => {
        console.warn('Unable to build texture maps for body', body?.id, error);
        if (!cancelled) {
          setTextureMaps(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [body, signature, hasKeys]);

  return textureMaps;
}

export function clearTextureCache() {
  textureCache.clear();
  pendingTextures.clear();
}
