import { DebugInfo } from "./DebugInfo";

export class DebugEventReporter extends Laya.Script3D {
  constructor() {
    super();
  }

  onMouseUp() {}
  onMouseDown() {}
  onMouseEnter() {
    DebugInfo.instance.mouseEnter(this.owner);
  }
  onMouseOut() {
    DebugInfo.instance.mouseOut(this.owner);
  }
}
