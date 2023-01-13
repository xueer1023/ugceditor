import { Logger } from "../../../utils/log";
import { DebugInfoScene } from "../../DebugScene";

export class DebugInfo extends Laya.Script {
  private logger = new Logger({ name: DebugInfo.name });
  private scene: DebugInfoScene;
  private static _ins: DebugInfo;

  static get instance() {
    if (!DebugInfo._ins) {
      DebugInfo._ins = new DebugInfo();
    }
    return DebugInfo._ins;
  }

  onAwake() {
    this.scene = this.owner as DebugInfoScene;
  }

  mouseEnter(node: Laya.Node) {
    if (this.scene) {
      this.scene.labelTarget.text = node.name;
    }
  }

  mouseOut(node: Laya.Node) {
    if (this.scene) {
      if (node.name === this.scene.labelTarget.text) {
        this.scene.labelTarget.text = "";
      }
    }
  }
}
