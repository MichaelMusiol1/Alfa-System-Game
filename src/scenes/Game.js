import Phaser from "../lib/phaser.js";

import Coin from "../game/Coin.js";

export default class Game extends Phaser.Scene {
  coinsCollected = 0;
  coinsCollectedText;
  constructor() {
    super("game");
  }

  init() {
    this.coinsCollected = 0;
  }

  preload() {
    //background layers
    this.load.image("background1", "../assets/PNG/Background/bg_layer1.png");
    this.load.image("background2", "../assets/PNG/Background/bg_layer2.png");
    this.load.image("background3", "../assets/PNG/Background/bg_layer3.png");
    this.load.image("background4", "../assets/PNG/Background/bg_layer4.png");
    //platform
    this.load.image("platform", "../assets/PNG/Environment/ground_grass.png");
    //player
    this.load.spritesheet(
      "jump",
      "assets/PNG/Main Characters/Mask Dude/Jump (32x32).png",
      {
        frameWidth: 32,
        frameHeight: 32,
      }
    );
    this.load.spritesheet(
      "fall",
      "assets/PNG/Main Characters/Mask Dude/Fall (32x32).png",
      {
        frameWidth: 32,
        frameHeight: 32,
      }
    );
    // this.load.image('player', '../assets/PNG/Players/bunny1_stand.png');
    // this.load.image('bunny-jump', '../assets/PNG/Players/bunny1_jump.png');
    //adding some kind of event handler to the keyboard input
    this.cursors = this.input.keyboard.createCursorKeys();
    //coin
    this.load.image("coin", "../assets/PNG/Items/gold_1.png");
    //jump sound
    this.load.audio("jump", "../assets/sounds/Jump.wav");
  }

  create() {
    //loading background sprite
    this.add.image(240, 320, "background1").setScrollFactor(1, 0);
    this.add.image(140, 320, "background2").setScrollFactor(1, 0);
    this.add.image(700, 200, "background3").setScrollFactor(1, 0);
    this.add.image(200, 300, "background4").setScale(0.5).setScrollFactor(1, 0);

    //creating group for platforms
    this.platforms = this.physics.add.staticGroup();
    //creating and loading platforms sprites
    for (let i = 0; i < 5; i++) {
      const x = Phaser.Math.Between(80, 400);
      const y = 170 * i;

      const platform = this.platforms.create(x, y, "platform");
      platform.scale = 0.5;

      const body = platform.body;
      body.updateFromGameObject();
    }
    //adding group
    this.coin = this.physics.add.group({
      classType: Coin,
    });
    this.physics.add.collider(this.platforms, this.coin);
    //adding player with physics
    this.player = this.physics.add.sprite(240, 320, "player").setScale(0.5);
    this.physics.add.collider(this.platforms, this.player);

    //turning off colision from all sides except top
    this.player.body.checkCollision.up = false;
    this.player.body.checkCollision.left = false;
    this.player.body.checkCollision.right = false;

    //adding camera and setting it to follow player in one line LOL

    this.cameras.main.startFollow(this.player);

    //not moving camera horizontaly
    this.cameras.main.setDeadzone(this.scale.width * 1.5);

    this.physics.add.collider(this.platforms, this.coins);

    this.physics.add.overlap(
      this.player,
      this.coin,
      this.handleCollectCoin,
      undefined,
      this
    );

    const style = { color: "#000", fontSize: 32, fontStyle: "Bold" };

    this.coinsCollectedText = this.add
      .text(240, 10, "Coins: 0", style)
      .setScrollFactor(0)
      .setOrigin(0.5, 0);

    this.anims.create({
      key: "fall",
      frames: [{ key: "fall", frame: 0 }],
      frameRate: 20,
    });

    this.anims.create({
      key: "Jump",
      frames: this.anims.generateFrameNumbers("jump", { start: 0, end: 0 }),
      frameRate: 20,
      repeat: -1,
    });
  }

  update() {
    //MAGIC OF THE MOVING PLATFORMS
    this.platforms.children.iterate((child) => {
      const platform = child;

      const scrollY = this.cameras.main.scrollY;
      if (platform.y >= scrollY + 700) {
        var iterator = 0;
        platform.y = scrollY - Phaser.Math.Between(50, 100);
        platform.body.updateFromGameObject();

        this.coinAbove(platform);
        if (this.coin.x >= scrollY) {
          this.coin.killAndHide(coin);
        }
      }
    });

    //chceking if the player is touching the ground
    const touchingGround = this.player.body.touching.down;
    //auto jump
    if (touchingGround) {
      this.player.setVelocityY(-650);
      this.player.anims.play("Jump", true);
      this.sound.play("jump");
    }
    const vy = this.player.body.velocity.y;
    if (vy > 0 && this.player.texture.key !== "player") {
      this.player.anims.play("fall", true).setScale(2);
    }
    //handling moving left and right or none
    if (this.cursors.left.isDown && !touchingGround) {
      this.player.setVelocityX(-200);
    } else if (this.cursors.right.isDown && !touchingGround) {
      this.player.setVelocityX(200);
    } else {
      this.player.setVelocityX(0);
    }

    this.horizontalWrap(this.player);

    const bottomPlatform = this.findBottomMostPlatform();
    if (this.player.y > bottomPlatform.y + 200) {
      this.scene.start("game-over");
    }
  }

  horizontalWrap(sprite) {
    const halfWidth = sprite.displayWidth * 0.5;
    const gameWidth = this.scale.width;
    if (sprite.x < -halfWidth) {
      sprite.x = gameWidth + halfWidth;
    } else if (sprite.x > gameWidth + halfWidth) {
      sprite.x = -halfWidth;
    }
  }
  coinAbove(sprite) {
    const y = sprite.y - sprite.displayHeight;
    const coin = this.coin.get(sprite.x, y, "coin");
    coin.setActive(true);
    coin.setVisible(true);
    this.add.existing(coin);
    coin.body.setSize(coin.width, coin.height);
    this.physics.world.enable(coin);
    return coin;
  }
  handleCollectCoin(player, coin) {
    this.coin.killAndHide(coin);

    this.physics.world.disableBody(coin.body);

    this.coinsCollected++;

    const value = `Coins: ${this.coinsCollected}`;
    this.coinsCollectedText.text = value;
  }
  findBottomMostPlatform() {
    const platforms = this.platforms.getChildren();
    let bottomPlatform = platforms[0];

    for (let i = 0; i < platforms.length; i++) {
      const platform = platforms[i];

      if (platform.y < bottomPlatform.y) {
        continue;
      }
      bottomPlatform = platform;
    }
    return bottomPlatform;
  }
}
