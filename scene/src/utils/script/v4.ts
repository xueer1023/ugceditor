import { ScriptReader } from "./reader";
import { readV3, ScriptV3 } from "./v3";

export async function readV4(
  script: ScriptV4,
  scriptUrl: string
): Promise<ScriptReader> {
  return {
    ...(await readV3(script, scriptUrl)),
  };
}

/**
 * 【新增】 character
 * 【修改】 mainCamera 挂载在 character 节点下
 */
export interface ScriptV4 extends ScriptV3 {
  character: {
    nodes: string[];
    collider: {
      // 角色碰撞器参数
      radius: number;
      height: number;
    };
    moveSpeed: number; // 角色移动速度
    stepHeight?: number; // 角色可跨越的最大高度
    maxSlope?: number; // 最大坡度
  };
}
