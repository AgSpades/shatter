import { Scene } from 'phaser';

export class VirtualJoystick {
    private scene: Scene;
    private base: Phaser.GameObjects.Arc;
    private thumb: Phaser.GameObjects.Arc;
    private isActive: boolean = false;
    private pointer: Phaser.Input.Pointer | null = null;
    
    // Position and size
    private baseX: number;
    private baseY: number;
    private baseRadius: number = 60;
    private thumbRadius: number = 30;
    private maxDistance: number = 50;
    
    // Input state
    public x: number = 0; // -1 to 1
    public y: number = 0; // -1 to 1
    
    // Dead zone (prevent accidental tiny movements)
    private deadZone: number = 0.15;

    constructor(scene: Scene, x: number, y: number) {
        this.scene = scene;
        this.baseX = x;
        this.baseY = y;

        // Create base (outer circle)
        this.base = scene.add.circle(x, y, this.baseRadius, 0x888888, 0.3);
        this.base.setStrokeStyle(2, 0xffffff, 0.5);
        this.base.setDepth(1000);
        this.base.setScrollFactor(0);

        // Create thumb (inner movable circle)
        this.thumb = scene.add.circle(x, y, this.thumbRadius, 0xffffff, 0.6);
        this.thumb.setStrokeStyle(3, 0xffffff, 0.8);
        this.thumb.setDepth(1001);
        this.thumb.setScrollFactor(0);

        // Make base interactive
        this.base.setInteractive();

        // Touch events
        this.base.on('pointerdown', this.onPointerDown, this);
        this.scene.input.on('pointermove', this.onPointerMove, this);
        this.scene.input.on('pointerup', this.onPointerUp, this);
    }

    private onPointerDown(pointer: Phaser.Input.Pointer) {
        this.isActive = true;
        this.pointer = pointer;
        this.updateThumbPosition(pointer);
    }

    private onPointerMove(pointer: Phaser.Input.Pointer) {
        if (!this.isActive || this.pointer !== pointer) return;
        this.updateThumbPosition(pointer);
    }

    private onPointerUp(pointer: Phaser.Input.Pointer) {
        if (this.pointer !== pointer) return;
        
        this.isActive = false;
        this.pointer = null;
        
        // Reset thumb to center
        this.thumb.setPosition(this.baseX, this.baseY);
        this.thumb.setAlpha(0.6);
        
        // Reset input values
        this.x = 0;
        this.y = 0;
    }

    private updateThumbPosition(pointer: Phaser.Input.Pointer) {
        // Get pointer position relative to base (accounting for camera)
        const dx = pointer.x - this.baseX;
        const dy = pointer.y - this.baseY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Calculate clamped position
        let thumbX = this.baseX;
        let thumbY = this.baseY;

        if (distance > 0) {
            const ratio = Math.min(distance, this.maxDistance) / distance;
            thumbX = this.baseX + dx * ratio;
            thumbY = this.baseY + dy * ratio;
        }

        // Update thumb visual position
        this.thumb.setPosition(thumbX, thumbY);
        this.thumb.setAlpha(1.0); // Full opacity when active

        // Calculate normalized input (-1 to 1)
        this.x = distance > 0 ? (thumbX - this.baseX) / this.maxDistance : 0;
        this.y = distance > 0 ? (thumbY - this.baseY) / this.maxDistance : 0;

        // Apply dead zone
        if (Math.abs(this.x) < this.deadZone) this.x = 0;
        if (Math.abs(this.y) < this.deadZone) this.y = 0;

        // Clamp to -1, 1 range
        this.x = Math.max(-1, Math.min(1, this.x));
        this.y = Math.max(-1, Math.min(1, this.y));
    }

    /**
     * Get the current joystick direction as normalized values
     */
    getDirection(): { x: number; y: number } {
        return { x: this.x, y: this.y };
    }

    /**
     * Check if joystick is currently being used
     */
    isPressed(): boolean {
        return this.isActive;
    }

    /**
     * Show or hide the joystick
     */
    setVisible(visible: boolean) {
        this.base.setVisible(visible);
        this.thumb.setVisible(visible);
    }

    /**
     * Cleanup
     */
    destroy() {
        this.base.destroy();
        this.thumb.destroy();
        this.scene.input.off('pointermove', this.onPointerMove, this);
        this.scene.input.off('pointerup', this.onPointerUp, this);
    }
}
