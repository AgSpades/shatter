import { Scene, GameObjects } from 'phaser';

export class MainMenu extends Scene
{
    background: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        const { width, height } = this.scale;

        this.background = this.add.image(width / 2, height / 2, 'background');
        this.background.setDisplaySize(width, height);

        this.logo = this.add.image(width / 2, height / 2 - 84, 'logo');
        this.logo.setAlpha(0);
        this.logo.y += 50;

        this.title = this.add.text(width / 2, height / 2 + 76, 'Main Menu', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);
        this.title.setAlpha(0);
        this.title.y += 50;

        const startText = this.add.text(width / 2, height / 2 + 140, 'Press ENTER to Start', {
            fontFamily: 'Arial', fontSize: 24, color: '#e6e0d4',
            stroke: '#000000', strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5);
        startText.setAlpha(0);
        startText.y += 50;

        // Slide up and Fade in animation
        this.tweens.add({
            targets: [this.logo, this.title, startText],
            y: '-=50',
            alpha: 1,
            duration: 1000,
            ease: 'Power2',
            stagger: 200,
            onComplete: () => {
                // Start blinking effect for text after entrance
                this.tweens.add({
                    targets: startText,
                    alpha: 0.5,
                    duration: 800,
                    yoyo: true,
                    repeat: -1
                });
            }
        });

        // Add Enter key listener
        if (this.input.keyboard) {
            const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
            enterKey.on('down', () => {
                this.scene.start('LarvaDisposalPit');
            });
        }
    }
}
