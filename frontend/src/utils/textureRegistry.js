const textureModules = import.meta.glob('../assets/textures/**/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  import: 'default'
});

function registerLookupEntry(registry, key, module) {
  if (!key || !module) {
    return;
  }
  const trimmed = key.trim();
  if (!trimmed) {
    return;
  }
  registry[trimmed] = module;
  registry[trimmed.toLowerCase()] = module;
}

const textureLookup = Object.entries(textureModules).reduce((acc, [path, module]) => {
  if (!module) {
    return acc;
  }
  const segments = path.split('/');
  const fileName = segments[segments.length - 1] ?? '';
  const baseName = fileName.replace(/\.[^.]+$/, '');
  registerLookupEntry(acc, fileName, module);
  registerLookupEntry(acc, baseName, module);
  return acc;
}, {});

function normalizeKey(key) {
  if (typeof key !== 'string') {
    return '';
  }
  return key.trim();
}

export function resolveTextureSource(key) {
  const normalized = normalizeKey(key);
  if (!normalized) {
    return null;
  }
  return textureLookup[normalized] ?? textureLookup[normalized.toLowerCase()] ?? null;
}

export function buildTextureSet({ textureKey, normalMapKey, emissiveMapKey } = {}) {
  return {
    map: resolveTextureSource(textureKey),
    normalMap: resolveTextureSource(normalMapKey),
    emissiveMap: resolveTextureSource(emissiveMapKey)
  };
}
