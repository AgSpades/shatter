import { Scene } from 'phaser';
import { Player } from '../objects/Player';
import { Hazard } from '../objects/Hazard';
import { Enforcer } from '../objects/Enforcer';

// Extended Enforcer to support specific start/end points and wait times
class SmartEnforcer extends Enforcer {
    private pathStart: number;
    private pathEnd: number;
    private waitTime: number;
    private isWaiting: boolean = false;
    // private waitTimer: Phaser.Time.TimerEvent | null = null; // Unused
    private moveDirection: number = 1; // 1 for positive, -1 for negative
    private currentAxis: 'x' | 'y';
    private speed: number = 150;

    constructor(scene: Scene, x: number, y: number, endX: number, endY: number, waitDuration: number) {
        // Calculate range and axis for the base constructor
        // We calculate range based on absolute difference
        const range = Math.max(Math.abs(endX - x), Math.abs(endY - y));
        
        // Determine axis based on which difference is larger
        const isHorizontal = Math.abs(endX - x) >= Math.abs(endY - y);
        const axis = isHorizontal ? 'x' : 'y';

        // Base class Constructor expects (scene, x, y, range, axis).
        // It initializes movement from (x, y). 
        // We want to control the movement logic ourselves mostly, 
        // but we need to satisfy the super call.
        super(scene, x, y, range, axis);
        
        this.currentAxis = axis;
        
        // Store explicit start/end for our custom logic
        this.pathStart = isHorizontal ? x : y;
        this.pathEnd = isHorizontal ? endX : endY;
        this.waitTime = waitDuration * 1000;
        
        // Determine initial direction towards end
        this.moveDirection = (this.pathEnd >= this.pathStart) ? 1 : -1;
        
        // Reset physics to our control
        this.setVelocity(0, 0); 
        this.startMoving();
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
        // We do NOT call super.update() because base class has simple ping-pong that fights us
        
        if (this.isWaiting) return;

        const currentPos = this.currentAxis === 'x' ? this.x : this.y;
        const target = (this.moveDirection > 0) ? Math.max(this.pathStart, this.pathEnd) : Math.min(this.pathStart, this.pathEnd);

        // Check distance to target
        // We use a small threshold
        const dist = Math.abs(target - currentPos);

        if (dist < 10) { // 10px threshold
            // Snap to target to prevent drift
            if (this.currentAxis === 'x') this.x = target;
            else this.y = target;
            
            this.stopAndTurn();
        }
    }

    stopAndTurn() {
        this.setVelocity(0, 0);
        this.isWaiting = true;
        
        if (this.scene) {
            this.scene.time.delayedCall(this.waitTime, () => {
                if (!this.scene) return;
                // Swap direction
                // If we were going to End, new target is Start
                // Effectively just invert direction? 
                // Wait, if we are at End, direction was > 0 (if End > Start).
                // Invert direction means go back.
                this.moveDirection *= -1;
                this.startMoving();
            });
        }
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

export class LarvaDisposalPit extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    player: Player;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    narrativeText: Phaser.GameObjects.Text;
    platforms: Phaser.Physics.Arcade.StaticGroup;
    hazards: Phaser.GameObjects.Group; 
    enforcers: Phaser.GameObjects.Group;
    timedHazards: TimedHazard[] = [];
    private canMove: boolean = false;
    
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
        // Player Start at P (Grid 2, 2 -> 3rd col, 3rd row from bottom)
        // Correct P is column 3 (index 2? '#..P'), Y=02.
        // gridToWorld(3, 2)
        const startP = this.gridToWorld(3, 2);
        this.player = new Player(this, startP.x, startP.y);

        // --- Layout Parsing ---
        this.createLevel();

        // --- Entities & Triggers ---
        this.createEnemies();
        this.createTriggers();
        this.createLighting();

        // --- Controls ---
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }

        // --- Camera ---
        this.camera = this.cameras.main;
        this.camera.setZoom(1.0); 
        this.camera.startFollow(this.player, true, 0.08, 0.08);
        this.camera.setBounds(0, 0, worldWidth, worldHeight);

        // --- Intro ---
        this.setupIntro();
        
        // --- Collisions ---
        this.physics.add.collider(this.player, this.platforms);
        
        // Hazard overlap
        this.physics.add.overlap(this.player, this.hazards, () => {
             this.handleDeath();
        });

        // Enforcer overlap
        this.physics.add.overlap(this.player, this.enforcers, () => {
            this.handleDeath();
        });
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
        // Act 1 Tilemap with gaps for traversal
        // Top to Bottom
        const mapData = [
            "##############################", // Y=79
            "#.............X..............#", // Y=78 - EXIT
            "############....#############", // Y=77 - FIXED: Opened gap in ceiling to allow exit
            "#.......................#....#", // Y=76
            "#.....................S.#....#", // Y=75
            "#######==#######==#####.#....#", // Y=74
            "#............S........#.#....#", // Y=73
            "#...................R.#.#....#", // Y=72
            "######==#############==#....#", // Y=71
            "#......................#....#", // Y=70
            "#.....S................#....#", // Y=69
            "#.......R..............#....#", // Y=68
            "#######==###############....#", // Y=67
            "#.......................#...#", // Y=66
            "#.......................#...#", // Y=65
            "########################....#", // Y=64 - Gap is on far right
            "#.......................===.#", // Y=63 - FIXED: Added step to reach the gap above
            "#..............===..........#", // Y=62
            "#...........................#", // Y=61
            "#...........................#", // Y=60
            "#.....===...................#", // Y=59
            "#...........................#", // Y=58
            "#....................===....#", // Y=57
            "#...........................#", // Y=56
            "#........===................#", // Y=55
            "#.............DM............#", // Y=54
            "####........................#", // Y=53
            "####........................#", // Y=52
            "#...........................#", // Y=51
            "#...........................#", // Y=50
            "#...........................#", // Y=49
            "############....#############", // Y=48 - Entry to upper shaft
            "#..........#....#...........#", // Y=47
            "#..........#....#...........#", // Y=46
            "#########..#....#..##########", // Y=45
            "#..........#....#...S.......#", // Y=44
            "#..........#....#..====.....#", // Y=43
            "#..........#....#...........#", // Y=42
            "#########..#....#..##########", // Y=41
            "#..................R........#", // Y=40
            "########...#..=.#..##########", // Y=39
            "#.........=#....#...........#", // Y=38
            "#..........#....#...........#", // Y=37
            "#..========#....#..##########", // Y=36
            "#........R.#....#...........#", // Y=35
            "#########..#....#..##########", // Y=34
            "#...............#...........#", // Y=33
            "############|..|#############", // Y=32 
            "#.............=.............#", // Y=31
            "#...........................#", // Y=30
            "#####..===###################", // Y=29
            "#...........................#", // Y=28
            "#...###.....................#", // Y=27
            "#...........................#", // Y=26
            "######================..#####", // Y=25
            "#...........................#", // Y=24
            "#.....................######", // Y=23
            "#........S..................#", // Y=22
            "#######===############...=..#", // Y=21
            "#........................R..#", // Y=20
            "########################==.##", // Y=19 - Gap is on right
            "#...........................#", // Y=18
            "#..................===......#", // Y=17 - FIXED: Added platform to bridge center to right
            "###########.....#############", // Y=16 - Gap is in center
            "#.........##...##...........#", // Y=15
            "#.........###...#...........#", // Y=14
            "#........###...##...........#", // Y=13
            "#...............#...........#", // Y=12
            "############....#############", // Y=11
            "#.............#.............#", // Y=10
            "#.........##................#", // Y=09
            "#...........................#", // Y=08
            "##################......#####", // Y=07
            "#...........................#", // Y=06
            "###################...#######", // Y=05
            "#...........................#", // Y=04
            "#..............===..........#", // Y=03
            "#..P........................#", // Y=02
            "##############################", // Y=01
            "##############################"  // Y=00
        ];

        // Graphics object for efficiently drawing terrain
        // Currently we use simple rects for physics, but for visuals we could draw one big shape?
        // Sticking to 1-to-1 visual/physics for now but merged.
        
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
                     const grate = this.add.rectangle(pos.x, pos.y, this.TILE_SIZE/2, this.TILE_SIZE, 0x222222);
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
                }
            }
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
        // Drone 01 (Zone B - Horizontal Patroller) (6, 26) <-> (22, 26)
        const d1Start = this.gridToWorld(6, 26);
        const d1End = this.gridToWorld(22, 26);
        const d1 = new SmartEnforcer(this, d1Start.x, d1Start.y, d1End.x, d1End.y, 1.5);
        this.enforcers.add(d1);

        // Drone 02 (Zone C - Gatekeeper) (12, 46) <-> (18, 46)
        const d2Start = this.gridToWorld(12, 46);
        const d2End = this.gridToWorld(18, 46);
        const d2 = new SmartEnforcer(this, d2Start.x, d2Start.y, d2End.x, d2End.y, 1.0);
        this.enforcers.add(d2);

        // Drone 03 (Zone E - Lower Horizontal) (4, 70) <-> (18, 70)
        const d3Start = this.gridToWorld(4, 70);
        const d3End = this.gridToWorld(18, 70);
        const d3 = new SmartEnforcer(this, d3Start.x, d3Start.y, d3End.x, d3End.y, 1.0);
        this.enforcers.add(d3);

        // Drone 04 (Zone E - Right Vertical) (24, 66) <-> (24, 76)
        const d4Start = this.gridToWorld(24, 66);
        const d4End = this.gridToWorld(24, 76);
        const d4 = new SmartEnforcer(this, d4Start.x, d4Start.y, d4End.x, d4End.y, 1.0);
        this.enforcers.add(d4);
    }

    private createTriggers() {
        // Hazard Helper
        const addVent = (gx: number, gy: number, on: number, off: number, widthScale: number = 1.0, heightScale: number = 1.0) => {
            const pos = this.gridToWorld(gx, gy);
            const w = this.TILE_SIZE * widthScale;
            const h = this.TILE_SIZE * heightScale;
            this.timedHazards.push(new TimedHazard(this, pos.x, pos.y, w, h, on, off));
            this.hazards.add(this.timedHazards[this.timedHazards.length-1].hazard);
        };

        // Vent A: (24, 20). 3s ON / 3s OFF.
        addVent(24, 20, 3, 3);

        // Vent B: (10, 35). 3s ON / 3s OFF.
        addVent(10, 35, 3, 3);

        // Vent C: (20, 40). 3s ON / 3s OFF.
        addVent(20, 40, 3, 3);

        // Vent D: (8, 68). 2s ON / 2s OFF.
        addVent(8, 68, 2, 2);

        // Vent E: (20, 72). 2s ON / 2s OFF.
        addVent(20, 72, 2, 2);

        // Shadow Zones
        this.createShadowZone(10, 22);
        this.createShadowZone(22, 44);
        this.createShadowZone(6, 69);
        this.createShadowZone(14, 73);
        this.createShadowZone(22, 75);
    }

    private createShadowZone(gx: number, gy: number) {
        const pos = this.gridToWorld(gx, gy);
        // Visual dark patch
        this.add.rectangle(pos.x, pos.y, this.TILE_SIZE, this.TILE_SIZE, 0x000000, 0.5).setDepth(10);
    }

    private createMask(x: number, y: number) {
        const mask = this.add.sprite(x, y, 'sprite1').setTint(0x888888).setDisplaySize(40, 40);
        this.physics.add.existing(mask, true);
        this.tweens.add({ targets: mask, y: y - 10, duration: 1500, yoyo: true, repeat: -1 });

        this.physics.add.overlap(this.player, mask, () => {
            this.narrativeText.setText("GREY MASK OBTAINED.").setAlpha(1);
            mask.destroy();
            this.time.delayedCall(2000, () => this.narrativeText.setAlpha(0));
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
        const cy = topWorld + h/2;
        
        // Use physics bounds width
        const w = this.physics.world.bounds.width;
        
        const overlay = this.add.rectangle(w/2, cy, w, h, color, alpha);
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

    private handleDeath() {
        this.cameras.main.flash(200, 255, 0, 0);
        const startPos = this.gridToWorld(3, 2); 
        this.player.setPosition(startPos.x, startPos.y);
        this.player.setVelocity(0,0);
    }

    private handleLevelComplete() {
        if (!this.canMove) return;
        this.canMove = false;
        this.narrativeText.setText("ACT 1 COMPLETE.\nASCENT ACHIEVED.").setAlpha(1);
        this.tweens.add({
            targets: this.cameras.main,
            alpha: 0,
            duration: 2000,
            onComplete: () => {
                this.scene.restart();
            } // Removed incorrect brace here
        });
    }

    update() {
        if (!this.canMove) return; // Simple pause check
        
        this.player.update();
        
        // Update smart enforcers
        this.enforcers.children.entries.forEach((enforcer: any) => {
            if (enforcer.update) enforcer.update();
        });

        // --- Camera Control (PRESERVED) ---
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
}
