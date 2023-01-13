import { Wallet } from "./Wallet";
import { PlayerState } from "../script/components/PlayerState";
import { VersionedScript } from "./script/index";

export async function loadJson<T = VersionedScript>(url: string) {
  return new Promise<T>((resolve) => {
    Laya.loader.load(
      url,
      Laya.Handler.create(this, (data: T) => {
        resolve(data);
      }),
      null,
      Laya.Loader.JSON
    );
  });
}

// export function getJson<T>(url: string) {
//   return Laya.loader.getRes(url);
// }

// export async function loadJsons<T>(urls: string[]) {
//   return Promise.all(urls.map((e) => loadJson<T>(e)));
// }

export async function loadScene<T = Laya.Scene>(url: string) {
  return new Promise<any>((resolve) => {
    Laya.Scene.load(
      url,
      Laya.Handler.create(this, (scene: T) => {
        resolve(scene);
      })
    );
  });
}

export async function loadDialog<T = Laya.Dialog>(url: string) {
  return new Promise<any>((resolve) => {
    Laya.Dialog.load(
      url,
      Laya.Handler.create(this, (scene: T) => {
        resolve(scene);
      })
    );
  });
}

export async function loadImage(url: string) {
  return new Promise<void>((resolve) => {
    Laya.loader.load(
      url,
      Laya.Handler.create(this, () => {
        resolve();
      })
    );
  });
}
export async function preloadSceneJson(url: string) {
  const loader = new Laya.SceneLoader();
  loader.load(url);
}
export async function preloadAtlas(url: string) {
  const loader = new Laya.Loader();
  loader.load(url, Laya.Loader.ATLAS);
}
export function travelNodes(
  node: Laya.Node,
  cb: (node: Laya.Node, depth: number) => any,
  options: {
    // 当前层深度
    depth?: number;
    includeRoot: boolean;
  }
) {
  if (options.includeRoot) {
    cb(node, options.depth || 0);
  }
  for (let idx = 0; idx < node.numChildren; idx++) {
    travelNodes(node.getChildAt(idx), cb, {
      depth: (options.depth || 0) + 1,
      includeRoot: true,
    });
  }
}

export function recursiveFindNode(
  node: Laya.Node,
  cmp: (node: Laya.Node) => boolean
): Laya.Node | null {
  if (cmp(node)) {
    return node;
  }
  for (let idx = 0; idx < node.numChildren; idx++) {
    const res = recursiveFindNode(node.getChildAt(idx), cmp);
    if (res) {
      return res;
    }
  }
  return null;
}

export async function signPostData<T>(
  wallet: Wallet,
  rawdata: T,
  onError?: (e) => void
): Promise<
  [
    {
      address: string;
      timestamp: number;
      rawdata: T & { account: string; scene: string; url: string; wallet: string; };
    },
    string
  ]
> {
  const data = {
    address: wallet.account,
    timestamp: Math.ceil(new Date().valueOf() / 1000),
    rawdata: {
      ...rawdata,
      account: wallet.account,
      wallet: wallet.source,
      scene: PlayerState.DefaultSceneScript.name,
      url: window.location.href,
    },
  };

  try {
    return [
      data,
      await wallet.signData(JSON.stringify(data), wallet.account),
    ];
  }catch(err) {
    console.log(err);
    onError(err);
  }
 
}

export function registerPointerLock(callback: (e: Event) => void) {
  if ("onpointerlockchange" in document) {
    // @ts-ignore
    document.addEventListener("pointerlockchange", callback, false);
  } else if ("onmozpointerlockchange" in document) {
    // @ts-ignore
    document.addEventListener("mozpointerlockchange", callback, false);
  }
}

export function unregisterPointerLock(callback: (e: Event) => void) {
  if ("onpointerlockchange" in document) {
    // @ts-ignore
    document.removeEventListener("pointerlockchange", callback, false);
  } else if ("onmozpointerlockchange" in document) {
    // @ts-ignore
    document.removeEventListener("mozpointerlockchange", callback, false);
  }
}

export function isPointerLocked() {
  const canvas = document.getElementsByTagName("canvas")[0];
  if (!canvas) return false;
  return (
    document.pointerLockElement === canvas ||
    // @ts-ignore
    document.mozPointerLockElement === canvas
  );
}

// export function togglePointerLock() {
//   const locked = isPointerLocked();
//   const canvas = document.getElementsByTagName("canvas")[0];
//   if (!locked) {
//     canvas?.requestPointerLock();
//   }
// }

export function registerMouseMovement(callback: (e: Event) => void) {
  document.addEventListener("mousemove", callback, false);
}

export function unregisterMouseMovement(callback: (e: Event) => void) {
  document.removeEventListener("mousemove", callback, false);
}

export function distance(obj1: Laya.Sprite3D, obj2: Laya.Sprite3D) {
  const pos1 = obj1.transform.position;
  const pos2 = obj2.transform.position;
  return Math.sqrt(
    Math.pow(pos1.x - pos2.x, 2) +
      Math.pow(pos1.y - pos2.y, 2) +
      Math.pow(pos1.z - pos2.z, 2)
  );
}

export function throttle (callback, limit) {
  let waiting = false;                      // Initially, we're not waiting
  return function () {                      // We return a throttled function
    if (!waiting) {                       // If we're not waiting
      callback.apply(this, arguments);  // Execute users function
      waiting = true;                   // Prevent future invocations
      setTimeout(function () {          // After a period of time
        waiting = false;              // And allow future invocations
      }, limit);
    }
  }
}