import { CameraMoveEuler } from "./components/CameraMoveEuler";
import { loadScene, travelNodes } from "../utils/utils";
import { Logger } from "../utils/log";
import { PlayerState } from "./components/PlayerState";
import { Observer } from "./components/Observer";
import UIScene from "./UIScene";
import Location from "./components/Location";
import NPC from "./components/NPC";
import DialogueScene from "./DialogueScene";
import ClueComponent from "./components/ClueComponent";
import PropComponent from "./components/PropComponent";
import { BackgroundMusic } from "./components/BackgroundMusic";
import { I18N, Lang } from "../utils/I18N";
import { ModelInteraction } from "./components/ModelInteraction";
import { DebugEventReporter } from "./components/debug/DebugEventReporter";
import { ModelInteractionResponder } from "./components/ModelInteractionResponder";
import { DebugInfoScene } from "./DebugScene";
import { DebugInfo } from "./components/debug/DebugInfo";
import { Lock } from "./components/Lock";
import PasswordDialog from "./PasswordDialog";
import { submitVisit } from "../utils/api";
import { wallet } from "../utils/Wallet";
import { LockResponder } from "./components/LockResponder";
import { StatePersistent } from "./components/StatePersistent";
import LoadingScene from "./LoadingScene";
import PortalComponent from "./components/PortalComponent";
import { SwitchSceneEvent } from "./events/define";
import { SceneInfo } from "./utils/scene";
import { Script, ScriptReader } from "../utils/script/reader";
import CharacterComponent from "./components/CharacterComponent";
import { FrameworkConfig } from "../framework";

export default class MainScene extends Laya.Scene {
  private logger = new Logger({ name: MainScene.name });
  private loadingScene: LoadingScene;
  private uiScene: UIScene;
  private dialogueScene: DialogueScene;
  private passwordDialogue: PasswordDialog;

  // private scripts: Record<string, ScriptReader> = {};
  private playerState: PlayerState;
  private gameScenes: Record<string, Laya.Scene3D> = {};
  private bgMusicCom: BackgroundMusic;

  constructor() {
    super();
  }

  async onOpened(param: any) {
    super.onOpened(param);

    // create PlayerState
    this.playerState = Laya.stage.addComponent(PlayerState);
    Laya.stage.addComponent(StatePersistent);

    this.playerState.events.on("switch-scene", this.switchScene);

    // 动态选择场景

    let defaultScript =
      SceneInfo.scripts.length > 0 ? SceneInfo.scripts[0] : null;
    let secondScript =
      SceneInfo.scripts.length > 1 ? SceneInfo.scripts[1] : null;

    if (!defaultScript) return;

    const pointerLockModeEnabled = !!defaultScript.character;
    PlayerState.DefaultSceneScript = defaultScript;
    this.playerState.pointerLockModeEnabled = pointerLockModeEnabled;

    if (defaultScript.backgroundMusic) {
      // 设置背景音乐
      this.bgMusicCom = new BackgroundMusic({
        music: defaultScript.backgroundMusic,
        sounds: defaultScript.backgroundSound || [],
      });
      Laya.stage.addComponentIntance(this.bgMusicCom);
    }

    this.loadingScene = await loadScene("LoadingScene.scene");
    this.prepareScene(
      secondScript ? [defaultScript, secondScript] : defaultScript,
      {
        preload: false,
        onLoaded: async ([scene0, scene1]) => {
          scene0.zOrder = -1;
          Laya.stage.addChild(scene0);

          // add UIScene
          const uiScene = await loadScene("UIScene.scene");
          uiScene.setPlayerState(this.playerState);
          uiScene.open(false, {
            pointerLockModeEnabled,
            creationMode: defaultScript.mode === 0,
          });
          this.uiScene = uiScene;
          this.playerState.setUIScene(uiScene);

          // 根据配置文件的道具数量，控制道具栏的显示和隐藏
          const propLen =
            defaultScript.props.length +
            (secondScript ? secondScript.props.length : 0);
          if (propLen === 0) {
            uiScene.hidePropList();
          }

          // close LoadingScene
          this.loadingScene.close();

          // add DialogueScene
          const dialogueScene = await loadScene("DialogueScene.scene");
          Laya.stage.addChild(dialogueScene);
          this.dialogueScene = dialogueScene;

          // register components
          await this.setupConfig(defaultScript, scene0);

          if (secondScript && scene1) {
            await this.setupConfig(secondScript, scene1);
          }

          (
            Laya.stage.getComponent(StatePersistent) as StatePersistent
          ).syncToPlayerState();

          // active scene
          this.playerState.activeScene(defaultScript.id);

          // // 预加载第二个场景
          // secondScript &&
          //   setTimeout(() => {
          //     this.prepareScene(secondScript, {
          //       preload: true,
          //     });
          //   }, 5000);
        },
      }
    );

    submitVisit(wallet.account);
  }

  onEnable(): void {}

  onDisable(): void {}

  getNodeByNodes(nodes: string[], scene: Laya.Scene3D) {
    let node: Laya.Node = scene;
    for (let i = 0, len = nodes.length; i < len; i++) {
      node = node.getChildByName(nodes[i]);
    }
    return node;
  }

  /**
   * 依据配置设置Components及PlayerState
   */
  private async setupConfig(script: ScriptReader, gameScene: Laya.Scene3D) {
    // 解析配置，设置相应Component

    let pointerLockMode = !!script.character; // 自由移动方式

    this.gameScenes[script.id] = gameScene;

    // 按照 "name.split('_')[0]" 的规则索引所有Node
    const nameNodes: Record<string, Laya.Node[]> = {};
    travelNodes(
      gameScene,
      (node) => {
        const name = node.name.split("_")[0];
        if (nameNodes[name] === undefined) {
          nameNodes[name] = [];
        }
        nameNodes[name].push(node);
      },
      { includeRoot: true }
    );

    // 获取所有Camera Node
    const cameras = {};
    let mainCamera: Laya.Camera;
    script.cameras.forEach((camera) => {
      let cameraNode = this.getNodeByNodes(
        camera.nodes,
        gameScene
      ) as Laya.Camera;
      cameras[camera.id] = cameraNode;
      if (camera.isMain) {
        mainCamera = cameraNode;
        const cameraMove: CameraMoveEuler = new CameraMoveEuler({
          enablePointerLockMode: pointerLockMode,
          playerState: this.playerState,
        });
        mainCamera.addComponentIntance(cameraMove);
      }
    });

    // V4: 存在 Character 参数则开启第一人称控制器
    let characterComponent: CharacterComponent;
    if (pointerLockMode) {
      const characterNode = this.getNodeByNodes(
        script.character.nodes,
        gameScene
      );
      if (characterNode) {
        const { collider, moveSpeed, stepHeight, maxSlope } = script.character;
        characterComponent = new CharacterComponent(
          gameScene,
          this.uiScene,
          mainCamera,
          this.playerState,
          collider.radius,
          collider.height,
          moveSpeed,
          stepHeight,
          maxSlope
        );
        characterNode.addComponentIntance(characterComponent);
        characterComponent.enabled = true;
      }
    }

    // 设置Observer
    const observers = [];
    if (!pointerLockMode) {
      for (const model of script.models) {
        if (model.observationTrigger && !!model.observationTrigger.colliderId) {
          for (const collider of model.observationTrigger.colliderId) {
            const nodes = nameNodes[collider] || [];
            for (const node of nodes) {
              const observer = new Observer(
                model.id,
                this.playerState,
                mainCamera,
                cameras[model.observationTrigger.cameraId],
                model.observationTrigger.sound
              );
              node.addComponentIntance(observer);
              observers.push(observer);
            }
          }
        }
      }
      for (const npc of script.npcs) {
        for (const collider of npc.observationTrigger.colliderId) {
          const nodes = nameNodes[collider] || [];
          for (const node of nodes) {
            const observer = new Observer(
              npc.id,
              this.playerState,
              mainCamera,
              cameras[npc.observationTrigger.cameraId],
              npc.observationTrigger.sound
            );
            node.addComponentIntance(observer);
            observers.push(observer);
          }
        }
      }
    }

    const locations = [];

    // 设置Location
    for (const location of script.locations) {
      const node = this.getNodeByNodes(location.nodes, gameScene);
      if (pointerLockMode) {
        node.parent.destroy();
        continue;
      }
      const locationCom: Location = node.addComponent(Location);
      locationCom.setCamera(mainCamera);
      locationCom.setPosition(location);
      locationCom.setPositionDuration(3000);
      locationCom.setPlayerState(this.playerState);
      locations.push(locationCom);
      this.logger.debug(`add Location Component to node ${node.name}`);
    }

    // 设置NPC
    const npcs = [];
    for (const npc of script.npcs) {
      const node = this.getNodeByNodes(npc.nodes, gameScene) as Laya.Sprite3D;
      const com = node.addComponentIntance(
        new NPC(pointerLockMode, this.playerState, this.dialogueScene, {
          dialogueGroup: npc.dialogueGroup,
          npcName: npc.name,
        })
      );
      npcs.push(com);
      this.logger.debug(`add NPC Component to node ${node.name}`);
    }

    // 设置线索
    const clues = [];
    for (const clue of script.clues) {
      const node = this.getNodeByNodes(clue.nodes, gameScene) as Laya.Sprite3D;
      const clueComp = new ClueComponent(clue, this.playerState);
      node.addComponentIntance(clueComp);
      clues.push(clueComp);
    }

    // 设置道具
    const props = [];
    for (const prop of script.props) {
      const node = this.getNodeByNodes(prop.nodes, gameScene) as Laya.Sprite3D;
      const propComp = new PropComponent(prop, this.playerState);
      node.addComponentIntance(propComp);
      props.push(propComp);
    }

    // 设置ModelInteraction
    const models = [];
    const portals = [];
    for (const model of script.models) {
      const node = this.getNodeByNodes(model.nodes, gameScene);
      const com = new ModelInteraction(this.playerState, gameScene, {
        modelId: model.id,
        initialState: model.initialState,
        animations: model.animation?.stateMachine || {},
        puzzles: (model.puzzleTriggers || []).map((p) => {
          return {
            preconditions: p.precondition.map((con) => {
              switch (con.type) {
                case Script.PreconditionType.HasProps:
                  return {
                    type: Script.PreconditionType.HasProps,
                    onFailure: con.onFailure || [],
                    hasProps: con.hasProps || [],
                  };
                case Script.PreconditionType.ModelState:
                  return {
                    type: Script.PreconditionType.ModelState,
                    onFailure: con.onFailure || [],
                    modelId: con.modelState[0],
                    modelState: con.modelState[1],
                  };
                case Script.PreconditionType.UseProp:
                  return {
                    type: Script.PreconditionType.UseProp,
                    onFailure: con.onFailure || [],
                    useProp: con.useProp,
                  };
                case Script.PreconditionType.Lock:
                  return {
                    type: Script.PreconditionType.Lock,
                    onFailure: con.onFailure || [],
                    lockId: con.lockId,
                    unlocked: con.unlocked,
                  };
                default:
                  throw new Error(`unkown PreconditionType ${con.type}`);
              }
            }),
            colliders: p.colliderId || [],
            onSuccesses: p.onSuccess || [],
          };
        }),
      });
      node.addComponentIntance(com);
      this.logger.debug(`add ModelInteraction to node ${node.name}`);

      models.push(com);
      const colliders = [];
      for (const puzzle of model.puzzleTriggers || []) {
        for (const collider of puzzle.colliderId || []) {
          if (colliders.indexOf(collider) < 0) {
            colliders.push(collider);
          }
        }
      }
      for (const collider of colliders) {
        for (const colliderNode of nameNodes[collider] || []) {
          const responderCom = ModelInteractionResponder.create(
            this.playerState,
            com
          );
          colliderNode.addComponentIntance(responderCom);
          this.logger.debug(
            `    add ModelInteractionResponder to node ${colliderNode.name}`
          );
        }
      }

      if (model.portalTrigger) {
        const portalComp = new PortalComponent(
          model.portalTrigger,
          this.playerState
        );
        node.addComponentIntance(portalComp);
        portals.push(portalComp);
      }
    }

    // 设置Lock
    this.passwordDialogue = await loadScene<PasswordDialog>(
      "PasswordDialog.scene"
    );
    const locks = [];
    for (const lock of script.locks || []) {
      const node = this.getNodeByNodes(lock.nodes, gameScene) as Laya.Sprite3D;
      if (!node) {
        this.logger.error(`invalid lock nodes ${JSON.stringify(lock.nodes)}`);
        continue;
      }
      const com = Lock.create({
        playerState: this.playerState,
        dialog: this.passwordDialogue,
        lockId: lock.id,
        password: lock.password,
        tip: lock.tip || "",
      });
      node.addComponentIntance(com);
      this.logger.debug(
        `add Lock to node ${node.name} with password '${lock.password}'`
      );
      locks.push(com);

      // locks下所有子节点可触发Lock操作
      travelNodes(
        node,
        (childNode) => {
          const respondCom = LockResponder.create(this.playerState, com);
          childNode.addComponentIntance(respondCom);
          this.logger.debug(`    add LockResponder to node ${childNode.name}`);
        },
        { includeRoot: false }
      );
    }

    // playerState 设置数据
    this.playerState.addSceneData(script.id, {
      clues: clues,
      props: props,
      observers,
      locations,
      npcs,
      models,
      locks,
      portals,
      mainCamera,
      character: characterComponent,
    });

    // 设置国际化
    I18N.update(Lang.enUS, script.locales.en);
    I18N.update(Lang.zhCN, script.locales.zh);
    // await Promise.all([
    //   loadJson<Record<string, string>>(script.locales.en).then((trans) => {
    //     I18N.update(Lang.enUS, trans);
    //   }),
    //   loadJson<Record<string, string>>(script.locales.zh).then((trans) => {
    //     I18N.update(Lang.zhCN, trans);
    //   }),
    // ]);

    if (FrameworkConfig.debug) {
      Laya.Scene.load(
        "debug/DebugInfoScene.scene",
        Laya.Handler.create(this, (scene: DebugInfoScene) => {
          scene.open(false);
          scene.addComponentIntance(DebugInfo.instance);
        })
      );

      travelNodes(
        gameScene,
        (node, depth) => {
          // 为每个Node增加ReportEvent，用于console.log事件
          node.addComponent(DebugEventReporter);

          // 按照层级打印node名称
          // this.logger.debug(`${" ".repeat(depth)} node: ${node.name}`);
        },
        { includeRoot: true }
      );
    }
  }

  /**
   * 切换场景事件
   */
  switchScene = ({
    sceneId,
    position,
    rotation,
  }: SwitchSceneEvent["payload"]) => {
    const script = SceneInfo.scripts.find((s) => s.id == sceneId);

    // 舞台中删除已有场景
    const currentGameScene = this.gameScenes[this.playerState.scene];
    if (currentGameScene) {
      Laya.stage.removeChild(currentGameScene);
    }

    // TODO Loading BG

    // 更新bgm
    this.bgMusicCom.updateMusic({
      music: script.backgroundMusic,
      sounds: script.backgroundSound,
    });

    // open LoadingScene
    this.prepareScene(script, {
      preload: false,
      onLoaded: async ([scene]) => {
        scene.zOrder = -1;
        Laya.stage.addChild(scene);

        if (!this.gameScenes[sceneId]) {
          // 注册组件
          await this.setupConfig(script, scene);
        }
        // 激活新场景
        this.playerState.activeScene(sceneId);

        // 初始化位置和视角
        // if (position) {
        //   this.playerState.mainCamera.transform.position = new Laya.Vector3(
        //     position.x,
        //     position.y,
        //     position.z
        //   );
        // }
        // if (rotation) {
        //   this.playerState.mainCamera.transform.localRotationEulerX =
        //     rotation.x;
        //   this.playerState.mainCamera.transform.localRotationEulerY =
        //     rotation.y;
        // }

        // close LoadingScene
        this.loadingScene.close();
      },
    });
  };

  private prepareScene(
    script: ScriptReader | ScriptReader[],
    params: {
      preload: boolean;
      onLoaded?: (scene: Laya.Scene3D[]) => Promise<void>;
    }
  ) {
    const { preload, onLoaded } = params;
    script = Array.isArray(script) ? script : [script];

    this.loadingScene.close();
    this.loadingScene.open(false, {
      assetsMode: script[0].assetsMode,
      inBackground: preload,
      assets: [].concat(...script.map((s) => s.assets)),
      zipUrl: script.map((s) => s.zipUrl),
      sceneUrl: script.map((s) => s.sceneUrl),
      onLoaded,
    });
  }
}
