import { Config } from '../config.js';

export class ChatUI {
  constructor(scene) {
    const style = Config.textStyle(Config.FONT_SIZES.SMALL, Config.COLORS.TEXT_WHITE);
    this.text = scene.add.text(10, scene.scale.height - 10, 'Chat connected', style)
      .setOrigin(0, 1)
      .setDepth(200);
  }
}
