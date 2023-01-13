import { I18N } from "../../utils/I18N";

/**
 * 为Image增加国际化支持
 *
 * 使用方式
 * ``` ts
 * const image = scene.addChild(new Laya.Image());
 * image.addComponentInstance(new I18NText('i18n.code'))
 * ```
 */
export class I18NImage extends Laya.Script {
  private code: string;
  private originSkin: string;
  private image: Laya.Image;

  constructor(code: string) {
    super();
    this.code = code;
  }

  onAwake() {
    this.image = this.owner as Laya.Image;
    this.originSkin = this.image.skin;
  }

  onEnable() {
    I18N.on("changed", this.onLangChanged);
    this.translate();
  }

  onDisable() {
    I18N.off("changed", this.onLangChanged);
    this.image.skin = this.originSkin;
  }

  private onLangChanged = () => {
    this.translate();
  };

  private translate() {
    if (this.image) {
      this.image.skin = I18N.f(this.code);
    }
  }

  public setCode(code: string) {
    this.code = code;
    this.translate();
  }
}
