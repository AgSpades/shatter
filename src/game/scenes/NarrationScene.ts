import { Scene, GameObjects } from 'phaser';

interface NarrationParagraph {
    text: string;
    delay?: number; // Delay before showing this paragraph
    emphasisColor?: string; // Optional color for emphasis
}

export class NarrationScene extends Scene {
    private currentParagraphIndex: number = 0;
    private currentCharIndex: number = 0;
    private typewriterTimer: Phaser.Time.TimerEvent | null = null;
    private paragraphDelayTimer: Phaser.Time.TimerEvent | null = null;
    private canSkip: boolean = true;
    private isComplete: boolean = false;
    
    private paragraphs: NarrationParagraph[] = [];
    private currentTextObject: GameObjects.Text | null = null;
    private skipInstructionText: GameObjects.Text | null = null;

    private particles: GameObjects.Particles.ParticleEmitter | null = null;
    
    private eKey: Phaser.Input.Keyboard.Key | null = null;

    constructor() {
        super('NarrationScene');
    }

    create() {
        const { width, height } = this.scale;

        // Define the narrative paragraphs
        this.paragraphs = [
            {
                text: "In the city of Nivara, everyone wears a mask.",
                delay: 500
            },
            {
                text: "Not for festivals.\nNot for fun.",
                delay: 2000
            },
            {
                text: "It's the law.",
                delay: 2500,
                emphasisColor: '#ff6b6b'
            },
            {
                text: "Long ago, a disaster called \"The Shatter\" made people\nlose control of their emotions.",
                delay: 2500
            },
            {
                text: "Rage, fear, jealousy...\nThey could physically hurt others.",
                delay: 2500
            },
            {
                text: "So the rulers created Emotion Masks.\nEach mask suppresses a feeling.",
                delay: 2500
            },
            {
                text: "People became \"safe\"...\n\n...but empty.",
                delay: 2500
            },
            {
                text: "You are Aryn, a mask technician.",
                delay: 3000,
                emphasisColor: '#4ecdc4'
            },
            {
                text: "One day, you found a cracked mask.",
                delay: 2500
            },
            {
                text: "When you wore it...\nyou could feel again.",
                delay: 2500,
                emphasisColor: '#ffe66d'
            },
            {
                text: "For the first time in your life.",
                delay: 2500
            },
            {
                text: "And you discovered a terrible truth...",
                delay: 3000,
                emphasisColor: '#ff6b6b'
            },
            {
                text: "The disaster never ended.\n\nIt was hidden.",
                delay: 3500,
                emphasisColor: '#ff4757'
            },
            {
                text: "Now you must descend into the depths of Nivara...",
                delay: 3000
            },
            {
                text: "...to uncover what lies beneath the masks.",
                delay: 3000
            }
        ];

        // Create dark background
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000);

        // Add atmospheric particle effects (subtle floating dust/debris)
        const particleTexture = this.add.graphics();
        particleTexture.fillStyle(0xffffff, 0.3);
        particleTexture.fillCircle(2, 2, 2);
        particleTexture.generateTexture('dust-particle', 4, 4);
        particleTexture.destroy();

        this.particles = this.add.particles(0, 0, 'dust-particle', {
            x: { min: 0, max: width },
            y: { min: -50, max: -10 },
            speedY: { min: 10, max: 30 },
            speedX: { min: -5, max: 5 },
            alpha: { start: 0, end: 0.3, ease: 'Sine.easeIn' },
            lifespan: 8000,
            frequency: 200,
            scale: { min: 0.5, max: 1.5 },
            blendMode: 'ADD'
        });

        // Create vignette effect (dark edges for cinematic feel)
        const vignetteGraphics = this.add.graphics();
        vignetteGraphics.fillStyle(0x000000, 0);
        vignetteGraphics.fillRect(0, 0, width, height);
        
        // Create radial gradient effect manually with rectangles
        const vignetteSteps = 8;
        for (let i = 0; i < vignetteSteps; i++) {
            const alpha = (i / vignetteSteps) * 0.7;
            const size = (vignetteSteps - i) / vignetteSteps;
            vignetteGraphics.lineStyle(width * (1 - size) / vignetteSteps, 0x000000, alpha);
            vignetteGraphics.strokeRect(
                width * (1 - size) / 2,
                height * (1 - size) / 2,
                width * size,
                height * size
            );
        }

        // Skip instruction
        this.skipInstructionText = this.add.text(width - 20, height - 20, "Press 'E' to skip", {
            fontFamily: 'Courier',
            fontSize: '18px',
            color: '#888888'
        }).setOrigin(1, 1).setAlpha(0.5);

        // Pulsing animation for skip text
        this.tweens.add({
            targets: this.skipInstructionText,
            alpha: { from: 0.3, to: 0.7 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Set up keyboard input
        if (this.input.keyboard) {
            this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        }

        // Start the narration
        this.showNextParagraph();
    }

    update() {
        // Check for skip input
        if (this.eKey && Phaser.Input.Keyboard.JustDown(this.eKey) && this.canSkip && !this.isComplete) {
            this.skipNarration();
        }
    }

    private showNextParagraph() {
        if (this.currentParagraphIndex >= this.paragraphs.length) {
            this.completeNarration();
            return;
        }

        const paragraph = this.paragraphs[this.currentParagraphIndex];

        // Clear previous text if exists
        if (this.currentTextObject) {
            this.tweens.add({
                targets: this.currentTextObject,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    if (this.currentTextObject) {
                        this.currentTextObject.destroy();
                        this.currentTextObject = null;
                    }
                    this.startTypewriter(paragraph);
                }
            });
        } else {
            this.startTypewriter(paragraph);
        }
    }

    private startTypewriter(paragraph: NarrationParagraph) {
        const { width, height } = this.scale;
        
        // Wait for the delay before showing this paragraph
        const delay = paragraph.delay || 0;
        
        this.paragraphDelayTimer = this.time.delayedCall(delay, () => {
            // Create text object
            const color = paragraph.emphasisColor || '#ffffff';
            this.currentTextObject = this.add.text(width / 2, height / 2, '', {
                fontFamily: 'Courier',
                fontSize: '32px',
                color: color,
                align: 'center',
                lineSpacing: 10,
                stroke: '#000000',
                strokeThickness: 4,
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#000000',
                    blur: 8,
                    fill: true
                }
            }).setOrigin(0.5).setAlpha(0);

            // Fade in the text container
            this.tweens.add({
                targets: this.currentTextObject,
                alpha: 1,
                duration: 300
            });

            // Reset character index
            this.currentCharIndex = 0;

            // Start typewriter effect
            this.typewriterTimer = this.time.addEvent({
                delay: 50, // 50ms per character for slow, deliberate pacing
                callback: this.typeNextCharacter,
                callbackScope: this,
                loop: true
            });
        });
    }

    private typeNextCharacter() {
        if (!this.currentTextObject || !this.typewriterTimer) return;

        const paragraph = this.paragraphs[this.currentParagraphIndex];
        
        if (this.currentCharIndex < paragraph.text.length) {
            const currentText = paragraph.text.substring(0, this.currentCharIndex + 1);
            this.currentTextObject.setText(currentText);
            this.currentCharIndex++;

            // Add subtle glow effect on emphasis colors
            if (paragraph.emphasisColor && this.currentCharIndex % 5 === 0) {
                this.tweens.add({
                    targets: this.currentTextObject,
                    scale: { from: 1.0, to: 1.02 },
                    duration: 100,
                    yoyo: true
                });
            }
        } else {
            // Paragraph complete
            if (this.typewriterTimer) {
                this.typewriterTimer.destroy();
                this.typewriterTimer = null;
            }

            // Move to next paragraph after a pause
            this.time.delayedCall(1500, () => {
                this.currentParagraphIndex++;
                this.showNextParagraph();
            });
        }
    }

    private skipNarration() {
        // Clean up timers
        if (this.typewriterTimer) {
            this.typewriterTimer.destroy();
            this.typewriterTimer = null;
        }
        if (this.paragraphDelayTimer) {
            this.paragraphDelayTimer.destroy();
            this.paragraphDelayTimer = null;
        }

        // Fade out and proceed to game
        this.canSkip = false;
        this.cameras.main.fadeOut(500, 0, 0, 0);
        
        this.time.delayedCall(500, () => {
            this.startGame();
        });
    }

    private completeNarration() {
        this.isComplete = true;
        
        // Wait a moment then fade to game
        this.time.delayedCall(2000, () => {
            this.cameras.main.fadeOut(1000, 0, 0, 0);
            
            this.time.delayedCall(1000, () => {
                this.startGame();
            });
        });
    }

    private startGame() {
        // Stop story music before starting the game
        const storyMusic = this.sound.get('story-music') as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
        
        if (storyMusic && storyMusic.isPlaying) {
            // Fade out the music
            const startVolume = storyMusic.volume;
            
            this.tweens.addCounter({
                from: startVolume,
                to: 0,
                duration: 800,
                onUpdate: (tween) => {
                    if (storyMusic && storyMusic.isPlaying) {
                        const value = tween.getValue();
                        if (value !== null) {
                            storyMusic.setVolume(value);
                        }
                    }
                },
                onComplete: () => {
                    if (storyMusic) {
                        storyMusic.stop();
                    }
                    this.transitionToGame();
                }
            });
        } else {
            this.transitionToGame();
        }
    }

    private transitionToGame() {
        // Clean up particles
        if (this.particles) {
            this.particles.stop();
        }

        // Transition to the first level
        this.scene.start('LarvaDisposalPit');
    }
}
