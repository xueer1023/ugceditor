import { Logger } from "../../utils/log";
import ObserverScene from "../ObserverScene";
import { PlayerState } from "./PlayerState";
import { MouseBehaviorHelper } from "../utils/MouseBehaviorHelper";
import { UIEventIndicator } from "./UIEventIndicator";
import { positionTween, rotationTween } from "../../utils/Transform3DExtension";
import { Script } from "../../utils/script/reader";

/**
 * 点击当前模型，进入观察视角，并显示UI
 */
export class Observer extends Laya.Script3D {
  // 当前观察视角是否处于观察中
  observing: boolean = false;

  private logger = new Logger({ name: Observer.name });
  private scene: ObserverScene;
  private prevPosition: Laya.Vector3;
  private prevRotation: Laya.Quaternion;

  private mouse = new MouseBehaviorHelper();

  constructor(
    private readonly observeTarget: string,
    private readonly playerState: PlayerState,
    private readonly mainCamera: Laya.Camera,
    private readonly observeCamera: Laya.Camera,
    private readonly sound?: Script.Sound
  ) {
    super();
  }

  get target() {
    return this.observeTarget;
  }

  onMouseDown() {
    this.mouse.logDown();
  }

  onMouseUp() {
    if (UIEventIndicator.interacting) return;
    if (this.mouse.upAsClick()) {
      if (!this.playerState.isObserving) {
        this.logger.debug(
          `observe '${this.observeTarget}' at camera '${this.observeCamera.name}' via click ${this.owner.name}`
        );
        // 异步处理逻辑，避免本次loop中其他组件逻辑判断异常
        requestAnimationFrame(() => this.enter());
      }
    }
  }

  onAwake() {
    this.logger.debug(
      `models[${this.observeTarget}] observer of ${this.owner.name}`
    );
  }

  onEnable() {
    this.playerState.events.on("npc-talking-start", this.hideBackBtn);
  }

  onDisable() {
    this.playerState.events.off("npc-talking-end", this.hideBackBtn);
  }

  // 用于NPC对话时隐藏按钮
  hideBackBtn = () => {
    if (this.scene && !this.scene.destroyed) {
      this.scene.imgBack.visible = false;
    }
  };

  // 进入观察视角
  enter() {
    this.playerState.observers
      .filter((obs) => obs.observing)
      .forEach((obj) => obj.back());

    this.observing = true;

    Laya.Scene.load(
      "ObserverScene.scene",
      Laya.Handler.create(this, (scene: ObserverScene) => {
        this.scene = scene;

        if (this.playerState.isTalking) {
          this.hideBackBtn();
        }
        this.scene.open(false, {
          onFinished: () => {
            this.back();
          },
        });

        const { x: px, y: py, z: pz } = this.mainCamera.transform.position;
        const {
          x: rx,
          y: ry,
          z: rz,
          w: rw,
        } = this.mainCamera.transform.rotation;
        this.prevPosition = new Laya.Vector3(px, py, pz);
        this.prevRotation = new Laya.Quaternion(rx, ry, rz, rw);
        positionTween({
          camera: this.mainCamera,
          target: this.observeCamera.transform.position,
          duration: 1800,
        });
        rotationTween({
          camera: this.mainCamera,
          target: this.observeCamera.transform.rotation,
          duration: 2000,
        });

        if (this.sound) {
          const { url } = this.sound;
          Laya.SoundManager.playSound(url, 1);
        }
      })
    );
  }

  // 推出观察视角
  back() {
    if (!this.observing || !this.scene) return;

    this.scene.close();
    this.scene = null;

    this.observing = false;

    positionTween({
      camera: this.mainCamera,
      target: this.prevPosition,
      duration: 1500,
    });
    rotationTween({
      camera: this.mainCamera,
      target: this.prevRotation,
      duration: 1500,
    });
    this.prevPosition = null;
    this.prevRotation = null;
  }
}
