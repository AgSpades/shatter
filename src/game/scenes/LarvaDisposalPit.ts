import { Scene } from 'phaser';
import { Player } from '../objects/Player';
import { Enforcer } from '../objects/Enforcer';

// Extended Enforcer with detection radius and stealth awareness
class SmartEnforcer extends Enforcer {
    private pathStart: number;
    private pathEnd: number;
    private waitTime: number;
    private isWaiting: boolean = false;
    private moveDirection: number = 1;
    private currentAxis: 'x' | 'y';
    private speed: number = 180; // Increased speed for more dynamic movement
    private detectionRadius: number = 256; // 4 tiles
    private detectionIndicator: Phaser.GameObjects.Text | null = null;
    public declare scene: Scene;
    private player: Player | null = null;

    constructor(scene: Scene, x: number, y: number, endX: number, endY: number, waitDuration: number) {
        const range = Math.max(Math.abs(endX - x), Math.abs(endY - y));
        const isHorizontal = Math.abs(endX - x) >= Math.abs(endY - y);
        const axis = isHorizontal ? 'x' : 'y';

        super(scene, x, y, range, axis);

        this.scene = scene;
        this.currentAxis = axis;
        this.pathStart = isHorizontal ? x : y;
        this.pathEnd = isHorizontal ? endX : endY;
        this.waitTime = Math.max(100, waitDuration * 1000); // Minimum 100ms wait
        this.moveDirection = (this.pathEnd >= this.pathStart) ? 1 : -1;

        // Create detection indicator
        this.detectionIndicator = scene.add.text(0, 0, '!', {
            fontSize: '32px',
            color: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5).setVisible(false).setDepth(150);

        this.startMoving();
    }

    setPlayer(player: Player) {
        this.player = player;
    }

    startMoving() {
        if (!this.scene) return;

        if (this.currentAxis === 'x') {
            this.setVelocityX(this.speed * this.moveDirection);
            this.setFlipX(this.moveDirection > 0);
        } else {
            this.setVelocityY(this.speed * this.moveDirection);
        }
        this.isWaiting = false;
    }

    update() {
        if (this.isWaiting || !this.body) return;

        const currentPos = this.currentAxis === 'x' ? this.x : this.y;
        const target = (this.moveDirection > 0) ? Math.max(this.pathStart, this.pathEnd) : Math.min(this.pathStart, this.pathEnd);
        const dist = Math.abs(target - currentPos);

        // Continuous flipping based on movement
        if (this.currentAxis === 'x') {
            this.setFlipX(this.moveDirection > 0);
        } else if (this.player) {
            // Vertical enemies face the player horizontally
            this.setFlipX(this.player.x > this.x);
        }

        if (dist < 15) { // Increased tolerance for smoother turning
            if (this.currentAxis === 'x') this.x = target;
            else this.y = target;
            this.stopAndTurn();
        }

        // Detection logic - directional (only what's in front)
        if (this.player && this.detectionIndicator) {
            const pitScene = this.scene as LarvaDisposalPit;
            let playerInFront = false;

            // Check if player is in front based on patrol axis and direction
            if (this.currentAxis === 'x') {
                // Horizontal patrol
                const forwardDist = (this.player.x - this.x) * this.moveDirection;
                const verticalDist = Math.abs(this.player.y - this.y);

                // Player must be ahead (forwardDist > 0) within detection range
                // Allow some vertical tolerance (128px = 2 tiles)
                playerInFront = forwardDist > 0 &&
                    forwardDist < this.detectionRadius &&
                    verticalDist < 128;
            } else {
                // Vertical patrol
                const forwardDist = (this.player.y - this.y) * this.moveDirection;
                const horizontalDist = Math.abs(this.player.x - this.x);

                // Player must be ahead within detection range
                // Allow some horizontal tolerance (128px = 2 tiles)
                playerInFront = forwardDist > 0 &&
                    forwardDist < this.detectionRadius &&
                    horizontalDist < 128;
            }

            if (playerInFront && !pitScene.isPlayerInShadow) {
                // Player detected!
                this.detectionIndicator.setPosition(this.x, this.y - 50);
                this.detectionIndicator.setVisible(true);

                // Trigger damage after brief indicator flash
                if (!pitScene.isPlayerDetected) {
                    pitScene.isPlayerDetected = true;
                    this.scene.time.delayedCall(300, () => {
                        pitScene.takeDamage(1);
                        pitScene.isPlayerDetected = false;
                    });
                }
            } else {
                this.detectionIndicator.setVisible(false);
            }
        }
    }

    stopAndTurn() {
        this.setVelocity(0, 0);
        this.isWaiting = true;

        if (this.scene) {
            this.scene.time.delayedCall(this.waitTime, () => {
                if (!this.scene) return;
                this.moveDirection *= -1;
                this.startMoving();
            });
        }
    }

    destroy() {
        if (this.detectionIndicator) {
            this.detectionIndicator.destroy();
        }
        super.destroy();
    }
}

// Checkpoint class
class Checkpoint {
    sprite: Phaser.GameObjects.Arc;
    gridX: number;
    gridY: number;
    isActivated: boolean = false;
    glow: Phaser.GameObjects.Arc;

    constructor(scene: Scene, x: number, y: number, gridX: number, gridY: number) {
        this.gridX = gridX;
        this.gridY = gridY;

        // Outer glow
        this.glow = scene.add.circle(x, y, 35, 0x00ff88, 0.3);
        this.glow.setDepth(5);

        // Main checkpoint
        this.sprite = scene.add.circle(x, y, 25, 0x00ff88, 0.6);
        this.sprite.setStrokeStyle(3, 0x00ff88);
        this.sprite.setDepth(10);

        scene.physics.add.existing(this.sprite, true);

        // Pulse animation
        scene.tweens.add({
            targets: [this.sprite, this.glow],
            alpha: { from: 0.3, to: 0.8 },
            scale: { from: 0.95, to: 1.05 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    activate(scene: Scene) {
        if (this.isActivated) return;

        this.isActivated = true;
        this.sprite.setFillStyle(0xffffff, 1);
        this.sprite.setStrokeStyle(4, 0xffffff);
        this.glow.setFillStyle(0xffffff, 0.5);

        // Play checkpoint sound effect
        (scene as any).playCheckpointSound();

        // Flash effect
        scene.cameras.main.flash(200, 0, 255, 136, false);

        // Background expanding circle effect
        const flash = scene.add.circle(this.sprite.x, this.sprite.y, 40, 0x00ff88, 0.7);
        flash.setDepth(5);
        scene.tweens.add({
            targets: flash,
            scale: { from: 1, to: 4 },
            alpha: { from: 0.7, to: 0 },
            duration: 600,
            ease: 'Cubic.easeOut',
            onComplete: () => flash.destroy()
        });
    }
}

// Coin collectible
class Coin {
    sprite: Phaser.GameObjects.Sprite;
    collected: boolean = false;

    constructor(scene: Scene, x: number, y: number) {
        this.sprite = scene.add.sprite(x, y, 'coin')
            .setDisplaySize(30, 30)
            .setDepth(15);

        scene.physics.add.existing(this.sprite, true);

        // Bob animation
        scene.tweens.add({
            targets: this.sprite,
            y: y - 15,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Rotate
        scene.tweens.add({
            targets: this.sprite,
            angle: 360,
            duration: 3000,
            repeat: -1,
            ease: 'Linear'
        });
    }

    collect(scene: Scene) {
        if (this.collected) return;

        this.collected = true;

        // Play coin sound effect
        this.playCoinSound(scene);

        // Background flash effect
        const flash = scene.add.circle(this.sprite.x, this.sprite.y, 80, 0xffdd00, 0.6);
        flash.setDepth(5);
        scene.tweens.add({
            targets: flash,
            scale: { from: 0.3, to: 2.5 },
            alpha: { from: 0.8, to: 0 },
            duration: 400,
            ease: 'Cubic.easeOut',
            onComplete: () => flash.destroy()
        });

        this.sprite.destroy();
    }

    private playCoinSound(scene: Scene) {
        if (!scene.game.registry.get('soundEnabled')) return;
        // Create a pleasant coin collection sound using Web Audio API
        const soundManager = scene.sound as any;
        const audioContext = soundManager.context as AudioContext;
        if (!audioContext) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Bright, cheerful coin sound (C6 to E6)
        oscillator.frequency.setValueAtTime(1046.5, audioContext.currentTime); // C6
        oscillator.frequency.exponentialRampToValueAtTime(1318.5, audioContext.currentTime + 0.1); // E6

        // Volume envelope
        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

        oscillator.type = 'sine';
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
    }
}

export class LarvaDisposalPit extends Scene {
    // Parallax background layers
    parallaxBg: Phaser.GameObjects.TileSprite;
    parallaxFarTrees: Phaser.GameObjects.TileSprite;
    parallaxMidTrees: Phaser.GameObjects.TileSprite;
    parallaxCloseTrees: Phaser.GameObjects.TileSprite;

    camera: Phaser.Cameras.Scene2D.Camera;
    player: Player;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    narrativeText: Phaser.GameObjects.Text;
    platforms: Phaser.Physics.Arcade.StaticGroup;
    hazards: Phaser.GameObjects.Group;
    enforcers: Phaser.GameObjects.Group;
    checkpoints: Checkpoint[] = [];
    coins: Coin[] = [];
    shadowZones: Phaser.GameObjects.Rectangle[] = [];
    lastCheckpoint: { x: number, y: number } | null = null;
    isPlayerInShadow: boolean = false;
    isPlayerDetected: boolean = false;
    hasShadowMask: boolean = false;
    score: number = 0;
    totalCoins: number = 0;
    coinText: Phaser.GameObjects.Text;
    maskIndicator: Phaser.GameObjects.Text;
    hpText: Phaser.GameObjects.Text;
    hpBarBg: Phaser.GameObjects.Rectangle;
    hpBarFill: Phaser.GameObjects.Rectangle;
    playerShadowGlow: Phaser.GameObjects.Arc | null = null;
    hp: number = 10;
    maxHp: number = 10;
    isInvulnerable: boolean = false;
    private canMove: boolean = false;
    private healingTimer: number = 0;
    private readonly HEAL_RATE: number = 0.5; // HP per second when mask is active
    private readonly HEAL_INTERVAL: number = 1000; // Heal every 1 second
    private isPaused: boolean = false;
    private pauseMenu: Phaser.GameObjects.Container | null = null;
    private pauseMenuOptions: { text: Phaser.GameObjects.Text, action: () => void }[] = [];
    private pauseSelectedIndex: number = 0;
    private escKey: Phaser.Input.Keyboard.Key | null = null;
    private woodsMusic: Phaser.Sound.BaseSound;
    private darknessOverlay: Phaser.GameObjects.Rectangle;
    private isPauseSettingsOpen: boolean = false;
    private pauseSettingsOptions: { text: Phaser.GameObjects.Text, key: string }[] = [];
    private pauseSettingsSelectedIndex: number = 0;
    private pauseSettingsMenu: Phaser.GameObjects.Container | null = null;

    // Map Config
    private readonly GRID_W = 30;
    private readonly GRID_H = 80;
    private readonly TILE_SIZE = 64;

    constructor() {
        super('LarvaDisposalPit');
    }

    create() {
        // --- Visuals & Environment ---
        // Calculate world bounds first
        const worldWidth = this.GRID_W * this.TILE_SIZE; // 1920
        const worldHeight = this.GRID_H * this.TILE_SIZE; // 5120

        // Set camera background color - brighter for better visibility
        this.cameras.main.setBackgroundColor('#2a2a2d');

        // Create parallax background layers (back to front)
        // Optimization: Use screen size instead of world size to avoid Out of Memory errors
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;

        this.parallaxBg = this.add.tileSprite(screenWidth / 2, screenHeight / 2, screenWidth, screenHeight, 'parallax-bg');
        this.parallaxBg.setScrollFactor(0);
        this.parallaxBg.setDepth(-4);
        this.parallaxBg.setAlpha(1.2);

        this.parallaxFarTrees = this.add.tileSprite(screenWidth / 2, screenHeight / 2, screenWidth, screenHeight, 'parallax-far-trees');
        this.parallaxFarTrees.setScrollFactor(0);
        this.parallaxFarTrees.setDepth(-3);
        this.parallaxFarTrees.setAlpha(1.2);

        this.parallaxMidTrees = this.add.tileSprite(screenWidth / 2, screenHeight / 2, screenWidth, screenHeight, 'parallax-mid-trees');
        this.parallaxMidTrees.setScrollFactor(0);
        this.parallaxMidTrees.setDepth(-2);
        this.parallaxMidTrees.setAlpha(1.2);

        this.parallaxCloseTrees = this.add.tileSprite(screenWidth / 2, screenHeight / 2, screenWidth, screenHeight, 'parallax-close-trees');
        this.parallaxCloseTrees.setScrollFactor(0);
        this.parallaxCloseTrees.setDepth(-1);
        this.parallaxCloseTrees.setAlpha(1.2);

        this.platforms = this.physics.add.staticGroup();
        this.hazards = this.add.group();
        this.enforcers = this.add.group();

        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

        // --- Player Setup ---
        const startP = this.gridToWorld(3, 2);
        this.player = new Player(this, startP.x, startP.y);
        this.lastCheckpoint = { x: startP.x, y: startP.y };

        // Increase player brightness with a glow effect
        this.player.setTint(0xffffff); // Ensure full brightness
        this.player.setAlpha(1.0); // Full opacity

        // Player shadow glow effect
        this.playerShadowGlow = this.add.circle(this.player.x, this.player.y, 60, 0x000000, 0.6);
        this.playerShadowGlow.setDepth(8);
        this.playerShadowGlow.setVisible(false);

        // Add a bright glow around the player for visibility
        const playerGlow = this.add.circle(this.player.x, this.player.y, 55, 0xffffff, 0.15);
        playerGlow.setDepth(7);
        playerGlow.setBlendMode(Phaser.BlendModes.ADD);

        // Make glow follow player
        this.events.on('update', () => {
            if (playerGlow && this.player) {
                playerGlow.setPosition(this.player.x, this.player.y);
            }
        });

        // Create darkness overlay with reduced opacity for better visibility
        this.darknessOverlay = this.add.rectangle(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, 0x000000, 0.4);
        this.darknessOverlay.setScrollFactor(0);
        this.darknessOverlay.setDepth(150);

        // Play woods ambient music
        this.woodsMusic = this.sound.add('woods-music', { loop: true, volume: 0.3 });
        if (this.game.registry.get('musicEnabled')) {
            this.woodsMusic.play();
        }

        // --- UI Setup (must be before collectibles) ---
        this.setupUI();

        // --- Layout Parsing ---
        this.createLevel();
        this.createCollectibles();

        // --- Entities & Triggers ---
        this.createEnemies();
        this.createTriggers();
        this.createCheckpoints();
        this.createLighting();

        // --- Controls ---
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        }

        // --- Camera ---
        this.camera = this.cameras.main;
        this.camera.setZoom(1.0);
        this.camera.startFollow(this.player, true, 0.08, 0.08);
        this.camera.setBounds(0, 0, worldWidth, worldHeight);

        // --- Intro ---
        this.setupIntro();

        // --- Load Save Data (if any) ---
        const sceneData = this.scene.settings.data as any;
        if (sceneData?.loadSave && sceneData?.saveData) {
            this.loadSaveData(sceneData.saveData);
        } else {
            // Auto-load from localStorage if available
            try {
                const savedGame = localStorage.getItem('shatter_save');
                if (savedGame) {
                    const saveData = JSON.parse(savedGame);
                    this.loadSaveData(saveData);
                }
            } catch (e) {
                console.error('Failed to load saved game:', e);
            }
        }

        // --- Collisions ---
        this.physics.add.collider(this.player, this.platforms);

        // Hazard overlap
        this.physics.add.overlap(this.player, this.hazards, () => {
            this.takeDamage(1);
        });

        // Enforcer overlap
        this.physics.add.overlap(this.player, this.enforcers, () => {
            if (!this.isPlayerInShadow || !this.hasShadowMask) {
                this.takeDamage(1);
            }
        });

        // Checkpoint collision
        this.checkpoints.forEach(checkpoint => {
            this.physics.add.overlap(this.player, checkpoint.sprite, () => {
                if (!checkpoint.isActivated) {
                    checkpoint.activate(this);
                    this.lastCheckpoint = {
                        x: checkpoint.sprite.x,
                        y: checkpoint.sprite.y
                    };

                    // Auto-save game when reaching checkpoint
                    this.saveGame();
                    this.showCheckpointMessage('CHECKPOINT SAVED');
                }
            });
        });

        // Coin collection
        this.coins.forEach(coin => {
            this.physics.add.overlap(this.player, coin.sprite, () => {
                if (!coin.collected) {
                    coin.collect(this);
                    this.score++;
                    this.updateCoinText();
                }
            });
        });

        // Shadow zone detection
        this.shadowZones.forEach(zone => {
            this.physics.add.overlap(this.player, zone, () => {
                if (this.hasShadowMask) {
                    this.isPlayerInShadow = true;
                }
            });
        });

        // Pass player reference to enforcers
        this.enforcers.children.entries.forEach((enforcer: any) => {
            if (enforcer.setPlayer) {
                enforcer.setPlayer(this.player);
            }
        });
    }

    private setupUI() {
        const uiX = 20;
        const uiY = 20;

        // --- HP BAR ---
        // Label
        this.add.text(uiX, uiY, 'LIFE', {
            fontFamily: 'Courier',
            fontSize: '18px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setScrollFactor(0).setDepth(200);

        // HP Bar Background
        this.hpBarBg = this.add.rectangle(uiX + 60, uiY + 10, 200, 20, 0x000000, 0.5)
            .setOrigin(0, 0.5)
            .setStrokeStyle(2, 0xffffff)
            .setScrollFactor(0)
            .setDepth(200);

        // HP Bar Fill
        this.hpBarFill = this.add.rectangle(uiX + 62, uiY + 10, 196, 16, 0x33ff33)
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
            .setDepth(201);

        // HP Text (Percentage or fraction)
        this.hpText = this.add.text(uiX + 270, uiY, '10/10', {
            fontFamily: 'Courier',
            fontSize: '16px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setScrollFactor(0).setDepth(200);

        // --- COIN DISPLAY ---
        // Emoji icon for aesthetic
        this.add.text(uiX, uiY + 40, '🪙', { fontSize: '24px' })
            .setScrollFactor(0)
            .setDepth(200);

        this.coinText = this.add.text(uiX + 40, uiY + 42, 'COINS: 0/0', {
            fontFamily: 'Courier',
            fontSize: '18px',
            color: '#ffdd00',
            fontStyle: 'bold'
        }).setScrollFactor(0).setDepth(200);

        // Mask indicator
        this.maskIndicator = this.add.text(uiX, uiY + 75, '', {
            fontFamily: 'Courier',
            fontSize: '14px',
            color: '#aaaaaa',
        }).setScrollFactor(0).setDepth(200);
    }

    private updateCoinText() {
        this.coinText.setText(`COINS: ${this.score}/${this.totalCoins}`);
    }

    private updateHPText() {
        this.hpText.setText(`${this.hp}/${this.maxHp}`);

        // Update bar width
        const percentage = Math.max(0, this.hp / this.maxHp);
        this.hpBarFill.width = 196 * percentage;

        // Change color based on HP percentage
        if (percentage <= 0.3) {
            this.hpBarFill.setFillStyle(0xff3333); // Red
        } else if (percentage <= 0.6) {
            this.hpBarFill.setFillStyle(0xffaa33); // Orange
        } else {
            this.hpBarFill.setFillStyle(0x33ff33); // Green
        }
    }

    public playCheckpointSound() {
        if (!this.game.registry.get('soundEnabled')) return;
        const soundManager = this.sound as any;
        const audioContext = soundManager.context as AudioContext;
        if (!audioContext) return;

        const oscillator = audioContext.createOscillator();
        const secondOscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        secondOscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        const now = audioContext.currentTime;
        oscillator.frequency.setValueAtTime(523.25, now);
        oscillator.frequency.exponentialRampToValueAtTime(783.99, now + 0.1);
        oscillator.frequency.exponentialRampToValueAtTime(1046.5, now + 0.3);

        secondOscillator.frequency.setValueAtTime(261.63, now);
        secondOscillator.frequency.exponentialRampToValueAtTime(523.25, now + 0.3);

        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

        oscillator.type = 'sine';
        secondOscillator.type = 'sine';

        oscillator.start(now);
        secondOscillator.start(now);
        oscillator.stop(now + 0.6);
        secondOscillator.stop(now + 0.6);
    }

    public playBeepSound() {
        if (!this.game.registry.get('soundEnabled')) return;
        const soundManager = this.sound as any;
        const audioContext = soundManager.context as AudioContext;
        if (!audioContext) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        const now = audioContext.currentTime;
        oscillator.frequency.setValueAtTime(220, now);
        oscillator.frequency.linearRampToValueAtTime(110, now + 0.1);

        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        oscillator.type = 'square';
        oscillator.start(now);
        oscillator.stop(now + 0.1);
    }

    takeDamage(amount: number = 1) {
        if (this.isInvulnerable) return;

        this.hp = Math.max(0, this.hp - amount);
        this.updateHPText();
        this.playBeepSound();

        // Flash player red
        this.player.setTint(0xff0000);
        this.time.delayedCall(100, () => this.player.clearTint());

        // Screen shake
        this.cameras.main.shake(100, 0.005);

        // Brief invulnerability
        this.isInvulnerable = true;
        this.time.delayedCall(500, () => this.isInvulnerable = false);

        if (this.hp <= 0) {
            this.handleDeath();
        }
    }

    private gridToWorld(gridX: number, gridY: number): { x: number, y: number } {
        // GridY: 0 is Bottom row, 79 is Top row.
        // PhaserY: 0 is Top, 5120 is Bottom.
        // Row 0 (Bottom) corresponds to PhaserY ~ 5120 - 32.
        // Row 79 (Top) corresponds to PhaserY ~ 32.
        // Formula: height - (gridY * tile) - offset?
        // Let's iterate Y from 0 to 79.
        // bottom Y (5120) corresponds to gridY 0.
        // 5120 - (0+1)*64 + 32 = 5088? 
        // 5120 - 64 + 32 = 5088. Correct center for last row?
        // If gridY=79: 5120 - (80)*64 + 32 = 32. Correct.
        const phaserY = (this.GRID_H * this.TILE_SIZE) - (gridY * this.TILE_SIZE) - (this.TILE_SIZE / 2);
        const phaserX = gridX * this.TILE_SIZE + (this.TILE_SIZE / 2);
        return { x: phaserX, y: phaserY };
    }

    private createLevel() {
        const mapData = [
            "##############################", // Y=79
            "#.............X.............##", // Y=78 - EXIT
            "############....##############", // Y=77
            "#.........C..........===....##", // Y=76 - Checkpoint 4 + bridge
            "#..........====.......S.....##", // Y=75 - Bridge + Shadow
            "#.......===........====.....##", // Y=74 - Bridge platforms
            "#....g........S.............##", // Y=73 - Gem + Shadow
            "#..........====......====...##", // Y=72 - Bridge platforms
            "#...g...........g...........##", // Y=71 - Gems
            "#......====.........====....##", // Y=70 - Bridge platforms
            "#.....S...........g.........##", // Y=69 - Shadow + gem
            "#....==....====.....====....##", // Y=68 - Bridge platforms
            "#...g...........g...........##", // Y=67 - Gems
            "########===.........====....##", // Y=66 - Platform + bridge
            "#..........g........===.....##", // Y=65 - Gem
            "###########===..............##", // Y=64 - Step up
            "#..............===..g.......##", // Y=63
            "#..g........................##", // Y=62
            "#...........g...............##", // Y=61
            "#.....===...................##", // Y=60
            "#...........................##", // Y=59
            "#..g........===.............##", // Y=58
            "#....................===....##", // Y=57
            "#............g..............##", // Y=56
            "#........===.....===........##", // Y=55 - Platform under mask
            "#.......g.....DM.....g......##", // Y=54 - SHADOW MASK + gems
            "####======.........======...##", // Y=53 - Solid platforms
            "####..........g.............##", // Y=52
            "#...........................##", // Y=51
            "#...........g...............##", // Y=50
            "#......===..................##", // Y=49 - SANCTUARY ZONE D
            "############....##############", // Y=48 - Checkpoint 3
            "#..........#..=.#ggggggggggg##", // Y=47
            "#..........#....#...........##", // Y=46
            "#.===......#....#.===......g##", // Y=45 - Side platforms
            "#..g.......#....#...........##", // Y=44 - Shadow + gems
            "#..........#....#..====.....##", // Y=43
            "#.===......#.==.#..........g##", // Y=42 - Intermediate zigzag
            "####.................=======##", // Y=41
            "#............=====..........##", // Y=40 - Center platform + gem
            "########...#....#...##########", // Y=39 - Intermediate platform
            "#.........=#.==.#...........##", // Y=38
            "#..g.......#....#.......g...##", // Y=37 - Gems
            "#..========#....#==.........##", // Y=36
            "#........R.#....#...........##", // Y=35 - Vent marker
            "#########..#....#..###########", // Y=34
            "#..g...........g#...........##", // Y=33 - GRINDER ZONE C
            "############....##############", // Y=32 - Wider shaft (4 tiles)
            "#...........C...g...........##", // Y=31 - Checkpoint 2 + gem
            "#..g........................##", // Y=30
            "#####..===####################", // Y=29
            "#...........................##", // Y=28
            "#...###...g.................##", // Y=27
            "#...........................##", // Y=26
            "######=======.g.........######", // Y=25
            "#.........g.................##", // Y=24
            "#....===.........===.....g..##", // Y=23 - Left stepping stone
            "#...........................##", // Y=22 - Shadow zone
            "#######===############===...##", // Y=21
            "#.....g........g............##", // Y=20
            "########################==..##", // Y=19
            "#..g........................##", // Y=18
            "#....===........===.........##", // Y=17 - FIXED: Left platform
            "###########.C...##############", // Y=16 - Checkpoint 1
            "#.........##g..###############", // Y=15
            "#........g###g..##############", // Y=14
            "#........###.g.###############", // Y=13
            "#.......g.......##############", // Y=12
            "############....##############", // Y=11
            "#.............#.............##", // Y=10
            "#.........##..g.............##", // Y=09
            "#...........................##", // Y=08
            "##################.g....######", // Y=07
            "#.............g.............##", // Y=06
            "###################...########", // Y=05
            "#..........g................##", // Y=04
            "#..g................===.....##", // Y=03
            "#..P........................##", // Y=02 - PLAYER START
            "##############################", // Y=01
            "##############################"  // Y=00
        ];

        mapData.forEach((row, rowIndex) => {
            const gridY = 79 - rowIndex;
            // Run-length encoding for horizontal blocks
            let currentRunLength = 0;
            let runStartX = -1;

            const paddedRow = row.padEnd(30, '.');

            for (let x = 0; x <= 30; x++) {
                const char = (x < 30) ? paddedRow[x] : '.'; // Sentinel to close run

                // Check Terrain Run
                if (char === '#') {
                    if (runStartX === -1) {
                        runStartX = x;
                    }
                    currentRunLength++;
                } else {
                    // End of run
                    if (runStartX !== -1) {
                        this.createMergedPlatform(runStartX, gridY, currentRunLength);
                        runStartX = -1;
                        currentRunLength = 0;
                    }
                }

                if (x >= 30) continue; // Skip entity check for sentinel

                const pos = this.gridToWorld(x, gridY);

                // Handle other entities
                if (char === '=') {
                    // Platform (Thin)
                    const plat = this.platforms.create(pos.x, pos.y - 22, 'cave_floor').setSize(this.TILE_SIZE, 20);
                    plat.setDisplaySize(this.TILE_SIZE, 20);
                    plat.refreshBody();
                } else if (char === '|') {
                    // Structure/Pipe
                    this.add.tileSprite(pos.x, pos.y, this.TILE_SIZE / 2, this.TILE_SIZE, 'cave_floor');

                    const plat = this.platforms.create(pos.x, pos.y, undefined);
                    plat.setSize(this.TILE_SIZE, this.TILE_SIZE);
                    plat.setVisible(false);
                    plat.refreshBody();
                } else if (char === 'X') {
                    const exit = this.add.rectangle(pos.x, pos.y, this.TILE_SIZE, this.TILE_SIZE, 0xFFFFFF, 0.5);
                    this.physics.add.existing(exit, true);
                    this.physics.add.overlap(this.player, exit, () => this.handleLevelComplete());
                } else if (char === 'M') {
                    this.createMask(pos.x, pos.y);
                } else if (char === 'C') {
                    // Checkpoint marker - handled in createCheckpoints()
                } else if (char === 'g') {
                    // Gem marker - handled in createCollectibles()
                }
            }
        });
    }

    private createCollectibles() {
        // Parse map for coins 'g'
        const mapData = [
            "##############################", "#.............X..............#", "############....#############",
            "#.........C..........===....#", "#..........====.......S.....#", "#.......===......====.......#",
            "#....g........S.............#", "#..........====.....==......#", "#...g...........g...........#",
            "#......====.........====....#", "#.....S...........g.........#", "#..........====.....====....#",
            "#...g...........g...........#", "########===.........====....#", "#..........g........===.....#",
            "###########===..............#", "#..............===..g.......#", "#..g........................#",
            "#...........g...............#", "#.....===...................#", "#...........................#",
            "#..g........................#", "#....................===....#", "#............g..............#",
            "#........===.....===........#", "#.......g.....DM.....g......#", "####======.........======...#",
            "####..........g.............#", "#...........................#", "#...........g...............#",
            "#......===..................#", "############....#############", "#..........#....#.....g.....#",
            "#..........#....#...........#", "#.===......#....#.===.......#", "#..g.......#....#...S..g....#",
            "#..........#....#..====.....#", "#.===......#.==.#...........#", "####.......#....#.......====",
            "#..........===g===..........#", "########...#....#...########", "#.........=#.==.#...........#",
            "#..g.......#....#.......g...#", "#..========#....#==.........#", "#........R.#....#...........#",
            "#########..#....#..#########", "#..g...........g#...........#", "############....#############",
            "#...........C...g...........#", "#..g........................#", "#####..===###################",
            "#...........................#", "#...###...g.................#", "#...........................#",
            "######=======.g.........#####", "#.........g.................#", "#....===.........===.....g..#",
            "#........S..................#", "#######===############===...#", "#.....g........g............#",
            "########################==..#", "#..g........................#", "#....===........===.........#",
            "###########.C...#############", "#.........##g..##...........#", "#.........###g..#...........#",
            "#........###.g.##...........#", "#.......g.......#...........#", "############....#############",
            "#.............#.............#", "#.........##..g.............#", "#...........................#",
            "##################.g....#####", "#.............g.............#", "###################...#######",
            "#..........g................#", "#..g...........===..........#", "#..P........................#",
            "##############################", "##############################"
        ];

        mapData.forEach((row, rowIndex) => {
            const gridY = 79 - rowIndex;
            for (let x = 0; x < row.length; x++) {
                if (row[x] === 'g') {
                    const pos = this.gridToWorld(x, gridY);
                    this.coins.push(new Coin(this, pos.x, pos.y));
                    this.totalCoins++;
                }
            }
        });

        this.updateCoinText();
    }

    private createCheckpoints() {
        // Checkpoint locations from map 'C' markers
        const checkpointPositions = [
            { x: 12, y: 16 }, // Zone B entry
            { x: 12, y: 31 }, // Zone C entry  
            { x: 10, y: 76 }  // Zone E near exit
        ];

        checkpointPositions.forEach(pos => {
            const worldPos = this.gridToWorld(pos.x, pos.y);
            this.checkpoints.push(new Checkpoint(this, worldPos.x, worldPos.y, pos.x, pos.y));
        });
    }

    private createMergedPlatform(gridX: number, gridY: number, length: number) {
        // Center position of the merged block
        // gridToWorld(x, y) gives center of ONE tile at x,y.
        // Left Edge = gridX * TILE
        // Right Edge = (gridX + length) * TILE
        // Width = length * TILE
        // CenterX = Left + Width/2 = (gridX + length/2) * TILE

        // However, our gridToWorld includes WORLD HEIGHT inversion math.
        // Y center is same for all in row.
        const centerY = this.gridToWorld(0, gridY).y; // Y is consistent for row

        const width = length * this.TILE_SIZE;
        const height = this.TILE_SIZE;

        // X calculation in px
        const leftPx = gridX * this.TILE_SIZE;
        const centerX = leftPx + (width / 2);

        // Create Visual Body using cave_floor tileSprite for textures
        const plat = this.add.tileSprite(centerX, centerY, width, height, 'cave_floor');

        this.physics.add.existing(plat, true); // Static
        this.platforms.add(plat);
    }

    private createEnemies() {
        // Relocated and optimized patrols for new layout

        // Drone 01 (Zone B - Main path) (6, 23) <-> (20, 23)
        const d1Start = this.gridToWorld(6, 23);
        const d1End = this.gridToWorld(20, 23);
        const d1 = new SmartEnforcer(this, d1Start.x, d1Start.y, d1End.x, d1End.y, 1.5);
        this.enforcers.add(d1);

        // Drone 02 (Zone C - Shaft guard) (12, 40) <-> (18, 40)
        const d2Start = this.gridToWorld(12, 40);
        const d2End = this.gridToWorld(18, 40);
        const d2 = new SmartEnforcer(this, d2Start.x, d2Start.y, d2End.x, d2End.y, 1.0);
        this.enforcers.add(d2);

        // Drone 03 (Zone E - Lower horizontal) (4, 68) <-> (20, 68)
        const d3Start = this.gridToWorld(4, 68);
        const d3End = this.gridToWorld(20, 68);
        const d3 = new SmartEnforcer(this, d3Start.x, d3Start.y, d3End.x, d3End.y, 1.0);
        this.enforcers.add(d3);

        // Drone 04 (Zone E - Mid horizontal) (6, 72) <-> (20, 72)
        const d4Start = this.gridToWorld(6, 72);
        const d4End = this.gridToWorld(20, 72);
        const d4 = new SmartEnforcer(this, d4Start.x, d4Start.y, d4End.x, d4End.y, 1.0);
        this.enforcers.add(d4);

        // Drone 05 (Zone E - Upper horizontal) (6, 75) <-> (18, 75)
        const d5Start = this.gridToWorld(6, 75);
        const d5End = this.gridToWorld(18, 75);
        const d5 = new SmartEnforcer(this, d5Start.x, d5Start.y, d5End.x, d5End.y, 0.8);
        this.enforcers.add(d5);
    }

    private createTriggers() {
        // Shadow Zones (with physics)
        this.createShadowZone(10, 22);  // Zone B
        this.createShadowZone(22, 44);  // Zone C
        this.createShadowZone(6, 69);   // Zone E lower
        this.createShadowZone(14, 73);  // Zone E mid
        this.createShadowZone(22, 75);  // Zone E upper
    }

    private createShadowZone(gx: number, gy: number) {
        const pos = this.gridToWorld(gx, gy);
        const zone = this.add.rectangle(pos.x, pos.y, this.TILE_SIZE * 1.5, this.TILE_SIZE * 1.5, 0x000000, 0.7);
        zone.setDepth(10);
        this.physics.add.existing(zone, true);
        this.shadowZones.push(zone);
    }

    private createMask(x: number, y: number) {
        const mask = this.add.sprite(x, y, 'mask').setDisplaySize(50, 50);
        this.physics.add.existing(mask, true);
        this.tweens.add({ targets: mask, y: y - 10, duration: 1500, yoyo: true, repeat: -1 });

        // Shadow aura around mask
        const aura = this.add.circle(x, y, 70, 0x000000, 0.4).setDepth(5);
        this.tweens.add({
            targets: aura,
            alpha: { from: 0.2, to: 0.6 },
            scale: { from: 0.9, to: 1.1 },
            duration: 1500,
            yoyo: true,
            repeat: -1
        });

        this.physics.add.overlap(this.player, mask, () => {
            this.hasShadowMask = true;
            this.narrativeText.setText(`SHADOW MASK OBTAINED.\nBLEND WITH DARKNESS.\nAUTO-HEALING ACTIVATED.`).setAlpha(1);
            this.maskIndicator.setText('■ SHADOW MASK').setColor('#000000');

            // Play checkpoint sound for mask as well
            this.playCheckpointSound();

            // Particle effect
            const particles = this.add.particles(x, y, 'mask', {
                speed: { min: 100, max: 250 },
                scale: { start: 0.5, end: 0 },
                alpha: { start: 0.8, end: 0 },
                lifespan: 800,
                tint: 0x000000,
                quantity: 25
            });

            this.cameras.main.flash(300, 0, 0, 0, false);
            mask.destroy();
            aura.destroy();

            this.time.delayedCall(600, () => particles.destroy());
            this.time.delayedCall(2500, () => this.narrativeText.setAlpha(0));
        });
    }

    private createLighting() {
        // @note remove shadow overlays for better visibility
        // Zone A (Y 0-15) - Deep Shadows.
        //this.createZoneOverlay(0, 15, 0x000000, 0.6);

        // Zone B (Y 16-31) - Industrial Gloom.
        //this.createZoneOverlay(16, 31, 0x4A5E6D, 0.3);

        // Zone C (Y 32-47) - Very Dark.
        //this.createZoneOverlay(32, 47, 0x000000, 0.8);

        // Zone D (Y 48-63) - Warm, sickly yellow-orange.
        this.createZoneOverlay(48, 63, 0x8A7F50, 0.2);

        // Zone E (Y 64-79) - Unstable Power
        const zoneE = this.createZoneOverlay(64, 79, 0x330000, 0.2);
        this.tweens.add({
            targets: zoneE,
            alpha: { from: 0.1, to: 0.3 },
            duration: 100,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private createZoneOverlay(yStart: number, yEnd: number, color: number, alpha: number) {
        // World Y of yEnd grid (Top of zone)
        // gridToWorld returns center. Top edge is center - 32.
        const topWorld = this.gridToWorld(0, yEnd).y - 32;
        // World Y of yStart grid (Bottom of zone)
        // Bottom edge is center + 32.
        const bottomWorld = this.gridToWorld(0, yStart).y + 32;

        const h = bottomWorld - topWorld;
        const cy = topWorld + h / 2;

        // Use physics bounds width
        const w = this.physics.world.bounds.width;

        const overlay = this.add.rectangle(w / 2, cy, w, h, color, alpha);
        overlay.setDepth(100);
        return overlay;
    }

    private setupIntro() {
        this.narrativeText = this.add.text(this.scale.width / 2, this.scale.height / 2, "", {
            fontFamily: 'Courier',
            fontSize: '20px',
            color: '#ffffff',
            align: 'center'
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(200);

        this.canMove = true;
    }

    handleDeath() {
        this.cameras.main.flash(400, 255, 0, 0);
        this.cameras.main.shake(200, 0.01);

        // Reset HP
        this.hp = this.maxHp;
        this.updateHPText();

        if (this.lastCheckpoint) {
            this.player.setPosition(this.lastCheckpoint.x, this.lastCheckpoint.y);
        } else {
            const startPos = this.gridToWorld(3, 2);
            this.player.setPosition(startPos.x, startPos.y);
        }

        this.player.setVelocity(0, 0);
        this.isPlayerDetected = false;
        this.isInvulnerable = false;
        this.healingTimer = 0; // Reset healing timer
    }

    private handleLevelComplete() {
        if (!this.canMove) return;
        this.canMove = false;

        // Character vanishes
        this.player.setVisible(false);
        this.player.setActive(false);
        this.player.setVelocity(0, 0);

        if (this.playerShadowGlow) {
            this.playerShadowGlow.setVisible(false);
        }

        const { width, height } = this.scale;
        const completeContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(400);

        // Semi-transparent overlay
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
        completeContainer.add(overlay);

        let greeting = "VICTORY! YOU HAVE ASCENDED.";
        if (this.score === this.totalCoins) {
            greeting = "FLAWLESS ASCENT! ALL COINS COLLECTED.";
        }

        // Greeting text
        const title = this.add.text(width / 2, height / 2 - 80, greeting, {
            fontFamily: 'Courier',
            fontSize: '32px',
            color: '#00ff88',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: width - 100 }
        }).setOrigin(0.5);
        completeContainer.add(title);

        // Subtext
        const subtext = this.add.text(width / 2, height / 2 + 20, "Level 1 Complete.", {
            fontFamily: 'Courier',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);
        completeContainer.add(subtext);

        // Restart Prompt
        const restartBtn = this.add.text(width / 2, height / 2 + 100, 'CLICK HERE TO RESTART', {
            fontFamily: 'Courier',
            fontSize: '28px',
            color: '#ffdd00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        restartBtn.setInteractive({ useHandCursor: true });
        restartBtn.on('pointerover', () => restartBtn.setScale(1.1).setColor('#ffffff'));
        restartBtn.on('pointerout', () => restartBtn.setScale(1.0).setColor('#ffdd00'));
        restartBtn.on('pointerdown', () => {
            localStorage.removeItem('shatter_save');
            this.scene.restart({ loadSave: false });
        });

        completeContainer.add(restartBtn);

        // Animation for the menu
        completeContainer.setAlpha(0);
        this.tweens.add({
            targets: completeContainer,
            alpha: 1,
            duration: 800,
            ease: 'Power2'
        });
    }

    update() {
        // Check for pause
        if (this.escKey && Phaser.Input.Keyboard.JustDown(this.escKey)) {
            this.togglePause();
        }

        if (this.isPaused) {
            this.updatePauseMenu();
            return;
        }

        if (!this.canMove) return;

        // Reset shadow state each frame
        this.isPlayerInShadow = false;

        this.player.update();

        // Update shadow glow position and visibility
        const cam = this.cameras.main;

        // Manual Parallax logic
        if (this.parallaxBg) {
            this.parallaxBg.tilePositionX = cam.scrollX * 0.1;
            this.parallaxBg.tilePositionY = cam.scrollY * 0.1;
        }
        if (this.parallaxFarTrees) {
            this.parallaxFarTrees.tilePositionX = cam.scrollX * 0.3;
            this.parallaxFarTrees.tilePositionY = cam.scrollY * 0.3;
        }
        if (this.parallaxMidTrees) {
            this.parallaxMidTrees.tilePositionX = cam.scrollX * 0.5;
            this.parallaxMidTrees.tilePositionY = cam.scrollY * 0.5;
        }
        if (this.parallaxCloseTrees) {
            this.parallaxCloseTrees.tilePositionX = cam.scrollX * 0.7;
            this.parallaxCloseTrees.tilePositionY = cam.scrollY * 0.7;
        }

        // Update player glow circle position
        if (this.playerShadowGlow) {
            this.playerShadowGlow.setPosition(this.player.x, this.player.y);

            // Check if player is in any shadow zone
            let inAnyShadow = false;
            this.shadowZones.forEach(zone => {
                if (this.physics.overlap(this.player, zone)) {
                    inAnyShadow = true;
                }
            });

            if (inAnyShadow && this.hasShadowMask) {
                this.isPlayerInShadow = true;
                this.playerShadowGlow.setVisible(true);
                this.player.setAlpha(0.5); // Darken player
            } else {
                this.playerShadowGlow.setVisible(false);
                this.player.setAlpha(1.0); // Normal
            }
        }

        // Update darkness overlay - fade from dark (bottom) to light (top)
        if (this.darknessOverlay && this.player) {
            // Calculate player's progress from bottom (0) to top (1)
            const worldHeight = this.GRID_H * this.TILE_SIZE;
            const progress = 1 - (this.player.y / worldHeight); // 0 at bottom, 1 at top

            // Darkness fades from 0.4 (less dark) at bottom to 0 (light) at top - improved brightness
            const darknessAlpha = Math.max(0, 0.4 - (progress * 0.4));
            this.darknessOverlay.setAlpha(darknessAlpha);
        }

        // Update enforcers
        this.enforcers.children.entries.forEach((enforcer: any) => {
            if (enforcer.update) enforcer.update();
        });

        // Automatic healing when player has shadow mask
        if (this.hasShadowMask && this.hp < this.maxHp) {
            this.healingTimer += this.game.loop.delta;

            if (this.healingTimer >= this.HEAL_INTERVAL) {
                this.healingTimer = 0;
                this.hp = Math.min(this.maxHp, this.hp + this.HEAL_RATE);
                this.updateHPText();

                // Subtle healing visual feedback
                const healParticle = this.add.circle(this.player.x, this.player.y, 5, 0x00ff88, 0.8);
                healParticle.setDepth(150);
                this.tweens.add({
                    targets: healParticle,
                    y: healParticle.y - 30,
                    alpha: 0,
                    duration: 800,
                    ease: 'Cubic.easeOut',
                    onComplete: () => healParticle.destroy()
                });
            }
        }

        // Camera control
        const maxLookOffset = 250;
        let targetOffsetY = 0;

        if (this.cursors.up.isDown) {
            targetOffsetY = maxLookOffset;
        } else if (this.cursors.down.isDown) {
            targetOffsetY = -maxLookOffset;
        }

        const currentOffsetY = this.camera.followOffset.y;
        const lerpedOffset = Phaser.Math.Linear(currentOffsetY, targetOffsetY, 0.05);
        this.camera.setFollowOffset(0, lerpedOffset);
    }

    private togglePause() {
        if (this.isPaused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
    }

    private pauseGame() {
        this.isPaused = true;
        this.physics.pause();
        this.tweens.pauseAll();

        // Create pause menu container
        const { width, height } = this.scale;
        this.pauseMenu = this.add.container(0, 0).setScrollFactor(0).setDepth(300);

        // Semi-transparent overlay
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
        this.pauseMenu.add(overlay);

        // Title
        const title = this.add.text(width / 2, height / 2 - 120, 'PAUSED', {
            fontFamily: 'Courier',
            fontSize: '48px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.pauseMenu.add(title);

        // Menu options
        const options = [
            { text: 'RESUME', action: () => this.resumeGame() },
            { text: 'SAVE GAME', action: () => this.saveGame() },
            { text: 'SETTINGS', action: () => this.openPauseSettings() },
            { text: 'EXIT TO MENU', action: () => this.exitToMenu() }
        ];

        this.pauseMenuOptions = [];
        const startY = height / 2 - 20;
        const spacing = 60;

        options.forEach((option, index) => {
            const text = this.add.text(width / 2, startY + (index * spacing), option.text, {
                fontFamily: 'Courier',
                fontSize: '24px',
                color: '#888888'
            }).setOrigin(0.5);

            text.setInteractive();
            text.on('pointerover', () => {
                this.pauseSelectedIndex = index;
                this.updatePauseMenuDisplay();
            });
            text.on('pointerdown', () => option.action());

            if (this.pauseMenu) {
                this.pauseMenu.add(text);
            }
            this.pauseMenuOptions.push({ text, action: option.action });
        });

        this.pauseSelectedIndex = 0;
        this.updatePauseMenuDisplay();
    }

    private resumeGame() {
        this.isPaused = false;
        this.physics.resume();
        this.tweens.resumeAll();

        if (this.pauseMenu) {
            this.pauseMenu.destroy();
            this.pauseMenu = null;
        }
        this.pauseMenuOptions = [];
    }

    private updatePauseMenuDisplay() {
        this.pauseMenuOptions.forEach((option, index) => {
            if (index === this.pauseSelectedIndex) {
                option.text.setColor('#ffffff').setFontSize('28px').setFontStyle('bold');
            } else {
                option.text.setColor('#888888').setFontSize('24px').setFontStyle('normal');
            }
        });
    }

    private openPauseSettings() {
        this.isPauseSettingsOpen = true;
        this.pauseMenu?.setVisible(false);

        const { width, height } = this.scale;
        this.pauseSettingsMenu = this.add.container(0, 0).setScrollFactor(0).setDepth(400);

        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9);
        this.pauseSettingsMenu.add(overlay);

        const title = this.add.text(width / 2, height / 2 - 120, 'SETTINGS', {
            fontFamily: 'Courier', fontSize: '48px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.pauseSettingsMenu.add(title);

        const options = [
            { label: 'MUSIC', key: 'musicEnabled' },
            { label: 'SOUND', key: 'soundEnabled' },
            { label: 'BACK', key: 'EXIT' }
        ];

        this.pauseSettingsOptions = [];
        const startY = height / 2 - 20;
        const spacing = 60;

        options.forEach((opt, index) => {
            const text = this.add.text(width / 2, startY + (index * spacing), '', {
                fontFamily: 'Courier', fontSize: '28px', color: '#888888'
            }).setOrigin(0.5).setInteractive();

            text.on('pointerdown', () => {
                this.pauseSettingsSelectedIndex = index;
                this.handlePauseSettingsSelection();
            });

            this.pauseSettingsMenu?.add(text);
            this.pauseSettingsOptions.push({ text, key: opt.key });
        });

        this.pauseSettingsSelectedIndex = 0;
        this.updatePauseSettingsDisplay();
    }

    private updatePauseSettingsDisplay() {
        this.pauseSettingsOptions.forEach((opt, index) => {
            let label = opt.key === 'EXIT' ? 'BACK' : (opt.key === 'musicEnabled' ? 'MUSIC' : 'SOUND');
            if (opt.key !== 'EXIT') {
                const enabled = this.game.registry.get(opt.key);
                label += `: ${enabled ? 'ON' : 'OFF'}`;
            }

            opt.text.setText(label);
            if (index === this.pauseSettingsSelectedIndex) {
                opt.text.setColor('#ffffff').setFontStyle('bold');
            } else {
                opt.text.setColor('#888888').setFontStyle('normal');
            }
        });
    }

    private handlePauseSettingsSelection() {
        const option = this.pauseSettingsOptions[this.pauseSettingsSelectedIndex];
        if (option.key === 'EXIT') {
            this.closePauseSettings();
        } else {
            const current = this.game.registry.get(option.key);
            this.game.registry.set(option.key, !current);
            this.saveSettings();
            this.updatePauseSettingsDisplay();

            if (option.key === 'musicEnabled') {
                if (!this.game.registry.get('musicEnabled')) {
                    this.sound.stopAll();
                } else if (this.woodsMusic && !this.woodsMusic.isPlaying) {
                    this.woodsMusic.play();
                }
            }
        }
    }

    private closePauseSettings() {
        if (this.pauseSettingsMenu) {
            this.pauseSettingsMenu.destroy();
            this.pauseSettingsMenu = null;
        }
        this.isPauseSettingsOpen = false;
        this.pauseMenu?.setVisible(true);
    }

    private saveSettings() {
        const settings = {
            music: this.game.registry.get('musicEnabled'),
            sound: this.game.registry.get('soundEnabled')
        };
        localStorage.setItem('shatter_settings', JSON.stringify(settings));
    }

    private updatePauseMenu() {
        if (this.cursors) {
            if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
                if (this.isPauseSettingsOpen) {
                    this.pauseSettingsSelectedIndex = (this.pauseSettingsSelectedIndex - 1 + this.pauseSettingsOptions.length) % this.pauseSettingsOptions.length;
                    this.updatePauseSettingsDisplay();
                } else {
                    this.pauseSelectedIndex = (this.pauseSelectedIndex - 1 + this.pauseMenuOptions.length) % this.pauseMenuOptions.length;
                    this.updatePauseMenuDisplay();
                }
            } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
                if (this.isPauseSettingsOpen) {
                    this.pauseSettingsSelectedIndex = (this.pauseSettingsSelectedIndex + 1) % this.pauseSettingsOptions.length;
                    this.updatePauseSettingsDisplay();
                } else {
                    this.pauseSelectedIndex = (this.pauseSelectedIndex + 1) % this.pauseMenuOptions.length;
                    this.updatePauseMenuDisplay();
                }
            }

            if (Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
                (this.input.keyboard && Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey('ENTER')))) {
                if (this.isPauseSettingsOpen) {
                    this.handlePauseSettingsSelection();
                } else {
                    this.pauseMenuOptions[this.pauseSelectedIndex].action();
                }
            }
        }
    }

    private showCheckpointMessage(message: string) {
        const msg = this.add.text(this.scale.width / 2, this.scale.height / 2 - 100, message, {
            fontFamily: 'Courier',
            fontSize: '24px',
            color: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(250);

        this.tweens.add({
            targets: msg,
            y: msg.y - 50,
            alpha: { from: 1, to: 0 },
            duration: 1500,
            ease: 'Cubic.easeOut',
            onComplete: () => msg.destroy()
        });
    }

    private saveGame() {
        const saveData = {
            score: this.score,
            totalCoins: this.totalCoins,
            hasShadowMask: this.hasShadowMask,
            lastCheckpoint: this.lastCheckpoint,
            hp: this.hp,
            collectedCoins: this.coins.map(coin => ({
                x: coin.sprite.x,
                y: coin.sprite.y,
                collected: coin.collected
            })),
            activatedCheckpoints: this.checkpoints.map(cp => cp.isActivated),
            playerPosition: { x: this.player.x, y: this.player.y },
            timestamp: Date.now()
        };

        try {
            localStorage.setItem('shatter_save', JSON.stringify(saveData));
            this.showPauseMessage('GAME SAVED');
        } catch (e) {
            this.showPauseMessage('SAVE FAILED');
            console.error('Save failed:', e);
        }
    }

    private loadSaveData(data: any) {
        if (!data) return;

        this.score = data.score || 0;
        this.hasShadowMask = data.hasShadowMask || false;
        this.lastCheckpoint = data.lastCheckpoint || null;
        this.hp = data.hp || this.maxHp;

        // Restore player position
        if (data.playerPosition) {
            this.player.setPosition(data.playerPosition.x, data.playerPosition.y);
        }

        // Restore collected coins
        if (data.collectedCoins) {
            data.collectedCoins.forEach((coinData: any, index: number) => {
                if (coinData.collected && this.coins[index]) {
                    this.coins[index].collected = true;
                    this.coins[index].sprite.destroy();
                }
            });
        }

        // Restore activated checkpoints
        if (data.activatedCheckpoints) {
            data.activatedCheckpoints.forEach((activated: boolean, index: number) => {
                if (activated && this.checkpoints[index]) {
                    this.checkpoints[index].isActivated = true;
                    this.checkpoints[index].sprite.setFillStyle(0xffffff, 1);
                    this.checkpoints[index].sprite.setStrokeStyle(4, 0xffffff);
                    this.checkpoints[index].glow.setFillStyle(0xffffff, 0.5);
                }
            });
        }

        // Update UI
        this.updateCoinText();
        this.updateHPText();
        if (this.hasShadowMask) {
            this.maskIndicator.setText('■ SHADOW MASK').setColor('#000000');
        }

        this.narrativeText.setText('GAME LOADED').setAlpha(1);
        this.time.delayedCall(2000, () => this.narrativeText.setAlpha(0));
    }

    private exitToMenu() {
        this.resumeGame();
        this.scene.start('MainMenu');
    }

    private showPauseMessage(message: string) {
        const msg = this.add.text(this.scale.width / 2, this.scale.height - 80, message, {
            fontFamily: 'Courier',
            fontSize: '18px',
            color: '#00ff88'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(400);

        this.tweens.add({
            targets: msg,
            alpha: 0,
            duration: 2000,
            onComplete: () => msg.destroy()
        });
    }
}
