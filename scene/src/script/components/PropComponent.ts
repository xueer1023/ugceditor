import { Logger } from "../../utils/log";
import PropList from "./PropList";
import ClueDialog from "../ClueDialog";
import { PlayerState } from "./PlayerState";
import { Script } from "../../utils/script/reader";
import {
  isPointerLocked,
  registerPointerLock,
  unregisterPointerLock,
} from "../../utils/utils";
import { UIEventIndicator } from "./UIEventIndicator";

export default class PropComponent extends Laya.Script3D {
  private logger = new Logger({ name: PropComponent.name });
  private prop: Laya.Sprite3D;
  private playerState: PlayerState;
  static Count = 0;

  dataSource: Script.Prop;
  got: boolean = false;
  order: number;
  selected: boolean;

  private pointerLockMode: boolean = false;

  get propId() {
    return this.dataSource.id;
  }

  constructor(prop: Script.Prop, playerState: PlayerState) {
    super();
    this.dataSource = prop;
    this.playerState = playerState;
    this.order = PropComponent.Count;
    PropComponent.Count++;
  }

  onAwake() {
    this.prop = this.owner as Laya.Sprite3D;
  }

  onMouseUp() {
    if (UIEventIndicator.interacting) return;
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
    if (this.got) return;
    this.got = true;
    this.owner.destroy();
    this.playerState.events.trigger({
      type: "prop-found",
      payload: { prop: this, isRestore },
    });
    // this.playerState.onFindProp(this.dataSource);
  }

  private pointerLockChange = () => {
    this.pointerLockMode = isPointerLocked();
  };
}
