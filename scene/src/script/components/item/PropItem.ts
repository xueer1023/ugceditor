import { I18NImage } from "../I18NImage";

export const PropSelectedBg = "background/prop-selected-bg.png";

export default class PropItem extends Laya.Box {
  private img: Laya.Image;
  private selectedBg: Laya.Image;
  public selected: boolean = false;

  constructor() {
    super();
    this.size(100, 100);
    this.selectedBg = new Laya.Image();
    this.selectedBg.size(100, 100);
    this.selectedBg.skin = PropSelectedBg;
    this.selectedBg.visible = false;
    this.selectedBg.zOrder = 10;
    this.addChild(this.selectedBg);
  }

  public onSelect() {
    this.selectedBg.visible = true;
    setTimeout(() => {
      this.selected = true;
    }, 200);
  }

  public onUnselect() {
    this.selected = false;
    this.selectedBg.visible = false;
  }

  public setImg(src: string): void {
    this.img = new Laya.Image();
    this.img.size(100, 100);
    this.img.centerX = 0;
    this.img.centerY = 0;

    if (src.startsWith("i18n:")) {
      this.img.addComponentIntance(new I18NImage(src.slice(5)));
    } else {
      this.img.skin = src;
    }
    this.addChild(this.img);
  }
}
