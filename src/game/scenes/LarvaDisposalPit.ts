import { Scene } from 'phaser';
import { Player } from '../objects/Player';
import { Hazard } from '../objects/Hazard';
import { Enforcer } from '../objects/Enforcer';

export class LarvaDisposalPit extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    player: Player;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    narrativeText: Phaser.GameObjects.Text;
    platforms: Phaser.Physics.Arcade.StaticGroup;
    hazards: Phaser.GameObjects.Group;
    enforcers: Phaser.GameObjects.Group;
    private canMove: boolean = false;

    constructor() {
        super('LarvaDisposalPit');
    }

    create() {
        // --- Visuals & Environment ---
        this.cameras.main.setBackgroundColor('#1a1a1d');

        // --- Level Layout (Act 1: The Underhive) ---
        // Based on Act1.md ASCII diagram
        // World: 2000x2000. Bottom = Y:2000, Top = Y:0
        // Sections (bottom to top):
        //   A: The Roots (Y: 1800-2000) - Tutorial
        //   B: Introduction of Threats (Y: 1400-1800)
        //   C: The Grinder (Y: 900-1400) - Narrow shaft with pipes
        //   D: Narrative Chamber (Y: 700-900) - Side sanctuary
        //   E: Final Ascent (Y: 0-700) - Stealth challenge

        this.platforms = this.physics.add.staticGroup();
        this.hazards = this.add.group();
        this.enforcers = this.add.group();

        // --- Player Setup (Must be before colliders using player) ---
        this.player = new Player(this, 500, 1900);
        this.physics.world.setBounds(0, 0, 2000, 2000);

        // Helper functions
        const addPlatform = (x: number, y: number, w: number, h: number, color: number = 0x4F6B57) => {
            const plat = this.add.rectangle(x, y, w, h, color);
            this.physics.add.existing(plat, true);
            this.platforms.add(plat);
            return plat;
        };
        const addWall = (x: number, y: number, w: number, h: number) => addPlatform(x, y, w, h, 0x333333);
        const addShadowZone = (x: number, y: number, w: number, h: number) => {
            // Visual dark alcove (platform + dark overlay)
            const plat = addPlatform(x, y, w, h, 0x111111);
            this.add.rectangle(x, y - 50, w, 100, 0x000000, 0.5); // Dark overlay above
            return plat;
        };

        // ============================================================
        // SECTION A: THE ROOTS (Tutorial & Atmosphere) [Y: 1800-2000]
        // Cramped, dark corridor. Low ceiling. Simple jump up.
        // ============================================================
        
        // Floor
        addWall(1000, 2010, 2000, 50);
        
        // Low ceiling (claustrophobic) - leaves gap in center
        addWall(300, 1880, 400, 30);   // Left ceiling
        addWall(1700, 1880, 400, 30);  // Right ceiling
        
        // START platform
        addPlatform(500, 1950, 400, 30); // [START] area
        
        // First upward jump platform (center, above floor)
        addPlatform(1000, 1850, 200, 20); // First Upward Jump
        
        // ============================================================
        // SECTION B: INTRODUCTION OF THREATS (Fear) [Y: 1400-1800]
        // Wider shaft. First hazard (steam vent) + horizontal drone.
        // ============================================================
        
        // Walls to frame the section
        addWall(100, 1600, 50, 400);   // Left wall
        addWall(1900, 1600, 50, 400);  // Right wall
        
        // Platform cluster
        addPlatform(1000, 1750, 200, 20); // Upper from Section A
        
        // Center platform
        addPlatform(700, 1650, 200, 20);
        
        // Steam Vent [RRR] - Right side (timed hazard)
        this.hazards.add(new Hazard(this, 1500, 1550, 100, 30));
        addWall(1500, 1580, 100, 30); // Vent base
        
        // Platform near hazard (risky path)
        addPlatform(1300, 1550, 150, 20);
        
        // Shadow Zone [///] - Safe alcove left side
        addShadowZone(300, 1550, 150, 20);
        
        // Upper platform in B
        addPlatform(800, 1500, 200, 20);
        
        // ENFORCER - Horizontal patrol (wide)
        // Patrols from X=400 to X=1200
        const droneB = new Enforcer(this, 400, 1450, 800, 'x');
        this.enforcers.add(droneB);
        
        // ============================================================
        // SECTION C: THE GRINDER (Narrow & Hostile) [Y: 900-1400]
        // Narrow central shaft with vertical pipes. Zig-zag hazards.
        // ============================================================
        
        // Narrow shaft walls
        addWall(700, 1150, 50, 500);   // Left shaft wall
        addWall(1300, 1150, 50, 500);  // Right shaft wall
        
        // Central "pipes" (climbable concept - for now just narrow vertical platforms)
        addPlatform(950, 1200, 20, 400, 0x555555);  // Left pipe
        addPlatform(1050, 1200, 20, 400, 0x555555); // Right pipe
        
        // Alternating hazards + platforms (zig-zag)
        // Bottom: Left hazard, Right platform
        this.hazards.add(new Hazard(this, 600, 1350, 80, 30)); // [RRR] Left
        addWall(600, 1380, 80, 30); // Vent base
        addPlatform(1200, 1300, 100, 20); // Safe spot right
        
        // Middle: Shadow zone left, Drone right
        addShadowZone(600, 1200, 100, 20); // [///] Left
        // Drone blocking main shaft - horizontal patrol
        const droneC = new Enforcer(this, 900, 1150, 200, 'x');
        this.enforcers.add(droneC);
        
        // Upper: Right hazard, Left platform
        this.hazards.add(new Hazard(this, 1400, 1100, 80, 30)); // [RRR] Right
        addWall(1400, 1130, 80, 30); // Vent base
        addPlatform(800, 1050, 100, 20); // Safe spot left
        
        // Top: Left hazard, Right shadow zone
        this.hazards.add(new Hazard(this, 600, 1000, 80, 30)); // [RRR] Left
        addWall(600, 1030, 80, 30); // Vent base
        addShadowZone(1400, 950, 100, 20); // [///] Right
        
        // Exit platform from Grinder
        addPlatform(1000, 920, 200, 20);
        
        // ============================================================
        // SECTION D: NARRATIVE CHAMBER (Sanctuary) [Y: 700-900]
        // Side room. No hazards. Relief. Find dead NPC + Grey Mask.
        // ============================================================
        
        // Main platform (floor of sanctuary)
        addPlatform(1000, 850, 600, 30);
        
        // Dividing wall (entrance from C)
        // Gap in wall allows entry from above
        addWall(700, 780, 50, 140);  // Left entrance wall
        addWall(1300, 780, 50, 140); // Right entrance wall
        
        // Shadow Zone atmosphere
        this.add.rectangle(1000, 800, 700, 150, 0x000000, 0.3); // Dark overlay
        
        // Dead NPC [ † ]
        this.add.rectangle(850, 810, 40, 80, 0x444444); // Placeholder body
        
        // Grey Mask [MASK]
        const mask = this.add.sprite(1150, 810, 'sprite1').setTint(0x888888).setDisplaySize(40, 40);
        this.physics.add.existing(mask, true);
        this.tweens.add({ targets: mask, y: '-=5', duration: 1500, yoyo: true, repeat: -1 });
        
        this.physics.add.overlap(this.player, mask, () => {
            this.narrativeText.setText("GREY MASK OBTAINED.\nSHADOWS EMBRACED.").setAlpha(1);
            mask.destroy();
        });
        
        // Entrance to Section E (to the right of sanctuary)
        addPlatform(1500, 750, 100, 20); // >>> path indicator
        
        // ============================================================
        // SECTION E: FINAL ASCENT (Stealth Application) [Y: 0-700]
        // Combines everything. Vertical + horizontal drones. Hazards.
        // ============================================================
        
        // Left wall structure (partial)
        addWall(400, 400, 50, 700);
        
        // Platform entering from D
        addPlatform(1400, 680, 150, 20);
        
        // Lower hazard + shadow zone
        this.hazards.add(new Hazard(this, 1700, 600, 100, 30)); // [RRR] Right
        addWall(1700, 630, 100, 30); // Vent base
        addShadowZone(500, 600, 100, 20); // [///] Left
        
        // Vertical Patrol Drone
        const droneE_vert = new Enforcer(this, 1000, 400, 250, 'y'); // Patrols Y=400 to Y=650
        this.enforcers.add(droneE_vert);
        
        // Mid-section platforms
        addPlatform(800, 500, 150, 20);
        addPlatform(1200, 450, 150, 20);
        
        // Upper hazard + shadow
        this.hazards.add(new Hazard(this, 600, 350, 100, 30)); // [RRR] Left
        addWall(600, 380, 100, 30); // Vent base
        addShadowZone(1500, 350, 100, 20); // [///] Right
        
        // Upper platform
        addPlatform(1600, 300, 150, 20);
        
        // Horizontal Top Patrol
        const droneE_horiz = new Enforcer(this, 500, 200, 700, 'x'); // Wide patrol
        this.enforcers.add(droneE_horiz);
        
        // Shadow zone near top
        addShadowZone(450, 250, 100, 20);
        
        // Final platform before exit
        addPlatform(1000, 150, 200, 20);
        
        // [EXIT] - The Light
        const exit = this.add.rectangle(1000, 50, 150, 20, 0xFFFFFF);
        this.physics.add.existing(exit, true);
        this.physics.add.overlap(this.player, exit, () => {
            this.narrativeText.setText("ESCAPED THE PIT.").setAlpha(1);
            this.canMove = false;
            this.time.delayedCall(3000, () => {
                this.scene.restart();
            });
        });
        
        // ============================================================
        // COLLISIONS & PHYSICS
        // ============================================================
        
        this.physics.add.collider(this.player, this.platforms);
        
        // Hazard overlap - death
        this.physics.add.overlap(this.player, this.hazards, () => {
            // Simple respawn for now
            this.player.setPosition(500, 1900);
            this.player.setVelocity(0, 0);
            this.cameras.main.flash(500, 255, 0, 0);
        });
        
        // Enforcer overlap - death
        this.physics.add.overlap(this.player, this.enforcers, () => {
            this.player.setPosition(500, 1900);
            this.player.setVelocity(0, 0);
            this.cameras.main.flash(500, 255, 0, 0);
        });

        // ============================================================
        // CAMERA
        // ============================================================
        
        this.camera = this.cameras.main;
        this.camera.setZoom(1.2);
        this.camera.startFollow(this.player, true, 0.08, 0.08);
        this.camera.setBounds(0, 0, 2000, 2000);

        // ============================================================
        // CONTROLS
        // ============================================================
        
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }

        // ============================================================
        // INTRO SEQUENCE
        // ============================================================
        
        const curtain = this.add.rectangle(0, 0, 20000, 20000, 0x000000)
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(100);

        this.narrativeText = this.add.text(this.scale.width / 2, this.scale.height / 2, "Darkness... The Shell is... cracked.", {
            fontFamily: 'Courier',
            fontSize: '20px',
            color: '#ffffff',
            align: 'center'
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(101)
            .setAlpha(0);

        if (this.physics.world.debugGraphic) {
            this.physics.world.debugGraphic.setVisible(false);
        }

        const timeline = this.add.timeline([
            { at: 500, tween: { targets: this.narrativeText, alpha: 1, duration: 2000, ease: 'Power2' } },
            { at: 3500, tween: { targets: this.narrativeText, alpha: 0, duration: 1500, ease: 'Power2' } },
            { at: 4800, tween: { 
                targets: curtain, y: -1500, duration: 2500, ease: 'Quad.easeInOut',
                onComplete: () => {
                    this.canMove = true;
                    curtain.destroy();
                    if (this.physics.world.debugGraphic) {
                        this.physics.world.debugGraphic.setVisible(true);
                    }
                }
            }}
        ]);
        timeline.play();
    }

    update() {
        if (!this.canMove) return;
        
        this.player.update();
        
        // Update enforcers
        this.enforcers.children.entries.forEach((enforcer: any) => {
            if (enforcer.update) enforcer.update();
        });
        
        // Camera look
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
