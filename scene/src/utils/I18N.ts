export enum Lang {
  zhCN = "zh-CN",
  enUS = "en-US",
}

type I18NEvent = keyof I18NEventCallbacks;
type I18NCallback = (i18n: I18NManager) => void;

interface I18NEventCallbacks {
  changed: I18NCallback[];
}

class I18NManager {
  private callbacks: I18NEventCallbacks = {
    changed: [],
  };
  private lang: Lang;

  private map: Record<Lang, Record<string, string>> = {
    "en-US": {},
    "zh-CN": {},
  };

  public update(lang: Lang, translates: Record<string, string>) {
    const l1Keys = Object.keys(this.map[lang]);
    const l2Keys = Object.keys(translates);
    for (const k of l2Keys) {
      if (l1Keys.indexOf(k) > -1) {
        console.warn(`[I18N] duplicated textId '${k}'`);
      }
    }

    Object.assign(this.map[lang], translates);
  }

  constructor(opts: { lang: Lang }) {
    this.lang = opts.lang;
  }

  getLang(): Lang {
    return this.lang;
  }

  setLang(lang: Lang) {
    if (lang != this.lang) {
      this.lang = lang;
      this.trigger("changed");
    }
  }

  on(event: I18NEvent, cb: I18NCallback) {
    // @ts-ignore
    if (!this.callbacks[event].includes(cb)) {
      this.callbacks[event].push(cb);
    }
  }
  off(event: I18NEvent, cb: I18NCallback) {
    const idx = this.callbacks[event].findIndex((c) => c === cb);
    if (idx >= 0) {
      this.callbacks[event].splice(idx, 1);
    }
  }

  /**
   * 获取国际化文本。若当前预言下ID对应的文本不存在，返回ID本身.
   * @param id 文本ID
   */
  f(id: string, args?: object): string {
    // 空id特殊处理，不报日志
    if (id === "") return "";
    try {
      let fmt = this.map[this.lang][id];
      if (fmt === "") {
        return "";
      }
      if (!fmt) {
        console.warn(`[I18N] [${this.lang}] there is not locale for '${id}'`);
        return id;
      }
      if (args) {
        for (const k of Object.keys(args)) {
          const v = args[k];
          fmt = fmt.replace(`{${k}}`, v);
        }
      }
      return fmt;
    } catch (err) {
      console.error(`[I18N] [${this.lang}] failed to format '${id}'`, err);
      return id;
    }
  }

  private async trigger(event: I18NEvent) {
    for (const cb of this.callbacks[event]) {
      await cb(this);
    }
  }
}

export const I18N = new I18NManager({ lang: Lang.enUS });
