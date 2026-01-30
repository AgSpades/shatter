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

        this.title = this.add.text(width / 2, height / 2 + 76, 'Main Menu', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {

            if (this.scale.isFullscreen)
            {
                //  We are already in fullscreen mode, so just start the game
                this.scene.start('Game');
            }
            else
            {
                //  Try to start fullscreen mode
                this.scale.startFullscreen();

                //  And start the game
                this.scene.start('Game');
            }

        });
    }
}
