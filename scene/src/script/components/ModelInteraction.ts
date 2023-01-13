/**
 * 响应用户点击事件，满足条件按时，执行动画交互
 */

import { Logger } from "../../utils/log";
import { Script } from "../../utils/script/reader";
import { recursiveFindNode } from "../../utils/utils";
import { LockUnlockedEvent } from "../events/define";
import { PlayerState } from "./PlayerState";

interface OnFailure {
  modelId?: string;
  state?: string;
  duration?: number;
  tip?: string;
}
interface OnSuccess {
  modelId?: string;
  state?: string;
  duration?: number;
  hideParticle?: string;
  portal?: Script.PortalTrigger;
  clue?: string;
}

export interface UsePropCondition {
  type: Script.PreconditionType.UseProp;
  onFailure: OnFailure[];
  useProp: string;
}

export interface HasPropsCondition {
  type: Script.PreconditionType.HasProps;
  onFailure: OnFailure[];
  hasProps: string[];
}

export interface ModelStateCondition {
  type: Script.PreconditionType.ModelState;
  onFailure: OnFailure[];
  modelId: string; // 目标模型ID
  modelState: string; // 目标模型动画状态
}

export interface LockCondition {
  type: Script.PreconditionType.Lock;
  onFailure: OnFailure[];
  lockId: string; // 目标lockId;
  unlocked: boolean;
}

export type RuleCondition =
  | UsePropCondition
  | HasPropsCondition
  | ModelStateCondition
  | LockCondition;

interface PuzzleDef {
  preconditions: RuleCondition[];
  colliders: string[];
  onSuccesses: OnSuccess[];
}

export interface ModelInteractionOptions {
  modelId: string;
  initialState: string;
  puzzles: PuzzleDef[];
  animations: Record<string, { sound?: Script.Sound }>;
}

export class ModelInteraction extends Laya.Script3D {
  private logger = new Logger({ name: ModelInteraction.name });

  // 是否在响应中
  private _puzzling = false;

  private _puzzles: PuzzleDef[];
  private _animations: Record<string, { sound?: Script.Sound }>;
  private _modelState = "";
  private _modelId = "";

  get puzzling(): boolean {
    return this._puzzling;
  }

  constructor(
    private readonly playerState: PlayerState,
    private readonly scene: Laya.Scene3D,
    opts: ModelInteractionOptions
  ) {
    super();
    this._modelState = opts.initialState;
    this._puzzles = opts.puzzles;
    this._modelId = opts.modelId;
    this._animations = opts.animations;
  }

  get modelId(): string {
    return this._modelId;
  }
  get modelState(): string {
    return this._modelState;
  }

  onEnable() {
    // 存在Lock类型的precondition时才监听LockUnlock事件
    if (
      this._puzzles.find(
        (puz) =>
          puz.preconditions.findIndex(
            (con) => con.type === Script.PreconditionType.Lock
          ) !== -1
      )
    ) {
      this.playerState.events.on("lock-unlocked", this.onLockUnlocked);
    }
  }

  onDisable() {
    if (
      this._puzzles.find(
        (puz) =>
          puz.preconditions.findIndex(
            (con) => con.type === Script.PreconditionType.Lock
          ) !== -1
      )
    ) {
      this.playerState.events.off("lock-unlocked", this.onLockUnlocked);
    }
  }

  onLockUnlocked = ({ lock }: LockUnlockedEvent["payload"]) => {
    this.logger.debug(`handle LockUnlockedEvent from '${lock.owner.name}'`);
    this.execRules(lock.owner.name, true);
  };

  /**
   * 检查条件规则并执行相应功能
   */
  async execRules(fromCollider: string, onlyLockRelated: boolean = false) {
    // 函数异步执行，防止在执行期间再次点击
    if (this._puzzling) {
      this.logger.debug(`model[${this.modelId}] already puzzling`);
      return;
    }
    this._puzzling = true;
    this.logger.debug(
      `model[${this.modelId}] execRules from collider '${fromCollider}'`
    );

    const onSuccesses: OnSuccess[] = [];
    const onFailures: OnFailure[] = [];
    fromCollider = fromCollider.split("_")[0];

    let validPuzzles = this._puzzles.filter(
      (puzzle) => puzzle.colliders.indexOf(fromCollider) >= 0
    );
    // TODO Refact
    // 监听Unlock事件时，不考虑colliderId。
    // 需要重新约定下配置文件的字段含义。目前不好处理。
    // 不检查colliderId会导致一把锁打开，会引起所有有锁precondition的Puzzle的检查
    if (onlyLockRelated) {
      this.logger.debug(`onlyLockRelated`);
      validPuzzles = this._puzzles.filter(
        (puzzle) =>
          puzzle.preconditions.findIndex(
            (con) => con.type === Script.PreconditionType.Lock
          ) !== -1
      );
    }
    this.logger.debug(
      `collider as '${fromCollider}', valide ${validPuzzles.length} puzzles`
    );

    for (const puzzle of validPuzzles) {
      const meet = puzzle.preconditions.every((condition) => {
        switch (condition.type) {
          case Script.PreconditionType.UseProp:
            // 检查使用道具的逻辑
            if (
              this.playerState.selectedProp &&
              this.playerState.selectedProp.propId === condition.useProp
            ) {
              return true;
            } else {
              onFailures.push(...condition.onFailure);
              this.logger.debug(`should use prop '${condition.useProp}'`);
              return false;
            }
          case Script.PreconditionType.ModelState:
            // 检查模型状态的逻辑
            const model = this.playerState.getModel(condition.modelId);
            if (!model) {
              this.logger.error(
                `model[${condition.modelId}] not found, please check json config.`
              );
              onFailures.push(...condition.onFailure);
              return false;
            }
            if (model.modelState !== condition.modelState) {
              onFailures.push(...condition.onFailure);
              return false;
            }
            this.logger.debug(
              `model[${condition.modelId}] is in state '${model.modelState}'`
            );
            return true;
          case Script.PreconditionType.HasProps:
            // 检查持有道具的逻辑
            const gotProps = this.playerState.gotProps.map(
              (prop) => prop.propId
            );
            if (
              condition.hasProps.every((prop) => gotProps.indexOf(prop) !== -1)
            ) {
              this.logger.debug(
                `hasProps ${JSON.stringify(condition.hasProps)}`
              );
              return true;
            } else {
              this.logger.debug(
                `shold got props ${JSON.stringify(condition.hasProps)}`
              );
              onFailures.push(...condition.onFailure);
              return false;
            }
          case Script.PreconditionType.Lock:
            // 检查锁打开情况
            const lock = this.playerState.getLock(condition.lockId);
            if (!lock) {
              this.logger.error(
                `lock[${condition.lockId}] not find, check json config.`
              );
              onFailures.push(...condition.onFailure);
              return false;
            }
            if (lock.unlocked !== condition.unlocked) {
              this.logger.debug(
                `lock[${lock.id}] should be ${
                  condition.unlocked ? "unlocked" : "locked"
                }`
              );
              onFailures.push(...condition.onFailure);
              return false;
            }
            this.logger.debug(
              `lock[${condition.lockId}] is ${
                lock.unlocked ? "unlocked" : "locked"
              }`
            );
            return true;
        }
      });
      meet && onSuccesses.push(...puzzle.onSuccesses);
    }

    for (const success of onSuccesses) {
      let { modelId, state, duration, hideParticle, portal, clue } = success;

      // 从playerState中获取对应model，执行changeState方法
      const model = this.playerState.getModel(modelId);
      if (!model) {
        this.logger.error(
          `model[${modelId}] not found, please check json config.`
        );
      } else {
        model.changeModelState(state);
      }

      // 获取Particle对象，执行隐藏操作
      if (hideParticle) {
        const node = recursiveFindNode(
          this.scene,
          (n) => n.name === hideParticle
        );
        if (node) {
          node.destroy();
        } else {
          this.logger.error(
            `can not hideParticle '${hideParticle}', not existed`
          );
        }
      }

      // 执行线索获得逻辑
      if (clue) {
        // this.playerState.onFindClue(clue);
        const clueCom = this.playerState.getClue(clue);
        if (!clueCom) {
          this.logger.error(`invalid clue[${clue}], check json file.`);
        } else {
          clueCom.onClick();
        }
      }

      duration &&
        (await new Promise((resolve) => {
          setTimeout(resolve, duration);
        }));

      if (portal) {
        if (this.playerState.isObserving) {
          this.playerState.currentObserver.back();
        }
        this.playerState.events.trigger({
          type: "switch-scene",
          payload: {
            ...portal,
          },
        });
      }
    }
    for (const failure of onFailures) {
      let { modelId, state, duration, tip } = failure;
      // 模型状态变化
      if (modelId) {
        const model = this.playerState.getModel(modelId);
        if (!model) {
          this.logger.error(
            `model[${modelId}] not found, please check json config.`
          );
        } else {
          model.changeModelState(state);
        }
      }

      if (tip) {
        this.playerState.events.trigger({
          type: "show-message",
          payload: {
            content: tip,
          },
        });
      }

      duration &&
        (await new Promise((resolve) => {
          setTimeout(resolve, duration);
        }));
    }

    this._puzzling = false;
  }

  // 切换模型状态
  changeModelState(state: string) {
    try {
      if (
        state !== "default" &&
        Object.keys(this._animations).indexOf(state) < 0
      ) {
        this.logger.error(
          `model[${this.modelId}] has no animation named '${state}'`
        );
        return;
      }
      this._modelState = state;

      if (state !== "default") {
        const animator: Laya.Animator = this.owner.getComponent(Laya.Animator);
        this.logger.debug(`model[${this.owner.name}] play state '${state}'`);
        if (animator !== undefined) {
          animator.play(state);
          const { sound } = this._animations[state];
          if (sound && sound.url) {
            Laya.SoundManager.playSound(sound.url, 1);
          }
        } else {
          this.logger.error(
            `there is no Animator on node '${this.owner.name}'`
          );
        }
      }
    } catch (e) {
      this.logger.error(e);
    }
  }
}
