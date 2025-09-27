const textureModules = import.meta.glob('../assets/textures/**/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  import: 'default'
});

const textureLookup = Object.entries(textureModules).reduce((acc, [path, module]) => {
  if (!module) {
    return acc;
  }
  const segments = path.split('/');
  const fileName = segments[segments.length - 1];
  const baseName = fileName.replace(/\.[^.]+$/, '');
  acc[fileName] = module;
  acc[baseName] = module;
  return acc;
}, {});

export function resolveTextureSource(key) {
  if (!key) {
    return null;
  }
  return textureLookup[key] ?? null;
}

export function buildTextureSet({ textureKey, normalMapKey, emissiveMapKey } = {}) {
  return {
    map: resolveTextureSource(textureKey),
    normalMap: resolveTextureSource(normalMapKey),
    emissiveMap: resolveTextureSource(emissiveMapKey)
  };
}
