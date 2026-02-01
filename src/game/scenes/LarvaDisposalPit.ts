import { Scene } from 'phaser';
import { Player } from '../objects/Player';
import { Hazard } from '../objects/Hazard';
import { Enforcer } from '../objects/Enforcer';

// Extended Enforcer with detection radius and stealth awareness
class SmartEnforcer extends Enforcer {
    private pathStart: number;
    private pathEnd: number;
    private waitTime: number;
    private isWaiting: boolean = false;
    private moveDirection: number = 1;
    private currentAxis: 'x' | 'y';
    private speed: number = 150;
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
        this.waitTime = waitDuration * 1000;
        this.moveDirection = (this.pathEnd >= this.pathStart) ? 1 : -1;

        // Create detection indicator
        this.detectionIndicator = scene.add.text(0, 0, '!', {
            fontSize: '32px',
            color: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5).setVisible(false).setDepth(150);

        this.setVelocity(0, 0);
        this.startMoving();
    }

    setPlayer(player: Player) {
        this.player = player;
    }

    startMoving() {
        if (this.currentAxis === 'x') {
            this.setVelocityX(this.speed * this.moveDirection);
            this.setFlipX(this.moveDirection < 0);
        } else {
            this.setVelocityY(this.speed * this.moveDirection);
        }
        this.isWaiting = false;
    }

    update() {
        if (this.isWaiting) return;

        const currentPos = this.currentAxis === 'x' ? this.x : this.y;
        const target = (this.moveDirection > 0) ? Math.max(this.pathStart, this.pathEnd) : Math.min(this.pathStart, this.pathEnd);
        const dist = Math.abs(target - currentPos);

        if (dist < 10) {
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

// Timed Hazard Wrapper
class TimedHazard {
    hazard: Hazard;
    onDuration: number;
    offDuration: number;
    timer: Phaser.Time.TimerEvent;
    isActive: boolean = true;

    constructor(scene: Scene, x: number, y: number, w: number, h: number, onTime: number, offTime: number, startDelay: number = 0) {
        this.hazard = new Hazard(scene, x, y, w, h);
        this.onDuration = onTime * 1000;
        this.offDuration = offTime * 1000;

        // Initial state logic
        if (startDelay > 0) {
            this.setActiveState(false);
            scene.time.delayedCall(startDelay * 1000, () => this.startCycle(scene));
        } else {
            this.startCycle(scene);
        }
    }

    startCycle(scene: Scene) {
        const cycle = () => {
            this.setActiveState(!this.isActive);
            const nextDuration = this.isActive ? this.onDuration : this.offDuration;
            this.timer = scene.time.delayedCall(nextDuration, cycle);
        };
        // Start first toggle after OnDuration
        this.timer = scene.time.delayedCall(this.onDuration, cycle);
    }

    setActiveState(active: boolean) {
        this.isActive = active;
        const body = this.hazard.body as Phaser.Physics.Arcade.Body;
        if (body) {
            // For Arcade Physics Static/Dynamic bodies, we can disable processing
            // But Hazard might be a group member, check collision logic in Scene
            // Disabling the body prevents overlap checks
            body.enable = active;
        }
        // Alpha specific to Hazard sprite might need casting if it's a specific class
        // Assuming Hazard extends Sprite/Image
        (this.hazard as any).setAlpha(active ? 1 : 0.2);
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

// Score Gem collectible
class ScoreGem {
    sprite: Phaser.GameObjects.Sprite;
    collected: boolean = false;

    constructor(scene: Scene, x: number, y: number) {
        this.sprite = scene.add.sprite(x, y, 'sprite1')
            .setDisplaySize(30, 30)
            .setTint(0xffdd00)
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
}

export class LarvaDisposalPit extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    player: Player;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    narrativeText: Phaser.GameObjects.Text;
    platforms: Phaser.Physics.Arcade.StaticGroup;
    hazards: Phaser.GameObjects.Group;
    enforcers: Phaser.GameObjects.Group;
    timedHazards: TimedHazard[] = [];
    checkpoints: Checkpoint[] = [];
    scoreGems: ScoreGem[] = [];
    shadowZones: Phaser.GameObjects.Rectangle[] = [];
    lastCheckpoint: { x: number, y: number } | null = null;
    isPlayerInShadow: boolean = false;
    isPlayerDetected: boolean = false;
    hasShadowMask: boolean = false;
    score: number = 0;
    totalGems: number = 0;
    scoreText: Phaser.GameObjects.Text;
    maskIndicator: Phaser.GameObjects.Text;
    hpText: Phaser.GameObjects.Text;
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

    // Map Config
    private readonly GRID_W = 30;
    private readonly GRID_H = 80;
    private readonly TILE_SIZE = 64;

    constructor() {
        super('LarvaDisposalPit');
    }

    create() {
        // --- Visuals & Environment ---
        this.cameras.main.setBackgroundColor('#1a1a1d');

        this.platforms = this.physics.add.staticGroup();
        this.hazards = this.add.group();
        this.enforcers = this.add.group();

        // Calculate world bounds
        // Grid 0-79. Y=0 is BOTTOM. Y=79 is TOP.
        // Phaser World usually 0 at top.
        // Height = 80 * 64 = 5120.
        const worldWidth = this.GRID_W * this.TILE_SIZE; // 1920
        const worldHeight = this.GRID_H * this.TILE_SIZE; // 5120

        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

        // --- Player Setup ---
        const startP = this.gridToWorld(3, 2);
        this.player = new Player(this, startP.x, startP.y);
        this.lastCheckpoint = { x: startP.x, y: startP.y };

        // Player shadow glow effect
        this.playerShadowGlow = this.add.circle(this.player.x, this.player.y, 60, 0x000000, 0.6);
        this.playerShadowGlow.setDepth(8);
        this.playerShadowGlow.setVisible(false);

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
                }

                // Heal player if not at full HP
                if (this.hp < this.maxHp) {
                    this.hp = this.maxHp;
                    this.updateHPText();
                    this.showHealMessage();
                }
            });
        });

        // Gem collection
        this.scoreGems.forEach(gem => {
            this.physics.add.overlap(this.player, gem.sprite, () => {
                if (!gem.collected) {
                    gem.collect(this);
                    this.score++;
                    this.updateScoreText();
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
        // HP display
        this.hpText = this.add.text(20, 20, 'HP: 10/10', {
            fontFamily: 'Courier',
            fontSize: '20px',
            color: '#ff0000',
            fontStyle: 'bold'
        })
            .setScrollFactor(0)
            .setDepth(200);

        // Score display
        this.scoreText = this.add.text(20, 50, 'GEMS: 0/0', {
            fontFamily: 'Courier',
            fontSize: '18px',
            color: '#ffdd00',
            fontStyle: 'bold'
        })
            .setScrollFactor(0)
            .setDepth(200);

        // Mask indicator
        this.maskIndicator = this.add.text(20, 80, '', {
            fontFamily: 'Courier',
            fontSize: '16px',
            color: '#888888',
        })
            .setScrollFactor(0)
            .setDepth(200);
    }

    private updateScoreText() {
        this.scoreText.setText(`GEMS: ${this.score}/${this.totalGems}`);
    }

    private updateHPText() {
        this.hpText.setText(`HP: ${this.hp}/${this.maxHp}`);

        // Change color based on HP
        if (this.hp <= 3) {
            this.hpText.setColor('#ff0000');
        } else if (this.hp <= 6) {
            this.hpText.setColor('#ff8800');
        } else {
            this.hpText.setColor('#00ff00');
        }
    }

    takeDamage(amount: number = 1) {
        if (this.isInvulnerable) return;

        this.hp = Math.max(0, this.hp - amount);
        this.updateHPText();

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
        // REDESIGNED MAP - Fully traversable with bridge platforms and proper gaps
        const mapData = [
            "##############################", // Y=79
            "#.............X..............#", // Y=78 - EXIT
            "############....#############", // Y=77
            "#.........C..........===....#", // Y=76 - Checkpoint 4 + bridge
            "#..........====.......S.....#", // Y=75 - Bridge + Shadow
            "#.......===......====.......#", // Y=74 - Bridge platforms
            "#....g........S.............#", // Y=73 - Gem + Shadow
            "#..........====.....==......#", // Y=72 - Bridge platforms
            "#...g...........g...........#", // Y=71 - Gems
            "#......====.........====....#", // Y=70 - Bridge platforms
            "#.....S...........g.........#", // Y=69 - Shadow + gem
            "#..........====.....====....#", // Y=68 - Bridge platforms
            "#...g...........g...........#", // Y=67 - Gems
            "########===.........====....#", // Y=66 - Platform + bridge
            "#..........g........===.....#", // Y=65 - Gem
            "###########===..............#", // Y=64 - Step up
            "#..............===..g.......#", // Y=63
            "#..g........................#", // Y=62
            "#...........g...............#", // Y=61
            "#.....===...................#", // Y=60
            "#...........................#", // Y=59
            "#..g........===.............#", // Y=58
            "#....................===....#", // Y=57
            "#............g..............#", // Y=56
            "#........===.....===........#", // Y=55 - Platform under mask
            "#.......g.....DM.....g......#", // Y=54 - SHADOW MASK + gems
            "####======.........======...#", // Y=53 - Solid platforms
            "####..........g.............#", // Y=52
            "#...........................#", // Y=51
            "#...........g...............#", // Y=50
            "#......===..................#", // Y=49 - SANCTUARY ZONE D
            "############....#############", // Y=48 - Checkpoint 3
            "#..........#..=.#.....g.....#", // Y=47
            "#..........#....#...........#", // Y=46
            "#.===......#....#.===.......#", // Y=45 - Side platforms
            "#..g.......#....#...S.......#", // Y=44 - Shadow + gems
            "#..........#....#..====.....#", // Y=43
            "#.===......#.==.#...........#", // Y=42 - Intermediate zigzag
            "####.......#.........=======", // Y=41
            "#............=====..........#", // Y=40 - Center platform + gem
            "########...#....#...########", // Y=39 - Intermediate platform
            "#.........=#.==.#...........#", // Y=38
            "#..g.......#....#.......g...#", // Y=37 - Gems
            "#..========#....#==.........#", // Y=36
            "#........R.#....#...........#", // Y=35 - Vent marker
            "#########..#....#..#########", // Y=34
            "#..g...........g#...........#", // Y=33 - GRINDER ZONE C
            "############....#############", // Y=32 - Wider shaft (4 tiles)
            "#...........C...g...........#", // Y=31 - Checkpoint 2 + gem
            "#..g........................#", // Y=30
            "#####..===###################", // Y=29
            "#...........................#", // Y=28
            "#...###...g.................#", // Y=27
            "#...........................#", // Y=26
            "######=======.g.........#####", // Y=25
            "#.........g.................#", // Y=24
            "#....===.........===.....g..#", // Y=23 - Left stepping stone
            "#........S..................#", // Y=22 - Shadow zone
            "#######===############===...#", // Y=21
            "#.....g........g............#", // Y=20
            "########################==..#", // Y=19
            "#..g........................#", // Y=18
            "#....===........===.........#", // Y=17 - FIXED: Left platform
            "###########.C...#############", // Y=16 - Checkpoint 1
            "#.........##g..##...........#", // Y=15
            "#.........###g..#...........#", // Y=14
            "#........###.g.##...........#", // Y=13
            "#.......g.......#...........#", // Y=12
            "############....#############", // Y=11
            "#.............#.............#", // Y=10
            "#.........##..g.............#", // Y=09
            "#...........................#", // Y=08
            "##################.g....#####", // Y=07
            "#.............g.............#", // Y=06
            "###################...#######", // Y=05
            "#..........g................#", // Y=04
            "#..g...........===..........#", // Y=03
            "#..P........................#", // Y=02 - PLAYER START
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
                    const plat = this.platforms.create(pos.x, pos.y - 22, undefined).setSize(this.TILE_SIZE, 20);
                    plat.setDisplaySize(this.TILE_SIZE, 20);
                    plat.setTint(0x888888);
                    plat.refreshBody();
                } else if (char === '|') {
                    // Structure/Pipe
                    const grate = this.add.rectangle(pos.x, pos.y, this.TILE_SIZE / 2, this.TILE_SIZE, 0x222222);
                    grate.setStrokeStyle(2, 0x111111);

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
                } else if (char === 'D') {
                    this.add.rectangle(pos.x, pos.y + 10, 40, 20, 0x330000).setOrigin(0.5);
                } else if (char === 'C') {
                    // Checkpoint marker - handled in createCheckpoints()
                } else if (char === 'g') {
                    // Gem marker - handled in createCollectibles()
                }
            }
        });
    }

    private createCollectibles() {
        // Parse map for gems 'g'
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
                    this.scoreGems.push(new ScoreGem(this, pos.x, pos.y));
                    this.totalGems++;
                }
            }
        });

        this.updateScoreText();
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

        // Create Physics Body
        // Use a rectangle with specific style
        const plat = this.add.rectangle(centerX, centerY, width, height, 0x111111);
        plat.setStrokeStyle(2, 0x555555); // "Hollow Knight" style dark outline?

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
        const addVent = (gx: number, gy: number, on: number, off: number) => {
            const pos = this.gridToWorld(gx, gy);
            this.timedHazards.push(new TimedHazard(this, pos.x, pos.y, this.TILE_SIZE, this.TILE_SIZE, on, off));
            this.hazards.add(this.timedHazards[this.timedHazards.length - 1].hazard);
        };

        // Relocated vents on main path
        addVent(12, 22, 3, 3); // Zone B center path
        addVent(10, 35, 3, 3); // Zone C shaft
        addVent(20, 40, 3, 3); // Zone C right
        addVent(8, 68, 2, 2);  // Zone E lower
        addVent(18, 72, 2, 2); // Zone E upper

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
        const mask = this.add.sprite(x, y, 'sprite1').setTint(0x222222).setDisplaySize(50, 50);
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
            this.narrativeText.setText("SHADOW MASK OBTAINED.\\nBLEND WITH DARKNESS.\\nAUTO-HEALING ACTIVATED.").setAlpha(1);
            this.maskIndicator.setText('■ SHADOW MASK').setColor('#000000');

            // Particle effect
            const particles = this.add.particles(x, y, 'sprite1', {
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
        // Zone A (Y 0-15) - Deep Shadows.
        this.createZoneOverlay(0, 15, 0x000000, 0.6);

        // Zone B (Y 16-31) - Industrial Gloom.
        this.createZoneOverlay(16, 31, 0x4A5E6D, 0.3);

        // Zone C (Y 32-47) - Very Dark.
        this.createZoneOverlay(32, 47, 0x000000, 0.8);

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

        let message = "ACT 1 COMPLETE.\nASCENT ACHIEVED.";
        if (this.score === this.totalGems) {
            message = "PERFECT ASCENT!\nALL GEMS COLLECTED.\n" + message;
        }

        this.narrativeText.setText(message).setAlpha(1);
        this.tweens.add({
            targets: this.cameras.main,
            alpha: 0,
            duration: 2000,
            onComplete: () => {
                this.scene.restart();
            }
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

    private updatePauseMenu() {
        if (this.cursors) {
            if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
                this.pauseSelectedIndex = (this.pauseSelectedIndex - 1 + this.pauseMenuOptions.length) % this.pauseMenuOptions.length;
                this.updatePauseMenuDisplay();
            } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
                this.pauseSelectedIndex = (this.pauseSelectedIndex + 1) % this.pauseMenuOptions.length;
                this.updatePauseMenuDisplay();
            }

            if (Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
                (this.input.keyboard && Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey('ENTER')))) {
                this.pauseMenuOptions[this.pauseSelectedIndex].action();
            }
        }
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

    private showHealMessage() {
        const msg = this.add.text(this.scale.width / 2, this.scale.height / 2 - 100, 'FULLY HEALED', {
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
            totalGems: this.totalGems,
            hasShadowMask: this.hasShadowMask,
            lastCheckpoint: this.lastCheckpoint,
            hp: this.hp,
            collectedGems: this.scoreGems.map(gem => ({
                x: gem.sprite.x,
                y: gem.sprite.y,
                collected: gem.collected
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

        // Restore collected gems
        if (data.collectedGems) {
            data.collectedGems.forEach((gemData: any, index: number) => {
                if (gemData.collected && this.scoreGems[index]) {
                    this.scoreGems[index].collected = true;
                    this.scoreGems[index].sprite.destroy();
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
        this.updateScoreText();
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
