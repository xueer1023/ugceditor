import { Logger } from "../../utils/log";
import { PlayerState } from "./PlayerState";
import { UIEventIndicator } from "./UIEventIndicator";
import { MouseBehaviorHelper } from "../utils/MouseBehaviorHelper";
import { Script } from "../../utils/script/reader";
import {
  isPointerLocked,
  registerPointerLock,
  unregisterPointerLock,
} from "../../utils/utils";

export default class PortalComponent extends Laya.Script3D {
  private logger = new Logger({ name: PortalComponent.name });
  private playerState: PlayerState;
  private mouse = new MouseBehaviorHelper();

  private portal: Laya.Sprite3D;
  private portalTrigger: Script.PortalTrigger;

  private pointerLockMode: boolean = false;

  constructor(portalTrigger: Script.PortalTrigger, playerState: PlayerState) {
    super();
    this.portalTrigger = portalTrigger;
    this.playerState = playerState;
  }

  onAwake() {
    this.portal = this.owner as Laya.Sprite3D;
  }

  onMouseDown() {
    this.mouse.logDown();
  }

  onMouseUp() {
    if (UIEventIndicator.interacting) return;
    if (!this.mouse.upAsClick()) return;
    if (this.pointerLockMode) return;

    this.onClick();
  }

  onEnable(): void {
    if (this.playerState.pointerLockModeEnabled) {
      registerPointerLock(this.pointerLockChange);
    }
  }

  onDisable(): void {
    if (this.playerState.pointerLockModeEnabled) {
      unregisterPointerLock(this.pointerLockChange);
    }
  }

  onClick() {
    if (this.playerState.isObserving) {
      this.playerState.currentObserver.back();
    }
    this.playerState.events.trigger({
      type: "switch-scene",
      payload: this.portalTrigger,
    });
  }

  private pointerLockChange = () => {
    this.pointerLockMode = isPointerLocked();
  };
}
