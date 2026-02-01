import { Scene } from 'phaser';

export class SplashScreen extends Scene
{
    constructor()
    {
        super('SplashScreen');
    }

    create()
    {
        const { width, height } = this.cameras.main;

        // Black background
        this.cameras.main.setBackgroundColor(0x000000);

        // Add logo centered
        const logo = this.add.image(width / 2, height / 2, 'berry-logo');
        
        // Scale logo to reasonable size (adjust scale as needed)
        logo.setScale(0.5);
        
        // Start with logo invisible
        logo.setAlpha(0);

        // Fade in animation
        this.tweens.add({
            targets: logo,
            alpha: 1,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                // Hold for 2 seconds
                this.time.delayedCall(2000, () => {
                    // Fade out animation
                    this.tweens.add({
                        targets: logo,
                        alpha: 0,
                        duration: 1000,
                        ease: 'Power2',
                        onComplete: () => {
                            // Start preloader after fade out
                            this.scene.start('MainMenu');
                        }
                    });
                });
            }
        });
    }
}
