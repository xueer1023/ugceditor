import { ui } from "../ui/layaMaxUI";
import { Logger } from "../utils/log";
import { UIEventIndicator } from "./components/UIEventIndicator";

/**
 * ConnectScene
 * 用于连接钱包，若open时不传递onFinished参数，则默认打开LanguageScene.
 */

export interface OpenOptions {
  onFinished: (scene: Laya.Scene) => any;
}

export default class ObserverScene extends ui.ObserverSceneUI {
  private logger = new Logger({ name: ObserverScene.name });
  private onFinished: (scene: Laya.Scene) => any;

  constructor() {
    super();
  }

  onOpened(params: OpenOptions) {
    this.logger.debug("onOpened", params);
    if (params && params.onFinished) {
      this.onFinished = params.onFinished;
    }
    this.mouseEnabled = true;
    this.mouseThrough = false;
  }

  onAwake() {
    this.logger.debug("onAwake");

    // setup ui
    this.imgBack.addComponent(UIEventIndicator);
    this.imgBack.on(Laya.Event.CLICK, this, () => {
      this.logger.debug("click BackBtn");

      this.close();
      this.onFinished(this);
    });
  }

  onDestroy() {
    this.logger.debug("onDestroy");
  }
}
