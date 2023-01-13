import PropItem from "./item/PropItem";
import ClueDialog from "../ClueDialog";

export default class PropList extends Laya.List {
  private clueDialog: ClueDialog;
  private selectedProp: PropItem;

  constructor() {
    super();
  }

  onAwake() {
    this.zOrder = 10;
    this.itemRender = PropItem;
    this.vScrollBarSkin = "";
    this.selectEnable = true;
    this.mouseHandler = new Laya.Handler(this, (e: Event, index: number) => {
      if (e.type == Laya.Event.CLICK) {
        let cell = this.getCell(index) as PropItem;
        if (cell.selected) {
          let { img, name } = cell.dataSource;
          this.clueDialog.setClue(name, img);
          this.clueDialog.popup();
        }
      }
    });
    this.selectHandler = new Laya.Handler(this, (index: number) => {
      this.selectedProp && this.selectedProp.onUnselect();
      let cell = this.getCell(index) as PropItem;
      cell.onSelect();
      this.selectedProp = cell;
    });
    this.renderHandler = new Laya.Handler(this, (cell: PropItem) => {
      cell.setImg(cell.dataSource.img);
    });
  }

  onEnable(): void {}

  onDisable(): void {}

  setClueDialog(clueDialog: ClueDialog) {
    this.clueDialog = clueDialog;
  }
}
