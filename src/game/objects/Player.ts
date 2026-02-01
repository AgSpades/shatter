import { Scene } from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd: {
        W: Phaser.Input.Keyboard.Key;
        A: Phaser.Input.Keyboard.Key;
        S: Phaser.Input.Keyboard.Key;
        D: Phaser.Input.Keyboard.Key;
    };
    private canDoubleJump: boolean = false;
    private isDashing: boolean = false;
    private canDash: boolean = true;
    private lastFacing: 'left' | 'right' = 'right';

    // Virtual input state (from joystick and buttons)
    private virtualDirectionX: number = 0; // -1 to 1
    private virtualJumpPressed: boolean = false;
    private virtualJumpPrevious: boolean = false;
    private virtualJumpReleased: boolean = false; // Track button release for variable jump height

    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, 'walk_0'); // Use first walking frame

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setDisplaySize(100, 100);
        this.setCollideWorldBounds(true);

        this.setupPhysics();
        this.setupInput();
    }

    private setupPhysics() {
        const body = this.body as Phaser.Physics.Arcade.Body;

        // Sprite texture bounds adjustment (Proportional)
        const width = this.width * 0.4;
        const height = this.height * 0.6;

        body.setSize(width, height);

        // Offset: Centered X, Padded Bottom Y
        const offsetX = (this.width - width) / 2;
        const offsetY = this.height - height - (this.height * 0.15);

        body.setOffset(offsetX, offsetY);

        body.setDragX(1200);
        body.setMaxVelocity(400, 1000);
    }

    private setupInput() {
        if (this.scene.input.keyboard) {
            this.cursors = this.scene.input.keyboard.createCursorKeys();
            this.wasd = this.scene.input.keyboard.addKeys('W,A,S,D') as any;
        }
    }

    /**
     * Set virtual joystick direction (-1 to 1 for X axis)
     */
    public setVirtualDirection(x: number) {
        this.virtualDirectionX = x;
    }

    /**
     * Trigger virtual jump (called by virtual button)
     */
    public virtualJump() {
        this.virtualJumpPressed = true;
    }

    /**
     * Signal virtual jump button release (for variable jump height)
     */
    public virtualJumpRelease() {
        this.virtualJumpReleased = true;
    }

    /**
     * Trigger virtual dash (called by virtual button)
     */
    public virtualDash() {
        if (this.canDash && !this.isDashing) {
            this.startDash();
        }
    }

    private triggerJump() {
        const body = this.body as Phaser.Physics.Arcade.Body;
        const jumpStrength = -850;

        if (body.touching.down) {
            body.setVelocityY(jumpStrength);
        } else if (this.canDoubleJump) {
            body.setVelocityY(-600);
            this.canDoubleJump = false;
        }
    }

    private startDash() {
        const body = this.body as Phaser.Physics.Arcade.Body;
        this.isDashing = true;
        this.canDash = false;

        // Physics alterations for dash
        body.allowGravity = false;
        const originalDrag = body.drag.x;
        const originalMaxVelX = body.maxVelocity.x;

        body.setDragX(0);
        body.setMaxVelocity(10000, body.maxVelocity.y);

        // Dash Velocity
        const dashSpeed = 800;
        const direction = this.lastFacing === 'left' ? -1 : 1;

        body.setVelocityX(dashSpeed * direction);
        body.setVelocityY(0);

        // Stop Dash Event
        this.scene.time.delayedCall(200, () => {
            this.isDashing = false;
            if (body) { // Check if body still exists (scene switch safety)
                body.allowGravity = true;
                body.setDragX(originalDrag);
                body.setMaxVelocity(originalMaxVelX, body.maxVelocity.y);
                body.setVelocityX(body.velocity.x * 0.2); // Dampen
            }
        });

        // Cooldown Event
        this.scene.time.delayedCall(650, () => {
            this.canDash = true;
        });
    }

    update() {
        const body = this.body as Phaser.Physics.Arcade.Body;

        // If dashing, ignore other inputs
        if (this.isDashing) return;

        const speed = 300;
        const jumpCut = 0.5;

        // Ground Check
        if (body.touching.down) {
            this.canDoubleJump = true;
            this.canDash = true;
        }

        // Horizontal Movement Input Detection
        // Keyboard input
        let moveDirection = 0;
        if (this.cursors?.left.isDown || this.wasd?.A.isDown) moveDirection = -1;
        if (this.cursors?.right.isDown || this.wasd?.D.isDown) moveDirection = 1;
        
        // Virtual joystick overrides keyboard if active
        if (Math.abs(this.virtualDirectionX) > 0.1) {
            moveDirection = this.virtualDirectionX;
        }
        
        const leftDown = moveDirection < -0.1;
        const rightDown = moveDirection > 0.1;

        if (leftDown) {
            body.setVelocityX(-speed);
            this.lastFacing = 'left';
            this.setFlipX(true); // Visual flip

            // Play walking animation
            if (this.anims && !this.anims.isPlaying) {
                this.play('walk');
            }
        } else if (rightDown) {
            body.setVelocityX(speed);
            this.lastFacing = 'right';
            this.setFlipX(false);

            // Play walking animation
            if (this.anims && !this.anims.isPlaying) {
                this.play('walk');
            }
        } else {
            // Stop animation when not moving
            if (this.anims && this.anims.isPlaying) {
                this.stop();
                this.setTexture('walk_0'); // Show first frame when idle
            }
        }

        // Jump and Dash logic
        if (this.scene.input.keyboard) {
            // Dash Input
            if (Phaser.Input.Keyboard.JustDown(this.cursors.shift) && this.canDash) {
                this.startDash();
                return;
            }

            // Jump Input (keyboard)
            if (Phaser.Input.Keyboard.JustDown(this.cursors.space) || Phaser.Input.Keyboard.JustDown(this.wasd.W)) {
                this.triggerJump();
            }
        }
        
        // Virtual jump input (works alongside keyboard)
        if (this.virtualJumpPressed && !this.virtualJumpPrevious) {
            this.triggerJump();
        }
        this.virtualJumpPrevious = this.virtualJumpPressed;
        this.virtualJumpPressed = false; // Reset for next frame

        // Variable Jump Height (keyboard)
        if (this.scene.input.keyboard) {
            // Variable Jump Height
            if (Phaser.Input.Keyboard.JustUp(this.cursors.space) || Phaser.Input.Keyboard.JustUp(this.wasd.W)) {
                if (body.velocity.y < 0) {
                    body.setVelocityY(body.velocity.y * jumpCut);
                }
            }
        }

        // Variable Jump Height (virtual button)
        if (this.virtualJumpReleased) {
            if (body.velocity.y < 0) {
                body.setVelocityY(body.velocity.y * jumpCut);
            }
        }
        this.virtualJumpReleased = false; // Reset for next frame
    }
}
