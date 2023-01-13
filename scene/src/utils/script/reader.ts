export interface ScriptReader {
  version: string;
  assetsMode: Script.AssetsMode;
  id: string;
  name: string;
  mode: Script.Mode;
  assets: string[];
  backgroundMusic: Script.Sound;
  backgroundSound: Script.Sound[];
  zipUrl?: string;
  sceneUrl: string;
  character?: Script.Character;
  cameras: Script.Camera[];
  models: Script.Model[];
  clues: Script.Clue[];
  props: Script.Prop[];
  npcs: Script.NPC[];
  particles: Script.Particle[];
  locations: Script.Location[];
  lights: {
    sportLights: Script.SportLight[];
  };
  locks: Script.Lock[];
  locales: {
    zh: Record<string, string>;
    en: Record<string, string>;
  };
  outline: {
    "zh-CN": Script.Outline;
    "en-US": Script.Outline;
  };
  openLetter: {
    "zh-CN": Script.OpenLetter;
    "en-US": Script.OpenLetter;
  };
}

/**
 * 解析script.json。提供配置兼容层，支持多版本Script。
 */
export namespace Script {
  export interface OpenLetter {
    title: string;
    content: string;
    consignor: string;
    width: number;
    consignorImg?: {
      url: string;
      width?: number;
      height?: number;
    };
    fontSize?: number;
    leading?: number;
  }

  export interface Outline {
    title: string;
    content: string;
    width: number;
    fontSize?: number;
    leading?: number;
  }

  export enum AssetsMode {
    Default,
    Zip
  }

  export enum Mode {
    Game = 1, // 游戏模式
    Create = 0, // 原始场景，创作模式
  }

  export interface Sound {
    url: string;
    volume: number; // 0 - 1
  }

  export interface Character {
    nodes: string[];
    collider: {
      // 角色碰撞器参数
      radius: number;
      height: number;
    };
    moveSpeed?: number; // 角色移动速度
    stepHeight?: number; // 角色可跨越的最大高度
    maxSlope?: number; // 最大坡度
  }

  export interface Camera {
    id: string;
    nodes: string[];
    isMain: boolean;
  }

  export interface Model {
    id: string;
    nodes: string[];
    /** 模型初始状态 */
    initialState: string;
    /** 模型的状态机 */
    animation: Animation;
    /** 模型观察触发器 */
    observationTrigger: ObservationTrigger;
    /** 模型解谜触发器 */
    puzzleTriggers: PuzzleTrigger[];
    /** 传送门触发器 */
    portalTrigger: PortalTrigger;
  }

  export interface ObservationTrigger {
    /**
     * 点击之后会触发观察模型操作的 collider 所属模型名的列表
     * 即在unity中该模型的modelName，按照约定，取modelName的第一个 _（下划线，如有）前的部分
     * e.g.: modelName为 cauldron_1、cauldron_2... 的模型，统一使用 cauldron
     *      -> colliderId: ["cauldron"]
     */
    colliderId: string[];
    /** 观看时所使用的cameraId */
    cameraId: string;
    /** 【可选】进入改视角后自动开始播放的音效 */
    sound?: Sound;
  }

  export enum PreconditionType {
    UseProp = 0, // 使用道具
    ModelState = 1, // 模型处于某个状态
    // NotUseProp = 2, // 未使用道具
    HasProps = 3,
    Lock = 4,
  }
  /**
   * 解谜触发器，一般是触发模型的动画（更改模型状态）
   */
  export interface PuzzleTrigger {
    /**
     * 点击之后会触发解谜操作的 collider 所属模型名的列表
     * 即在unity中该模型的modelName，按照约定，取modelName的第一个 _（下划线，如有）前的部分
     * e.g.: modelName为 cauldron_1、cauldron_2... 的模型，统一使用 cauldron
     *      -> colliderId: ["cauldron"]
     */
    colliderId: string[];
    /**
     * 触发解谜的前置条件
     * 需要达成precondition列表里所有的条件才执行onSuccess
     * PreconditionType分为：
     *    UseProp -> 需要使用某个道具，useProp为道具的id，即用户需要使用该模型，才能触发解谜（如：需要选中钥匙，才能打开箱子）
     *    ModelState ->  某个模型处于某个状态，modelState为二元数组，modelState[0]为模型名，modelState[1]为该模型需要所处的状态（如：箱子需要处于关闭状态下，才能打开箱子）
     *    NotUseProp -> 未使用某个道具，useProp为道具的id，即用户没有使用该模型时，会触发解谜效果（如：没有选中钥匙，箱子会抖动）
     */
    precondition: {
      type: PreconditionType;
      useProp?: string;
      hasProps?: string[];
      modelState?: string[]; // [ModelId, StateName]
      lockId?: string;
      unlocked?: boolean;
      onFailure: {
        modelId?: string;
        state?: string;
        duration?: number;
        tip: string;
      }[];
    }[];
    /**
     * 解谜结果
     * 即模型状态的变更：modelId对应的模型变更到state状态
     * 程序会自动执行该模型的 stateAnimation[state] 对应的动画
     * @param state 模型的新状态
     */
    onSuccess: {
      modelId?: string;
      state?: string;
      duration?: number;
      hideParticle?: string;
      portal?: PortalTrigger;
      clue?: string;
    }[];
  }

  export interface PortalTrigger {
    /** 目标传送场景的id */
    sceneId: string;
    /**
     * 切换场景后的初始配置
     * @position: 初始位置
     * @rotation: 初始视角
     */
    position: {
      x: number;
      y: number;
      z: number;
    };
    rotation: {
      x: number;
      y: number;
    };
  }

  export interface Animation {
    /**
     * 模型状态机
     * 当模型切换到stateName时，会播放动画animation和sound音效(如有)
     */
    stateMachine: {
      [stateName: string]: {
        sound: Sound;
      };
    };
    // /** 模型可以播放的 animation 列表 */
    // animations: string[];
  }

  export interface Clue {
    id: string;
    name: string;
    desc: string;
    img: string;
    nodes: string[];
    disableHit: boolean;
  }
  /** 粒子特效 */
  export interface Particle {
    id: string;
    nodes: string[];
  }
  export interface Prop {
    id: string;
    name: string;
    desc: string;
    img: string;
    nodes: string[];
  }
  /**
   * 实现参考：https://layaair2.ldc2.layabox.com/demo2/?language=zh&category=3d&group=Lighting&name=SpotLightDemo
   */
  export interface SportLight {
    /** 光线旋转范围，如[50, 0, 50] */
    ranges: [number, 0, number];
    /**
     * 灯源在场景中的位置信息 [x, y, z]
     * ! 注：Laya的x轴与unity的x轴相反
     */
    lightPosition: number[];
    lightNodes: [];
    /**
     * 粒子特效在场景中的位置信息 [x, y, z]
     * ! 注：Laya的x轴与unity的x轴相反
     */
    particlePosition: number[];
    particleNodes: [];
    // /** 灯光颜色 [r, g, b] */
    // color: number[];
    // /** 世界矩阵的前向量 [a, b, c] */
    // worldMatrix: number[];
    // /** 聚光范围 */
    // range: number;
    // /** 聚光灯的锥形角度 */
    // spotAngle: number;
    // /** 用于生成旋转四元数，用处暂不明确，可能与旋转速度有关，默认为[0.025, 0, 0] */
    // yawPitchRoll: number[];
  }

  /**
   * 场景中的NPC人物，具有点击后对话（获得线索）、播放动画等功能
   */
  export interface NPC {
    id: string;
    name: string;
    nodes: string[];
    /** 模型观察触发器 */
    observationTrigger: ObservationTrigger;
    /**
     * NPC的对话组列表
     * 如有clueId，玩家触发之后可以获得对应的线索
     */
    dialogueGroup: DialogueGroup;
  }
  /**
   * NPC的对话组
   */
  export interface DialogueGroup {
    /** NPC的对话内容，可以将完整的对话拆成多段，玩家每次点击屏幕播放下一段 */
    dialogue: Dialogue[];
    /** 非空则表示该对话组为「线索对话组」，clueId为对应Clue的id */
    clueId?: string;
  }

  export interface Dialogue {
    /** 对话文本 */
    content: string;
    /** 如果state非空，播放到当前对话时，NPC的模型状态会发生变更，并播放对应的模型动画和音效 */
    state?: string;
  }

  export interface Location {
    id: string;
    nodes: string[];
    x: number;
    y: number;
    z: number;
  }

  export interface Lock {
    id: string;
    nodes: string[];
    password: string;
    tip?: string;
  }
}
