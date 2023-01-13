import PasswordDialog from "../PasswordDialog";
import { PlayerState } from "./PlayerState";

interface Options {
  lockId: string;
  password: string;
  playerState: PlayerState;
  dialog: PasswordDialog;
  tip: string;
}

export class Lock extends Laya.Script3D {
  private password: string;
  private dialog: PasswordDialog;
  private playState: PlayerState;
  private tip: string;

  private _unlocked = false;
  private _lockId = "";

  get unlocked() {
    return this._unlocked;
  }
  get lockId() {
    return this._lockId;
  }

  static create(opts: Options) {
    const com = new Lock();
    com.dialog = opts.dialog;
    com.playState = opts.playerState;
    com.password = opts.password;
    com._lockId = opts.lockId;
    com.tip = opts.tip;
    return com;
  }

  exec({
    isRestore = false,
  }: {
    isRestore?: boolean;
  } = {}) {
    if (this._unlocked) return;

    if (isRestore) {
      // 数据回复，不需要用户输入也不弹窗，直接解锁
      this._unlocked = true;
      this.playState.events.trigger({
        type: "lock-unlocked",
        payload: {
          lock: this,
          isRestore: true,
        },
      });
    } else {
      this.dialog.setAnswer(this.password, this.tip, () => {
        this._unlocked = true;
        this.playState.events.trigger({
          type: "lock-unlocked",
          payload: {
            lock: this,
            isRestore: false,
          },
        });
      });
      this.dialog.popup();
    }
  }
}
