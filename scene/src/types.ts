
// declare namespace Service {
//   export interface Role {
//     id: number;
//     name: string;
//     desc: string;
//     avatar: string;
//   }
//   export interface Clue {
//     id: number;
//     desc: string;
//     name: string;
//     img: string;
//     model_id: string;
//     model_available_state: string;
//   }
//   export interface StateMutationRule {
//     target: string;
//     from_state: string;
//     to_state: string;
//     conditions: StateMutationCondition[];
//   }
//   export interface StateMutationCondition {
//     target: string;
//     states: string[];
//   }

//   export interface Scene {
//     id: number;
//     name: string;
//     clues_per_role: number;
//     clues: Clue[];
//     state_mutation_rules: StateMutationRule[];
//     initial_state: {
//       [model_id: string]: string;
//     };
//     url: string;
//   }
//   export interface Story {
//     id: number;
//     name: string;
//     roles: Role[];
//     scenes: Scene[];
//   }
//   export interface Runtime {
//     role_bindings: { user_id: string; role_id: number }[];
//     scene_role_opened: {
//       [scene_id: number]: number[];
//     };
//     found_clues: {
//       [role_id: number]: { clue_id: number; is_shared: boolean }[];
//     };
//     role_binding_locked: boolean;
//     model_states: {
//       [scene_id: number]: {
//         [model_id: string]: string;
//       };
//     };
//   }
//   export interface User {
//     user_id: string;
//     nickname: string;
//   }
//   export interface Room {
//     story: Story;
//     runtime: Runtime;
//   }
// }

export interface ResultWrapper<T> {
  code: number;
  msg: string;
  data: T;
}

export interface PageWrapper<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface SignatureData<T> {
  address: string;
  rawdata: T;
  timestamp: number;
}

export interface AnswerFormData {
  answer: string;
  reason: string;
  discordTag: string;
  community: string;
  url: string;
  scene?: string;
}

export interface Message {
  address: string;
  message: string;
  createTime: number;
}

export interface ScriptCreation {
  name: string;
  summary: string;
  discordTag: string;
  case: string;
  clueProps: string;
  npcDialogue: string;
  more: string;
  ipfsCid?: string;
}

export interface SignatureBasicData {
  url: string;
  scene: string;
  account: string;
}


export interface PuzzleFormData {
  lang: string;
  answer: string;
  reason: string;
  discordTag: string;
  community: string;
}
