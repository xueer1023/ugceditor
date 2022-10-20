import '@umijs/max/typings';

declare global {
  interface Plug {
    sessionManager: {
      sessionData?: {
        agent: any;
        principalId: string;
        accountId: string;
      };
    };
  }

  interface Window {
    ic: {
      plug: Plug;
    };
  }

  namespace API {
    type Chain = {
      name: string;
      type: string;
      factoryAddress: string;
      findsAddress: string;
      taskModule: TaskModuleType;
    };

    type Jwt = {
      expiresIn: number;
      token: string;
    };

    type Story = {
      author: string;
      chain: string;
      chainInfo: Chain;
      chainStoryId: string;
      contentHash: string;
      info?: StoryInfo;
      nft?: NftSale;
      onChainAddr: string;
      createTime: string;
      updateTime: string;
    };

    type StoryInfo = {
      chain: string;
      chainStoryId: string;
      chapters: StoryChapter[];
      contentHash: string;
      cover: string;
      createAt: string;
      description: string;
      id: number;
      title: string;
      updateAt: string;
    };

    type StoryChapter = {
      id: number;
      name: string;
      content: string;
      createAt: string;
      updateAt: string;
      delete?: boolean;
    };

    type StoryDetail = {
      title: string;
      cover: string;
      description: string;
      chapters: ChapterDetail[];
      createAt: string | number;
      updateAt: string | number;
      version: string;
    };

    type ChapterDetail = {
      name: string;
      content: string;
      createAt: string;
      updateAt: string;
    };

    type NftSale = {
      authorClaimed: number;
      authorReserved: number;
      chain: string;
      chainStoryId: string;
      description: string;
      image: string;
      name: string;
      nftSaleAddr: string;
      price: string;
      sold: number;
      total: number;
      type: number;
      createTime: string;
      updateTime: string;
    };

    type User = {
      account: string;
      chain: string;
    };

    type ResultWrapper<T> = {
      data: T;
      code: number;
      message: string;
    };

    type IpfsData = {
      cid: string;
      size: number;
    };

    type IpfsResult = {
      cid: string;
      url: string;
    };

    /**
     * Record<`FCC_CHAPTER_CACHE_${chainStoryId}`, ChapterStorage[]>
     */
    type ChapterStorage = {
      id: number;
      name: string;
      content: string;
      timestamp: number;
      new: boolean;
    };

    type StoryTask = {
      id: number;
      status: StoryTaskStatus;
      title: string;
      description: string;
      submits: StoryTaskSubmit[];
      chain: string;
      chainStoryId: string;
    };

    type StoryChainTask = StoryTask & {
      chainTaskId: string;
      cid: string;
      creator: string;
      nft: string;
      rewardNfts: string[];
      status: StoryChainTaskStatus;
      submits: StoryChainTaskSubmit[];
      createTime: string;
      updateTime: string;
    };

    type StoryTaskSubmit = {
      id: number;
      status: StoryTaskSubmitStatus;
      taskId: number;
      account: string;
      content: string;
      createTime: string;
    };

    type StoryChainTaskSubmit = StoryTaskSubmit & {
      chain: string;
      chainStoryId: string;
      chainSubmitId: string;
      chainTaskId: string;
      cid: string;
      creator: string;
      // status: StoryChainTaskSubmitStatus;
      createTime: string;
      updateTime: string;
    };

    type StoryTaskStatus = 'Cancelled' | 'Done' | 'Todo';

    type StoryChainTaskStatus = 'Cancelled' | 'Done' | 'Todo';

    type StoryTaskSubmitStatus =
      | 'Approved'
      | 'Pending'
      | 'Rejected'
      | 'Withdrawed';

    type StoryChainTaskSubmitStatus =
      | 'APPROVED'
      | 'PENDING'
      | 'REJECTED'
      | 'WITHDRAWED';

    type TaskModuleType = 'Basic' | 'Chain';

    // enum StoryTaskStatus {
    //   Cancelled = 'Cancelled',
    //   Done = 'Done',
    //   Todo = 'Todo',
    // }

    // enum StoryTaskSubmitStatus {
    //   Approved = 'Approved',
    //   Pending = 'Pending',
    //   Rejected = 'Rejected',
    // }
  }
}
