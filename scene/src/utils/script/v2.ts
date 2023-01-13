import { loadJson } from "../utils";
import { Script, ScriptReader } from "./reader";

export async function readV2(
  script: ScriptV2,
  scriptUrl: string
): Promise<ScriptReader> {
  function _u(u: string) {
    if (!u) return u;
    const charIdx = scriptUrl.lastIndexOf("/");
    const res = scriptUrl.slice(0, charIdx + 1) + u;
    return res;
  }

  function _sound(s: Script.Sound): Script.Sound {
    return {
      volume: s.volume,
      url: _u(s.url),
    };
  }
  function _animation(
    a: Script.Animation | undefined
  ): Script.Animation | undefined {
    if (!a) return undefined;

    const stateMachine = { ...a.stateMachine };
    for (const key of Object.keys(stateMachine)) {
      stateMachine[key] = {
        ...stateMachine[key],
        sound: _sound(stateMachine[key].sound),
      };
    }
    return {
      ...a,
      stateMachine,
    };
  }
  function _model(m: Script.Model): Script.Model {
    return {
      ...m,
      animation: _animation(m.animation),
    };
  }
  function _isUrl(s: string): boolean {
    return s.includes("/") && s.includes(".");
  }
  function _locales(l: Record<string, string>): Record<string, string> {
    const ll = { ...l };
    for (const key of Object.keys(ll)) {
      if (_isUrl(ll[key])) {
        ll[key] = _u(ll[key]);
      }
    }
    return ll;
  }

  function _openLetter(l: Script.OpenLetter): Script.OpenLetter {
    if (l && l.consignorImg) {
      l.consignorImg.url = _u(l.consignorImg.url);
    }
    return l;
  }

  const [zh, en, outline, openLetter] = await Promise.all([
    (async ()=>_locales(
      await loadJson<Record<string, string>>(_u(script.locales.zh))
    ))(),
    (async ()=>_locales(
      await loadJson<Record<string, string>>(_u(script.locales.en))
    ))(),
    (async ()=>(script.outlineUrl
      ? await loadJson<{
          "zh-CN": Script.Outline;
          "en-US": Script.Outline;
        }>(_u(script.outlineUrl))
      : null))(),
    (async ()=>(script.openLetterUrl
      ? await loadJson<{
          "zh-CN": Script.OpenLetter;
          "en-US": Script.OpenLetter;
        }>(_u(script.openLetterUrl))
      : null))(),
  ]) 


  // const zh = _locales(
  //   await loadJson<Record<string, string>>(_u(script.locales.zh))
  // );
  // const en = _locales(
  //   await loadJson<Record<string, string>>(_u(script.locales.en))
  // );

  // const outline = script.outlineUrl
  //   ? await loadJson<{
  //       "zh-CN": Script.Outline;
  //       "en-US": Script.Outline;
  //     }>(_u(script.outlineUrl))
  //   : null;

  // const openLetter = script.openLetterUrl
  //   ? await loadJson<{
  //       "zh-CN": Script.OpenLetter;
  //       "en-US": Script.OpenLetter;
  //     }>(_u(script.openLetterUrl))
  //   : null;

  return {
    ...script,
    assetsMode: Script.AssetsMode.Default,
    assets: script.assets.map(_u),
    backgroundMusic: _sound(script.backgroundMusic),
    backgroundSound: (script.backgroundSound||[]).map(_sound),
    sceneUrl: _u(script.sceneUrl),
    models: script.models.map(_model),
    locales: {
      zh,
      en,
    },
    outline,
    openLetter: {
      "zh-CN":
        !!openLetter && openLetter["zh-CN"]
          ? _openLetter(openLetter["zh-CN"])
          : null,
      "en-US":
        !!openLetter && openLetter["en-US"]
          ? _openLetter(openLetter["en-US"])
          : null,
    },
  };
}

/**
 * 内部所有的资源以相对该script的路径表达
 */
export interface ScriptV2 {
  version: string;

  outlineUrl?: string;
  openLetterUrl?: string;

  id: string;
  name: string;
  mode: number; // 0: 原始场景，创作模式, 1: 游戏模式
  loadStatus: LoadStatus;
  /**
   * 预加载资源
   * 包括：模型、道具的png图片、背景音乐、动画音效
   */
  assets: string[];
  /** 语言文件路径 */
  locales: {
    zh: string;
    en: string;
  };
  // 背景音乐路径
  backgroundMusic: Sound;
  // 需要全程循环播放的音效路径
  backgroundSound: Sound[];
  sceneUrl: string;
  cameras: Camera[]; // 摄像机
  /**
   * 模型，只需要录入：
   * 可以点击后靠近观察的模型，一般是模型上有线索或道具的
   * e.g.: 桌子上有卷轴，需要点击桌子靠近观察，然后再点击卷轴拾取
   *        -> 录入桌子数据，包括：observationTrigger用于靠近观察
   *
   * 或者道具在模型里面的，需要解谜操作才能看到的
   * e.g.: 箱子里有本书，需要点击箱子靠近观察，然后使用钥匙打开箱子
   *        -> 录入箱子数据，包括：observationTrigger用于靠近观察，puzzleTriggers用于判断条件来播放箱子的对应动画
   */
  models: Model[];
  clues: Clue[]; // 线索
  props: Prop[]; // 道具
  npcs: NPC[];
  particles: Particle[]; // 粒子特效
  /**
   * 场景中的定位箭头
   * 由于Laya的x轴与unity的x轴是相反的，所以录入的时候x要取unity中x的相反数
   */
  locations: Location[]; // 定位箭头
  /**
   * 场景中的光源，Unity的场景导出到Laya中无法实现的光源效果，在此处编写，由代码生成并控制
   */
  lights: {
    sportLights: SportLight[];
  };
  locks: Lock[];
}

enum LoadStatus {
  Unload,
  Loading,
  Loaded,
}

interface Camera {
  id: string;
  nodes: string[];
  isMain: boolean;
}
interface Model {
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
/**
 * 场景中的NPC人物，具有点击后对话（获得线索）、播放动画等功能
 */
interface NPC {
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
interface DialogueGroup {
  /** NPC的对话内容，可以将完整的对话拆成多段，玩家每次点击屏幕播放下一段 */
  dialogue: Dialogue[];
  /** 非空则表示该对话组为「线索对话组」，clueId为对应Clue的id */
  clueId?: string;
}

interface Clue {
  id: string;
  name: string;
  desc: string;
  img: string;
  nodes: string[];
  disableHit: boolean;
}
/** 粒子特效 */
interface Particle {
  id: string;
  nodes: string[];
}
interface Prop {
  id: string;
  name: string;
  desc: string;
  img: string;
  nodes: string[];
}
/**
 * 实现参考：https://layaair2.ldc2.layabox.com/demo2/?language=zh&category=3d&group=Lighting&name=SpotLightDemo
 */
interface SportLight {
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

interface Dialogue {
  /** 对话文本 */
  content: string;
  /** 如果state非空，播放到当前对话时，NPC的模型状态会发生变更，并播放对应的模型动画和音效 */
  state?: string;
}

interface Animation {
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

interface Sound {
  url: string;
  volume: number; // 0 - 1
}

interface ObservationTrigger {
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

enum PreconditionType {
  UseProp = 0, // 使用道具
  ModelState = 1, // 模型处于某个状态
  // NotUseProp = 2, // 未使用道具
  HasProps = 3,
  Lock = 4,
}

/**
 * 解谜触发器，一般是触发模型的动画（更改模型状态）
 */
interface PuzzleTrigger {
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

interface PortalTrigger {
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

interface Location {
  id: string;
  nodes: string[];
  x: number;
  y: number;
  z: number;
}

interface Lock {
  id: string;
  nodes: string[];
  password: string;
  tip?: string;
}
