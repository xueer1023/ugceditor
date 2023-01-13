import { Logger } from "../../utils/log";
import { Observer } from "./Observer";
import Location from "./Location";
import ClueComponent from "./ClueComponent";
import PropComponent from "./PropComponent";
import UIScene from "../UIScene";
import { EventDispatcher } from "../events/EventDispatcher";
import NPC from "./NPC";
import { ModelInteraction } from "./ModelInteraction";
import { Lock } from "./Lock";
import PortalComponent from "./PortalComponent";
import { ScriptReader } from "../../utils/script/reader";
import CharacterComponent from "./CharacterComponent";

export class PlayerState extends Laya.Script {
  private logger = new Logger({ name: PlayerState.name });

  static DefaultSceneScript: ScriptReader;

  pointerLockModeEnabled: boolean = false;

  // 当前的场景
  scene: string;

  // UI场景，包括：留言、故事背景、提交表单按钮；线索、道具列表；左下角logo；右下角钱包地址显示；
  private uiScene: UIScene;

  // 所有场景的线索信息列表(含获取状态)
  private scenesClues: Record<string, ClueComponent[]> = {};

  // 所有场景的道具信息列表(含获取状态)
  private scenesProps: Record<string, PropComponent[]> = {};

  // 所有场景所有的观察视角
  private scenesObservers: Record<string, Observer[]> = {};

  // 所有场景所有的定位点
  private scenesLocations: Record<string, Location[]> = {};

  // 所有场景的NPC
  private scenesNPCs: Record<string, NPC[]> = {};

  // 所有场景的Model
  private scenesModels: Record<string, ModelInteraction[]> = {};

  // 所有场景的Locks
  private scenesLocks: Record<string, Lock[]> = {};

  // 所有场景的传送门
  private scenesPortals: Record<string, PortalComponent[]> = {};

  // 所有场景的主摄像头
  private mainCameras: Record<string, Laya.Camera> = {};

  // 所有场景的角色
  private characters: Record<string, CharacterComponent> = {};

  public events = new EventDispatcher();

  /** 所有场景的数据 */
  get allClues(): ClueComponent[] {
    return Object.keys(this.scenesClues)
      .map((scene) => this.scenesClues[scene])
      .reduce((prev, curr) => [...prev, ...curr], [])
      .sort((a, b) => a.order - b.order);
  }

  get allProps(): PropComponent[] {
    return Object.keys(this.scenesProps)
      .map((scene) => this.scenesProps[scene])
      .reduce((prev, curr) => [...prev, ...curr], [])
      .sort((a, b) => a.order - b.order);
  }

  get foundClues(): ClueComponent[] {
    return Object.keys(this.scenesClues)
      .map((scene) => this.scenesClues[scene])
      .reduce((prev, curr) => [...prev, ...curr], [])
      .filter((clue) => clue.got);
  }

  /** 当前场景的数据 */

  get clues(): ClueComponent[] {
    return this.scenesClues[this.scene] || [];
  }

  get props(): PropComponent[] {
    return this.scenesProps[this.scene] || [];
  }
  get observers(): Observer[] {
    return this.scenesObservers[this.scene] || [];
  }

  get locations(): Location[] {
    return this.scenesLocations[this.scene] || [];
  }

  get npcs(): NPC[] {
    return this.scenesNPCs[this.scene] || [];
  }

  get models(): ModelInteraction[] {
    return this.scenesModels[this.scene] || [];
  }

  get locks(): Lock[] {
    return this.scenesLocks[this.scene] || [];
  }

  get mainCamera(): Laya.Camera {
    return this.mainCameras[this.scene];
  }

  get character(): CharacterComponent {
    return this.characters[this.scene];
  }

  // 当前场景所处位置
  get currentLocation(): Location {
    return this.locations.find((loc) => loc.isCameraHere);
  }

  // 当前场景是否处于观察视角中
  get isObserving(): boolean {
    return this.observers.find((obs) => obs.observing) !== undefined;
  }

  // 当前场景是否处于对话中
  get isTalking(): boolean {
    return this.npcs.find((npc) => npc.talking) !== undefined;
  }

  // 当前场景的观察视角
  get currentObserver(): Observer | undefined {
    return this.observers.find((obs) => obs.observing);
  }

  // 所有道具中，选中的道具
  get selectedProp(): PropComponent | undefined {
    return this.allProps.find((prop) => prop.selected);
  }

  // 所有道具中，拥有的道具
  get gotProps(): PropComponent[] {
    return this.allProps.filter((prop) => prop.got);
  }

  addSceneData(
    scene: string,
    data: {
      clues: ClueComponent[];
      props: PropComponent[];
      observers: Observer[];
      locations: Location[];
      npcs: NPC[];
      models: ModelInteraction[];
      locks: Lock[];
      portals: PortalComponent[];
      mainCamera: Laya.Camera;
      character: CharacterComponent;
    }
  ) {
    this.mainCameras[scene] = data.mainCamera;
    this.characters[scene] = data.character;
    this.scenesClues[scene] = data.clues;
    this.logger.debug(`Scene[${scene}] setup ${data.clues.length} clues`);
    this.scenesProps[scene] = data.props;
    this.logger.debug(`Scene[${scene}] setup ${data.props.length} props`);
    this.scenesLocations[scene] = data.locations;
    this.logger.debug(
      `Scene[${scene}] setup ${data.locations.length} locations`
    );
    this.scenesObservers[scene] = data.observers;
    this.logger.debug(
      `Scene[${scene}] setup ${data.observers.length} observers`
    );
    this.scenesNPCs[scene] = data.npcs;
    this.logger.debug(`Scene[${scene}] setup ${data.npcs.length} NPCs`);
    this.scenesModels[scene] = data.models;
    this.logger.debug(`Scene[${scene}] setup ${data.models.length} models`);
    this.scenesLocks[scene] = data.locks;
    this.logger.debug(`Scene[${scene}] setup ${data.locks.length} locks`);
    this.scenesPortals[scene] = data.portals;
    this.logger.debug(`Scene[${scene}] setup ${data.portals.length} portals`);

    this.uiScene.renderClueLabel(this.foundClues.length, this.allClues.length);
  }

  activeScene(scene: string) {
    this.scene = scene;
    this.logger.debug(`Scene[${scene}] active`);
  }

  getModel(modelId: string): ModelInteraction | undefined {
    return this.models.find((m) => m.modelId === modelId);
  }

  getLock(lockId: string): Lock | undefined {
    return this.locks.find((lock) => lock.lockId === lockId);
  }

  getClue(clueId: string): ClueComponent | undefined {
    return this.allClues.find((clue) => clue.dataSource.id === clueId);
  }

  getProp(propId: string): PropComponent | undefined {
    return this.allProps.find((prop) => prop.dataSource.id === propId);
  }

  setUIScene(scene: UIScene) {
    this.uiScene = scene;
  }

  // onFindClue(clue: Clue | string) {
  //   if (typeof clue === "string") {
  //     const _clue = this.allClues.find((e) => e.dataSource.id === clue);
  //     _clue && this.onFindClue(_clue.dataSource);
  //   } else {
  //     this.uiScene.onFindClue(
  //       clue,
  //       this.foundClues.length,
  //       this.allClues.length
  //     );
  //   }
  // }

  // onFindProp(prop: Prop) {
  //   this.uiScene.onFindProp(prop);
  // }
}
