import { MouseBehaviorHelper } from "../utils/MouseBehaviorHelper";
import { PlayerState } from "./PlayerState";
import { UIEventIndicator } from "./UIEventIndicator";
import {
  getLookAtRotation,
  positionTween,
  rotationTween,
} from "../../utils/Transform3DExtension";

/**
 * 【组件】添加在定位光圈上，实现点击光圈移动的功能
 *
 * TODO: rotation的缓动效果
 *
 * 使用方式
 * ``` ts
 * const location = mSprite.addComponent(Location);
 * location.setCamera(camera);
 * location.setPosition({x: 1, y: 1, z: 1});
 * ```
 */
export default class Location extends Laya.Script3D {
  private rotationDuration: number = 1500;
  private positionDuration: number = 3000;
  private location: Laya.Sprite3D;
  private position: { x: number; y: number; z: number };
  private camera: Laya.Camera;
  private mouse = new MouseBehaviorHelper();
  private playerState: PlayerState;

  constructor() {
    super();
  }

  get isCameraHere(): boolean {
    const { x: _x, y: _y, z: _z } = this.position;
    const { x, y, z } = this.camera.transform.position;
    return x == _x && y == _y && z == _z;
  }

  onAwake() {
    this.location = this.owner as Laya.Sprite3D;
  }

  onEnable(): void {}

  onDisable(): void {}

  setCamera(camera: Laya.Camera) {
    this.camera = camera;
  }

  setPosition(position: { x: number; y: number; z: number }) {
    this.position = position;
  }

  setPositionDuration(duration: number) {
    this.positionDuration = duration;
  }

  setRotationDuration(duration: number) {
    this.rotationDuration = duration;
  }

  setPlayerState(playerState: PlayerState) {
    this.playerState = playerState;
  }

  onMouseDown() {
    this.mouse.logDown();
  }

  onMouseUp() {
    if (this.mouse.upAsClick()) {
      this.onClick();
    }
  }

  onClick() {
    if (!this.enabled || !this.position || !this.camera) return;
    if (UIEventIndicator.interacting) return;
    if (this.playerState.isObserving) {
      this.playerState.currentObserver.back();
    }

    this.move();
  }

  move() {
    positionTween({
      camera: this.camera,
      target: this.position,
      duration: this.positionDuration,
    });

    const { x, y, z } = this.position;
    const targetRotation = getLookAtRotation(
      this.camera.transform.position,
      new Laya.Vector3(x, y, z)
    );
    try {
      rotationTween({
        camera: this.camera,
        target: targetRotation,
        duration: this.rotationDuration,
      });
    } catch (e) {}
  }
}
