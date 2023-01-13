import { ui } from "../ui/layaMaxUI";
import { CameraMoveEuler } from "./components/CameraMoveEuler";
import { I18NText } from "./components/I18NText";
import { UIEventIndicator } from "./components/UIEventIndicator";
import { PlayerState } from "./components/PlayerState";
import { I18N } from "../utils/I18N";

/**
 * 【弹窗】故事背景弹窗
 *
 * 使用方式
 * ``` ts
 * Laya.Dialog.load(
 *       "StorySettingDialog.scene",
 *       Laya.Handler.create(this, (dialog: StorySettingDialog) => {
 *          dialog.setCamera(mCamera);
 *          dialog.popup();
 *       })
 * );
 * ```
 */
export default class StorySettingDialog extends ui.StorySettingDialogUI {
  private playerState: PlayerState;

  constructor() {
    super();
  }

  setPlayerState(playerState: PlayerState) {
    this.playerState = playerState;
  }

  onAwake() {
    this.addComponent(UIEventIndicator);
    // 去掉loadJson后，为了尽量保持时序一致，使用setTimeout作为异步。
    setTimeout(() => {
      const res = PlayerState.DefaultSceneScript.outline;
      const conf = res[I18N.getLang()];
      this.title.text = conf.title;
      this.content.text = conf.content;
      this.content.width = conf.width;
      if (conf.fontSize) {
        this.content.fontSize = conf.fontSize;
      }
      if (conf.leading) {
        this.content.leading = conf.leading;
      }
    }, 0);
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
}
