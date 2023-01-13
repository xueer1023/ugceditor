import { Logger } from "../../utils/log";
import { getCommunityRank } from "../../utils/api";
import { CommunityOptions } from "../../utils/const";

const ViewPadding = 12;
const ItemGap = 6;
const ItemHeight = 48;
const RankPositionY = [...new Array(9)].map(
  (e, index) => ViewPadding + ItemHeight * index + ItemGap * index
);

export default class RankList extends Laya.Box {
  private logger = new Logger({ name: RankList.name });
  constructor() {
    super();
  }
  onAwake() {
    CommunityOptions.map((e) => {
      const { value, url } = e;
      const logo = this.getLogo(value);
      logo?.on(Laya.Event.CLICK, this, () => {
        window.open(url, "_blank", "noopener,noreferrer");
      });
    });
    this.updateRank();
    setInterval(() => {
      this.updateRank();
    }, 15000);
  }

  onEnable(): void {}

  onDisable(): void {}

  async updateRank() {
    try {
      const res = await getCommunityRank(
        CommunityOptions.map((c) => c.value).join(",")
      );
      const rank = res.data?.data;
      if (rank) {
        rank.map((e, index) => {
          const { community, answers } = e;
          const [view, label] = this.getItemAndValue(community);
          view.y = RankPositionY[index];
          label.text = `${answers}`;
        });
      }
    } catch (e) {
      this.logger.error(e);
    }
  }

  getLogo(communityName: string): Laya.Image {
    const community = this.getChildByName(communityName) as Laya.Box;
    return community?.getChildByName("logo") as Laya.Image;
  }

  getItemAndValue(communityName: string): [Laya.Box, Laya.Label] {
    const community = this.getChildByName(communityName) as Laya.Box;
    return [community, community?.getChildByName("value") as Laya.Label];
  }
}
