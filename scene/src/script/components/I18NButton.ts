import { I18N } from "../../utils/I18N";

/**
 * 为Button增加国际化支持
 *
 * 使用方式
 * ``` ts
 * const button = scene.addChild(new Laya.Button('xxxxx'));
 * button.addComponentInstance(new I18NButton('i18n.code'))
 * ```
 */
export class I18NButton extends Laya.Script {
  private code: string;
  private button: Laya.Button;
  private originText: string;

  constructor(code: string) {
    super();
    this.code = code;
  }

  onAwake() {
    this.button = this.owner as Laya.Button;
    this.originText = this.button.label;
  }

  onEnable() {
    I18N.on("changed", this.onLangChanged);
    this.translate();
  }

  onDisable() {
    I18N.off("changed", this.onLangChanged);
    this.button.label = this.originText;
  }

  private onLangChanged = () => {
    this.translate();
  };

  private translate() {
    this.button.label = I18N.f(this.code);
  }

  public setCode(code: string) {
    this.code = code;
    this.translate();
  }
}
