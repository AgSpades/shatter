import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { Game as MainGame } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { FullscreenPrompt } from './scenes/FullscreenPrompt';
import { LarvaDisposalPit } from './scenes/LarvaDisposalPit';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';

// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 1536,
    height: 1024,
    parent: 'game-container',
    backgroundColor: '#1a1a1d',
    scale: {
        mode: Phaser.Scale.RESIZE,
        width: '100%',
        height: '100%'
    },
    scene: [
        Boot,
        Preloader,
        FullscreenPrompt,
        MainMenu,
        LarvaDisposalPit,
        MainGame,
        GameOver
    ]
};

const StartGame = (parent: string) => {

    return new Game({ ...config, parent });

}

export default StartGame;
