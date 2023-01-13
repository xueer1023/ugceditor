import { ui } from "../ui/layaMaxUI";
import { I18NImage } from "./components/I18NImage";
import { I18NText } from "./components/I18NText";
import { CameraMoveEuler } from "./components/CameraMoveEuler";
import { UIEventIndicator } from "./components/UIEventIndicator";
import { PlayerState } from "./components/PlayerState";

export default class ClueDialog extends ui.ClueDialogUI {
  private readonly clueImgI18N: I18NImage;
  private readonly clueNameI18N: I18NText;
  private playerState: PlayerState;

  constructor() {
    super();
    this.clueImgI18N = new I18NImage("");
    this.clueNameI18N = new I18NText("");
    this.clueImg.addComponentIntance(this.clueImgI18N);
    this.clueName.addComponentIntance(this.clueNameI18N);
    this.addComponent(UIEventIndicator);
  }

  setPlayerState(playerState: PlayerState) {
    this.playerState = playerState;
  }

  onEnable(): void {}

  onDisable(): void {}

  setClue(name: string, img: string) {
    const [useI18n, code] = this.parseI18nImgCode(img);
    if (useI18n) {
      this.clueImgI18N.setCode(code);
      this.clueImgI18N.enabled = true;
    } else {
      this.clueImg.skin = img;
      this.clueImgI18N.enabled = false;
    }
    this.clueNameI18N.setCode(name);
  }

  private parseI18nImgCode(img: string): [boolean, string] {
    if (img.startsWith("i18n:")) {
      return [true, img.slice(5)];
    } else {
      return [false, img];
    }
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
}
