/**
 * 基于鼠标按下、鼠标弹起事件，推断是否未一次点击操作
 * 判断依据:
 * 1. 按下点与弹起点x、y坐标差距均小于`shakeDistance`
 * 2. 按下与弹起的时间差小于`timeGap`
 **/
export class MouseBehaviorHelper {
  private lastDownX: number = 0;
  private lastDownY: number = 0;
  private lastDownAt: number = 0;

  private shakeDistance: number = 2;
  private timeGap: number = 250;

  // 记录鼠标按下
  logDown() {
    this.lastDownX = Laya.stage.mouseX;
    this.lastDownY = Laya.stage.mouseY;
    this.lastDownAt = new Date().valueOf();
  }

  // 确保mouseDown与mouse
  upAsClick(): boolean {
    return (
      Math.abs(Laya.stage.mouseX - this.lastDownX) < this.shakeDistance &&
      Math.abs(Laya.stage.mouseY - this.lastDownY) < this.shakeDistance &&
      new Date().valueOf() - this.lastDownAt < this.timeGap
    );
  }
}
