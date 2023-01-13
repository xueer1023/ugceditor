import {
  
  getMessages,
  
  submitMessage,
  submitQuery,
  submitScript,
} from "./api";
import { I18N } from "./I18N";
import { ScriptCreation } from "../types";

export enum ReactDomEventType {
  SetSpinning = "SetSpinning",
  SetMessageModalVisible = "SetMessageModalVisible",
  SetFormModalVisible = "SetFormModalVisible",
  SetFormModalValue = "SetFormModalValue",
  SetShareModalVisible = "SetShareModalVisible",
  MessageModalVisibleChanged = "MessageModalVisibleChanged",
  FormModalVisibleChanged = "FormModalVisibleChanged",
  ShareModalVisibleChanged = "ShareModalVisibleChanged",
}
class ReactDomEvent extends EventTarget {
  setSpinning(spinning: boolean) {
    this.dispatchEvent(
      new CustomEvent(ReactDomEventType.SetSpinning, {
        detail: {
          spinning: spinning,
        },
      })
    );
  }
  setMessageModalVisible(visible: boolean) {
    this.dispatchEvent(
      new CustomEvent(ReactDomEventType.SetMessageModalVisible, {
        detail: {
          visible: visible,
        },
      })
    );
  }
  setFormModalVisible(visible: boolean) {
    this.dispatchEvent(
      new CustomEvent(ReactDomEventType.SetFormModalVisible, {
        detail: {
          visible: visible,
        },
      })
    );
  }
  setFormModalValue(values?: any) {
    this.dispatchEvent(
      new CustomEvent(ReactDomEventType.SetFormModalValue, {
        detail: {
          values: values,
        },
      })
    );
  }
  setShareModalVisible(visible: boolean) {
    this.dispatchEvent(
      new CustomEvent(ReactDomEventType.SetShareModalVisible, {
        detail: {
          visible: visible,
        },
      })
    );
  }
}

export const reactDomEvent = new ReactDomEvent();

reactDomEvent.addEventListener(
  ReactDomEventType.MessageModalVisibleChanged,
  (e) => {
    const visible = (e as CustomEvent).detail.visible;
    Laya.stage.renderingEnabled = !visible;
  }
);
reactDomEvent.addEventListener(
  ReactDomEventType.FormModalVisibleChanged,
  (e) => {
    const visible = (e as CustomEvent).detail.visible;
    Laya.stage.renderingEnabled = !visible;
  }
);
reactDomEvent.addEventListener(
  ReactDomEventType.ShareModalVisibleChanged,
  (e) => {
    const visible = (e as CustomEvent).detail.visible;
    Laya.stage.renderingEnabled = !visible;
  }
);

// @ts-ignore
const EvidenceReactComponent = window.EvidenceReactComponent;
const React = EvidenceReactComponent.React;
const ReactDOM = EvidenceReactComponent.ReactDOM;
const e = React.createElement;

export const renderSpin = () => {
  const spinContainer = document.querySelector("#react-node-spin");
  ReactDOM.render(
    e(EvidenceReactComponent.FullScreenSpin, {
      event: reactDomEvent,
    }),
    spinContainer
  );
};

export const renderFormModal = (
  formItems: any,
  onSubmit: (value) => Promise<void>
) => {
  const formContainer = document.querySelector("#react-node-form");
  ReactDOM.render(
    e(EvidenceReactComponent.FormModal, {
      lang: I18N.getLang(),
      event: reactDomEvent,
      ...formItems,
      onSubmit,
    }),
    formContainer
  );
};

export const renderMessageModal = () => {
  const messageContainer = document.querySelector("#react-node-message");
  ReactDOM.render(
    e(EvidenceReactComponent.MessageModal, {
      event: reactDomEvent,
      lang: I18N.getLang(),
      request: async (page, pageSize) => {
        const res = await getMessages(page, pageSize);
        return res.data.data.data;
      },
      onSubmit: MessageModalSubmit,
    }),
    messageContainer
  );
};

/**
 * 分享弹窗
 * 每次打开需要重新render
 */
export const renderShareModal = (params: {
  img: string;
  url: string;
  lang: string;
}) => {
  const shareContainer = document.querySelector("#react-node-share");
  ReactDOM.unmountComponentAtNode(shareContainer);
  ReactDOM.render(
    e(EvidenceReactComponent.ShareModal, {
      ...params,
      event: reactDomEvent,
    }),
    shareContainer
  );
};

export const FormModalSubmit = async (values: any) => {
  const { answer, reason, discordTag, community } = values;
  await submitQuery({
    answer,
    reason,
    discordTag,
    community,
    lang: I18N.getLang(),
  });

};

export const CreationModalSubmit = async (values: ScriptCreation) => {
  const resData = await submitScript(values);
  reactDomEvent.setFormModalValue(
    resData
      ? {
          ...resData,
          alert: I18N.f("modal.ipfs-tip", {
            ipfsCid: resData.ipfsCid,
          }),
        }
      : undefined
  );
};

export const MessageModalSubmit = async (message: string) => {
  try {
    await submitMessage(message);
    return true;
  }catch(err){
    console.log(err);
    return false;
  }
};
