import { Scene } from 'phaser';
import { MobileUtils } from '../utils/MobileUtils';

export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    preload ()
    {
        //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
        //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.

        this.load.image('background', 'assets/title_parallax/parallax-demon-woods-bg.png');
        this.load.image('berry-logo', 'assets/berry berry_rbg.png');
    }

    create ()
    {
        // Detect mobile and request landscape orientation
        if (MobileUtils.isMobile()) {
            MobileUtils.requestLandscape();
            console.log('Mobile device detected - requesting landscape orientation');
        }
        
        this.scene.start('Preloader');
    }
}
