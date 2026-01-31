import { Scene } from 'phaser';

export class Switch extends Phaser.GameObjects.Sprite {
    private isActivated: boolean = false;
    public onActivate: () => void;

    constructor(scene: Scene, x: number, y: number) {
        // Placeholder rectangle for now if sprite not available, or use sprite1 
        // Let's use a green rectangle for visual clarity
        super(scene, x, y, 'sprite1'); 
        
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // Static

        this.setDisplaySize(40, 40);
        this.setTint(0xFF0000); // Red = locked
    }

    activate() {
        if (this.isActivated) return;
        this.isActivated = true;
        this.setTint(0x00FF00); // Green = active
        if (this.onActivate) this.onActivate();
    }
}

export class Gate extends Phaser.GameObjects.Rectangle {
    constructor(scene: Scene, x: number, y: number, width: number, height: number, color: number = 0xFFFFFF) {
        super(scene, x, y, width, height, color);
        
        scene.add.existing(this);
        scene.physics.add.existing(this, true); 
    }

    open() {
        // Disable physics body
        const body = this.body as Phaser.Physics.Arcade.StaticBody;
        body.enable = false; // Disable collision

        // Visual feedback
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            y: this.y - 100,
            duration: 1000,
            onComplete: () => {
                this.destroy(); // Remove object
            }
        });
    }
}
