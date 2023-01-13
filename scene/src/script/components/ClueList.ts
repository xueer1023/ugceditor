import ClueItem from "./item/ClueItem";
import ClueDialog from "../ClueDialog";

export default class ClueList extends Laya.List {
  private clueDialog: ClueDialog;

  constructor() {
    super();
  }

  onAwake() {
    this.zOrder = 10;
    this.itemRender = ClueItem;
    this.vScrollBarSkin = "";
    this.selectEnable = true;
    this.mouseHandler = new Laya.Handler(this, (e: Event, index: number) => {
      if (e.type == Laya.Event.CLICK) {
        const c = this.getItem(index);
        if (c) {
          let { img, name } = c;
          this.clueDialog.setClue(name, img);
          this.clueDialog.popup();
        }
      }
    });
    this.renderHandler = new Laya.Handler(this, (cell: ClueItem) => {
      cell.setImg(cell.dataSource.img);
    });
  }

  onEnable(): void {}

  onDisable(): void {}

  setClueDialog(clueDialog: ClueDialog) {
    this.clueDialog = clueDialog;
  }
}
