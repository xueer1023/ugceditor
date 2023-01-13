import { I18NImage } from "../I18NImage";

export default class ClueItem extends Laya.Box {
  private imgCover: Laya.Image = null;
  private i18n: I18NImage = null;
  constructor() {
    super();
    this.size(100, 100);
  }

  public setImg(src: string): void {
    this.imgCover = this.imgCover === null ? new Laya.Image() : this.imgCover;
    this.imgCover.size(100, 100);

    if (src.startsWith("i18n:")) {
      if (!this.i18n) {
        this.i18n = new I18NImage("");
        this.imgCover.addComponentIntance(this.i18n);
      }
      this.i18n.setCode(src.slice(5));
    } else {
      this.imgCover.skin = src;
    }
    if (!this.getChildByName(this.imgCover.name)) {
      this.addChild(this.imgCover);
    }
  }
}
