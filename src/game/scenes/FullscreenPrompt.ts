import { Scene } from 'phaser';

export class FullscreenPrompt extends Scene {
    private storyMusic: Phaser.Sound.BaseSound;

    constructor() {
        super('FullscreenPrompt');
    }

    create() {
        const { width, height } = this.scale;

        // Play story music
        this.storyMusic = this.sound.add('story-music', { loop: true, volume: 0.5 });
        this.storyMusic.play();

        // Background
        this.add.rectangle(0, 0, width, height, 0x1a1a1d).setOrigin(0);

        // Best Experience Text
        this.add.text(width / 2, height / 2 - 50, 'For the best experience, play in full screen.', {
            fontFamily: 'Arial',
            fontSize: 24,
            color: '#e6e0d4',
            align: 'center'
        }).setOrigin(0.5);

        // Prompt Text
        const promptText = this.add.text(width / 2, height / 2 + 50, 'Press ENTER to continue', {
            fontFamily: 'Arial Black',
            fontSize: 32,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5);

        // Blink effect
        this.tweens.add({
            targets: promptText,
            alpha: 0.5,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Input Listener
        if (this.input.keyboard) {
            const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
            enterKey.on('down', () => {
                if (!this.scale.isFullscreen) {
                    this.scale.startFullscreen();
                }
                // Don't stop music - let it continue to SplashScreen
                this.scene.start('SplashScreen');
            });
        }
    }
}
