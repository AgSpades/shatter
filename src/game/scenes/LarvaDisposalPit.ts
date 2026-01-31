import { Scene } from 'phaser';

export class LarvaDisposalPit extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    player: Phaser.Types.Physics.Arcade.GameObjectWithBody;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    narrativeText: Phaser.GameObjects.Text;
    platforms: Phaser.Physics.Arcade.StaticGroup;
    private canMove: boolean = false;
    private canDoubleJump: boolean = false;

    constructor() {
        super('LarvaDisposalPit');
    }

    create() {
        // --- Visuals & Environment ---
        this.cameras.main.setBackgroundColor('#1a1a1d');

        // --- Level Layout (The Underhive Ascent) ---
        this.platforms = this.physics.add.staticGroup();

        // 1. The Pit Floor (Start)
        this.platforms.create(1000, 1975, 'ground').setSize(2000, 50).setVisible(false); // Invisible physics body if we want custom graphics, or just use Rects
        // Actually, let's use Add.Rectangle and add to group for visible protoyping
        const addPlatform = (x: number, y: number, w: number, h: number, color: number = 0x4F6B57) => {
            const plat = this.add.rectangle(x, y, w, h, color);
            this.physics.add.existing(plat, true);
            this.platforms.add(plat);
            return plat;
        };

        // Pit Floor
        addPlatform(1000, 1975, 2000, 50);

        // 2. The Ascent (Platforms)
        addPlatform(1200, 1800, 300, 30); // First hop
        addPlatform(800, 1650, 200, 30);
        addPlatform(400, 1500, 150, 30);  // Narrow jump
        addPlatform(100, 1350, 200, 30);  // Wall hug

        // 3. The Red Zone (Hazard Area - Middle layer)
        // Visual Warning
        this.add.rectangle(1000, 1100, 2000, 400, 0x8B1E1E, 0.2); // Red overlay
        // Platforms inside hazard
        addPlatform(600, 1200, 150, 30, 0x5e2a2a); // Darker red-tinted plat
        addPlatform(1000, 1100, 100, 30, 0x5e2a2a); // Tiny platform
        addPlatform(1400, 1000, 150, 30, 0x5e2a2a);

        // 4. The Safe Zone (Top)
        // Visual Safe glow
        this.add.circle(1800, 200, 300, 0xC9A24D, 0.1); // Amber glow
        addPlatform(1600, 600, 800, 50, 0xC9A24D); // Safe ledge

        // --- Player (The Shell) ---
        // Spawn at bottom
        const playerRect = this.add.rectangle(768, 1900, 32, 48, 0xE6E0D4);
        this.physics.add.existing(playerRect);
        this.player = playerRect as Phaser.Types.Physics.Arcade.GameObjectWithBody;
        
        // Physics properties
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.setDragX(1200); 
        body.setMaxVelocity(400, 1000);
        body.setCollideWorldBounds(true);

        // World Bounds
        this.physics.world.setBounds(0, 0, 2000, 2000);

        // Colliders
        this.physics.add.collider(this.player, this.platforms);

        // --- Camera Framing ---
        this.camera = this.cameras.main;
        this.camera.setZoom(1.5); // Zoom out a bit to see more of the level
        this.camera.startFollow(this.player, true, 0.1, 0.1);
        this.camera.setBounds(0, 0, 2000, 2000);

        // --- Controls ---
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }

        // --- Narrative Beat & Intro Sequence ---
        // 1. Black Curtain (Covers screen)
        const curtain = this.add.rectangle(0, 0, 20000, 20000, 0x000000)
            .setOrigin(0.5)
            .setScrollFactor(0) // Fixed to camera
            .setDepth(100); // Top layer

        // 2. Narrative Text (On top of curtain)
        // "Darkness... The Shell is... cracked."
        this.narrativeText = this.add.text(this.scale.width / 2, this.scale.height / 2, "Darkness... The Shell is... cracked.", {
            fontFamily: 'Courier',
            fontSize: '20px',
            color: '#ffffff',
            align: 'center'
        })
        .setOrigin(0.5)
        .setScrollFactor(0) // Fixed to center of screen
        .setDepth(101) // Above curtain
        .setAlpha(0);

        // 3. Intro Sequence Timeline
        // Hide debug graphics if they exist (to prevent finding them through curtain)
        if (this.physics.world.debugGraphic) {
            this.physics.world.debugGraphic.setVisible(false);
        }

        const timeline = this.add.timeline([
            {
                at: 500,
                tween: {
                    targets: this.narrativeText,
                    alpha: 1,
                    duration: 2000,
                    ease: 'Power2'
                }
            },
            {
                at: 3500, // Hold for a bit
                tween: {
                    targets: this.narrativeText,
                    alpha: 0,
                    duration: 1500,
                    ease: 'Power2'
                }
            },
            {
                at: 4800, // Start slightly before text is fully gone for smoother flow
                tween: {
                    targets: curtain,
                    y: -1500, // Slide up off screen
                    duration: 2500,
                    ease: 'Quad.easeInOut',
                    onComplete: () => {
                        this.canMove = true;
                        curtain.destroy(); // Cleanup
                        // Re-enable debug graphics
                        if (this.physics.world.debugGraphic) {
                            this.physics.world.debugGraphic.setVisible(true);
                        }
                    }
                }
            }
        ]);

        timeline.play();
    }

    update() {
        if (!this.cursors || !this.canMove) return;

        const body = this.player.body as Phaser.Physics.Arcade.Body;
        const speed = 300;
        const jumpStrength = -850;
        const jumpCut = 0.5; // Multiplier to cut velocity when releasing button
        const maxLookOffset = 150;

        // Ground Check for Double Jump Reset
        if (body.touching.down) {
            this.canDoubleJump = true;
        }

        // Horizontal Movement
        if (this.cursors.left.isDown) {
            body.setVelocityX(-speed);
        } else if (this.cursors.right.isDown) {
            body.setVelocityX(speed);
        }

        // Variable Jump Logic
        // 1. Start Jump
        if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
            if (body.touching.down) {
                body.setVelocityY(jumpStrength);
            } else if (this.canDoubleJump) {
                 body.setVelocityY(-600); // Double Jump
                 this.canDoubleJump = false;
            }
        }
        
        // 2. Cut Jump (Variable Height)
        if (Phaser.Input.Keyboard.JustUp(this.cursors.space)) {
            if (body.velocity.y < 0) {
                 body.setVelocityY(body.velocity.y * jumpCut);
            }
        }

        // Camera Look Logic (Up/Down)
        let targetOffsetY = 0;
        
        if (this.cursors.down.isDown) {
            // Look Up -> moves camera up (which means offset y increases in negative? No, follow offset behaves inversely usually, let's test)
            // Actually, setFollowOffset(x, y): "The amount to offset the focus position by."
            // If we want to see UP, we need the camera to move UP relative to player.
            // Camera Y = Player Y + Offset Y. 
            // So to look UP (camera moves up), Offset Y should be NEGATIVE.
            targetOffsetY = -maxLookOffset;
        } else if (this.cursors.up.isDown) {
             // Look Down
            targetOffsetY = maxLookOffset;
        }

        // Smoothly interpolate current offset to target
        const currentOffsetY = this.camera.followOffset.y;
        const lerpedOffset = Phaser.Math.Linear(currentOffsetY, targetOffsetY, 0.05); // 0.05 = smooth speed
        
        this.camera.setFollowOffset(0, lerpedOffset);

        // Keep text above player
        this.narrativeText.x = body.x + 16;
        this.narrativeText.y = body.y - 40;
    }
}
