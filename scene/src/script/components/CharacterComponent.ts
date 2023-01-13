import { Logger } from "../../utils/log";
import { UIEventIndicator } from "./UIEventIndicator";
import { isMoveArea } from "./CameraMoveEuler";
import {
  distance,
  isPointerLocked,
  registerMouseMovement,
  registerPointerLock, throttle,
  unregisterMouseMovement,
  unregisterPointerLock,
} from "../../utils/utils";
import { ModelInteractionResponder } from "./ModelInteractionResponder";
import ClueComponent from "./ClueComponent";
import PropComponent from "./PropComponent";
import UIScene from "../UIScene";
import NPC from "./NPC";
import { PlayerState } from "./PlayerState";
import PortalComponent from "./PortalComponent";

export default class CharacterComponent extends Laya.Script3D {
  private logger = new Logger({ name: CharacterComponent.name });

  private controllerSprite: Laya.Sprite3D;
  private characterController: Laya.CharacterController;

  // 视角旋转速度
  private rotaionSpeed: number = 0.004;
  // 移动速度
  private moveSpeed: number = 0.03;
  private stepHeight: number = 0.1;
  private maxSlope: number = 45;
  private colliderRadius: number = 1.5;
  private colliderHeight: number = 20;

  private lastMouseX: number = 0;
  // 是否按下
  private isLeftMouseDown: boolean = false;
  private isRightMouseDown: boolean = false;
  // 鼠标锁定模式
  private pointerLockMode: boolean = false;

  private scene: Laya.Scene3D;
  private uiScene: UIScene;
  private mainCamera: Laya.Camera;
  private playerState: PlayerState;

  get isMouseDown() {
    return this.isLeftMouseDown || this.isRightMouseDown;
  }

  // 旋转角度
  private yawPitchRoll: Laya.Vector3 = new Laya.Vector3();

  constructor(
    scene: Laya.Scene3D,
    uiScene: UIScene,
    mainCamera: Laya.Camera,
    playerState: PlayerState,
    colliderRadius: number,
    colliderHeight: number,
    moveSpeed: number,
    stepHeight?: number,
    maxSlope?: number
  ) {
    super();
    this.scene = scene;
    this.uiScene = uiScene;
    this.mainCamera = mainCamera;
    this.playerState = playerState;
    this.colliderRadius = colliderRadius;
    this.colliderHeight = colliderHeight;
    this.moveSpeed = moveSpeed;
    this.stepHeight = stepHeight || 0.1;
    this.maxSlope = maxSlope || 45;
  }

  onEnable() {
    registerPointerLock(this.pointerLockChange);
    registerMouseMovement(this.mouseMovement);
    Laya.stage.on(Laya.Event.MOUSE_DOWN, this, this.leftMouseDown);
    Laya.stage.on(Laya.Event.RIGHT_MOUSE_DOWN, this, this.rightMouseDown);
    Laya.stage.on(Laya.Event.MOUSE_UP, this, this.leftMouseUp);
    Laya.stage.on(Laya.Event.RIGHT_MOUSE_UP, this, this.rightMouseUp);
    this.isLeftMouseDown = false;
    this.isRightMouseDown = false;
  }

  onDisable() {
    this.characterController.move(new Laya.Vector3(0, 0, 0));

    if (this.pointerLockMode) {
      this.pointerLockMode = false;
      document.exitPointerLock();
    }
    unregisterPointerLock(this.pointerLockChange);
    unregisterMouseMovement(this.mouseMovement);
    Laya.stage.off(Laya.Event.MOUSE_DOWN, this, this.leftMouseDown);
    Laya.stage.off(Laya.Event.RIGHT_MOUSE_DOWN, this, this.rightMouseDown);
    Laya.stage.off(Laya.Event.MOUSE_UP, this, this.leftMouseUp);
    Laya.stage.off(Laya.Event.RIGHT_MOUSE_UP, this, this.rightMouseUp);
    this.isLeftMouseDown = false;
    this.isRightMouseDown = false;
  }

  onAwake() {
    this.controllerSprite = this.owner as Laya.Sprite3D;
    this.characterController = this.controllerSprite.addComponent(
      Laya.CharacterController
    );
    this.characterController.colliderShape = new Laya.CapsuleColliderShape(
      this.colliderRadius,
      this.colliderHeight
    );
    this.characterController.gravity = new Laya.Vector3(0, -9.8, 0);
    this.characterController.restitution = 0;
    this.characterController.friction = 1;
    this.characterController.stepHeight = this.stepHeight;
    this.characterController.maxSlope = this.maxSlope;
  }

  onUpdate() {
    super.onUpdate();
    if (this.playerState.isTalking) {
      this.characterController.move(new Laya.Vector3(0, 0, 0));
      return;
    }

    const elapsedTime = Laya.timer.delta;

    // 非锁定模式下的角色旋转
    if (this.isMouseDown && !isNaN(this.lastMouseX)) {
      const offsetX = Laya.stage.mouseX - this.lastMouseX;
      this.controllerSprite.transform.localRotationEulerY +=
        offsetX * this.rotaionSpeed * elapsedTime;
      this.lastMouseX = Laya.stage.mouseX;
    }

    // 位置移动
    let w = Laya.KeyBoardManager.hasKeyDown(87);
    let s = Laya.KeyBoardManager.hasKeyDown(83);
    let a = Laya.KeyBoardManager.hasKeyDown(65);
    let d = Laya.KeyBoardManager.hasKeyDown(68);

    if (w && s) {
      w = false;
      s = false;
    }
    if (a && d) {
      a = false;
      d = false;
    }

    if (w || s || a || d) {
      const delta = this.moveSpeed * elapsedTime;

      const keyboardDirection = w
        ? a
          ? 45
          : d
          ? -45
          : 0
        : s
        ? a
          ? 135
          : d
          ? 225
          : 180
        : a
        ? 90
        : -90;
      const characterRotation =
        this.controllerSprite.transform.localRotationEulerY;
      const x =
        Math.sin((characterRotation + keyboardDirection) * (Math.PI / 180)) *
        delta;
      const z =
        Math.cos((characterRotation + keyboardDirection) * (Math.PI / 180)) *
        delta;
      const movement = new Laya.Vector3(x, 0, z);
      this.characterController.move(movement);
    } else {
      this.characterController.move(new Laya.Vector3(0, 0, 0));
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
    this.controllerSprite.transform.localRotation.getYawPitchRoll(
      this.yawPitchRoll
    );
    this.lastMouseX = Laya.stage.mouseX;
    if (!isMoveArea(this.lastMouseX, Laya.stage.mouseY)) return;
  }

  /**
   * 锁定模式下射线检测目标
   */
  rayCast(exec: boolean) {
    const centerPoint: Laya.Vector2 = new Laya.Vector2(
      Laya.stage.width / 2,
      Laya.stage.height / 2
    );
    this.mainCamera.viewportPointToRay(centerPoint, this.centerRay);
    this.scene.physicsSimulation.rayCast(this.centerRay, this.hitResult);
    if (this.hitResult.succeeded) {
      const sprite = this.hitResult.collider.owner as Laya.Sprite3D;
      const dist = distance(sprite, this.mainCamera);
      if (dist <= 40) {
        const interactionResp: ModelInteractionResponder = sprite.getComponent(
          ModelInteractionResponder
        );

        // @ts-ignore
        const clueComp: ClueComponent = sprite.getComponent(ClueComponent);

        // @ts-ignore
        const propComp: PropComponent = sprite.getComponent(PropComponent);

        // @ts-ignore
        const npcComp: NPC = sprite.getComponent(NPC);

        // @ts-ignore
        const portalComp: PortalComponent = sprite.getComponent(PortalComponent);

        if (exec) {
          interactionResp?.exec();
          clueComp?.onClick();
          propComp?.onClick();
          portalComp?.onClick();
          if (npcComp) {
            document.exitPointerLock();
            npcComp.onClick();
          }
        }

        return !!interactionResp || !!clueComp || !!propComp || !!npcComp || !!portalComp;
      } else {
        return false;
      }
    }
  }

  mouseUp(): void {
    if (this.pointerLockMode) {
      this.rayCast(true);
    }
  }

  private pointerLockChange = () => {
    this.pointerLockMode = isPointerLocked();
  };

  private centerRay: Laya.Ray = new Laya.Ray(
    new Laya.Vector3(0, 0, 0),
    new Laya.Vector3(0, 0, 0)
  );
  private hitResult: Laya.HitResult = new Laya.HitResult();

  throttledRayCast = throttle(() => {
    const hitModel = this.rayCast(false);
    if (hitModel) {
      this.uiScene.activeCrosshair();
    } else {
      this.uiScene.inactiveCrosshair();
    }
  }, 125)

  /**
   * 锁定模式下的角色旋转
   * @param e Event
   */
  private mouseMovement = (e: any) => {
    if (this.pointerLockMode) {
      const { movementX } = e;
      this.controllerSprite.transform.localRotationEulerY -=
        movementX * this.rotaionSpeed * 10;
      this.lastMouseX = Laya.stage.mouseX;

      this.throttledRayCast()
    }
  };
}
