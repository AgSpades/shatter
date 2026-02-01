import { Scene } from 'phaser';

export type ButtonType = 'jump' | 'dash';

export class VirtualButton {
    private scene: Scene;
    private button: Phaser.GameObjects.Arc;
    private label: Phaser.GameObjects.Text;
    private isPressed: boolean = false;
    private type: ButtonType;
    
    // Visual properties
    private normalColor: number;
    private pressedColor: number;
    private normalAlpha: number = 0.5;
    private pressedAlpha: number = 1.0;
    
    // Callback
    private onPress: (() => void) | null = null;
    private onRelease: (() => void) | null = null;
    
    // Cooldown display
    private cooldownOverlay: Phaser.GameObjects.Arc | null = null;
    private isCooldown: boolean = false;

    constructor(scene: Scene, x: number, y: number, type: ButtonType, onPress?: () => void, onRelease?: () => void) {
        this.scene = scene;
        this.type = type;
        this.onPress = onPress || null;
        this.onRelease = onRelease || null;

        // Set colors based on button type
        if (type === 'jump') {
            this.normalColor = 0x00ff88; // Green
        } else {
            this.normalColor = 0x00ddff; // Cyan
        }
        this.pressedColor = 0xffffff; // White when pressed

        // Create button circle
        this.button = scene.add.circle(x, y, 40, this.normalColor, this.normalAlpha);
        this.button.setStrokeStyle(3, 0xffffff, 0.7);
        this.button.setDepth(1000);
        this.button.setScrollFactor(0);
        this.button.setInteractive();

        // Create cooldown overlay (hidden by default)
        this.cooldownOverlay = scene.add.circle(x, y, 40, 0x000000, 0.6);
        this.cooldownOverlay.setDepth(1001);
        this.cooldownOverlay.setScrollFactor(0);
        this.cooldownOverlay.setVisible(false);

        // Create label
        const labelText = type === 'jump' ? 'JUMP' : 'DASH';
        this.label = scene.add.text(x, y, labelText, {
            fontFamily: 'Courier',
            fontSize: '14px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        this.label.setOrigin(0.5);
        this.label.setDepth(1002);
        this.label.setScrollFactor(0);

        // Touch events
        this.button.on('pointerdown', this.handlePointerDown, this);
        this.button.on('pointerup', this.handlePointerUp, this);
        this.button.on('pointerout', this.handlePointerOut, this);
    }

    private handlePointerDown() {
        if (this.isCooldown) return;
        
        this.isPressed = true;
        this.button.setFillStyle(this.pressedColor, this.pressedAlpha);
        this.button.setScale(0.95); // Slight scale down for press feedback

        if (this.onPress) {
            this.onPress();
        }
    }

    private handlePointerUp() {
        if (!this.isPressed) return;
        
        this.isPressed = false;
        this.button.setFillStyle(this.normalColor, this.normalAlpha);
        this.button.setScale(1.0);

        if (this.onRelease) {
            this.onRelease();
        }
    }

    private handlePointerOut() {
        // Treat leaving button area as release
        if (this.isPressed) {
            this.handlePointerUp();
        }
    }

    /**
     * Show cooldown overlay for a duration
     */
    showCooldown(duration: number) {
        if (!this.cooldownOverlay) return;

        this.isCooldown = true;
        this.cooldownOverlay.setVisible(true);
        this.cooldownOverlay.setAlpha(0.6);

        // Fade out cooldown overlay
        this.scene.tweens.add({
            targets: this.cooldownOverlay,
            alpha: 0,
            duration: duration,
            ease: 'Linear',
            onComplete: () => {
                this.isCooldown = false;
                if (this.cooldownOverlay) {
                    this.cooldownOverlay.setVisible(false);
                }
            }
        });
    }

    /**
     * Check if button is currently pressed
     */
    isPressedDown(): boolean {
        return this.isPressed;
    }

    /**
     * Show or hide the button
     */
    setVisible(visible: boolean) {
        this.button.setVisible(visible);
        this.label.setVisible(visible);
        if (this.cooldownOverlay) {
            this.cooldownOverlay.setVisible(visible && this.isCooldown);
        }
    }

    /**
     * Enable or disable the button
     */
    setEnabled(enabled: boolean) {
        if (enabled) {
            this.button.setAlpha(this.normalAlpha);
            this.button.setInteractive();
        } else {
            this.button.setAlpha(0.2);
            this.button.disableInteractive();
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        this.button.destroy();
        this.label.destroy();
        if (this.cooldownOverlay) {
            this.cooldownOverlay.destroy();
        }
    }
}
