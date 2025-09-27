import * as THREE from 'three';

function createCanvas(width, height) {
  if (typeof document === 'undefined') {
    return null;
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function createCanvasTexture(width, height, painter) {
  const canvas = createCanvas(width, height);
  if (!canvas) {
    return null;
  }
  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }

  painter(context, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createEarthDiffuseTexture() {
  return createCanvasTexture(1024, 512, (ctx, w, h) => {
    const oceanGradient = ctx.createLinearGradient(0, 0, 0, h);
    oceanGradient.addColorStop(0, '#0b1f3b');
    oceanGradient.addColorStop(1, '#144c7c');
    ctx.fillStyle = oceanGradient;
    ctx.fillRect(0, 0, w, h);

    const continentShapes = [
      { x: w * 0.28, y: h * 0.48, rx: w * 0.16, ry: h * 0.22, rotation: -0.35 },
      { x: w * 0.62, y: h * 0.52, rx: w * 0.18, ry: h * 0.25, rotation: 0.25 },
      { x: w * 0.45, y: h * 0.35, rx: w * 0.08, ry: h * 0.12, rotation: 0.8 },
      { x: w * 0.5, y: h * 0.72, rx: w * 0.12, ry: h * 0.16, rotation: -0.6 }
    ];

    continentShapes.forEach(({ x, y, rx, ry, rotation }) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.scale(rx, ry);
      ctx.beginPath();
      ctx.moveTo(1, 0);
      for (let i = 0; i <= 32; i += 1) {
        const theta = (i / 32) * Math.PI * 2;
        const radius = 1 + Math.sin(theta * 3 + x + y) * 0.08;
        ctx.lineTo(Math.cos(theta) * radius, Math.sin(theta) * radius);
      }
      ctx.closePath();
      ctx.fillStyle = '#3aa15a';
      ctx.fill();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#cfd7a4';
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    });

    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 18; i += 1) {
      const centerX = Math.random() * w;
      const centerY = Math.random() * h;
      const size = (Math.random() * 0.04 + 0.02) * w;
      const cloudGradient = ctx.createRadialGradient(centerX, centerY, size * 0.1, centerX, centerY, size);
      cloudGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      cloudGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.beginPath();
      ctx.fillStyle = cloudGradient;
      ctx.arc(centerX, centerY, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
}

function createEarthNormalTexture() {
  return createCanvasTexture(1024, 512, (ctx, w, h) => {
    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, w, h);

    const reliefGradient = ctx.createLinearGradient(0, 0, 0, h);
    reliefGradient.addColorStop(0, 'rgba(60, 60, 200, 0.3)');
    reliefGradient.addColorStop(1, 'rgba(200, 200, 255, 0.3)');
    ctx.fillStyle = reliefGradient;
    ctx.fillRect(0, 0, w, h);

    ctx.globalAlpha = 0.4;
    ctx.fillStyle = 'rgb(170, 170, 255)';
    const ridges = 24;
    for (let i = 0; i < ridges; i += 1) {
      const y = (i / ridges) * h;
      const bandHeight = h * 0.02;
      ctx.fillRect(0, y, w, bandHeight);
    }
    ctx.globalAlpha = 1;
  });
}

function createJupiterDiffuseTexture() {
  return createCanvasTexture(1024, 512, (ctx, w, h) => {
    const bands = [
      '#d7b58d',
      '#c18b58',
      '#d3a269',
      '#b97846',
      '#d9b68f',
      '#b66a3e',
      '#e0c19c'
    ];

    const bandHeight = h / bands.length;
    bands.forEach((color, index) => {
      const y = index * bandHeight;
      const gradient = ctx.createLinearGradient(0, y, 0, y + bandHeight);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.5, color);
      gradient.addColorStop(1, color);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, y, w, bandHeight + 1);
    });

    const spotGradient = ctx.createRadialGradient(w * 0.75, h * 0.55, w * 0.04, w * 0.75, h * 0.55, w * 0.12);
    spotGradient.addColorStop(0, 'rgba(165, 80, 40, 0.9)');
    spotGradient.addColorStop(0.6, 'rgba(165, 80, 40, 0.4)');
    spotGradient.addColorStop(1, 'rgba(165, 80, 40, 0)');
    ctx.fillStyle = spotGradient;
    ctx.beginPath();
    ctx.ellipse(w * 0.75, h * 0.55, w * 0.13, h * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

function createSunEmissiveTexture() {
  return createCanvasTexture(1024, 512, (ctx, w, h) => {
    const centerX = w / 2;
    const centerY = h / 2;
    const maxRadius = Math.max(w, h) / 2;
    const gradient = ctx.createRadialGradient(centerX, centerY, maxRadius * 0.1, centerX, centerY, maxRadius);
    gradient.addColorStop(0, 'rgba(255, 220, 120, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 140, 40, 0.85)');
    gradient.addColorStop(1, 'rgba(120, 20, 0, 0.05)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = 'rgba(255, 190, 90, 0.7)';
    ctx.lineWidth = w * 0.01;
    for (let i = 0; i < 36; i += 1) {
      const angle = (i / 36) * Math.PI * 2;
      const inner = maxRadius * 0.45;
      const outer = maxRadius * (0.55 + Math.sin(i * 0.5) * 0.1);
      ctx.beginPath();
      ctx.moveTo(centerX + Math.cos(angle) * inner, centerY + Math.sin(angle) * inner);
      ctx.lineTo(centerX + Math.cos(angle) * outer, centerY + Math.sin(angle) * outer);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
}

const TEXTURE_GENERATORS = {
  earthDiffuse: createEarthDiffuseTexture,
  earthNormal: createEarthNormalTexture,
  jupiterDiffuse: createJupiterDiffuseTexture,
  sunEmissive: createSunEmissiveTexture
};

function generateTextureByKey(key) {
  if (!key) {
    return null;
  }
  const generator = TEXTURE_GENERATORS[key];
  return generator ? generator() : null;
}

export function buildTextureSet({ textureKey, normalMapKey, emissiveMapKey }) {
  const map = generateTextureByKey(textureKey);
  const normalMap = generateTextureByKey(normalMapKey);
  const emissiveMap = generateTextureByKey(emissiveMapKey);

  if (map) {
    map.colorSpace = THREE.SRGBColorSpace;
  }
  if (emissiveMap) {
    emissiveMap.colorSpace = THREE.SRGBColorSpace;
  }

  return {
    map,
    normalMap,
    emissiveMap
  };
}
