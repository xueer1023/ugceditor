import { MouseBehaviorHelper } from "../utils/MouseBehaviorHelper";
import { Lock } from "./Lock";
import { PlayerState } from "./PlayerState";
import { UIEventIndicator } from "./UIEventIndicator";

export class LockResponder extends Laya.Script3D {
  private mouse = new MouseBehaviorHelper();

  private playerState: PlayerState;
  private lock: Lock;

  static create(playerState: PlayerState, lock: Lock): LockResponder {
    const com = new LockResponder();
    com.lock = lock;
    com.playerState = playerState;
    return com;
  }

  onMouseDown() {
    this.mouse.logDown();
  }

  onMouseUp() {
    if (UIEventIndicator.interacting) return;
    if (!this.mouse.upAsClick()) return;
    if (!this.playerState.isObserving) return;

    requestAnimationFrame(() => {
      this.lock.exec();
    });
  }
}
