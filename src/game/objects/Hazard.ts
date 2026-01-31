import { Scene } from 'phaser';

export class Hazard extends Phaser.GameObjects.Rectangle {
    constructor(scene: Scene, x: number, y: number, width: number, height: number, color: number = 0x8B1E1E) {
        super(scene, x, y, width, height, color);
        
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // Static body
        
        this.setAlpha(0.4); // Semi-transparent danger look
    }
}
