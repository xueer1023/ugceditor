import { Script } from "../../utils/script/reader";
import ClueComponent from "../components/ClueComponent";
import { Lock } from "../components/Lock";
import NPC from "../components/NPC";
import { Observer } from "../components/Observer";
import PropComponent from "../components/PropComponent";

export interface ObservingStartEvent {
  type: "observing-start";
  payload: {
    observer: Observer;
  };
}

export interface MovedEvent {
  type: "moved";
  payload: {
    location: Location;
  };
}

export interface NPCTalkingStartEvent {
  type: "npc-talking-start";
  payload: {
    npc: NPC;
  };
}

export interface NPCTalkingEndEvent {
  type: "npc-talking-end";
  payload: {
    npc: NPC;
  };
}

export interface LockUnlockedEvent {
  type: "lock-unlocked";
  payload: {
    lock: Lock;
    isRestore: boolean; // 是否为数据恢复
  };
}

export interface ClueFoundEvent {
  type: "clue-found";
  payload: {
    clue: ClueComponent;
    isRestore: boolean; // 是否为数据恢复
  };
}

export interface PropFoundEvent {
  type: "prop-found";
  payload: {
    prop: PropComponent;
    isRestore: boolean; // 是否为数据恢复
  };
}

export interface SwitchSceneEvent {
  type: "switch-scene";
  payload: Script.PortalTrigger;
}

export interface ShowMessageEvent {
  type: "show-message";
  payload: {
    content: string;
  };
}

export type PlayerEvent =
  | ObservingStartEvent
  | MovedEvent
  | NPCTalkingStartEvent
  | NPCTalkingEndEvent
  | LockUnlockedEvent
  | ClueFoundEvent
  | PropFoundEvent
  | SwitchSceneEvent
  | ShowMessageEvent;
