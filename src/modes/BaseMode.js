export class BaseMode {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.options = options;
  }
  getGameManagerOptions() {
    // By default return options unchanged
    return this.options;
  }
  setup() {
    // Mode specific setup after GameManager creation
  }
}
