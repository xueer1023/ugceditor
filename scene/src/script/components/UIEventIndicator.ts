// import { Logger } from "../../utils/log";

export class UIEventIndicator extends Laya.Script {
  // private logger = new Logger({name: UIEventIndicator.name});
  private static lastClickAt = 0;
  public static get interacting(): boolean {
    return new Date().valueOf() - UIEventIndicator.lastClickAt < 100;
  }

  onMouseDown() {
    // this.logger.debug("update lastClickAt via onMouseDown")
    UIEventIndicator.lastClickAt = new Date().valueOf();
  }

  onMouseUp() {
    // this.logger.debug("update lastClickAt via onMouseUp")
    UIEventIndicator.lastClickAt = new Date().valueOf();
  }
}
