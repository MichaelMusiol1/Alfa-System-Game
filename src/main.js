import Phaser from "./lib/phaser.js";

import Game from "./scenes/Game.js";

import GameOver from "./scenes/GameOver.js";

//configuration of the window and scenes

export default new Phaser.Game({
  type: Phaser.AUTO,
  width: 480,
  height: 648,
  scene: [Game, GameOver],
  physics: {
    default: "arcade",
    arcade: {
      gravity: {
        y: 800,
      },
      debug: false,
    },
  },
});
