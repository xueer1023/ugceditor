import { UIEventIndicator } from "./UIEventIndicator";
import {
  isPointerLocked,
  registerMouseMovement,
  registerPointerLock,
  unregisterMouseMovement,
  unregisterPointerLock,
} from "../../utils/utils";
import { PlayerState } from "./PlayerState";
import {reactDomEvent, ReactDomEventType} from "../../utils/ReactComponent";

/**
 * 【组件】摄像头视角、位置移动
 *
 * 使用方式
 * ``` ts
 * const cameraMove = mainCamera.addComponent(CameraMoveEuler);
 * cameraMove.enable = true;
 * cameraMove.movementEnable = true; // 开启 WASDQE 位置移动
 * ```
 */
export class CameraMoveEuler extends Laya.Script {
  // 摄像机
  private camera: Laya.Camera;
  // 位移向量
  private _tempVector3: Laya.Vector3 = new Laya.Vector3();
  // 旋转角度
  private yawPitchRoll: Laya.Vector3 = new Laya.Vector3();
  // 按键下的旋转速度
  private rotaionSpeed: number = 0.004;
  // 移动速度
  private moveSpeed: number = 0.01;
  // 鼠标上个位置x，用来计算鼠标的位移
  private lastMouseX: number = 0;
  // 鼠标上个位置y
  private lastMouseY: number = 0;
  // 是否按下
  private isLeftMouseDown: boolean = false;
  private isRightMouseDown: boolean = false;
  // 鼠标锁定模式
  private pointerLockModeEnabled: boolean = false;
  private pointerLockMode: boolean = false;

  private playerState: PlayerState;

  get isMouseDown() {
    return this.isLeftMouseDown || this.isRightMouseDown;
  }

  constructor({
    enablePointerLockMode,
    playerState,
  }: {
    enablePointerLockMode?: boolean;
    playerState: PlayerState;
  }) {
    super();
    this.pointerLockModeEnabled = enablePointerLockMode || false;
    this.playerState = playerState;

    reactDomEvent.addEventListener(
        ReactDomEventType.FormModalVisibleChanged,
        (e) => {
          const visible = (e as CustomEvent).detail.visible;
          this.enabled = !visible;
        }
    );
    reactDomEvent.addEventListener(
        ReactDomEventType.MessageModalVisibleChanged,
        (e) => {
          const visible = (e as CustomEvent).detail.visible;
          this.enabled = !visible;
        }
    );
  }

  onEnable() {
    if (this.pointerLockModeEnabled) {
      registerPointerLock(this.pointerLockChange);
      registerMouseMovement(this.mouseMovement);
    }

    Laya.stage.on(Laya.Event.KEY_PRESS, this, this.keyPress);
    Laya.stage.on(Laya.Event.MOUSE_DOWN, this, this.leftMouseDown);
    Laya.stage.on(Laya.Event.RIGHT_MOUSE_DOWN, this, this.rightMouseDown);
    Laya.stage.on(Laya.Event.MOUSE_UP, this, this.leftMouseUp);
    Laya.stage.on(Laya.Event.RIGHT_MOUSE_UP, this, this.rightMouseUp);
    this.camera = this.owner as Laya.Camera;
    this.isLeftMouseDown = false;
    this.isRightMouseDown = false;
  }

  onDisable() {
    if (this.pointerLockModeEnabled) {
      this.pointerLockMode = false;
      unregisterPointerLock(this.pointerLockChange);
      unregisterMouseMovement(this.mouseMovement);
    }

    Laya.stage.off(Laya.Event.KEY_PRESS, this, this.keyPress);
    Laya.stage.off(Laya.Event.MOUSE_DOWN, this, this.leftMouseDown);
    Laya.stage.off(Laya.Event.RIGHT_MOUSE_DOWN, this, this.rightMouseDown);
    Laya.stage.off(Laya.Event.MOUSE_UP, this, this.leftMouseUp);
    Laya.stage.off(Laya.Event.RIGHT_MOUSE_UP, this, this.rightMouseUp);
    this.isLeftMouseDown = false;
    this.isRightMouseDown = false;
  }

  onUpdate(): void {
    if (!this.enabled || this.playerState.isTalking) return;

    const elapsedTime = Laya.timer.delta;

    if (
      this.isMouseDown &&
      !isNaN(this.lastMouseX) &&
      !isNaN(this.lastMouseY)
    ) {
      const offsetY = Laya.stage.mouseY - this.lastMouseY;
      const localRotationEulerX =
        this.camera.transform.localRotationEulerX +
        offsetY * this.rotaionSpeed * elapsedTime;

      if (!this.pointerLockModeEnabled) {
        const offsetX = Laya.stage.mouseX - this.lastMouseX;
        this.camera.transform.localRotationEulerY +=
          offsetX * this.rotaionSpeed * elapsedTime;
      }
      localRotationEulerX < 70 &&
        localRotationEulerX > -70 &&
        (this.camera.transform.localRotationEulerX = localRotationEulerX);

      this.lastMouseY = Laya.stage.mouseY;
      this.lastMouseX = Laya.stage.mouseX;
    }
  }

  leftMouseDown() {
    if (UIEventIndicator.interacting || this.pointerLockMode) return;
    this.isLeftMouseDown = true;
    this.mouseDown();
  }

  rightMouseDown() {
    if (UIEventIndicator.interacting || this.pointerLockMode) return;
    this.isRightMouseDown = true;
    this.mouseDown();
  }

  leftMouseUp() {
    this.isLeftMouseDown = false;
    this.mouseUp();
  }

  rightMouseUp() {
    this.isRightMouseDown = false;
    this.mouseUp();
  }

  mouseDown(): void {
    this.camera.transform.localRotation.getYawPitchRoll(this.yawPitchRoll);
    this.lastMouseX = Laya.stage.mouseX;
    this.lastMouseY = Laya.stage.mouseY;
    if (!isMoveArea(this.lastMouseX, this.lastMouseY)) return;
  }

  mouseUp(): void {}

  async keyPress(e) {
    switch (e.keyCode) {
      case 116: // T
        if (!this.pointerLockModeEnabled) return;
        if (this.pointerLockMode) {
          document.exitPointerLock();
        } else {
          const canvas = document.getElementsByTagName("canvas")[0];
          try {
            await canvas?.requestPointerLock();
            this.camera.transform.localRotation.getYawPitchRoll(
              this.yawPitchRoll
            );
            this.lastMouseX = Laya.stage.mouseX;
            this.lastMouseY = Laya.stage.mouseY;
          } catch (e) {
            console.log(e);
          }
        }
        break;
    }
  }

  private pointerLockChange = () => {
    this.pointerLockMode = isPointerLocked();
  };

  /**
   * 锁定模式下的视角旋转
   * 由于在 PointerLock 模式下 Laya 无法监测鼠标移动事件
   * 因此使用 mousemove 事件中的 movementX、movementY 值分别作为 offsetX、offsetY
   * @param e Event
   */
  private mouseMovement = (e: any) => {
    if (this.pointerLockMode) {
      const { movementY } = e;
      const localRotationEulerX =
        this.camera.transform.localRotationEulerX -
        movementY * this.rotaionSpeed * 10;
      localRotationEulerX < 70 &&
        localRotationEulerX > -70 &&
        (this.camera.transform.localRotationEulerX = localRotationEulerX);
    }
  };
}

/**
 * 防止鼠标穿透的区域坐标
 * [ [左上x, 左上y, 右下x, 右下y] ]
 */
const UnMovableArea = [];

export function isMoveArea(mouseX: number, mouseY: number): boolean {
  for (const area of UnMovableArea) {
    const [tlX, tlY, brX, brY] = area;
    if (mouseX >= tlX && mouseX <= brX && mouseY >= tlY && mouseY <= brY) {
      return false;
    }
  }
  return true;
}
