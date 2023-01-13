import { ui } from "../ui/layaMaxUI";
import { Logger } from "../utils/log";
import { I18NText } from "./components/I18NText";
import { loadImage, preloadAtlas, preloadSceneJson } from "../utils/utils";
import { PlayerState } from "./components/PlayerState";
import { I18N } from "../utils/I18N";
import { Script } from "../utils/script/reader";

/**
 * 【页面】Loading页面，加载资源和场景
 * 第一次Open显示公开信，之后Open均不显示
 *
 * 使用方式
 * ``` ts
 * Laya.Scene.load(
 *       "LoadingScene.scene",
 *       Laya.Handler.create(this, (scene: Laya.Scene) => {
 *         scene.open(false, {
 *           assets,
 *           sceneUrl,
 *           onLoaded: (scene) => {},
 *         });
 *       })
 * );
 * ```
 */
export default class LoadingScene extends ui.LoadingSceneUI {
  private logger = new Logger({ name: LoadingScene.name });

  // 初次加载，显示公开信；之后的加载不显示
  private isFirstLoad: boolean = true;

  private assetsMode: Script.AssetsMode;
  private zipDownloaded: boolean = false;
  private assetProgress: number = 0;
  private sceneProgress: number = 0;
  private progressTween: Laya.Tween;
  private progressMinWidth: number = 7;
  private progressMaxWidth: number = 536;
  private progressWidthUnit: number;

  private onLoaded: (scene: Laya.Scene3D[]) => void;
  private sceneLoaded: Laya.Scene3D[];

  constructor() {
    super();
  }

  onAwake() {
    // 去掉loadJson后，为了尽量保持时序一致，使用setTimeout作为异步。
    setTimeout(async () => {
      const res = PlayerState.DefaultSceneScript.openLetter;

      const conf = res[I18N.getLang()];
      this.title.text = conf.title;
      if (conf.fontSize) {
        this.content.fontSize = conf.fontSize;
        this.consignor.fontSize = conf.fontSize;
      }
      if (conf.leading) {
        this.content.leading = conf.leading;
      }
      this.content.text = conf.content;
      this.content.width = conf.width;
      const contentBound = this.content.getBounds();
      this.consignor.width = conf.width;

      if (typeof conf.consignor === "string") {
        this.consignor.text = conf.consignor;
      } else {
        const { text, bold = true, align = "center" } = conf.consignor;
        this.consignor.text = text;
        this.consignor.bold = bold;
        this.consignor.align = align;
      }
      this.consignor.y = contentBound.bottom + 24;

      const consignorBound = this.consignor.getBounds();
      if (conf.consignorImg) {
        const { url, width = 0, height = 0 } = conf.consignorImg;
        await loadImage(url);
        this.consignorImg.skin = url;
        this.consignorImg.width = width;
        this.consignorImg.height = height;
        this.consignorImg.x = (1920 - width) / 2;
        this.consignorImg.y = consignorBound.bottom + 24;
      } else {
        this.consignorImg.destroy();
      }
    }, 0);

    this.enterLabel.addComponentIntance(new I18NText("page.main.label.enter"));
    this.enterBtn.on(Laya.Event.CLICK, this, () => {
      this.isFirstLoad = false;

      if (!this.onLoaded || !this.sceneLoaded) return;

      this.enterBtn.visible = false;
      const onLoaded = this.onLoaded;
      this.onLoaded = null;
      onLoaded(this.sceneLoaded);
      this.sceneLoaded = null;
    });

    // preload MainScene assets
    preloadSceneJson("UIScene.json");
    preloadSceneJson("StorySettingDialog.json");
    preloadAtlas("res/atlas/background.atlas");
    loadImage("res/atlas/background.png");
  }

  onOpened(params: {
    inBackground: boolean;
    assets: string[];
    assetsMode: Script.AssetsMode;
    zipUrl: string | string[];
    sceneUrl: string | string[];
    onLoaded?: (scene: Laya.Scene3D[]) => void;
  }) {
    super.onOpened(params);
    const { inBackground, assets, sceneUrl, assetsMode, zipUrl, onLoaded } =
      params;
    this.assetsMode = assetsMode;

    if (!this.isFirstLoad) {
      this.title.visible = false;
      this.content.visible = false;
      this.consignor.visible = false;
      this.consignorImg.visible = false;
      this.enterBtn.visible = false;
      this.loadingView.scaleX = 1.8;
      this.loadingView.scaleY = 1.8;
      this.loadingView.x = 471;
      this.loadingView.y = 424;
    }

    this._resetProgress();
    this.visible = !inBackground;
    this.onLoaded = onLoaded;

    const onFinish = (scenes: Laya.Scene3D[]) => {
      if (this.isFirstLoad) {
        this.sceneLoaded = scenes;
        this.loadingView.visible = false;
        this.enterBtn.visible = true;
      } else {
        onLoaded?.(scenes);
      }
    };

    if (assetsMode === Script.AssetsMode.Zip) {
      this._loadZips(Array.isArray(zipUrl) ? zipUrl : [zipUrl]).then(() => {
        this._loadScenes(Array.isArray(sceneUrl) ? sceneUrl : [sceneUrl]).then(
          (scenes) => onFinish(scenes)
        );
      });
    } else {
      Promise.all([
        this._loadAssets(assets),
        this._loadScenes(Array.isArray(sceneUrl) ? sceneUrl : [sceneUrl]),
      ]).then(([_, scene]) => onFinish(scene));
    }
  }

  onEnable(): void {}

  onDisable(): void {}

  _resetProgress() {
    this.progressWidthUnit =
      (this.progressMaxWidth - this.progressMinWidth) /
      (this.assetsMode === Script.AssetsMode.Zip ? 100 : 200);
    this.assetProgress = 0;
    this.sceneProgress = 0;
    this.zipDownloaded = false;
    this._updateProgress(false);
    this.loadingView.visible = true;
  }

  _updateProgress(animate = true) {
    this.progressTween && this.progressTween.clear();
    const progress =
      ((this.assetsMode === Script.AssetsMode.Zip ? 0 : this.sceneProgress) +
        this.assetProgress) *
      100;
    const newWidth = this.progressMinWidth + progress * this.progressWidthUnit;
    const p = { width: this.progressRect.width };
    this.progressTween = Laya.Tween.to(
      p,
      { width: newWidth },
      animate ? 500 : 0
    );
    this.progressTween.update = new Laya.Handler(this, () => {
      this.progressRect.width = p.width;
    });
  }

  _loadZips(zipUrls: string[]) {
    return new Promise((resolve) => {
      const loaded = () => {
        this.logger.debug("zip loaded");
        this.assetProgress = 1;
        this._updateProgress();
        setTimeout(() => {
          resolve(true);
        }, 500);
      };
      Laya.loader.create(
        zipUrls.map((z) => ({
          url: z,
          type: LayaZip.ZIP,
          propertyParams: ["Conventional/", "audio/", "img/"],
        })),
        Laya.Handler.create(this, () => {
          loaded();
        }),
        Laya.Handler.create(this, (progress) => {
          let _progress = progress / 2;
          if (this.zipDownloaded) {
            _progress += 0.5;
          } else if (progress === 1) {
            this.zipDownloaded = true;
          }
          this.assetProgress = _progress;
          this._updateProgress();
        })
      );
    });
  }

  _loadAssets(assets: string[]) {
    return new Promise((resolve) => {
      const loaded = () => {
        this.logger.debug("assets loaded");
        this.assetProgress = 1;
        this._updateProgress();
        setTimeout(() => {
          resolve(true);
        }, 500);
      };
      if (assets.length > 0) {
        Laya.loader.load(
          assets,
          Laya.Handler.create(this, () => {
            loaded();
          }),
          Laya.Handler.create(this, (progress) => {
            this.assetProgress = progress > 0.05 ? progress - 0.05 : progress;
            this._updateProgress();
          })
        );
      } else {
        loaded();
      }
    });
  }

  _loadScenes(sceneUrls: string[]) {
    if (this.assetsMode === Script.AssetsMode.Default) {
      const sceneCount = sceneUrls.length;
      const sceneProgress = new Array(sceneCount).fill(0);

      return Promise.all(
        sceneUrls.map(
          (sceneUrl, index) =>
            new Promise<Laya.Scene3D>((resolve) =>
              Laya.Scene3D.loadWithProgress(
                sceneUrl,
                Laya.Handler.create(this, (scene) => {
                  this.logger.debug("scene loaded");
                  sceneProgress[index] = 1;
                  this.sceneProgress =
                    sceneProgress.reduce((a, b) => a + b) / sceneCount;
                  this._updateProgress();
                  setTimeout(() => {
                    resolve(scene);
                  }, 250);
                }),
                Laya.Handler.create(this, (progress) => {
                  sceneProgress[index] =
                    progress > 0.05 ? progress - 0.05 : progress;
                  this.sceneProgress =
                    sceneProgress.reduce((a, b) => a + b) / sceneCount;
                  this._updateProgress();
                })
              )
            )
        )
      );
    } else if (this.assetsMode === Script.AssetsMode.Zip) {
      return Promise.all(
        sceneUrls.map(
          (sceneUrl) =>
            new Promise<Laya.Scene3D>((resolve) =>
              Laya.Scene3D.load(
                sceneUrl,
                Laya.Handler.create(this, (scene) => {
                  this.logger.debug("scene loaded");
                  resolve(scene);
                })
              )
            )
        )
      );
    }
  }
}
