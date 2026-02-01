import { Scene, GameObjects } from 'phaser';

interface MenuOption {
    text: string;
    action: () => void;
}

export class MainMenu extends Scene {
    background: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;
    menuOptions: MenuOption[];
    menuTexts: GameObjects.Text[] = [];
    selectedIndex: number = 0;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    canNavigate: boolean = true;
    enterKey: Phaser.Input.Keyboard.Key | null = null;
    spaceKey: Phaser.Input.Keyboard.Key | null = null;

    constructor() {
        super('MainMenu');
    }

    create() {
        const { width, height } = this.scale;

        this.background = this.add.image(width / 2, height / 2, 'background');
        this.background.setDisplaySize(width, height);

        this.logo = this.add.image(width / 2, height / 2 - 160, 'logo');

        this.title = this.add.text(width / 2, height / 2 - 60, 'THE ASCENT', {
            fontFamily: 'Courier', fontSize: 48, color: '#ffffff',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5);

        // Define menu options
        this.menuOptions = [
            {
                text: 'NEW GAME',
                action: () => this.startNewGame()
            },
            {
                text: 'LOAD GAME',
                action: () => this.loadGame()
            },
            {
                text: 'EXIT',
                action: () => this.exitGame()
            }
        ];

        // Create menu option texts
        const startY = height / 2 + 40;
        const spacing = 60;

        this.menuOptions.forEach((option, index) => {
            const text = this.add.text(width / 2, startY + (index * spacing), option.text, {
                fontFamily: 'Courier',
                fontSize: '28px',
                color: '#888888'
            }).setOrigin(0.5);
            
            this.menuTexts.push(text);

            // Mouse hover
            text.setInteractive();
            text.on('pointerover', () => {
                this.selectedIndex = index;
                this.updateMenuDisplay();
            });

            // Mouse click
            text.on('pointerdown', () => {
                option.action();
            });
        });

        // Keyboard controls
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
            this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        }

        this.updateMenuDisplay();
    }

    update() {
        if (!this.canNavigate) return;

        // Navigate menu
        if (this.cursors && Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.selectedIndex = (this.selectedIndex - 1 + this.menuOptions.length) % this.menuOptions.length;
            this.updateMenuDisplay();
            this.canNavigate = false;
            this.time.delayedCall(150, () => this.canNavigate = true);
        } else if (this.cursors && Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
            this.selectedIndex = (this.selectedIndex + 1) % this.menuOptions.length;
            this.updateMenuDisplay();
            this.canNavigate = false;
            this.time.delayedCall(150, () => this.canNavigate = true);
        }

        // Activate menu option
        if ((this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey)) ||
            (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey))) {
            this.menuOptions[this.selectedIndex].action();
        }
    }

    private updateMenuDisplay() {
        if (!this.menuTexts || this.menuTexts.length === 0) return;
        
        this.menuTexts.forEach((text, index) => {
            if (!text || !text.active) return;
            
            if (index === this.selectedIndex) {
                text.setColor('#ffffff');
                text.setFontSize('32px');
                text.setFontStyle('bold');
            } else {
                text.setColor('#888888');
                text.setFontSize('28px');
                text.setFontStyle('normal');
            }
        });
    }

    private startNewGame() {
        if (!this.scene || !this.scene.isActive()) return;
        
        // Clear any existing save
        localStorage.removeItem('shatter_save');
        
        if (this.scale.isFullscreen) {
            this.scene.start('LarvaDisposalPit');
        } else {
            this.scale.startFullscreen();
            this.scene.start('LarvaDisposalPit');
        }
    }

    private loadGame() {
        if (!this.scene || !this.scene.isActive()) return;
        
        const saveData = localStorage.getItem('shatter_save');
        
        if (saveData) {
            try {
                const data = JSON.parse(saveData);
                this.scene.start('LarvaDisposalPit', { loadSave: true, saveData: data });
            } catch (e) {
                console.error('Failed to load save:', e);
                this.showMessage('SAVE DATA CORRUPTED');
            }
        } else {
            this.showMessage('NO SAVE DATA FOUND');
        }
    }

    private exitGame() {
        this.showMessage('THANKS FOR PLAYING');
        this.time.delayedCall(1500, () => {
            // In browser, just return to menu
            window.close();
        });
    }

    private showMessage(message: string) {
        const msg = this.add.text(this.scale.width / 2, this.scale.height / 2 + 200, message, {
            fontFamily: 'Courier',
            fontSize: '20px',
            color: '#ffff00'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: msg,
            alpha: 0,
            duration: 1500,
            onComplete: () => msg.destroy()
        });
    }
}
