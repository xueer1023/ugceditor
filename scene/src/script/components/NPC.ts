import DialogueScene from "../DialogueScene";
import { PlayerState } from "./PlayerState";
import { UIEventIndicator } from "./UIEventIndicator";
import { MouseBehaviorHelper } from "../utils/MouseBehaviorHelper";
import { Logger } from "../../utils/log";
import { Script } from "../../utils/script/reader";
import { distance } from "../../utils/utils";

export default class NPC extends Laya.Script3D {
  private logger = new Logger({ name: NPC.name });
  private npcSprite: Laya.Sprite3D;
  private dialogueScene: DialogueScene;
  private readonly dialogueGroup: Script.DialogueGroup;
  private readonly npcName: string;

  private playerState: PlayerState;
  private isTalking: boolean;
  private mouse = new MouseBehaviorHelper();
  private pointerLockModeEnabled: boolean = false;

  get talking(): boolean {
    return this.isTalking;
  }

  constructor(
    pointerLockModeEnabled: boolean,
    playerState: PlayerState,
    dialogueScene: DialogueScene,
    data: {
      dialogueGroup: Script.DialogueGroup;
      npcName: string;
    }
  ) {
    super();
    this.pointerLockModeEnabled = pointerLockModeEnabled;
    this.playerState = playerState;
    this.dialogueScene = dialogueScene;
    const { dialogueGroup, npcName } = data;
    this.dialogueGroup = dialogueGroup;
    this.npcName = npcName;
  }

  onAwake() {
    this.npcSprite = this.owner as Laya.Sprite3D;
  }

  onMouseDown() {
    this.mouse.logDown();
  }

  onMouseUp() {
    if (UIEventIndicator.interacting) return;

    if (this.pointerLockModeEnabled) {
      const dist = distance(this.owner as any, this.playerState.mainCamera);
      if (dist > 40) return;
    }

    if (this.mouse.upAsClick()) {
      this.onClick();
    }
  }

  onEnable(): void {}

  onDisable(): void {}

  onClick() {
    this.isTalking = true;

    this.playerState.events.trigger({
      type: "npc-talking-start",
      payload: { npc: this },
    });

    this.dialogueScene.startDialogue(
      this.dialogueGroup,
      this.npcName,
      () => {
        this.isTalking = false;

        this.playerState.events.trigger({
          type: "npc-talking-end",
          payload: { npc: this },
        });

        this.playerState.currentObserver?.back();
      },
      (clueId) => {
        const clueCom = this.playerState.getClue(clueId);
        if (!clueCom) {
          this.logger.error(
            `clue[${clueId}] not found, please check json file`
          );
        } else {
          clueCom.onClick();
        }
        // this.playerState.onFindClue(clueId);
      }
    );
  }
}
