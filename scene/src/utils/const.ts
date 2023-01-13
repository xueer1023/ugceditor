export const CommunityOptions: {
  label: string;
  subLabel: string;
  value: string;
  img: string;
  url: string;
}[] = [];

export const FormModalProps: Record<"zh-CN" | "en-US", object> = {
  "zh-CN": {
    title: "提交回答",
    okText: "提交",
    cancelText: "关闭",
    fields: [
      {
        name: "community",
        label: "为哪个社区助力？",
        type: "input",
        rules: [{ required: true, message: "请输入社区名！" }],
        maxLength: 30,
        placeholder: "请输入社区名",
      },
      {
        name: "discordTag",
        label: "Discord Tag",
        type: "input",
        rules: [{ required: true, message: "请输入 Discord Tag！" }],
        maxLength: 30,
        placeholder: "请输入Discord Tag",
      },
      {
        name: "answer",
        label: "死者死因",
        type: "textarea",
        rules: [{ required: true, message: "请输入！" }],
        rows: 3,
        maxLength: 4000,
        placeholder: "请输入",
      },
      {
        name: "reason",
        label: "还原真相",
        type: "textarea",
        rules: [{ required: true, message: "请输入！" }],
        rows: 10,
        maxLength: 4000,
        placeholder: "请输入",
      },
    ],
  },
  "en-US": {
    title: "Commit Answer",
    okText: "Submit",
    cancelText: "Close",
    fields: [
      {
        name: "community",
        label: "Which community are you going to boost?",
        type: "input",
        rules: [
          {
            required: true,
            message: "Please enter the name of your community!",
          },
        ],
        maxLength: 30,
        placeholder: "Please enter the name of your community",
      },
      {
        name: "discordTag",
        label: "Discord Tag",
        type: "input",
        rules: [{ required: true, message: "Please enter your Discord Tag!" }],
        maxLength: 30,
        placeholder: "Please enter your Discord Tag",
      },
      {
        name: "answer",
        label: "The cause of death",
        type: "textarea",
        rules: [{ required: true, message: "Please enter!" }],
        rows: 3,
        maxLength: 4000,
        placeholder: "Please enter",
      },
      {
        name: "reason",
        label: "Truth restoration",
        type: "textarea",
        rules: [{ required: true, message: "Please enter!" }],
        rows: 10,
        maxLength: 4000,
        placeholder: "Please enter",
      },
    ],
  },
};

export const CreationModalProps: Record<"zh-CN" | "en-US", object> = {
  "zh-CN": {
    title: "叙写真相",
    okText: "提交",
    cancelText: "关闭",
    fields: [
      {
        name: "discordTag",
        label: "Discord Tag",
        type: "input",
        rules: [{ required: true, message: "请输入 Discord Tag！" }],
        maxLength: 30,
        placeholder: "请输入Discord Tag",
      },
      {
        name: "name",
        label: "故事名称",
        type: "input",
        rules: [{ required: true, message: "请输入故事名称！" }],
        maxLength: 64,
        placeholder: "请输入",
      },
      {
        name: "summary",
        label: "故事摘要",
        type: "textarea",
        rules: [{ required: true, message: "请输入故事摘要！" }],
        rows: 5,
        maxLength: 200,
        placeholder: "请输入故事摘要",
      },
      {
        name: "case",
        label: "案件还原",
        type: "textarea",
        rules: [{ required: true, message: "请输入案件还原！" }],
        rows: 10,
        maxLength: 4000,
        placeholder: "请输入案件详情",
      },
      {
        name: "clueProps",
        label: "道具线索使用",
        type: "textarea",
        rules: [{ required: true, message: "请输入道具线索使用说明！" }],
        rows: 10,
        maxLength: 4000,
        placeholder: "请输入各个道具线索的使用说明",
      },
      {
        name: "npcDialogue",
        label: "NPC对话",
        type: "textarea",
        rules: [{ required: true, message: "请输入NPC对话！" }],
        rows: 10,
        maxLength: 4000,
        placeholder: "请输入与各个NPC的对话内容",
      },
      {
        name: "more",
        label: "更多内容",
        type: "textarea",
        rules: [{ required: true, message: "请输入更多内容！" }],
        rows: 10,
        maxLength: 4000,
        placeholder: "请输入",
      },
    ],
  },
  "en-US": {
    title: "Describe the Truth",
    okText: "Submit",
    cancelText: "Close",
    fields: [
      {
        name: "discordTag",
        label: "Discord Tag",
        type: "input",
        rules: [{ required: true, message: "Please input your Discord Tag!" }],
        maxLength: 30,
        placeholder: "Please input your Discord Tag",
      },
      {
        name: "name",
        label: "Story name",
        type: "input",
        rules: [{ required: true, message: "Please input the story name!" }],
        maxLength: 64,
        placeholder: "Please input the story name",
      },
      {
        name: "summary",
        label: "Story outline",
        type: "textarea",
        rules: [{ required: true, message: "Please input the story outline!" }],
        rows: 5,
        maxLength: 200,
        placeholder: "Please input the story outline",
      },
      {
        name: "case",
        label: "Details of the case",
        type: "textarea",
        rules: [
          { required: true, message: "Please input the detail of your case!" },
        ],
        rows: 10,
        maxLength: 4000,
        placeholder: "Please input the detail of your case",
      },
      {
        name: "clueProps",
        label: "Details of clues and props",
        type: "textarea",
        rules: [
          {
            required: true,
            message: "Please input the usage of each clue and prop!",
          },
        ],
        rows: 10,
        maxLength: 4000,
        placeholder: "Please input the usage of each clue and prop",
      },
      {
        name: "npcDialogue",
        label: "Dialogues of NPCs",
        type: "textarea",
        rules: [
          { required: true, message: "Please input the dialogue of each NPC!" },
        ],
        rows: 10,
        maxLength: 4000,
        placeholder: "Please input the dialogue of each NPC",
      },
      {
        name: "more",
        label: "More details",
        type: "textarea",
        rules: [{ required: true, message: "Please input something!" }],
        rows: 10,
        maxLength: 4000,
        placeholder: "Please input",
      },
    ],
  },
};
