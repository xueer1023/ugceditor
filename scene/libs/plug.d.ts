interface Plug {
  sessionManager: {
    sessionData?: {
      agent: any;
      principalId: string;
      accountId: string;
    };
  };
}

declare interface Window {
  ic: {
    plug: Plug;
  };
}