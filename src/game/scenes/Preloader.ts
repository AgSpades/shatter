import { Scene } from 'phaser';

export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    init() {
        const { width, height } = this.scale;

        // Initialize settings from localStorage or defaults
        const settings = JSON.parse(localStorage.getItem('shatter_settings') || '{"music": true, "sound": true}');
        this.game.registry.set('musicEnabled', settings.music);
        this.game.registry.set('soundEnabled', settings.sound);

        this.add.image(width / 2, height / 2, 'background').setDisplaySize(width, height);

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(width / 2, height / 2, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle((width / 2) - 230, height / 2, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress: number) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload() {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath('assets');

        this.load.image('logo', 'shatter_demo.png');
        this.load.image('sprite1', 'sprites/sprite1.png');
        this.load.image('cave_floor', 'cave_floor.png');
        this.load.image('safeguard', 'SafeGaurd.png');

        // Load enemy animation frames
        for (let i = 1; i <= 4; i++) {
            this.load.image(`enemy_fly_${i}`, `sprites/Animation/Enemy/flying_dem${i}.png`);
        }

        // Load coin and mask sprites
        this.load.image('coin', 'sprites/Coin.png');
        this.load.image('mask', 'sprites/Mask.png');

        // Load berry logo for splash screen
        this.load.image('berry-logo', 'berry berry_black.png');

        // Load walking animation frames
        for (let i = 0; i < 24; i++) {
            const frameNumber = i.toString().padStart(3, '0');
            this.load.image(`walk_${i}`, `sprites/Animation/walking/0_Reaper_Man_Walking_${frameNumber}.png`);
        }

        // Load parallax layers
        this.load.setPath('assets/title_parallax');
        this.load.image('parallax-bg', 'parallax-demon-woods-bg.png');
        this.load.image('parallax-far-trees', 'parallax-demon-woods-far-trees.png');
        this.load.image('parallax-mid-trees', 'parallax-demon-woods-mid-trees.png');
        this.load.image('parallax-close-trees', 'parallax-demon-woods-close-trees.png');

        // Load audio files
        this.load.setPath('assets');
        this.load.audio('story-music', 'story.mp3');
        this.load.audio('woods-music', 'woods.mp3');
    }

    create() {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        // Create walking animation
        const walkFrames = [];
        for (let i = 0; i < 24; i++) {
            walkFrames.push({ key: `walk_${i}` });
        }

        this.anims.create({
            key: 'walk',
            frames: walkFrames,
            frameRate: 20,
            repeat: -1
        });

        // Create enemy flying animation
        this.anims.create({
            key: 'enemy_fly',
            frames: [
                { key: 'enemy_fly_1' },
                { key: 'enemy_fly_2' },
                { key: 'enemy_fly_3' },
                { key: 'enemy_fly_4' }
            ],
            frameRate: 8,
            repeat: -1
        });

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('FullscreenPrompt');
    }
}
