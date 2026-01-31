import { Scene } from 'phaser';

export class LarvaDisposalPit extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    player: Phaser.GameObjects.Rectangle;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    narrativeText: Phaser.GameObjects.Text;

    constructor() {
        super('LarvaDisposalPit');
    }

    create() {
        // --- Visuals & Environment ---
        // Background - Dark, oppressive (simulating deep hive darkness)
        this.cameras.main.setBackgroundColor('#1a1a1d');

        // Environment - The Pit Walls (Simple placeholders)
        // Floor
        this.add.rectangle(0, 600, 2000, 50, 0x4F6B57).setOrigin(0, 0); // Spore Greenish

        // --- Player (The Shell) ---
        // Geometric placeholder: Rectangle (32x48) - Chitin Ivory #E6E0D4
        // Starting position: center-ish
        this.player = this.add.rectangle(768, 550, 32, 48, 0xE6E0D4);
        
        // --- Camera Framing ---
        // Claustrophobic feel: Zoom 2.0, Follow player
        this.camera = this.cameras.main;
        this.camera.setZoom(2.0);
        this.camera.startFollow(this.player, true, 0.1, 0.1);
        this.camera.setBounds(0, 0, 2000, 1024); // Limit camera for now

        // --- Controls (Temporary for Camera Test) ---
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }

        // --- Narrative Beat ---
        // "Darkness... The Shell is... cracked."
        this.narrativeText = this.add.text(768, 480, "Darkness... The Shell is... cracked.", {
            fontFamily: 'Courier', // Placeholder for "typewriter" feel
            fontSize: '16px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Simple fade in effect for text
        this.narrativeText.setAlpha(0);
        this.tweens.add({
            targets: this.narrativeText,
            alpha: 1,
            duration: 2000,
            ease: 'Power2',
            yoyo: true,
            hold: 3000
        });
    }

    update() {
        // Basic movement just to test camera focus (Not the final movement logic)
        const speed = 4;
        
        if (this.cursors.left.isDown) {
            this.player.x -= speed;
        } else if (this.cursors.right.isDown) {
            this.player.x += speed;
        }

        if (this.cursors.up.isDown) {
            this.player.y -= speed;
        } else if (this.cursors.down.isDown) {
            this.player.y += speed;
        }

        // Keep text above player for this test
        this.narrativeText.x = this.player.x;
        this.narrativeText.y = this.player.y - 70;
    }
}
