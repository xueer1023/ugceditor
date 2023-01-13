import { ui } from "../ui/layaMaxUI";
import { I18N, Lang } from "../utils/I18N";
import { Logger } from "../utils/log";
import zhCNSys from "../locales/zh-CN.sys";
import enUSSys from "../locales/en-US.sys";
import { loadImage, preloadAtlas, preloadSceneJson } from "../utils/utils";

/**
 * LanguageScene
 * 用于设置语言
 */

export interface OpenOptions {
  onFinished: (scene: Laya.Scene) => any;
}

export default class LanguageScene extends ui.LanguageSceneUI {
  private logger = new Logger({ name: LanguageScene.name });
  private onFinished: (scene: Laya.Scene) => any;

  onAwake() {
    
    this.logger.debug("onAwake");
    // update sys locale
    I18N.update(Lang.zhCN, zhCNSys);
    I18N.update(Lang.enUS, enUSSys);

    // setup ui
    function setupView(v: Laya.View) {
      v.on(Laya.Event.MOUSE_OVER, this, () => {
        Laya.Mouse.cursor = "pointer";
      });

      v.on(Laya.Event.MOUSE_OUT, this, () => {
        Laya.Mouse.cursor = "default";
      });
    }
    setupView(this.viewEn);
    setupView(this.viewZh);
    this.viewEn.on(Laya.Event.CLICK, this, () => {
      I18N.setLang(Lang.enUS);
      this.onFinished && this.onFinished(this);
    });

    this.viewZh.on(Laya.Event.CLICK, this, () => {
      I18N.setLang(Lang.zhCN);
      this.onFinished && this.onFinished(this);
    });

    loadImage("res/atlas/loading.png");
    preloadSceneJson("MainScene.json");
    preloadSceneJson("LoadingScene.json");
    preloadAtlas("res/atlas/button.atlas");
    preloadAtlas("res/atlas/loading.atlas");
    
  }

  onDestroy() {
    this.logger.debug("onDestroy");
  }

  onOpened(params: OpenOptions) {
    this.logger.debug("onOpened");
    if (params) {
      this.onFinished = params.onFinished;
    } else {
      this.logger.log(`onFinished set to default: load MainScene`);
      this.onFinished = () => {
        Laya.Scene.load(
          "MainScene.scene",
          Laya.Handler.create(this, (scene: Laya.Scene) => {
            scene.open(true);
          })
        );
      };
    }
  }
}
