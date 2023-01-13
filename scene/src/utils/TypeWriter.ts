enum TypeWriteState {
  Ready,
  Writing,
  Finished,
}

export default class TypeWriter {
  speed: number;
  text: string;
  writeCallback: (text: string) => void;
  finishCallback: () => void;

  private currentText: string = "";
  private writeIndex: number = 0;
  private textLength: number;
  private intervalTask: any;
  taskState: TypeWriteState = TypeWriteState.Ready;

  constructor(
    text: string,
    options: {
      onWrite: (text: string) => void;
      onFinish: () => void;
      speed?: number;
    }
  ) {
    this.text = text;
    this.textLength = text.length;

    const { onWrite, onFinish, speed } = options;
    this.writeCallback = onWrite;
    this.finishCallback = onFinish;
    this.speed = speed ?? 50;
  }

  start() {
    if (!(this.taskState === TypeWriteState.Ready)) {
      return;
    }
    this.taskState = TypeWriteState.Writing;
    this.intervalTask = setInterval(() => this.print(), this.speed);
  }

  private print() {
    if (!(this.taskState === TypeWriteState.Writing)) {
      return;
    }
    if (this.writeIndex < this.textLength) {
      this.currentText += this.text.charAt(this.writeIndex);
      this.writeIndex += 1;
      this.writeCallback(this.currentText);
    } else {
      this.taskState = TypeWriteState.Finished;
      this.intervalTask && clearInterval(this.intervalTask);
      setTimeout(() => this.finishCallback(), 400);
    }
  }

  printAll() {
    if (
      !(
        this.taskState === TypeWriteState.Writing ||
        this.taskState === TypeWriteState.Ready
      )
    ) {
      return;
    }
    this.intervalTask && clearInterval(this.intervalTask);
    this.taskState = TypeWriteState.Finished;
    this.writeCallback(this.text);
    setTimeout(() => this.finishCallback(), 400);
  }
}
