import Phaser from 'phaser';

const PLACEHOLDER_COLORS = {
  slow:   [0x4488cc, 0x6699dd, 0x557799],
  medium: [0x338844, 0x44aa55],
  fast:   [0x886644, 0x997755, 0xaa8866],
};

export class ParallaxManager {
  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    this.scene = scene;
    this.setData = null;
    this.layers = [];
    this.running = false;
  }

  /** @param {string} setId  e.g. "forest-day" */
  async loadSet(setId) {
    const scene = this.scene;

    if (!scene.cache.json.has('bg-index')) {
      await this._loadJson('bg-index', 'assets/backgrounds/index.json');
    }

    const bgIndex = scene.cache.json.get('bg-index');
    const entry = bgIndex.sets.find(s => s.id === setId);
    if (!entry) {
      console.warn(`[ParallaxManager] Background set "${setId}" not found in index. Using empty background.`);
      return;
    }

    const setKey = `bg-set-${setId}`;
    if (!scene.cache.json.has(setKey)) {
      await this._loadJson(setKey, entry.file);
    }

    this.setData = scene.cache.json.get(setKey);

    const allLayers = this._flatLayers();
    let queued = 0;

    for (const layer of allLayers) {
      if (!scene.textures.exists(layer.assetKey)) {
        scene.load.image(layer.assetKey, layer.texture.path);
        queued++;
      }
    }

    if (queued > 0) {
      await new Promise((resolve, reject) => {
        scene.load.once(Phaser.Loader.Events.COMPLETE, resolve);
        scene.load.once('loaderror', (file) => {
          console.warn(`[ParallaxManager] Failed to load: ${file.key} (${file.url}). Will use placeholder.`);
        });
        scene.load.start();
      });
    }
  }

  createLayers() {
    if (!this.setData) return;

    this._clearLayers();

    const { width, height } = this.scene.scale;
    const tiers = ['slow', 'medium', 'fast'];
    const baseHeight = this.setData.baseHeight || height;
    const verticalRatio = height / baseHeight;

    for (const tier of tiers) {
      const tierLayers = this.setData.tiers[tier] || [];
      const fallbackColors = PLACEHOLDER_COLORS[tier] || [0x333333];

      tierLayers.forEach((layerDef, idx) => {
        const hasTexture = this.scene.textures.exists(layerDef.assetKey);
        let textureKey = layerDef.assetKey;

        if (!hasTexture) {
          textureKey = this._generatePlaceholder(layerDef, tier, idx, fallbackColors, verticalRatio);
        }

        const layerScale = layerDef.scale || 1;
        const layerY = (layerDef.position?.y || 0) * verticalRatio;
        const layerHeight = (layerDef.height || height) * verticalRatio * layerScale;
        const ts = this.scene.add.tileSprite(
          0,
          layerY,
          width,
          layerHeight,
          textureKey
        );

        ts.setOrigin(0, 0);
        ts.setScrollFactor(0);
        ts.setDepth(layerDef.depth);
        ts.setAlpha(layerDef.alpha ?? 1);

        if (typeof ts.setTileScale === 'function' && layerScale !== 1) {
          ts.setTileScale(layerScale, layerScale);
        }

        ts.tilePositionX = (layerDef.position?.x || 0) * layerScale;
        ts.setData('speed', layerDef.speed);
        ts.setData('layerId', layerDef.id);

        this.layers.push(ts);
      });
    }

    this.running = true;
  }

  /** @param {number} delta  ms since last frame */
  update(delta) {
    if (!this.running) return;

    const dtSec = delta / 1000;
    for (const ts of this.layers) {
      ts.tilePositionX += ts.getData('speed') * dtSec;
    }
  }

  pause() {
    this.running = false;
  }

  resume() {
    this.running = true;
  }

  reset() {
    for (const ts of this.layers) {
      ts.tilePositionX = 0;
    }
  }

  destroy() {
    this.running = false;
    this._clearLayers();
    this.setData = null;
  }

  _clearLayers() {
    for (const ts of this.layers) {
      ts.destroy();
    }
    this.layers = [];
  }

  _flatLayers() {
    if (!this.setData) return [];
    const tiers = this.setData.tiers || {};
    return [
      ...(tiers.slow || []),
      ...(tiers.medium || []),
      ...(tiers.fast || []),
    ];
  }

  _generatePlaceholder(layerDef, tier, idx, fallbackColors, verticalRatio = 1) {
    const key = `${layerDef.assetKey}__placeholder`;
    if (this.scene.textures.exists(key)) return key;

    const { width } = this.scene.scale;
    const h = Math.max(1, Math.round((layerDef.height || 200) * verticalRatio * (layerDef.scale || 1)));
    const color = fallbackColors[idx % fallbackColors.length];

    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(color, 1);
    g.fillRect(0, 0, width, h);

    g.fillStyle(0xffffff, 0.08);
    for (let x = 0; x < width; x += 60) {
      g.fillRect(x, 0, 2, h);
    }

    g.generateTexture(key, width, h);
    g.destroy();

    console.info(`[ParallaxManager] Placeholder generated: ${layerDef.id} (${tier})`);
    return key;
  }

  _loadJson(key, url) {
    return new Promise((resolve) => {
      this.scene.load.json(key, url);
      this.scene.load.once(Phaser.Loader.Events.COMPLETE, resolve);
      this.scene.load.start();
    });
  }
}
