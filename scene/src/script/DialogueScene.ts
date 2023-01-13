import { ui } from "../ui/layaMaxUI";
import { I18N } from "../utils/I18N";
import { I18NText } from "./components/I18NText";
import TypeWriter from "../utils/TypeWriter";
import { UIEventIndicator } from "./components/UIEventIndicator";
import { Script } from "../utils/script/reader";

export default class DialogueScene extends ui.DialogueSceneUI {
  private isInDialogue: boolean = false;
  private dialogueGroup: Script.DialogueGroup;
  private typeWriter: TypeWriter;
  private typeWriters: TypeWriter[];
  private readonly npcNameI18N: I18NText;
  private readonly contentI18N: I18NText;

  private onDialogueFinish?: () => void;
  private onFindClue?: (clueId: string) => void;

  constructor() {
    super();
    this.npcNameI18N = new I18NText("");
    this.contentI18N = new I18NText("");
    this.npcName.addComponentIntance(this.npcNameI18N);
    this.content.addComponentIntance(this.contentI18N);
    this.addComponent(UIEventIndicator);
  }

  onAwake() {
    this.on(Laya.Event.CLICK, this, () => {
      if (this.isInDialogue) {
        this.typeWriter ? this.typeWriter.printAll() : this.playNextDialogue();
      }
    });
  }

  onEnable(): void {}

  onDisable(): void {}

  startDialogue(
    dialogueGroup: Script.DialogueGroup,
    npcName: string,
    onDialogueFinish?: () => void,
    onFindClue?: (clueId: string) => void
  ) {
    if (this.isInDialogue) return;
    this.visible = true;
    this.isInDialogue = true;
    this.onDialogueFinish = onDialogueFinish;
    this.onFindClue = onFindClue;
    this.npcNameI18N.setCode(npcName);
    this.dialogueGroup = dialogueGroup;

    this.typeWriters = dialogueGroup.dialogue
      .filter((d) => !!I18N.f(d.content))
      .map((d) => {
        return new TypeWriter(I18N.f(d.content), {
          speed: I18N.getLang() === "zh-CN" ? 50 : 25,
          onWrite: (text) => {
            this.content.text = text;
          },
          onFinish: () => {
            this.typeWriter = null;
          },
        });
      });
    this.playNextDialogue();
  }

  playNextDialogue() {
    if (!this.isInDialogue || this.typeWriter) {
      return;
    }

    if (!this.typeWriters.length) {
      this.finishDialogue();
    } else {
      this.typeWriter = this.typeWriters.shift();
      this.typeWriter.start();
    }
  }

  finishDialogue() {
    if (!this.isInDialogue) return;
    this.isInDialogue = false;
    this.typeWriter = null;
    this.typeWriters = [];
    this.visible = false;
    this.npcName.text = "";
    this.content.text = "";

    this.onDialogueFinish?.();

    if (!!this.dialogueGroup?.clueId) {
      this.onFindClue(this.dialogueGroup?.clueId);
    }

    this.dialogueGroup = null;
    this.onDialogueFinish = null;
    this.onFindClue = null;
  }
}
