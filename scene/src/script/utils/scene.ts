import { FrameworkConfig } from "../../framework";
import { readScript, VersionedScript } from "../../utils/script/index";
import { ScriptReader } from "../../utils/script/reader";
import { loadJson } from "../../utils/utils";

export const SceneInfo: {
  code: string;
  scripts: ScriptReader[];
} = {
  code: "",
  scripts: [],
};

interface SceneManageApiResult<D = any> {
  code: number;
  data: D;
  msg: string;
}

/**
 * 通过URL信息提取当前场景代码(code)，
 * 并更新到SceneInfo中。
 */
export async function initSceneInfo() {
  const u = new URL(location.href);

  // second priority: from path ".../{scene-code}"
  const parts = u.pathname.split("/").filter((p) => !!p);
  if (parts.length > 0) {
    const scene = parts[parts.length - 1];
    SceneInfo.code = scene;
  }
  // first priority: from querystring "?scene="
  const scene = u.searchParams.get("scene") || "";
  if (scene) {
    SceneInfo.code = scene;
  }

  if (!SceneInfo.code) {
    throw new Error("no scene code");
  }

  const scriptUrls = await querySceneScripts(SceneInfo.code);

  const scripts = await Promise.all(
    scriptUrls.map(async (url) => {
      const versionedScript = await loadJson<VersionedScript>(url);
      const script = await readScript(
        new URL(url, location.href).href, // absolute,
        versionedScript
      );
      return script;
    })
  );

  SceneInfo.scripts = scripts;
}

async function querySceneScripts(code: string): Promise<string[]> {
  return (
    await loadJson<SceneManageApiResult<string[]>>(
      FrameworkConfig.sceneManagerUrl + `/scenes/${code}/script-urls`
    )
  ).data;
}
