import { ScriptReader } from "./reader";
import { readV1, ScriptV1 } from "./v1";
import { readV2, ScriptV2 } from "./v2";
import { readV3, ScriptV3 } from "./v3";
import { readV4, ScriptV4 } from "./v4";

export type VersionedScript = ScriptV1 | ScriptV2 | ScriptV3 | ScriptV4;

/**
 *
 * @param scriptUrl absoulte url
 * @param script
 * @returns
 */
export async function readScript(
  scriptUrl: string,
  script: VersionedScript
): Promise<ScriptReader> {
  switch (script.version) {
    case "4":
      return await readV4(script as ScriptV4, scriptUrl);
    case "3":
      return await readV3(script, scriptUrl);
    case "2":
      return await readV2(script, scriptUrl);
    default:
      return await readV1(script);
  }
}
