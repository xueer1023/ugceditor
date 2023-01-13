interface CreateLoggerOptions {
  name: string;
  level: string;
  enabled: boolean;
}

function empty() {}

interface LevelConfig {
  func: (...args: any[]) => void;
  base: Object;
  value: number;
}
interface IGlobalLoggerConfig {
  enabled: boolean;
  level: string;
  levels: {
    [name: string]: LevelConfig;
  };
}

export const GlobalLoggerConfig: IGlobalLoggerConfig = {
  enabled: true,
  level: "ALL",
  levels: {
    ALL: {
      func: console.debug,
      base: window.console,
      value: 0,
    },
    DBG: {
      func: console.debug,
      base: window.console,
      value: 5,
    },
    LOG: {
      func: console.log,
      base: window.console,
      value: 10,
    },
    INF: {
      func: console.info,
      base: window.console,
      value: 20,
    },
    WRN: {
      func: console.warn,
      base: window.console,
      value: 30,
    },
    ERR: {
      func: console.error,
      base: window.console,
      value: 40,
    },
  },
};

export class Logger {
  enabled: boolean;
  name: string;
  level: string;

  constructor({
    name = "MAIN",
    level = "ALL",
    enabled = true,
  }: Partial<CreateLoggerOptions> = {}) {
    this.enabled = enabled;
    this.name = name;
    this.level = level;
  }

  private getLevelConfig(level: string): LevelConfig {
    let levelValue = GlobalLoggerConfig.levels[level];
    if (levelValue === undefined) {
      console.error(`unknown level '${level}',reset to 'log' level value`);
      levelValue = GlobalLoggerConfig.levels["LOG"];
    }
    return levelValue;
  }

  private buildFunc(targetLevel: string): (...args: any[]) => void {
    if (GlobalLoggerConfig.enabled && this.enabled) {
      let {
        value: targetLevelValue,
        base,
        func,
      } = this.getLevelConfig(targetLevel);
      let enableLevelValue = this.getLevelConfig(this.level).value;
      let globalLevelValue = this.getLevelConfig(
        GlobalLoggerConfig.level
      ).value;
      if (
        targetLevelValue >= enableLevelValue &&
        targetLevelValue >= globalLevelValue
      ) {
        return func.bind(base, this.formatPrefix(targetLevel));
      }
    }
    return empty;
  }

  private formatPrefix(level: string): string {
    const d = new Date();
    function padStart(s, len, char) {
      while (s.length < len) {
        s = char + s;
      }
      return s;
    }
    const hour = padStart(`${d.getHours() + 1}`, 2, "0");
    const min = padStart(`${d.getMinutes() + 1}`, 2, "0");
    const sec = padStart(`${d.getSeconds() + 1}`, 2, "0");
    const mil = padStart(`${d.getMilliseconds() + 1}`, 3, "0");

    return `${hour}:${min}:${sec}.${mil} ${level} [${this.name}]`;
  }

  get debug(): (...args: any) => void {
    return this.buildFunc("DBG");
  }
  get log(): (...args: any) => void {
    return this.buildFunc("LOG");
  }
  get info(): (...args: any) => void {
    return this.buildFunc("INF");
  }
  get warn(): (...args: any) => void {
    return this.buildFunc("WRN");
  }
  get error(): (...args: any) => void {
    return this.buildFunc("ERR");
  }
}
