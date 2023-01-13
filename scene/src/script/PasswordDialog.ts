import { ui } from "../ui/layaMaxUI";
import { CameraMoveEuler } from "./components/CameraMoveEuler";
import { I18NText } from "./components/I18NText";
import { I18NButton } from "./components/I18NButton";
import { UIEventIndicator } from "./components/UIEventIndicator";
import { PlayerState } from "./components/PlayerState";

const DeleteKeyCode = 8;

export default class PasswordDialog extends ui.PasswordDialogUI {
  private messageI18N: I18NText;
  private messageHideTimeout: any;
  private answerPwd: string = "";
  private pwdInput: string[] = [];
  private subTitleI18n: I18NText;
  private onPassed: () => void;
  private playerState: PlayerState;

  constructor() {
    super();
    Laya.stage.on(Laya.Event.KEY_UP, this, this.onKeyUp);
    this.messageI18N = new I18NText("");
    this.message.addComponentIntance(this.messageI18N);
    this.title.addComponentIntance(new I18NText("dialog.password.title"));
    this.subTitleI18n = this.subTitle.addComponentIntance(
      new I18NText("dialog.password.subTitle")
    );
    this.enterBtn.addComponentIntance(new I18NButton("dialog.password.enter"));
    this.enterBtn.on(Laya.Event.CLICK, this, this.onSubmit);

    this.addComponent(UIEventIndicator);
  }

  setPlayerState(playerState: PlayerState) {
    this.playerState = playerState;
  }

  onOpened() {
    const camera = this.playerState?.mainCamera;
    if (camera) {
      // @ts-ignore
      const cameraMove = camera.getComponent(CameraMoveEuler);
      cameraMove && (cameraMove.enabled = false);
    }

    const character = this.playerState?.character;
    if (character) {
      character.enabled = false;
    }
  }

  onUpdate() {}

  onEnable(): void {}

  onDisable(): void {}

  onClosed() {
    const camera = this.playerState?.mainCamera;
    if (camera) {
      // @ts-ignore
      const cameraMove = camera.getComponent(CameraMoveEuler);
      cameraMove && (cameraMove.enabled = true);
    }

    const character = this.playerState?.character;
    if (character) {
      character.enabled = true;
    }
  }

  setAnswer(answer: string, tips: string, onPassed: () => void) {
    this.answerPwd = answer;
    this.onPassed = onPassed;
    this.subTitleI18n.setCode(tips);
    if (this.pwdInput.length) {
      this.pwdInput = [];
      this.renderPwd();
    }
  }

  onKeyUp(e: Event): void {
    const keyCode = e["keyCode"];
    if (keyCode === DeleteKeyCode) {
      if (this.pwdInput.length > 0) {
        this.pwdInput.pop();
        this.renderPwd();
      }
    } else if (keyCode > 47 && keyCode < 58) {
      if (this.pwdInput.length < 6) {
        this.pwdInput.push(this.getNumber(keyCode).toString());
        this.renderPwd();
      }
    } else if (keyCode > 64 && keyCode < 91) {
      if (this.pwdInput.length < 6) {
        this.pwdInput.push(String.fromCharCode(keyCode));
        this.renderPwd();
      }
    } else if (keyCode > 95 && keyCode < 106) {
      if (this.pwdInput.length < 6) {
        this.pwdInput.push((keyCode - 96).toString());
        this.renderPwd();
      }
    }
  }

  getNumber(keyCode: number) {
    return keyCode - 48;
  }

  renderPwd() {
    const [k1, k2, k3, k4, k5, k6] = this.pwdInput;
    this.pwdInput1.text = k1 !== undefined ? `${k1}` : "_";
    this.pwdInput2.text = k2 !== undefined ? `${k2}` : "_";
    this.pwdInput3.text = k3 !== undefined ? `${k3}` : "_";
    this.pwdInput4.text = k4 !== undefined ? `${k4}` : "_";
    this.pwdInput5.text = k5 !== undefined ? `${k5}` : "_";
    this.pwdInput6.text = k6 !== undefined ? `${k6}` : "_";
  }

  onSubmit() {
    if (this.pwdInput.length < 6) {
      this.showMessage("dialog.password.message.fill");
    } else {
      const answer = this.pwdInput.join("");
      if (answer === this.answerPwd) {
        this.close();
        this.onPassed();
      } else {
        this.showMessage("dialog.password.message.wrong");
      }
    }
  }

  showMessage(msg: string) {
    if (this.message.visible) {
      clearInterval(this.messageHideTimeout);
      this.message.visible = false;
      this.message.y = 308;
    }
    this.messageI18N.setCode(msg);
    this.message.visible = true;
    const pos = { y: 308 };
    Laya.Tween.to(pos, { y: 354 }, 300).update = new Laya.Handler(this, () => {
      this.message.y = pos.y;
    });
    this.messageHideTimeout = setTimeout(() => {
      this.message.visible = false;
      this.message.y = 308;
    }, 3000);
  }
}
