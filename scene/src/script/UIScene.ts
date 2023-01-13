import { ui } from "../ui/layaMaxUI";
import { I18NText } from "./components/I18NText";
import StorySettingDialog from "./StorySettingDialog";
import {
  isPointerLocked,
  loadDialog,
  registerPointerLock,
  unregisterPointerLock,
} from "../utils/utils";
import ClueDialog from "./ClueDialog";
import ClueList from "./components/ClueList";
import PropList from "./components/PropList";
import { wallet } from "../utils/Wallet";
import PasswordDialog from "./PasswordDialog";
import { UIEventIndicator } from "./components/UIEventIndicator";
import {
  CreationModalSubmit,
  FormModalSubmit,
  reactDomEvent,
  renderFormModal,
  renderMessageModal,
  renderSpin,
} from "../utils/ReactComponent";
import {
  getQuery,
  queryScript,
} from "../utils/api";
import { I18N } from "../utils/I18N";
import { Logger } from "../utils/log";
import { PlayerState } from "./components/PlayerState";
import {
  ClueFoundEvent,
  PropFoundEvent,
  ShowMessageEvent,
} from "./events/define";
import { CreationModalProps, FormModalProps } from "../utils/const";
import { Script } from "../utils/script/reader";

export default class UIScene extends ui.UISceneUI {
  private logger = new Logger({ name: UIScene.name });
  private storyDialog: StorySettingDialog;
  private clueDialog: ClueDialog;
  private passwordDialog: PasswordDialog;

  private clueLabelI18N: I18NText;

  private playerState: PlayerState;

  private creationMode = false;

  private pointerLockModeEnabled = false;
  private pointerLockMode: boolean = false;

  constructor() {
    super();
  }

  onAwake() {
    this.accountLabel.text = `Address: ${wallet.account}`;
    wallet.on("changed", () => {
      this.accountLabel.text = `Address: ${wallet.account}`;
      reactDomEvent.setFormModalVisible(false);
      reactDomEvent.setShareModalVisible(false);
    });

    this.storyLabel.addComponentIntance(
      new I18NText("dialog.storySetting.title")
    );
    this.messageLabel.addComponentIntance(new I18NText("page.message.title"));
    this.clueLabelI18N = new I18NText("page.main.title.clue", {
      found: 0,
      total: 0,
    });
    this.clueLabel.addComponentIntance(this.clueLabelI18N);
    this.propLabel.addComponentIntance(new I18NText("page.main.title.prop"));

    if (this.creationMode) {
      /**
       * 创作模式
       * -  formLabel 文案
       * - formBtn 点击事件
       * - renderFormModal 参数
       * - 隐藏留言按钮
       * - 隐藏故事背景按钮
       */
      this.messageBtn.visible = false;
      this.messageLabel.visible = false;
      this.storyBtn.visible = false;
      this.storyLabel.visible = false;
      this.formLabel.addComponentIntance(new I18NText("page.creation.title"));
      this.formBtn.on(Laya.Event.CLICK, this, async () => {
        try {
          reactDomEvent.setSpinning(true);

          const resData = (await queryScript(wallet.account)).data.data;
          reactDomEvent.setFormModalValue(
            resData
              ? {
                  ...resData,
                  alert: I18N.f("modal.ipfs-tip", {
                    ipfsCid: resData.ipfsCid,
                  }),
                }
              : undefined
          );

          reactDomEvent.setFormModalVisible(true);
        } catch (e) {
          this.logger.error(e);
        } finally {
          reactDomEvent.setSpinning(false);
        }
      });
      renderFormModal(CreationModalProps[I18N.getLang()], CreationModalSubmit);
    } else {
      /**
       * 游戏模式
       * - formLabel 文案
       * - formBtn 点击事件
       * - renderFormModal 参数
       */
      this.formLabel.addComponentIntance(new I18NText("page.form.title"));
      this.formBtn.on(Laya.Event.CLICK, this, async () => {
        try {
          reactDomEvent.setSpinning(true);
          const res = await getQuery();
          reactDomEvent.setFormModalValue(res?.data.data);

          reactDomEvent.setFormModalVisible(true);
        } catch (e) {
          this.logger.error(e);
        } finally {
          reactDomEvent.setSpinning(false);
        }
      });
      renderFormModal(FormModalProps[I18N.getLang()], FormModalSubmit);
    }

    this.formBtn.addComponent(UIEventIndicator);
    this.storyBtn.on(Laya.Event.CLICK, this, () => {
      if (!UIEventIndicator.interacting) return;
      if (!this.storyDialog || this.storyDialog.isPopup) return;
      this.storyDialog.popup();
    });
    this.storyBtn.addComponent(UIEventIndicator);
    this.messageBtn.on(Laya.Event.CLICK, this, () => {
      reactDomEvent.setMessageModalVisible(true);
    });
    this.messageBtn.addComponent(UIEventIndicator);
    this.logoFt.on(Laya.Event.CLICK, this, () => {
      window.open("https://findtruman.io", "_blank", "noopener,noreferrer");
    });
    this.logoFt.addComponent(UIEventIndicator);
    this.logoDc.on(Laya.Event.CLICK, this, () => {
      window.open(
        "https://discord.com/invite/vrUjMWsjAj",
        "_blank",
        "noopener,noreferrer"
      );
    });
    this.logoDc.addComponent(UIEventIndicator);
    this.logoTw.on(Laya.Event.CLICK, this, () => {
      window.open(
        "https://twitter.com/FindTruman",
        "_blank",
        "noopener,noreferrer"
      );
    });
    this.logoTw.addComponent(UIEventIndicator);

    this.propView.addComponent(UIEventIndicator);
    this.propListArrowUp.on(Laya.Event.CLICK, this, () => {
      this.propList.tweenTo(
        Math.ceil(this.propList.content.scrollRect.y / 100) - 2
      );
    });
    this.propListArrowUp.addComponent(UIEventIndicator);
    this.propListArrowDown.on(Laya.Event.CLICK, this, () => {
      this.propList.tweenTo(
        Math.floor(this.propList.content.scrollRect.y / 100) + 1
      );
    });
    this.propListArrowDown.addComponent(UIEventIndicator);

    this.clueView.addComponent(UIEventIndicator);
    this.clueListArrowUp.on(Laya.Event.CLICK, this, () => {
      this.clueList.tweenTo(
        Math.ceil(this.clueList.content.scrollRect.y / 100) - 2
      );
    });
    this.clueListArrowUp.addComponent(UIEventIndicator);
    this.clueListArrowDown.on(Laya.Event.CLICK, this, () => {
      this.clueList.tweenTo(
        Math.floor(this.clueList.content.scrollRect.y / 100) + 1
      );
    });
    this.clueListArrowDown.addComponent(UIEventIndicator);

    renderMessageModal();
    renderSpin();
  }

  onEnable(): void {}

  onDisable(): void {}

  setPlayerState(playerState: PlayerState) {
    this.playerState = playerState;
  }

  /**
   * 监听PlayerState的 ClueFoundEvent 即 PropFoundEvent 来更新渲染状态
   */

  onOpened({
    pointerLockModeEnabled,
    creationMode,
  }: {
    pointerLockModeEnabled: boolean;
    creationMode: boolean;
  }) {
    this.creationMode = creationMode;
    this.pointerLockModeEnabled = pointerLockModeEnabled;
    if (this.pointerLockModeEnabled) {
      registerPointerLock(this.pointerLockChange);
      this.operationTip.addComponentIntance(new I18NText("operation-mode-tip"));
      this.operationTip.visible = true;
      this.operationTip.on(Laya.Event.CLICK, this, () => {
        this.operationTip.visible = false;
      });
    } else {
      this.operationTip.visible = false;
    }
    this.playerState.events.on("clue-found", this.onClueFound);
    this.playerState.events.on("prop-found", this.onPropFound);
    this.playerState.events.on("show-message", this.showFailureTip);

    // 创作模式不打开故事背景
    if (!this.creationMode) {
      loadDialog("StorySettingDialog.scene").then(
        (storyDialog: StorySettingDialog) => {
          storyDialog.setPlayerState(this.playerState);
          this.storyDialog = storyDialog;
          setTimeout(() => {
            !storyDialog.isPopup && storyDialog.popup();
          }, 500);
        }
      );
    }

    loadDialog("ClueDialog.scene").then((clueDialog: ClueDialog) => {
      clueDialog.setPlayerState(this.playerState);
      this.clueDialog = clueDialog;
      (this.clueList as ClueList).setClueDialog(clueDialog);
      (this.propList as PropList).setClueDialog(clueDialog);
    });

    loadDialog("PasswordDialog.scene").then(
      (passwordDialog: PasswordDialog) => {
        passwordDialog.setPlayerState(this.playerState);
        this.passwordDialog = passwordDialog;
      }
    );
  }

  onClosed() {
    if (this.pointerLockModeEnabled) {
      unregisterPointerLock(this.pointerLockChange);
    }
    this.playerState.events.off("clue-found", this.onClueFound);
    this.playerState.events.off("prop-found", this.onPropFound);
    this.playerState.events.off("show-message", this.showFailureTip);
  }

  onClueFound = ({ clue, isRestore }: ClueFoundEvent["payload"]) => {
    const found = this.playerState.allClues.filter((c) => c.got).length;
    this.onFindClue(
      clue.dataSource,
      isRestore,
      found,
      this.playerState.allClues.length
    );
  };
  onPropFound = ({ prop, isRestore }: PropFoundEvent["payload"]) => {
    this.onFindProp(prop.dataSource, isRestore);
  };

  renderClueLabel(found: number, total: number) {
    this.clueLabelI18N.setCode("page.main.title.clue", {
      found,
      total,
    });
  }

  private onFindClue(
    clue: Script.Clue,
    isRestore: boolean,
    found: number,
    total: number
  ) {
    if (!isRestore) {
      this.clueDialog.setClue(clue.name, clue.img);
      this.clueDialog.popup();
    }

    if (
      this.clueList.cells
        .filter((e) => !!e.dataSource)
        .findIndex((e) => e.dataSource.id === clue.id) === -1
    ) {
      this.clueList.addItem(clue);
    }
    this.clueLabelI18N.setCode("page.main.title.clue", {
      found,
      total,
    });
  }

  private onFindProp(prop: Script.Prop, isRestore: boolean) {
    if (!isRestore) {
      this.clueDialog.setClue(prop.name, prop.img);
      this.clueDialog.popup();
    }

    if (
      this.propList.cells
        .filter((e) => !!e.dataSource)
        .findIndex((e) => e.dataSource.id === prop.id) === -1
    ) {
      this.propList.addItem(prop);
    }
  }

  hidePropList() {
    this.propView.visible = false;
  }

  private messageViewTimeout;

  showFailureTip = ({ content }: ShowMessageEvent["payload"]) => {
    this.messageTip.text = I18N.f(content);
    if (!this.messageTip.visible) {
      this.messageTip.visible = true;
      const pos = { y: 134 };
      Laya.Tween.to(pos, { y: 158 }, 300).update = new Laya.Handler(
        this,
        () => {
          this.messageTip.y = pos.y;
        }
      );
      this.messageViewTimeout && clearTimeout(this.messageViewTimeout);
      this.messageViewTimeout = setTimeout(() => {
        this.messageTip.visible = false;
        this.messageTip.y = 134;
      }, 3000);
    }
  };

  private pointerLockChange = () => {
    this.pointerLockMode = isPointerLocked();
    if (this.pointerLockMode) {
      this.crosshair.visible = true;
    } else {
      this.crosshair.visible = false;
      this.crosshariActive.visible = false;
    }
  };

  activeCrosshair() {
    if (this.pointerLockMode) {
      this.crosshair.visible = false;
      this.crosshariActive.visible = true;
    }
  }

  inactiveCrosshair() {
    if (this.pointerLockMode) {
      this.crosshair.visible = true;
      this.crosshariActive.visible = false;
    }
  }
}
