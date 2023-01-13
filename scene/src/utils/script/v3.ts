import { readV2, ScriptV2 } from "./v2";
import { Script, ScriptReader } from "./reader";

/**
 * V3 结构与 V2 相同
 */
export async function readV3(
  script: ScriptV3,
  scriptUrl: string
): Promise<ScriptReader> {
  function _u(u: string) {
    if (!u) return u;
    const charIdx = scriptUrl.lastIndexOf("/");
    const res = scriptUrl.slice(0, charIdx + 1) + u;
    return res;
  }

  return {
    ...(await readV2(script, scriptUrl)),
    assetsMode: Script.AssetsMode.Zip,
    zipUrl: _u(`${script.id}.zip`),
  };
}

/**
 * V3 结构与 V2 相同
 */
export interface ScriptV3 extends ScriptV2 {}
