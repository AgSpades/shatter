import { Scene } from 'phaser';

export class Enforcer extends Phaser.Physics.Arcade.Sprite {
    private startPos: number;
    private endPos: number;
    private direction: number = 1;
    private moveSpeed: number = 200;
    private axis: 'x' | 'y';

    constructor(scene: Scene, x: number, y: number, range: number, axis: 'x' | 'y' = 'x') {
        super(scene, x, y, 'sprite1'); 

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.axis = axis;
        if (axis === 'x') {
            this.startPos = x;
            this.endPos = x + range;
            this.setVelocityX(this.moveSpeed);
        } else {
            this.startPos = y;
            this.endPos = y + range;
            this.setVelocityY(this.moveSpeed);
        }

        this.setDisplaySize(80, 80); 
        this.setTint(0xff0000); 
        
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false); 
        body.setImmovable(true);
        body.setSize(60, 60);
    }

    update() {
        if (this.axis === 'x') {
            if (this.x >= this.endPos && this.direction > 0) {
                this.direction = -1;
                this.setVelocityX(-this.moveSpeed);
            } else if (this.x <= this.startPos && this.direction < 0) {
                this.direction = 1;
                this.setVelocityX(this.moveSpeed);
            }
        } else {
            if (this.y >= this.endPos && this.direction > 0) {
                this.direction = -1;
                this.setVelocityY(-this.moveSpeed);
            } else if (this.y <= this.startPos && this.direction < 0) {
                this.direction = 1;
                this.setVelocityY(this.moveSpeed);
            }
        }
    }
}
