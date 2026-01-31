import { Scene } from 'phaser';

export class LarvaDisposalPit extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    player: Phaser.Types.Physics.Arcade.GameObjectWithBody;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    narrativeText: Phaser.GameObjects.Text;
    floor: Phaser.GameObjects.Rectangle;
    private canMove: boolean = false;

    constructor() {
        super('LarvaDisposalPit');
    }

    create() {
        // --- Visuals & Environment ---
        this.cameras.main.setBackgroundColor('#1a1a1d');

        // Environment - The Pit Floor (Static Physics Object)
        // Move to bottom of 2000px world
        this.floor = this.add.rectangle(0, 1950, 2000, 50, 0x4F6B57).setOrigin(0, 0); 
        this.physics.add.existing(this.floor, true); // true = static body

        // --- Player (The Shell) ---
        // Create visual rectangle - Start near bottom
        const playerRect = this.add.rectangle(768, 1850, 32, 48, 0xE6E0D4);
        // Add physics to it
        this.physics.add.existing(playerRect);
        this.player = playerRect as Phaser.Types.Physics.Arcade.GameObjectWithBody;
        
        // Physics properties for "Weighty" feel
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        // High drag to stop quickly (snappy)
        body.setDragX(1200); 
        // Cap max velocity so you don't fly off screen
        body.setMaxVelocity(400, 1000);
        body.setCollideWorldBounds(true);

        // Resize world world bounds to stop falling forever if missed platform (though floor is static)
        this.physics.world.setBounds(0, 0, 3000, 2000);

        // Colliders
        this.physics.add.collider(this.player, this.floor);

        // --- Camera Framing ---
        this.camera = this.cameras.main;
        this.camera.setZoom(2.0);
        this.camera.startFollow(this.player, true, 0.1, 0.1);
        this.camera.setBounds(0, 0, 2000, 2000);

        // --- Controls ---
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }

        // --- Narrative Beat ---
        // "Darkness... The Shell is... cracked."
        this.narrativeText = this.add.text(768, 1800, "Darkness... The Shell is... cracked.", {
            fontFamily: 'Courier',
            fontSize: '16px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.narrativeText.setAlpha(0);
        this.tweens.add({
            targets: this.narrativeText,
            alpha: 1,
            duration: 2000,
            ease: 'Power2',
            yoyo: true,
            hold: 3000,
            onComplete: () => {
                this.canMove = true;
            }
        });
    }

    update() {
        if (!this.cursors || !this.canMove) return;

        const body = this.player.body as Phaser.Physics.Arcade.Body;
        const speed = 300;
        const jumpStrength = -650; // Needs to overcome 1500 gravity

        // Horizontal Movement
        if (this.cursors.left.isDown) {
            body.setVelocityX(-speed);
        } else if (this.cursors.right.isDown) {
            body.setVelocityX(speed);
        } else {
            // Drag handles deceleration, but we can also force zero if we want SUPER snappy
            // body.setAccelerationX(0); 
        }

        // Jump (only when touching floor)
        if ((this.cursors.up.isDown || this.cursors.space.isDown) && body.touching.down) {
            body.setVelocityY(jumpStrength);
        }

        // Keep text above player
        this.narrativeText.x = body.x + 16; // Center on width (32/2)
        this.narrativeText.y = body.y - 40;
    }
}
