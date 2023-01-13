import { I18N } from "../../../utils/I18N";

export default class MessageItem extends Laya.Box {
  constructor() {
    super();
    this.width = 1200;
  }

  setData(data: any, y: number) {
    const address = new Laya.Text();
    address.font = "Helvetica";
    address.width = this.width - 12;
    address.color = "#d9d9d9";
    address.fontSize = 24;
    address.text = `${data.address.substring(0, 6)}...${data.address.substring(
      38,
      42
    )}: `;
    address.align = "left";
    address.x = 0;
    address.y = y;
    this.addChild(address);

    const message = new Laya.HTMLDivElement();
    message.innerHTML = `<div style="width: 1200px; height: fit-content; font-size: 20px; color: #bfbfbf; word-break: break-word;">${data.message}</div>`;
    message.x = 0;
    message.y = y + address.getBounds().height + 12;
    this.addChild(message);

    const time = new Laya.Text();
    const date = new Date(data.createTime);
    time.font = "Helvetica";
    time.width = this.width - 12;
    time.color = "#8c8c8c";
    time.fontSize = 18;
    time.text = `${date.toLocaleDateString(
      I18N.getLang()
    )} ${date.toLocaleTimeString(I18N.getLang(), {
      hour12: I18N.getLang() === "zh-CN",
    })}`;
    time.align = "right";
    time.x = 0;
    time.y = y + address.getBounds().height + message.contextHeight + 24;
    this.addChild(time);
  }
}
