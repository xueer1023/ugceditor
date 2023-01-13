import { I18N } from "../../utils/I18N";

/**
 * 为Label增加国际化支持
 *
 * 使用方式
 * ``` ts
 * const label = scene.addChild(new Laya.Label('xxxxx'));
 * label.addComponentInstance(new I18NText('i18n.code'))
 * ```
 */
export class I18NText extends Laya.Script {
  private code: string;
  private params: object;
  private label: Laya.Label;
  private originText: string;

  constructor(code: string, params?: object) {
    super();
    this.code = code;
    this.params = params;
  }

  onAwake() {
    this.label = this.owner as Laya.Label;
    this.originText = this.label.text;
  }

  onEnable() {
    I18N.on("changed", this.onLangChanged);
    this.translate();
  }

  onDisable() {
    I18N.off("changed", this.onLangChanged);
    this.label.text = this.originText;
  }

  private onLangChanged = () => {
    this.translate();
  };

  private translate() {
    if (this.label) {
      this.label.text = I18N.f(this.code, this.params);
    }
  }

  public setCode(code: string, params?: object) {
    this.code = code;
    this.params = params;
    this.translate();
  }
}
