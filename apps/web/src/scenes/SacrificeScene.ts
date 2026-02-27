import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@solanasurvivors/shared';
import type { NftAsset } from '@solanasurvivors/core';
import { getServices } from '../integration/GameServices';
import { HEADER, TINY, textStyle } from '../ui/textStyles';

/** Map mint address → preloaded NFT art texture key */
const MINT_NFT_IMAGE: Record<string, string> = {
  'BCGzRJjd8Zyt7HyhnEERYkZhiXvWwBY99KN6V2TkJu81': 'nft-boss',
  '7F8TpbMpz8bSmM1HQtupvMdoCbWJLKhaZCB388Rk1Uu4':  'nft-elite',
  '22mgzuS5A9UUchuSruum9PxtWNS6jzpsJV5KaNPKWVLX':  'nft-exploder',
};

/** Map NFT texture → post-sacrifice enemy texture */
const NFT_TO_SACRIFICE: Record<string, string> = {
  'nft-boss': 'sacrifice-boss',
  'nft-elite': 'sacrifice-elite',
  'nft-exploder': 'sacrifice-exploder',
};

/**
 * Overlay scene: NFT selection grid → ritual modal with pentagram → sacrifice.
 * TEST MODE: fake wallet popup + dramatic effects, no real blockchain tx.
 */
export class SacrificeScene extends Phaser.Scene {
  private ritualObjects: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super({ key: 'SacrificeScene' });
  }

  /* ================================================================
   *  CARD SELECTION SCREEN
   * ================================================================ */

  create(): void {
    const { wallet } = getServices();

    // Generate particle texture once
    if (!this.textures.exists('particle-dot')) {
      const gfx = this.make.graphics({ x: 0, y: 0 }, false);
      gfx.fillStyle(0xffffff, 1);
      gfx.fillCircle(4, 4, 4);
      gfx.generateTexture('particle-dot', 8, 8);
      gfx.destroy();
    }

    // Full opaque background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e, 1);

    // Header
    this.add.text(GAME_WIDTH / 2, 18, 'SACRIFICE', HEADER).setOrigin(0.5);

    // Close button
    const closeBtn = this.add.text(GAME_WIDTH - 16, 14, '[X]', textStyle(8, '#ff4444'))
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.scene.stop('SacrificeScene'));

    if (!wallet.isConnected()) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Connect wallet to sacrifice NFTs', TINY).setOrigin(0.5);
      return;
    }

    const loadingText = this.add.text(GAME_WIDTH / 2, 40, 'Loading your NFTs...', TINY).setOrigin(0.5);

    const address = wallet.getAddress()!;
    const { nftProvider } = getServices();
    nftProvider.getOwnedNfts(address).then((nfts) => {
      if (!this.scene.isActive('SacrificeScene')) return;
      loadingText.setText(
        nfts.length === 0 ? 'No eligible NFTs found' : 'Select an NFT to sacrifice:',
      );
      this.renderNftCards(nfts);
    });

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20,
      'Your NFT becomes an arena enemy. Other players will face it in battle.',
      textStyle(5, '#555555')).setOrigin(0.5);
  }

  private renderNftCards(nfts: NftAsset[]): void {
    const maxVisible = Math.min(nfts.length, 3);
    const cardWidth = 150;
    const cardHeight = 240;
    const gap = 20;
    const totalWidth = maxVisible * cardWidth + (maxVisible - 1) * gap;
    const startX = (GAME_WIDTH - totalWidth) / 2 + cardWidth / 2;
    const cy = 185;

    nfts.slice(0, maxVisible).forEach((nft, i) => {
      const cx = startX + i * (cardWidth + gap);

      const bg = this.add.rectangle(cx, cy, cardWidth, cardHeight, 0x22223a)
        .setStrokeStyle(2, 0xcc3333);

      const imgY = cy - 45;
      const texKey = MINT_NFT_IMAGE[nft.id];
      let cardImage: Phaser.GameObjects.Image | undefined;
      if (texKey && this.textures.exists(texKey)) {
        cardImage = this.add.image(cx, imgY, texKey)
          .setDisplaySize(120, 120)
          .setOrigin(0.5);
        cardImage.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
      }

      const nameY = cy + 30;
      this.add.text(cx, nameY, nft.name, textStyle(7, '#ffffff')).setOrigin(0.5);
      this.add.text(cx, nameY + 16, nft.id.slice(0, 8) + '...', textStyle(5, '#666666')).setOrigin(0.5);

      const btnY = cy + 65;
      const btnBg = this.add.rectangle(cx, btnY, 110, 24, 0xcc3333)
        .setInteractive({ useHandCursor: true });
      const btnText = this.add.text(cx, btnY, 'SACRIFICE', textStyle(7, '#ffffff')).setOrigin(0.5);

      btnBg.on('pointerover', () => btnBg.setFillStyle(0xee4444));
      btnBg.on('pointerout', () => btnBg.setFillStyle(0xcc3333));
      btnBg.on('pointerdown', () => {
        this.openRitual(nft, texKey, cardImage, bg, btnBg, btnText);
      });
    });
  }

  /* ================================================================
   *  RITUAL MODAL — pentagram + floating NFT + sacrifice button
   * ================================================================ */

  private openRitual(
    nft: NftAsset,
    texKey: string | undefined,
    cardImage: Phaser.GameObjects.Image | undefined,
    cardBg: Phaser.GameObjects.Rectangle,
    cardBtnBg: Phaser.GameObjects.Rectangle,
    cardBtnText: Phaser.GameObjects.Text,
  ): void {
    this.ritualObjects = [];
    const cx = GAME_WIDTH / 2;
    const ritualCy = GAME_HEIGHT / 2 - 10;
    const pentaRadius = 90;

    // --- Dark overlay ---
    const overlay = this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x060610, 0.97)
      .setInteractive();
    this.ritualObjects.push(overlay);

    // --- Title ---
    const title = this.add.text(cx, 22, 'SACRIFICE RITUAL', textStyle(10, '#ff3333')).setOrigin(0.5);
    this.ritualObjects.push(title);

    // --- Pentagram (glow + sharp) ---
    const pentaGlow = this.add.graphics().setPosition(cx, ritualCy);
    this.drawPentagram(pentaGlow, pentaRadius, 0xff3333, 0.12, 8);
    this.ritualObjects.push(pentaGlow);

    const pentaLines = this.add.graphics().setPosition(cx, ritualCy);
    this.drawPentagram(pentaLines, pentaRadius, 0xff3333, 0.6, 1.5);
    this.ritualObjects.push(pentaLines);

    // Slow rotation
    this.tweens.add({
      targets: [pentaGlow, pentaLines],
      angle: 360,
      duration: 25000,
      repeat: -1,
    });

    // Ambient glow pulse on pentagram
    this.tweens.add({
      targets: pentaGlow,
      alpha: { from: 0.5, to: 1 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // --- Ambient particles floating up from pentagram edge ---
    const ambient = this.add.particles(cx, ritualCy, 'particle-dot', {
      speed: { min: 8, max: 25 },
      angle: { min: 250, max: 290 },
      lifespan: 2500,
      alpha: { start: 0.5, end: 0 },
      scale: { start: 0.5, end: 0.1 },
      tint: 0xff3333,
      frequency: 150,
      emitZone: {
        type: 'edge',
        source: new Phaser.Geom.Circle(0, 0, pentaRadius),
        quantity: 1,
      },
    });
    this.ritualObjects.push(ambient);

    // --- NFT image floating in center ---
    let nftImg: Phaser.GameObjects.Image | undefined;
    if (texKey && this.textures.exists(texKey)) {
      nftImg = this.add.image(cx, ritualCy, texKey)
        .setDisplaySize(110, 110)
        .setOrigin(0.5);
      nftImg.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
      this.ritualObjects.push(nftImg);

      // Gentle float
      this.tweens.add({
        targets: nftImg,
        y: ritualCy - 8,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // --- NFT name ---
    const nameText = this.add.text(cx, ritualCy + 80, nft.name, textStyle(8, '#ffffff')).setOrigin(0.5);
    this.ritualObjects.push(nameText);

    // --- SACRIFICE button ---
    const sBtnBg = this.add.rectangle(cx, ritualCy + 110, 160, 32, 0xcc2222)
      .setInteractive({ useHandCursor: true });
    const sBtnText = this.add.text(cx, ritualCy + 110, 'SACRIFICE', textStyle(9, '#ffffff')).setOrigin(0.5);
    this.ritualObjects.push(sBtnBg, sBtnText);

    // Button pulse
    this.tweens.add({
      targets: [sBtnBg],
      scaleX: 1.05,
      scaleY: 1.08,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    sBtnBg.on('pointerover', () => sBtnBg.setFillStyle(0xee3333));
    sBtnBg.on('pointerout', () => sBtnBg.setFillStyle(0xcc2222));

    // --- BACK button ---
    const backBtn = this.add.text(16, 18, '< BACK', textStyle(7, '#666666'))
      .setInteractive({ useHandCursor: true });
    this.ritualObjects.push(backBtn);

    backBtn.on('pointerover', () => backBtn.setColor('#aaaaaa'));
    backBtn.on('pointerout', () => backBtn.setColor('#666666'));
    backBtn.on('pointerdown', () => {
      this.cleanupRitual();
    });

    // --- Wire up SACRIFICE button ---
    sBtnBg.on('pointerdown', () => {
      sBtnBg.disableInteractive();
      sBtnText.setText('...');

      this.showFakePopup(
        // Confirm
        () => {
          this.playRitualEffect(
            nftImg, pentaGlow, pentaLines, ambient, nameText, sBtnBg, sBtnText,
            texKey, cx, ritualCy, pentaRadius,
            () => {
              // Return to card grid — update the card
              this.cleanupRitual();
              cardBtnText.setText('DONE');
              cardBtnBg.setFillStyle(0x2a6a2a);
              cardBtnBg.disableInteractive();
              cardBg.setStrokeStyle(2, 0x44ff44);

              // Swap card image to enemy art
              const sacrificeTex = texKey ? NFT_TO_SACRIFICE[texKey] : undefined;
              if (cardImage && sacrificeTex && this.textures.exists(sacrificeTex)) {
                cardImage.setTexture(sacrificeTex);
                cardImage.setDisplaySize(120, 120);
                cardImage.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
              }
            },
          );
        },
        // Cancel
        () => {
          sBtnText.setText('SACRIFICE');
          sBtnBg.setFillStyle(0xcc2222);
          sBtnBg.setInteractive({ useHandCursor: true });
        },
      );
    });
  }

  /* ================================================================
   *  FAKE WALLET POPUP
   * ================================================================ */

  private showFakePopup(onConfirm: () => void, onCancel: () => void): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const popupW = 240;
    const popupH = 160;

    const popOverlay = this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.5)
      .setInteractive();
    const popBg = this.add.rectangle(cx, cy, popupW, popupH, 0x1e1e2f)
      .setStrokeStyle(2, 0x7b61ff);
    const popTitle = this.add.text(cx, cy - 55, 'Confirm Transaction', textStyle(7, '#ffffff'))
      .setOrigin(0.5);
    const popSubtitle = this.add.text(cx, cy - 38, 'localhost:3000', textStyle(5, '#888888'))
      .setOrigin(0.5);
    const popBody1 = this.add.text(cx, cy - 12, 'Sacrifice NFT to Arena', textStyle(6, '#cccccc'))
      .setOrigin(0.5);
    const popBody2 = this.add.text(cx, cy + 6, 'Network fee: 0.00005 SOL', textStyle(5, '#888888'))
      .setOrigin(0.5);

    const btnW = 90;
    const btnH = 26;
    const btnY = cy + 45;

    const cancelBg = this.add.rectangle(cx - 55, btnY, btnW, btnH, 0x444455)
      .setInteractive({ useHandCursor: true });
    const cancelTxt = this.add.text(cx - 55, btnY, 'Cancel', textStyle(7, '#ffffff')).setOrigin(0.5);
    cancelBg.on('pointerover', () => cancelBg.setFillStyle(0x555566));
    cancelBg.on('pointerout', () => cancelBg.setFillStyle(0x444455));

    const confirmBg = this.add.rectangle(cx + 55, btnY, btnW, btnH, 0x7b61ff)
      .setInteractive({ useHandCursor: true });
    const confirmTxt = this.add.text(cx + 55, btnY, 'Confirm', textStyle(7, '#ffffff')).setOrigin(0.5);
    confirmBg.on('pointerover', () => confirmBg.setFillStyle(0x9b81ff));
    confirmBg.on('pointerout', () => confirmBg.setFillStyle(0x7b61ff));

    const popupParts = [popOverlay, popBg, popTitle, popSubtitle, popBody1, popBody2,
      cancelBg, cancelTxt, confirmBg, confirmTxt];

    const destroyPopup = () => popupParts.forEach((o) => o.destroy());

    cancelBg.on('pointerdown', () => { destroyPopup(); onCancel(); });
    confirmBg.on('pointerdown', () => { destroyPopup(); onConfirm(); });
  }

  /* ================================================================
   *  DRAMATIC RITUAL EFFECT  (~3.5 s)
   * ================================================================ */

  private playRitualEffect(
    nftImg: Phaser.GameObjects.Image | undefined,
    pentaGlow: Phaser.GameObjects.Graphics,
    pentaLines: Phaser.GameObjects.Graphics,
    ambient: Phaser.GameObjects.Particles.ParticleEmitter,
    nameText: Phaser.GameObjects.Text,
    sBtnBg: Phaser.GameObjects.Rectangle,
    sBtnText: Phaser.GameObjects.Text,
    texKey: string | undefined,
    cx: number,
    cy: number,
    pentaRadius: number,
    onComplete: () => void,
  ): void {
    // Hide button & name during effect
    sBtnBg.setVisible(false);
    sBtnText.setVisible(false);
    nameText.setVisible(false);

    // Stop ambient emitter — we take over particles now
    ambient.stop();

    // ── Phase 1 (0–800ms): Charge — pentagram spins fast, particles converge ──

    // Speed up pentagram rotation
    this.tweens.killTweensOf([pentaGlow, pentaLines]);
    this.tweens.add({
      targets: [pentaGlow, pentaLines],
      angle: '+=720',
      duration: 2000,
      ease: 'Cubic.easeIn',
    });

    // Pentagram brightens
    this.tweens.add({
      targets: pentaGlow,
      alpha: 1,
      duration: 800,
    });
    this.tweens.add({
      targets: pentaLines,
      alpha: 1,
      duration: 800,
    });

    // Converging particles (small circles flying inward)
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = pentaRadius + 10 + Math.random() * 40;
      const dot = this.add.circle(
        cx + Math.cos(angle) * dist,
        cy + Math.sin(angle) * dist,
        2 + Math.random() * 2, 0xff4422, 0.8,
      );
      this.ritualObjects.push(dot);

      this.tweens.add({
        targets: dot,
        x: cx,
        y: cy,
        alpha: 0,
        scale: 0.3,
        duration: 500 + Math.random() * 400,
        delay: Math.random() * 300,
        ease: 'Power2',
        onComplete: () => dot.destroy(),
      });
    }

    // NFT shakes during charge
    if (nftImg) {
      this.tweens.add({
        targets: nftImg,
        x: { from: cx - 3, to: cx + 3 },
        duration: 50,
        yoyo: true,
        repeat: 14,
      });
    }

    // ── Phase 2 (800ms): Impact — flash + NFT shatters ──

    this.time.delayedCall(800, () => {
      // Screen flash
      const flash = this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0.85);
      this.ritualObjects.push(flash);
      this.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 400,
        onComplete: () => flash.destroy(),
      });

      // Camera-like shake via offset tween on all ritual objects
      // (Quick x jitter on pentagram)
      this.tweens.add({
        targets: [pentaGlow, pentaLines],
        x: { from: cx - 4, to: cx + 4 },
        duration: 40,
        yoyo: true,
        repeat: 5,
        onComplete: () => {
          pentaGlow.setPosition(cx, cy);
          pentaLines.setPosition(cx, cy);
        },
      });

      // NFT shrinks + fades
      if (nftImg) {
        this.tweens.killTweensOf(nftImg);
        this.tweens.add({
          targets: nftImg,
          alpha: 0,
          scale: 0.1,
          duration: 500,
          ease: 'Power3',
        });
      }

      // Big particle burst outward
      if (this.textures.exists('xp-gem')) {
        const burst = this.add.particles(cx, cy, 'xp-gem', {
          speed: { min: 60, max: 220 },
          angle: { min: 0, max: 360 },
          lifespan: { min: 800, max: 1400 },
          alpha: { start: 1, end: 0 },
          scale: { start: 0.7, end: 0.05 },
          tint: [0xff2222, 0xff6600, 0xffaa00, 0xffffff],
          gravityY: 30,
          emitting: false,
        });
        this.ritualObjects.push(burst);
        burst.explode(70);
      }

      // Secondary ring of small dots
      const dotBurst = this.add.particles(cx, cy, 'particle-dot', {
        speed: { min: 100, max: 280 },
        angle: { min: 0, max: 360 },
        lifespan: { min: 600, max: 1000 },
        alpha: { start: 0.9, end: 0 },
        scale: { start: 0.6, end: 0.1 },
        tint: [0xff0000, 0xff4400, 0xcc0000],
        emitting: false,
      });
      this.ritualObjects.push(dotBurst);
      dotBurst.explode(50);
    });

    // ── Phase 3 (1800ms): Reveal — pentagram fades, enemy image appears ──

    this.time.delayedCall(1800, () => {
      // Fade pentagram
      this.tweens.add({
        targets: [pentaGlow, pentaLines],
        alpha: 0,
        duration: 600,
      });

      // Show enemy image (the "sacrifice" texture)
      const sacrificeTex = texKey ? NFT_TO_SACRIFICE[texKey] : undefined;
      if (sacrificeTex && this.textures.exists(sacrificeTex)) {
        const enemyImg = this.add.image(cx, cy, sacrificeTex)
          .setDisplaySize(0, 0)
          .setOrigin(0.5)
          .setAlpha(0);
        enemyImg.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
        this.ritualObjects.push(enemyImg);

        // Scale up with bounce
        this.tweens.add({
          targets: enemyImg,
          displayWidth: 120,
          displayHeight: 120,
          alpha: 1,
          duration: 500,
          ease: 'Back.easeOut',
        });
      }
    });

    // ── Phase 4 (2600ms): "SACRIFICED" text slam ──

    this.time.delayedCall(2600, () => {
      const doneText = this.add.text(cx, cy + 90, 'SACRIFICED', textStyle(12, '#ff4444'))
        .setOrigin(0.5)
        .setScale(2.5)
        .setAlpha(0);
      this.ritualObjects.push(doneText);

      this.tweens.add({
        targets: doneText,
        scale: 1,
        alpha: 1,
        duration: 300,
        ease: 'Back.easeOut',
      });
    });

    // ── Phase 5 (5500ms): Complete — return to card grid ──

    this.time.delayedCall(5500, onComplete);
  }

  /* ================================================================
   *  HELPERS
   * ================================================================ */

  /** Draw a pentagram (circle + 5-pointed star) centered at graphics origin. */
  private drawPentagram(
    gfx: Phaser.GameObjects.Graphics,
    radius: number,
    color: number,
    alpha: number,
    lineWidth: number,
  ): void {
    gfx.lineStyle(lineWidth, color, alpha);

    // Outer circle
    gfx.strokeCircle(0, 0, radius);

    // Inner circle
    gfx.strokeCircle(0, 0, radius * 0.38);

    // 5-pointed star — connect every other vertex of a regular pentagon
    const order = [0, 2, 4, 1, 3];
    const pts = order.map((idx) => {
      const a = (idx * 2 * Math.PI) / 5 - Math.PI / 2;
      return { x: Math.cos(a) * radius, y: Math.sin(a) * radius };
    });

    gfx.beginPath();
    gfx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      gfx.lineTo(pts[i].x, pts[i].y);
    }
    gfx.closePath();
    gfx.strokePath();
  }

  /** Destroy all objects created by the ritual overlay. */
  private cleanupRitual(): void {
    for (const obj of this.ritualObjects) {
      if (obj && obj.active) obj.destroy();
    }
    this.ritualObjects = [];
  }
}
