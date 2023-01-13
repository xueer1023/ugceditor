import { Logger } from "../../utils/log";
import { PlayerState } from "./PlayerState";
import { MouseBehaviorHelper } from "../utils/MouseBehaviorHelper";
import { UIEventIndicator } from "./UIEventIndicator";
import { Script } from "../../utils/script/reader";
import {
  isPointerLocked,
  registerPointerLock,
  unregisterPointerLock,
} from "../../utils/utils";

export default class ClueComponent extends Laya.Script3D {
  private logger = new Logger({ name: ClueComponent.name });
  private clue: Laya.Sprite3D;
  private playerState: PlayerState;
  static Count = 0;
  private mouse = new MouseBehaviorHelper();

  dataSource: Script.Clue;
  got: boolean = false;
  order: number;

  private pointerLockMode: boolean = false;

  constructor(clue: Script.Clue, playerState: PlayerState) {
    super();
    this.dataSource = clue;
    this.playerState = playerState;
    this.order = ClueComponent.Count;
    ClueComponent.Count++;
  }

  onAwake() {
    this.clue = this.owner as Laya.Sprite3D;
  }

  onMouseDown() {
    this.mouse.logDown();
  }

  onMouseUp() {
    if (UIEventIndicator.interacting) return;
    if (!this.mouse.upAsClick()) return;
    if (this.pointerLockMode) return;
    if (
      this.playerState.pointerLockModeEnabled ||
      this.playerState.isObserving
    ) {
      this.onClick();
    }
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

  onClick({
    isRestore = false,
  }: {
    isRestore?: boolean;
  } = {}) {
    if (this.dataSource.disableHit) return;
    if (this.got) return;

    this.got = true;
    this.owner.destroy();
    this.playerState.events.trigger({
      type: "clue-found",
      payload: { clue: this, isRestore },
    });
    // this.playerState.onFindClue(this.dataSource);
  }

  private pointerLockChange = () => {
    this.pointerLockMode = isPointerLocked();
  };
}
