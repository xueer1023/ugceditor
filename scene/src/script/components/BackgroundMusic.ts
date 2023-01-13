import { Logger } from "../../utils/log";
import { Script } from "../../utils/script/reader";

export class BackgroundMusic extends Laya.Script {
  private logger = new Logger({ name: BackgroundMusic.name });
  private music: Script.Sound;
  private sounds: Script.Sound[];

  private musicChannel: Laya.SoundChannel = null;
  private soundsChannels: Laya.SoundChannel[] = [];

  constructor(opts: { music?: Script.Sound; sounds?: Script.Sound[] }) {
    super();

    this.music = opts.music;
    this.sounds = opts.sounds;
  }

  onEnable() {
    this.play();
  }

  onDisable() {
    this.stop();
  }

  updateMusic(opts: { music?: Script.Sound; sounds?: Script.Sound[] }) {
    this.music = opts.music;
    this.sounds = opts.sounds;
    this.stop();
    this.play();
  }

  play() {
    if (this.music) {
      const { url } = this.music;
      this.logger.debug(`play bgmusic ${url}`);
      this.musicChannel = Laya.SoundManager.playMusic(url, 0);
    }
    if (this.sounds) {
      for (const _sound of this.sounds) {
        const { url } = _sound;
        this.logger.debug(`play bgsound ${url}`);
        const channel = Laya.SoundManager.playSound(url, 0);
        this.soundsChannels.push(channel);
      }
    }
  }

  stop() {
    if (this.musicChannel && !this.musicChannel.isStopped) {
      this.logger.debug(`stop bgmusic ${this.musicChannel.url}`);
      this.musicChannel.stop();
    }
    for (const channel of this.soundsChannels) {
      if (!channel.isStopped) {
        this.logger.debug(`stop bgsound ${channel.url}`);
        channel.stop();
      }
    }
  }
}
