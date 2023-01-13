import { MouseBehaviorHelper } from "../utils/MouseBehaviorHelper";
import { ModelInteraction } from "./ModelInteraction";
import { PlayerState } from "./PlayerState";
import { UIEventIndicator } from "./UIEventIndicator";
import {
  distance,
  isPointerLocked,
  registerPointerLock,
  unregisterPointerLock,
} from "../../utils/utils";

export class ModelInteractionResponder extends Laya.Script3D {
  private mouse = new MouseBehaviorHelper();

  private playerState: PlayerState;
  private mi: ModelInteraction;
  private pointerLockMode: boolean = false;

  static create(
    playerState: PlayerState,
    mi: ModelInteraction
  ): ModelInteractionResponder {
    const com = new ModelInteractionResponder();
    com.setModelInteraction(mi);
    com.setPlayerState(playerState);
    return com;
  }

  onEnable() {
    super.onEnable();
    if (this.playerState.pointerLockModeEnabled) {
      registerPointerLock(this.pointerLockChange);
    }
  }

  onDisable() {
    super.onDisable();
    if (this.playerState.pointerLockModeEnabled) {
      unregisterPointerLock(this.pointerLockChange);
    }
  }

  private setPlayerState(playerState: PlayerState) {
    this.playerState = playerState;
  }

  private setModelInteraction(mi: ModelInteraction) {
    this.mi = mi;
  }

  onMouseDown() {
    if (this.pointerLockMode) return;
    this.mouse.logDown();
  }

  onMouseUp() {
    if (UIEventIndicator.interacting) return;
    if (this.pointerLockMode) return;
    if (!this.mouse.upAsClick()) return;
    if (
      this.playerState.pointerLockModeEnabled ||
      this.playerState.isObserving
      // 会出现不匹配的问题
      // ||this.playerState.currentObserver?.target !== this.mi.modelId
    ) {
      const dist = distance(this.owner as any, this.playerState.mainCamera);
      if (dist > 40) return;

      requestAnimationFrame(() => {
        this.mi.execRules(this.owner.name);
      });
    }
  }

  exec() {
    requestAnimationFrame(() => {
      this.mi.execRules(this.owner.name);
    });
  }

  private pointerLockChange = () => {
    this.pointerLockMode = isPointerLocked();
  };
}
