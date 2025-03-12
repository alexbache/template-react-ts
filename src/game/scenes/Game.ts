import { EventBus } from "../EventBus";
import { Scene } from "phaser";

export class Game extends Scene {
    private player: Phaser.GameObjects.Sprite;
    private npc: Phaser.GameObjects.Sprite;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private camera: Phaser.Cameras.Scene2D.Camera;
    private background: Phaser.GameObjects.Image;
    private npcDirection: "left" | "right" | "up" | "down" = "right";
    private npcBounds = {
        left: 800,
        right: 1200,
        top: 600,
        bottom: 900,
    };
    private ribbitText: Phaser.GameObjects.Text;

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
    }

    create() {
        // Set up the background
        this.background = this.add.image(0, 0, "map");
        this.background.setOrigin(0, 0);

        // Create the player sprite in the middle of the screen
        this.player = this.add.sprite(1024, 768, "player");
        this.player.setOrigin(0, 0);
        this.player.setScale(0.4);

        // Create the NPC sprite
        this.npc = this.add.sprite(1000, 700, "npc");
        this.npc.setOrigin(0, 0);
        this.npc.setScale(0.8);

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

        // Add ribbit text (hidden by default)
        this.ribbitText = this.add.text(0, 0, "Ribbet Ribbet!", {
            fontSize: "24px",
            color: "#ffffff",
            backgroundColor: "#000000",
            padding: { x: 10, y: 5 },
        });
        this.ribbitText.setVisible(false);

        EventBus.emit("current-scene-ready", this);
    }

    update() {
        const speed = 1;
        let isMoving = false;

        // Handle player movement based on cursor keys
        if (this.cursors.left.isDown) {
            this.player.x -= speed;
            this.player.play("walk-left", true);
            isMoving = true;
        } else if (this.cursors.right.isDown) {
            this.player.x += speed;
            this.player.play("walk-right", true);
            isMoving = true;
        }

        if (this.cursors.up.isDown) {
            this.player.y -= speed;
            this.player.play("walk-up", true);
            isMoving = true;
        } else if (this.cursors.down.isDown) {
            this.player.y += speed;
            this.player.play("walk-down", true);
            isMoving = true;
        }

        // Stop animation if not moving
        if (!isMoving) {
            this.player.stop();
        }

        // Handle NPC movement within bounds
        const npcSpeed = 0.5;

        switch (this.npcDirection) {
            case "right":
                this.npc.x += npcSpeed;
                this.npc.play("npc-walk-right", true);
                if (this.npc.x >= this.npcBounds.right) {
                    this.npcDirection = "down";
                }
                break;
            case "down":
                this.npc.y += npcSpeed;
                this.npc.play("npc-walk-down", true);
                if (this.npc.y >= this.npcBounds.bottom) {
                    this.npcDirection = "left";
                }
                break;
            case "left":
                this.npc.x -= npcSpeed;
                this.npc.play("npc-walk-left", true);
                if (this.npc.x <= this.npcBounds.left) {
                    this.npcDirection = "up";
                }
                break;
            case "up":
                this.npc.y -= npcSpeed;
                this.npc.play("npc-walk-up", true);
                if (this.npc.y <= this.npcBounds.top) {
                    this.npcDirection = "right";
                }
                break;
        }

        // Check for collision between player and NPC
        if (this.checkCollision(this.player, this.npc)) {
            this.showRibbitText();
        }

        // Update ribbit text position to follow NPC
        this.ribbitText.setPosition(
            this.npc.x - this.ribbitText.width / 2,
            this.npc.y - 50
        );
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

    private showRibbitText(): void {
        if (!this.ribbitText.visible) {
            this.ribbitText.setVisible(true);
            this.time.delayedCall(1000, () => {
                this.ribbitText.setVisible(false);
            });
        }
    }
}

