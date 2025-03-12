import { EventBus } from "../EventBus";
import { Scene } from "phaser";

export class Game extends Scene {
    private player: Phaser.GameObjects.Sprite;
    private playerNet: Phaser.GameObjects.Sprite;
    private npcs: Phaser.GameObjects.Sprite[] = [];
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private camera: Phaser.Cameras.Scene2D.Camera;
    private background: Phaser.GameObjects.Image;
    private npcDirections: ("left" | "right" | "up" | "down")[] = [];
    private npcBounds = {
        left: 800,
        right: 1200,
        top: 600,
        bottom: 900,
    };
    private ribbitTexts: Phaser.GameObjects.Text[] = [];
    private npcDirectionTimers: number[] = [];
    private npcDirectionChangeInterval: number = 2000; // Change direction every 2 seconds
    private currentDirection: string = "right"; // Track player direction
    private isNetVisible: boolean = true;
    private nKey: Phaser.Input.Keyboard.Key;
    private cKey: Phaser.Input.Keyboard.Key;
    private isNetSwinging: boolean = false;
    private netBaseAngle: number = 0;

    constructor() {
        super("Game");
    }

    preload() {
        this.load.image("map", "assets/map.png");
        this.load.spritesheet("player", "assets/soph.png", {
            frameWidth: 64,
            frameHeight: 64,
        });
        this.load.spritesheet("npc", "assets/frog.png", {
            frameWidth: 24,
            frameHeight: 24,
        });
        this.load.image("net", "assets/net.png");
    }

    create() {
        // Set up the background
        this.background = this.add.image(0, 0, "map");
        this.background.setOrigin(0, 0);

        // Create the player sprite in the middle of the screen
        this.player = this.add.sprite(1024, 768, "player");
        this.player.setOrigin(0, 0);
        this.player.setScale(0.4);
        this.player.setDepth(1);

        // Create the net sprite with initial position for right direction
        this.playerNet = this.add.sprite(this.player.x, this.player.y, "net");
        this.playerNet.setOrigin(0, 0);
        this.playerNet.setScale(0.1);
        // this.playerNet.setFlipX(true); // Flip for left direction
        this.playerNet.setAngle(0); // Reset angle

        // Create multiple NPC sprites
        const npcPositions = [
            { x: 1000, y: 700 },
            { x: 900, y: 800 },
            { x: 1100, y: 650 },
            { x: 950, y: 850 },
        ];

        npcPositions.forEach((pos) => {
            const npc = this.add.sprite(pos.x, pos.y, "npc");
            npc.setOrigin(0, 0);
            npc.setScale(0.8);
            this.npcs.push(npc);
            this.npcDirections.push("right");
            this.npcDirectionTimers.push(0);

            // Create ribbit text for each NPC
            const ribbitText = this.add.text(0, 0, "Ribbet Ribbet!", {
                fontSize: "24px",
                color: "#ffffff",
                backgroundColor: "#000000",
                padding: { x: 10, y: 5 },
            });
            ribbitText.setVisible(false);
            this.ribbitTexts.push(ribbitText);
        });

        // Set up camera to follow player with zoom
        this.camera = this.cameras.main;
        this.camera.startFollow(this.player);
        this.camera.setBounds(
            0,
            0,
            this.background.width,
            this.background.height
        );
        this.camera.setZoom(1.8);

        // Set up keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();

        // Add this after the cursors setup
        this.nKey = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.N
        );
        this.cKey = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.C
        );

        // Create animations for player
        this.anims.create({
            key: "walk-down",
            frames: this.anims.generateFrameNumbers("player", {
                start: 0,
                end: 3,
            }),
            frameRate: 8,
            repeat: -1,
        });

        this.anims.create({
            key: "walk-left",
            frames: this.anims.generateFrameNumbers("player", {
                start: 4,
                end: 7,
            }),
            frameRate: 8,
            repeat: -1,
        });

        this.anims.create({
            key: "walk-right",
            frames: this.anims.generateFrameNumbers("player", {
                start: 8,
                end: 11,
            }),
            frameRate: 8,
            repeat: -1,
        });

        this.anims.create({
            key: "walk-up",
            frames: this.anims.generateFrameNumbers("player", {
                start: 12,
                end: 15,
            }),
            frameRate: 8,
            repeat: -1,
        });

        // Create animations for NPC
        this.anims.create({
            key: "npc-walk-down",
            frames: this.anims.generateFrameNumbers("npc", {
                start: 0,
                end: 3,
            }),
            frameRate: 8,
            repeat: -1,
        });

        this.anims.create({
            key: "npc-walk-left",
            frames: this.anims.generateFrameNumbers("npc", {
                start: 4,
                end: 7,
            }),
            frameRate: 8,
            repeat: -1,
        });

        this.anims.create({
            key: "npc-walk-right",
            frames: this.anims.generateFrameNumbers("npc", {
                start: 8,
                end: 11,
            }),
            frameRate: 8,
            repeat: -1,
        });

        this.anims.create({
            key: "npc-walk-up",
            frames: this.anims.generateFrameNumbers("npc", {
                start: 12,
                end: 15,
            }),
            frameRate: 8,
            repeat: -1,
        });

        EventBus.emit("current-scene-ready", this);
    }

    update(time: number) {
        // Add this near the start of update
        if (Phaser.Input.Keyboard.JustDown(this.nKey)) {
            this.isNetVisible = !this.isNetVisible;
            this.playerNet.setVisible(this.isNetVisible);
        }

        // Handle net swipe animation
        if (
            Phaser.Input.Keyboard.JustDown(this.cKey) &&
            !this.isNetSwinging &&
            this.isNetVisible
        ) {
            this.isNetSwinging = true;
            const swingAngle = 30;
            const swingDuration = 150;

            // Store the current angle as base
            this.netBaseAngle = this.playerNet.angle;

            // Swing forward
            this.tweens.add({
                targets: this.playerNet,
                angle: this.netBaseAngle + swingAngle,
                duration: swingDuration,
                ease: "Power1",
                yoyo: true,
                onComplete: () => {
                    // Reset the net angle and swinging state
                    this.playerNet.setAngle(this.netBaseAngle);
                    this.isNetSwinging = false;
                },
            });
        }

        const speed = this.isNetVisible ? 3 : 5; // Match NPC speed when net is out, faster when hidden
        let isMoving = false;

        // Handle player movement based on cursor keys
        if (this.cursors.left.isDown) {
            this.player.x -= speed;
            this.player.play("walk-left", true);
            this.currentDirection = "left";
            isMoving = true;
        } else if (this.cursors.right.isDown) {
            this.player.x += speed;
            this.player.play("walk-right", true);
            this.currentDirection = "right";
            isMoving = true;
        }

        if (this.cursors.up.isDown) {
            this.player.y -= speed;
            this.player.play("walk-up", true);
            this.currentDirection = "up";
            isMoving = true;
        } else if (this.cursors.down.isDown) {
            this.player.y += speed;
            this.player.play("walk-down", true);
            this.currentDirection = "down";
            isMoving = true;
        }

        // Stop animation if not moving
        if (!isMoving) {
            this.player.stop();
        }

        // Update net position based on player direction
        if (!this.isNetSwinging) {
            switch (this.currentDirection) {
                case "left":
                    this.playerNet.setPosition(
                        this.player.x - 24,
                        this.player.y + 8
                    );
                    this.playerNet.setFlipX(true);
                    this.playerNet.setAngle(0);
                    this.netBaseAngle = 0;
                    this.playerNet.setDepth(0);
                    break;
                case "right":
                    this.playerNet.setPosition(
                        this.player.x + 8,
                        this.player.y + 8
                    );
                    this.playerNet.setFlipX(false);
                    this.playerNet.setAngle(0);
                    this.netBaseAngle = 0;
                    this.playerNet.setDepth(2);
                    break;
                case "up":
                    this.playerNet.setPosition(
                        this.player.x + 22,
                        this.player.y - 30
                    );
                    this.playerNet.setAngle(90);
                    this.netBaseAngle = 90;
                    this.playerNet.setFlipX(true);
                    this.playerNet.setFlipY(true);
                    this.playerNet.setDepth(0);
                    break;
                case "down":
                    this.playerNet.setPosition(
                        this.player.x + 20,
                        this.player.y + 14
                    );
                    this.playerNet.setAngle(90);
                    this.netBaseAngle = 90;
                    this.playerNet.setFlipY(false);
                    this.playerNet.setFlipX(false);
                    break;
            }
        }

        // Handle NPC movement within bounds
        const npcSpeed = 3;

        this.npcs.forEach((npc, index) => {
            // Change direction randomly
            if (time > this.npcDirectionTimers[index]) {
                const directions: ("left" | "right" | "up" | "down")[] = [
                    "left",
                    "right",
                    "up",
                    "down",
                ];

                // Check bounds and remove invalid directions
                if (npc.x <= this.npcBounds.left)
                    directions.splice(directions.indexOf("left"), 1);
                if (npc.x >= this.npcBounds.right)
                    directions.splice(directions.indexOf("right"), 1);
                if (npc.y <= this.npcBounds.top)
                    directions.splice(directions.indexOf("up"), 1);
                if (npc.y >= this.npcBounds.bottom)
                    directions.splice(directions.indexOf("down"), 1);

                // Pick a random valid direction
                if (directions.length > 0) {
                    this.npcDirections[index] =
                        directions[
                            Math.floor(Math.random() * directions.length)
                        ];
                }

                // Add some randomness to the interval (between 1-3 seconds)
                this.npcDirectionTimers[index] =
                    time + Math.random() * 2000 + 1000;
            }

            // Move NPC in current direction
            switch (this.npcDirections[index]) {
                case "right":
                    if (npc.x < this.npcBounds.right) {
                        npc.x += npcSpeed;
                        npc.play("npc-walk-right", true);
                    }
                    break;
                case "down":
                    if (npc.y < this.npcBounds.bottom) {
                        npc.y += npcSpeed;
                        npc.play("npc-walk-down", true);
                    }
                    break;
                case "left":
                    if (npc.x > this.npcBounds.left) {
                        npc.x -= npcSpeed;
                        npc.play("npc-walk-left", true);
                    }
                    break;
                case "up":
                    if (npc.y > this.npcBounds.top) {
                        npc.y -= npcSpeed;
                        npc.play("npc-walk-up", true);
                    }
                    break;
            }

            // Check for collision between player and NPC
            if (this.checkCollision(this.player, npc)) {
                this.showRibbitText(index);
            }

            // Update ribbit text position to follow NPC
            this.ribbitTexts[index].setPosition(
                npc.x - this.ribbitTexts[index].width / 2,
                npc.y - 50
            );
        });
    }

    changeScene() {
        this.scene.start("GameOver");
    }

    private checkCollision(
        player: Phaser.GameObjects.Sprite,
        npc: Phaser.GameObjects.Sprite
    ): boolean {
        const bounds1 = player.getBounds();
        const bounds2 = npc.getBounds();
        return Phaser.Geom.Intersects.RectangleToRectangle(bounds1, bounds2);
    }

    private showRibbitText(index: number): void {
        if (!this.ribbitTexts[index].visible) {
            this.ribbitTexts[index].setVisible(true);
            this.time.delayedCall(1000, () => {
                this.ribbitTexts[index].setVisible(false);
            });
        }
    }
}

