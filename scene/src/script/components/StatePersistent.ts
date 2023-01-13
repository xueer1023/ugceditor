import { Logger } from "../../utils/log";
import {
  ClueFoundEvent,
  LockUnlockedEvent,
  PropFoundEvent,
} from "../events/define";
import { SceneInfo } from "../utils/scene";
import { PlayerState } from "./PlayerState";

interface StorageData {
  gotClues: string[];
  gotProps: string[];
  unlockedLocks: string[];
}

export class StatePersistent extends Laya.Script {
  private logger = new Logger({ name: StatePersistent.name });
  private data: StorageData = {
    gotClues: [],
    gotProps: [],
    unlockedLocks: [],
  };
  private storageKey: string;

  constructor() {
    super();
    this.storageKey = location.href +"_" + SceneInfo.code;
    this.loadFromPersistent();
  }

  onEnable() {
    this.logger.debug("enable StatePersistent");
    const playerState = this.getPlayerState();
    if (playerState) {
      playerState.events.on("clue-found", this.onFoundClue);
      playerState.events.on("prop-found", this.onFoundProp);
      playerState.events.on("lock-unlocked", this.onLockUnlocked);
    }
  }

  onDisable() {
    this.logger.debug("disable StatePersistent");
    const playerState = this.getPlayerState();
    if (playerState) {
      playerState.events.off("clue-found", this.onFoundClue);
      playerState.events.off("prop-found", this.onFoundProp);
      playerState.events.off("lock-unlocked", this.onLockUnlocked);
    }
  }

  /**
   * 需等各组件awake后执行，因为此方法中会对各组件进行功能调用。
   */
  syncToPlayerState() {
    this.logger.debug(`sync to PlayerState`);
    const playerState = this.getPlayerState();
    if (playerState) {
      for (const clueId of this.data.gotClues) {
        const clueCom = playerState.getClue(clueId);
        if (!clueCom) {
          this.logger.warn(`can not found clue[${clueCom.id}]`);
          continue;
        }
        if (!clueCom.got) {
          clueCom.onClick({ isRestore: true });
          this.logger.debug(`clue[${clueId}] synced`);
        }
      }
      for (const propId of this.data.gotProps) {
        const propCom = playerState.getProp(propId);
        if (!propCom) {
          this.logger.warn(`can not found prop[${propCom.id}]`);
          continue;
        }
        if (!propCom.got) {
          propCom.onClick({ isRestore: true });
          this.logger.debug(`prop[${propId}] synced`);
        }
      }
      for (const lockId of this.data.unlockedLocks) {
        const lockCom = playerState.getLock(lockId);
        if (!lockCom) {
          this.logger.warn(`can not found lock[${lockCom.id}]`);
          continue;
        }
        if (!lockCom.unlocked) {
          lockCom.exec({ isRestore: true });
          this.logger.debug(`lock[${lockId}] synced`);
        }
      }
    }
  }

  private onFoundClue = ({ clue }: ClueFoundEvent["payload"]) => {
    if (this.data.gotClues.indexOf(clue.dataSource.id) === -1) {
      this.data.gotClues.push(clue.dataSource.id);
      this.saveToPersistent();
    }
  };
  private onFoundProp = ({ prop }: PropFoundEvent["payload"]) => {
    if (this.data.gotProps.indexOf(prop.dataSource.id) === -1) {
      this.data.gotProps.push(prop.dataSource.id);
      this.saveToPersistent();
    }
  };
  private onLockUnlocked = ({ lock }: LockUnlockedEvent["payload"]) => {
    if (this.data.unlockedLocks.indexOf(lock.lockId) === -1) {
      this.data.unlockedLocks.push(lock.lockId);
      this.saveToPersistent();
    }
  };

  private getPlayerState(): PlayerState {
    const com = this.owner.getComponent(PlayerState);
    if (!com) {
      this.logger.error(
        `can not found PlayerState on node['${this.owner.name}']`
      );
    }
    return com;
  }

  private saveToPersistent() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    this.logger.debug(
      `saved to persistent: ${this.data.gotClues.length} gotClues, ${this.data.gotProps.length} gotProps, ${this.data.unlockedLocks.length} unlockedLocks.`
    );
  }

  private loadFromPersistent() {
    try {
      const data = JSON.parse(localStorage.getItem(this.storageKey));
      this.data.gotClues = data.gotClues || [];
      this.data.gotProps = data.gotProps || [];
      this.data.unlockedLocks = data.unlockedLocks || [];
    } catch {
      this.data = {
        gotClues: [],
        gotProps: [],
        unlockedLocks: [],
      };
    }
    this.logger.debug(
      `loaded from persistent: ${this.data.gotClues.length} gotClues, ${this.data.gotProps.length} gotProps, ${this.data.unlockedLocks.length} unlockedLocks.`
    );
  }
}
