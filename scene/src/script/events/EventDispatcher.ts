import { Logger } from "../../utils/log";
import {
  ClueFoundEvent,
  LockUnlockedEvent,
  MovedEvent,
  NPCTalkingEndEvent,
  NPCTalkingStartEvent,
  ObservingStartEvent,
  PlayerEvent,
  PropFoundEvent,
  SwitchSceneEvent,
  ShowMessageEvent,
} from "./define";

export type CB<P> = (payload: P) => any;

export class EventDispatcher {
  private logger = new Logger({ name: EventDispatcher.name });
  private cbs: Record<PlayerEvent["type"], CB<any>[]> = {
    moved: [],
    "npc-talking-end": [],
    "npc-talking-start": [],
    "observing-start": [],
    "lock-unlocked": [],
    "clue-found": [],
    "prop-found": [],
    "switch-scene": [],
    "show-message": [],
  };

  // 监听
  on(
    type: ObservingStartEvent["type"],
    cb: CB<ObservingStartEvent["payload"]>
  ): void;
  on(type: MovedEvent["type"], cb: CB<MovedEvent["payload"]>): void;
  on(
    type: NPCTalkingStartEvent["type"],
    cb: CB<NPCTalkingStartEvent["payload"]>
  ): void;
  on(
    type: NPCTalkingEndEvent["type"],
    cb: CB<NPCTalkingEndEvent["payload"]>
  ): void;
  on(
    type: LockUnlockedEvent["type"],
    cb: CB<LockUnlockedEvent["payload"]>
  ): void;
  on(type: ClueFoundEvent["type"], cb: CB<ClueFoundEvent["payload"]>): void;
  on(type: PropFoundEvent["type"], cb: CB<PropFoundEvent["payload"]>): void;
  on(type: SwitchSceneEvent["type"], cb: CB<SwitchSceneEvent["payload"]>): void;
  on(type: ShowMessageEvent["type"], cb: CB<ShowMessageEvent["payload"]>): void;
  on(type: PlayerEvent["type"], cb: CB<any>): void {
    if (this.cbs[type] === undefined) {
      this.cbs[type] = [];
    }
    if (this.cbs[type].indexOf(cb) === -1) {
      this.cbs[type].push(cb);
    }
  }

  // 取消监听
  off(
    type: ObservingStartEvent["type"],
    cb: CB<ObservingStartEvent["payload"]>
  ): void;
  off(type: MovedEvent["type"], cb: CB<MovedEvent["payload"]>): void;
  off(
    type: NPCTalkingStartEvent["type"],
    cb: CB<NPCTalkingStartEvent["payload"]>
  ): void;
  off(
    type: NPCTalkingEndEvent["type"],
    cb: CB<NPCTalkingEndEvent["payload"]>
  ): void;
  off(
    type: LockUnlockedEvent["type"],
    cb: CB<LockUnlockedEvent["payload"]>
  ): void;
  off(type: ClueFoundEvent["type"], cb: CB<ClueFoundEvent["payload"]>): void;
  off(type: PropFoundEvent["type"], cb: CB<PropFoundEvent["payload"]>): void;
  off(
    type: SwitchSceneEvent["type"],
    cb: CB<SwitchSceneEvent["payload"]>
  ): void;
  off(
    type: ShowMessageEvent["type"],
    cb: CB<ShowMessageEvent["payload"]>
  ): void;
  off(type: PlayerEvent["type"], cb: CB<any>): void {
    if (this.cbs[type] === undefined) {
      return;
    }
    const idx = this.cbs[type].indexOf(cb);
    if (idx >= 0) {
      this.cbs[type].splice(idx, 1);
    }
  }

  // 触发事件
  trigger(event: PlayerEvent) {
    this.logger.debug(`trigger ${event.type}`, event.payload);
    const cbs = this.cbs[event.type];
    if (cbs) {
      for (const cb of cbs) {
        cb(event.payload);
      }
    }
  }
}
