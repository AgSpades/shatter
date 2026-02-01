import { Scene, GameObjects } from 'phaser';

interface MenuOption {
    text: string;
    action: () => void;
}

export class MainMenu extends Scene {
    // Parallax layers
    parallaxBg: GameObjects.TileSprite;
    parallaxFarTrees: GameObjects.TileSprite;
    parallaxMidTrees: GameObjects.TileSprite;
    parallaxCloseTrees: GameObjects.TileSprite;

    background: GameObjects.Image;
    logo: GameObjects.Image;
    menuOptions: MenuOption[];
    menuTexts: GameObjects.Text[] = [];
    selectedIndex: number = 0;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    canNavigate: boolean = true;
    enterKey: Phaser.Input.Keyboard.Key | null = null;
    spaceKey: Phaser.Input.Keyboard.Key | null = null;
    settingsMenu: GameObjects.Container | null = null;
    isSettingsOpen: boolean = false;
    settingsOptions: { text: GameObjects.Text, key: string }[] = [];
    settingsSelectedIndex: number = 0;

    constructor() {
        super('MainMenu');
    }

    create() {
        const { width, height } = this.scale;

        // Create parallax background layers (back to front) with increased brightness
        this.parallaxBg = this.add.tileSprite(width / 2, height / 2, width, height, 'parallax-bg');
        this.parallaxBg.setDisplaySize(width, height);
        this.parallaxBg.setAlpha(1.3); // Increase brightness

        this.parallaxFarTrees = this.add.tileSprite(width / 2, height / 2, width, height, 'parallax-far-trees');
        this.parallaxFarTrees.setDisplaySize(width, height);
        this.parallaxFarTrees.setAlpha(1.3); // Increase brightness

        this.parallaxMidTrees = this.add.tileSprite(width / 2, height / 2, width, height, 'parallax-mid-trees');
        this.parallaxMidTrees.setDisplaySize(width, height);
        this.parallaxMidTrees.setAlpha(1.3); // Increase brightness

        this.parallaxCloseTrees = this.add.tileSprite(width / 2, height / 2, width, height, 'parallax-close-trees');
        this.parallaxCloseTrees.setDisplaySize(width, height);
        this.parallaxCloseTrees.setAlpha(1.3); // Increase brightness

        // Add lighter overlay for better text contrast while maintaining brightness
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.2);

        this.logo = this.add.image(width / 2, height / 2 - 160, 'logo');

        // Add glow effect to logo
        this.tweens.add({
            targets: this.logo,
            alpha: { from: 0.8, to: 1 },
            scale: { from: 0.98, to: 1.02 },
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

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
                text: 'SETTINGS',
                action: () => this.openSettings()
            }
        ];

        // Create menu option texts
        const startY = height / 2 + 40;
        const spacing = 60;

        this.menuOptions.forEach((option, index) => {
            const text = this.add.text(width / 2, startY + (index * spacing), option.text, {
                fontFamily: 'Courier',
                fontSize: '28px',
                color: '#888888',
                stroke: '#000000',
                strokeThickness: 3
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

            // Stagger fade-in animation
            text.setAlpha(0);
            this.tweens.add({
                targets: text,
                alpha: 1,
                duration: 500,
                delay: 500 + (index * 150),
                ease: 'Power2'
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
        // Animate parallax layers at different speeds
        this.parallaxBg.tilePositionX += 0.1;
        this.parallaxFarTrees.tilePositionX += 0.3;
        this.parallaxMidTrees.tilePositionX += 0.6;
        this.parallaxCloseTrees.tilePositionX += 1.2;

        if (!this.canNavigate) return;

        // Navigate menu
        if (this.cursors && Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            if (this.isSettingsOpen) {
                this.settingsSelectedIndex = (this.settingsSelectedIndex - 1 + this.settingsOptions.length) % this.settingsOptions.length;
                this.updateSettingsDisplay();
            } else {
                this.selectedIndex = (this.selectedIndex - 1 + this.menuOptions.length) % this.menuOptions.length;
                this.updateMenuDisplay();
            }
            this.canNavigate = false;
            this.time.delayedCall(150, () => this.canNavigate = true);
        } else if (this.cursors && Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
            if (this.isSettingsOpen) {
                this.settingsSelectedIndex = (this.settingsSelectedIndex + 1) % this.settingsOptions.length;
                this.updateSettingsDisplay();
            } else {
                this.selectedIndex = (this.selectedIndex + 1) % this.menuOptions.length;
                this.updateMenuDisplay();
            }
            this.canNavigate = false;
            this.time.delayedCall(150, () => this.canNavigate = true);
        }

        // Activate menu option
        if ((this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey)) ||
            (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey))) {
            if (this.isSettingsOpen) {
                this.handleSettingsSelection();
            } else {
                this.menuOptions[this.selectedIndex].action();
            }
        }
    }

    private handleSettingsSelection() {
        const option = this.settingsOptions[this.settingsSelectedIndex];
        if (option.key === 'EXIT') {
            this.closeSettings();
        } else {
            const current = this.game.registry.get(option.key);
            this.game.registry.set(option.key, !current);
            this.saveSettings();
            this.updateSettingsDisplay();

            // Apply music change immediately
            if (option.key === 'musicEnabled') {
                const storyMusic = this.sound.get('story-music');
                if (!this.game.registry.get('musicEnabled')) {
                    if (storyMusic) storyMusic.stop();
                    this.sound.stopAll();
                } else if (!storyMusic || !storyMusic.isPlaying) {
                    if (storyMusic) {
                        storyMusic.play();
                    } else {
                        this.sound.play('story-music', { loop: true, volume: 0.5 });
                    }
                }
            }
        }
    }

    private openSettings() {
        this.isSettingsOpen = true;
        this.canNavigate = false;
        this.selectedIndex = -1;
        this.updateMenuDisplay();

        const { width, height } = this.scale;
        this.settingsMenu = this.add.container(0, 0).setDepth(200);

        const overlay = this.add.rectangle(width / 2, height / 2, 400, 300, 0x000000, 0.9);
        overlay.setStrokeStyle(2, 0xffffff);
        this.settingsMenu.add(overlay);

        const title = this.add.text(width / 2, height / 2 - 100, 'SETTINGS', {
            fontFamily: 'Courier',
            fontSize: '32px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.settingsMenu.add(title);

        const options = [
            { label: 'MUSIC', key: 'musicEnabled' },
            { label: 'SOUND', key: 'soundEnabled' },
            { label: 'BACK', key: 'EXIT' }
        ];

        this.settingsOptions = [];
        const startY = height / 2 - 20;
        const spacing = 60;

        options.forEach((opt, index) => {
            const text = this.add.text(width / 2, startY + (index * spacing), '', {
                fontFamily: 'Courier',
                fontSize: '24px',
                color: '#888888'
            }).setOrigin(0.5).setInteractive();

            text.on('pointerdown', () => {
                this.settingsSelectedIndex = index;
                this.handleSettingsSelection();
            });

            this.settingsMenu?.add(text);
            this.settingsOptions.push({ text, key: opt.key });
        });

        this.settingsSelectedIndex = 0;
        this.updateSettingsDisplay();
        this.time.delayedCall(200, () => this.canNavigate = true);
    }

    private updateSettingsDisplay() {
        this.settingsOptions.forEach((opt, index) => {
            let label = opt.key === 'EXIT' ? 'BACK' : (opt.key === 'musicEnabled' ? 'MUSIC' : 'SOUND');
            if (opt.key !== 'EXIT') {
                const enabled = this.game.registry.get(opt.key);
                label += `: ${enabled ? 'ON' : 'OFF'}`;
            }

            opt.text.setText(label);

            if (index === this.settingsSelectedIndex) {
                opt.text.setColor('#ffffff').setFontStyle('bold');
            } else {
                opt.text.setColor('#888888').setFontStyle('normal');
            }
        });
    }

    private closeSettings() {
        if (this.settingsMenu) {
            this.settingsMenu.destroy();
            this.settingsMenu = null;
        }
        this.isSettingsOpen = false;
        this.settingsOptions = [];
        this.selectedIndex = 2; // Return to Settings option
        this.updateMenuDisplay();
    }

    private saveSettings() {
        const settings = {
            music: this.game.registry.get('musicEnabled'),
            sound: this.game.registry.get('soundEnabled')
        };
        localStorage.setItem('shatter_settings', JSON.stringify(settings));
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

        // Keep story music playing through narration
        // (NarrationScene will handle stopping it when transitioning to game)

        if (this.scale.isFullscreen) {
            this.scene.start('NarrationScene');
        } else {
            this.scale.startFullscreen();
            this.scene.start('NarrationScene');
        }
    }

    private loadGame() {
        if (!this.scene || !this.scene.isActive()) return;

        const saveData = localStorage.getItem('shatter_save');

        if (saveData) {
            try {
                const data = JSON.parse(saveData);

                // Stop story music before entering game
                const storyMusic = this.sound.get('story-music');
                if (storyMusic) {
                    storyMusic.stop();
                }

                this.scene.start('LarvaDisposalPit', { loadSave: true, saveData: data });
            } catch (e) {
                console.error('Failed to load save:', e);
                this.showMessage('SAVE DATA CORRUPTED');
            }
        } else {
            this.showMessage('NO SAVE DATA FOUND');
        }
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
