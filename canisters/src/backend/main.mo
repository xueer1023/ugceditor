import Cycles "mo:base/ExperimentalCycles";
import StoryNFT "./nft";
import Types "./types";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Array "mo:base/Array";
import Nat64 "mo:base/Nat64";
import Int32 "mo:base/Int32";
import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import NftTypes "./nft_types";
import Principal "mo:base/Principal";
import Finds "../finds/token";
import Iter "mo:base/Iter";
import Buffer "mo:base/Buffer";
import Prelude "mo:base/Prelude";

actor StortFactory {
  type Stories = HashMap.HashMap<Nat, Types.Story>;
  type Sales = HashMap.HashMap<Nat, Types.Sale>;
  // type Tasks = HashMap.HashMap<Nat, [Types.Task]>;

  stable var nextId : Nat = 1;
  var stories : Stories = HashMap.HashMap(
    32,
    Nat.equal,
    Hash.hash,
  );
  var sales : Sales = HashMap.HashMap(
    32,
    Nat.equal,
    Hash.hash,
  );

  // pubh story
  // check cocurrency problem?
  public shared ({ caller }) func publishStory(cid : Text) : async Types.Story {
    let id = nextId;
    nextId += 1;
    let story : Types.Story = {
      id = id;
      author = caller;
      cid = cid;
    };
    stories.put(
      id,
      story,
    );

    story;
  };

  // update story
  public shared ({ caller }) func updateStory(id : Nat, cid : Text) : async ?Types.Story {
    switch (stories.get(id)) {
      case (?(dat)) {
        assert (dat.author == caller);
        let newInfo : Types.Story = {
          id = id;
          author = caller;
          cid = cid;
        };
        stories.put(
          id,
          newInfo,
        );
        ?(newInfo);
      };
      case null {
        null;
      };
    };
  };
  // publish nft
  public shared ({ caller }) func publishNft(
    id : Nat,
    total : Nat,
    authorReserved : Nat,
    recv : Principal,
    token : Principal,
    price : Nat,
    name : Text,
    symbol : Text,
    uriPrefix : Text,
  ) : async ?Types.Sale {
    switch (stories.get(id)) {
      case (?(dat)) {
        assert (dat.author == caller);

        switch (sales.get(id)) {
          case (?(sale_data)) {
            null;
          };
          case null {
            // publish
            let init : NftTypes.Dip721NonFungibleToken = {
              logo = {
                logo_type = "";
                data = "";
              };
              name = name;
              symbol = symbol;
              maxLimit = 10000;
            };
            Cycles.add(1_000_000_000_000);
            let nft = await StoryNFT.StoryNFT(
              Principal.fromActor(StortFactory),
              init,
            );
            let sale : Types.Sale = {
              id = id;
              total = total;
              sold = 0;
              authorReserved = authorReserved;
              authorClaimed = 0;
              recv = recv;
              token = token;
              price = price;
              nft = Principal.fromActor(nft);
              uriPrefix = uriPrefix;
            };

            sales.put(id, sale);

            ?(sale);
          };
        };
      };
      case null {
        null;
      };
    };
  };
  // mint nft
  public shared ({ caller }) func mintNft(id : Nat) : async ?Nat64 {
    switch (sales.get(id)) {
      case (?(sale_data)) {
        // cast canisterID to token interface
        let dip20 = actor (Principal.toText(sale_data.token)) : Types.DIP20Interface;

        let result = await dip20.balanceOf(caller);
        assert (result >= sale_data.price);

        assert ((sale_data.total - sale_data.authorReserved - sale_data.sold) > 0);

        switch (await dip20.transferFrom(caller, sale_data.recv, sale_data.price)) {
          case (#Ok(_)) {

            let dip721 = actor (Principal.toText(sale_data.nft)) : Types.DIP721Interface;
            let nextTokenId = (await dip721.totalSupplyDip721()) + 1;

            switch (await dip721.mintDip721(caller, [{ purpose = #Rendered; key_val_data = [{ key = "uri"; val = #TextContent(sale_data.uriPrefix # "/" # Nat64.toText(nextTokenId)) }]; data = "" }])) {
              case (#Ok({ token_id })) {
                let updated_sale : Types.Sale = {
                  id = sale_data.id;
                  total = sale_data.total;
                  sold = sale_data.sold + 1;
                  authorReserved = sale_data.authorReserved;
                  authorClaimed = sale_data.authorClaimed;
                  recv = sale_data.recv;
                  token = sale_data.token;
                  price = sale_data.price;
                  nft = sale_data.nft;
                  uriPrefix = sale_data.uriPrefix;
                };
                sales.put(id, updated_sale);

                ?token_id;
              };
              case (#Err(_)) {
                null;
              };
            }

          };
          case (#Err(_)) {
            null;
          };
        };
      };
      case null {
        null;
      };
    };

  };

  // 第二部分
  let TASK_TODO = 1;
  let TASK_DONE = 2;
  let TASK_CANELLED = 3;

  let TASK_SUBMIT_PENDING = 1;
  let TASK_SUBMIT_APPROVED = 2;
  let TASK_SUBMIT_WITHDRAWED = 3;
  type StoryTaskInfo = {
    storyId : Nat;
    nextTaskId : Nat;
  };
  var storyTasksInfos : HashMap.HashMap<Nat, StoryTaskInfo> = HashMap.HashMap(
    32,
    Nat.equal,
    Hash.hash,
  );
  var tasks : HashMap.HashMap<Nat, HashMap.HashMap<Nat, Types.Task>> = HashMap.HashMap(32, Nat.equal, Hash.hash);
  var submits : HashMap.HashMap<Nat, HashMap.HashMap<Nat, HashMap.HashMap<Nat, Types.TaskSubmit>>> = HashMap.HashMap(32, Nat.equal, Hash.hash);

  public shared ({ caller }) func claimAuthorReservedNft(
    storyId : Nat,
    amount : Nat,
  ) : async ?[Nat64] {
    switch (stories.get(storyId)) {
      case (?(dat)) {
        assert (dat.author == caller);

        switch (sales.get(storyId)) {
          case (?(sale_data)) {
            assert (sale_data.authorReserved - sale_data.authorClaimed) >= amount;

            let dip721 = actor (Principal.toText(sale_data.nft)) : Types.DIP721Interface;

            let token_ids = Buffer.Buffer<Nat64>(amount);

            for (idx in Iter.range(0, amount -1)) {
              let nextTokenId = (await dip721.totalSupplyDip721()) + 1;

              switch (await dip721.mintDip721(caller, [{ purpose = #Rendered; key_val_data = [{ key = "uri"; val = #TextContent(sale_data.uriPrefix # "/" # Nat64.toText(nextTokenId)) }]; data = "" }])) {
                case (#Ok({ token_id })) {
                  token_ids.add(token_id);
                };
                case (#Err(_)) {
                  return null;
                };
              };
            };
            let sale : Types.Sale = {
              id = sale_data.id;
              total = sale_data.total;
              sold = sale_data.sold;
              authorReserved = sale_data.authorReserved;
              authorClaimed = sale_data.authorClaimed + amount;
              recv = sale_data.recv;
              token = sale_data.token;
              price = sale_data.price;
              nft = sale_data.nft;
              uriPrefix = sale_data.uriPrefix;
            };
            sales.put(storyId, sale);
            ?(Buffer.toArray(token_ids));

          };
          case null {
            null;
          };
        };
      };
      case null {
        null;
      };
    };
  };

  public shared ({ caller }) func createTask(
    storyId : Nat,
    cid : Text,
    nft : Principal,
    rewardNfts : [Nat64],
  ) : async ?Types.Task {
    switch (stories.get(storyId)) {
      case (?(dat)) {
        // author
        assert (dat.author == caller);

        // task info
        let info = switch (storyTasksInfos.get(storyId)) {
          case null {
            let new_info : StoryTaskInfo = {
              storyId = storyId;
              nextTaskId = 1;
            };
            storyTasksInfos.put(storyId, new_info);
            new_info;
          };
          case (?info) {
            info;
          };
        };

        let dip721 = actor (Principal.toText(nft)) : Types.DIP721Interface;

        // ensure tokenIds owner
        for (tokenId in Iter.fromArray(rewardNfts)) {
          switch (await dip721.ownerOfDip721(tokenId)) {
            case (#Ok(principal)) {
              assert principal == caller;
            };
            case (#Err(_)) {
              return null;
            };
          };
        };

        // transfer tokenIds
        for (tokenId in Iter.fromArray(rewardNfts)) {
          switch (await dip721.transferFromDip721(caller, Principal.fromActor(StortFactory), tokenId)) {
            case (#Ok(principal)) {};
            case (#Err(_)) {
              return null;
            };
          };
        };

        let task : Types.Task = {
          id = info.nextTaskId;
          storyId = storyId;
          cid = cid;
          creator = caller;
          nft = nft;
          rewardNfts = rewardNfts;
          nextSubmitId = 1;
          status = TASK_TODO;
        };

        addStoryTask(storyId, task);

        let updated_story_task : StoryTaskInfo = {
          storyId = info.storyId;
          nextTaskId = info.nextTaskId + 1;
        };
        storyTasksInfos.put(storyId, updated_story_task);
        ?task;
      };
      case null {
        null;
      };
    };
  };

  public shared ({ caller }) func updateTask(
    storyId : Nat,
    taskId : Nat,
    cid : Text,
  ) : async ?Types.Task {
    let task = getStoryTask(storyId, taskId);

    assert task.status == TASK_TODO;
    assert task.creator == caller;
    let updated_task : Types.Task = {
      id = task.id;
      cid = cid;
      storyId = task.storyId;
      creator = task.creator;
      nft = task.nft;
      rewardNfts = task.rewardNfts;
      nextSubmitId = task.nextSubmitId;
      status = task.status;
    };
    updateStoryTask(storyId, updated_task);
    ?updated_task;
  };

  public shared ({ caller }) func cancelTask(
    storyId : Nat,
    taskId : Nat,
  ) {
    let task = getStoryTask(storyId, taskId);
    assert caller == task.creator;
    assert task.status == TASK_TODO;
    let updated_task : Types.Task = {
      id = task.id;
      cid = task.cid;
      storyId = task.storyId;
      creator = task.creator;
      nft = task.nft;
      rewardNfts = task.rewardNfts;
      nextSubmitId = task.nextSubmitId;
      status = TASK_CANELLED;
    };
    updateStoryTask(storyId, updated_task);

    // return nfts
    let dip721 = actor (Principal.toText(task.nft)) : Types.DIP721Interface;

    // transfer tokenIds
    for (tokenId in Iter.fromArray(task.rewardNfts)) {
      switch (await dip721.transferFromDip721(Principal.fromActor(StortFactory), task.creator, tokenId)) {
        case (#Ok(principal)) {};
        case (#Err(_)) {
          Prelude.unreachable();
        };
      };
    };

  };
  public shared ({ caller }) func createTaskSubmit(
    storyId : Nat,
    taskId : Nat,
    cid : Text,
  ) : async Types.TaskSubmit {
    let task = getStoryTask(storyId, taskId);
    assert task.status == TASK_TODO;
    let submit : Types.TaskSubmit = {
      id = task.nextSubmitId;
      creator = caller;
      storyId = storyId;
      taskId = taskId;
      cid = cid;
      status = TASK_SUBMIT_PENDING;
    };
    let updated_task : Types.Task = {
      id = task.id;
      cid = task.cid;
      creator = task.creator;
      storyId = task.storyId;
      nft = task.nft;
      rewardNfts = task.rewardNfts;
      nextSubmitId = task.nextSubmitId + 1;
      status = task.status;
    };
    addStoryTaskSubmit(storyId, taskId, submit);
    addStoryTask(storyId, updated_task);
    submit;
  };

  public shared ({ caller }) func withdrawTaskSubmit(
    storyId : Nat,
    taskId : Nat,
    submitId : Nat,
  ) {
    let task = getStoryTask(storyId, taskId);
    assert task.status == TASK_TODO;
    let submit = getStoryTaskSubmit(storyId, taskId, submitId);
    assert submit.status == TASK_SUBMIT_PENDING;
    assert submit.creator == caller;
    let updated_submit : Types.TaskSubmit = {
      id = submit.id;
      creator = submit.creator;
      storyId = submit.storyId;
      taskId = submit.taskId;
      cid = submit.cid;
      status = TASK_SUBMIT_WITHDRAWED;
    };
    upadteStoryTaskSubmit(storyId, taskId, updated_submit);
  };
  public shared ({ caller }) func markTaskDone(
    storyId : Nat,
    taskId : Nat,
    selectedSubmitId : Nat,
  ) {
    let task = getStoryTask(storyId, taskId);
    let submit = getStoryTaskSubmit(storyId, taskId, selectedSubmitId);
    assert caller == task.creator;
    assert task.status == TASK_TODO;
    assert submit.status == TASK_SUBMIT_PENDING;

    let updated_submit : Types.TaskSubmit = {
      id = submit.id;
      creator = submit.creator;
      storyId = submit.storyId;
      taskId = submit.taskId;
      cid = submit.cid;
      status = TASK_SUBMIT_APPROVED;
    };

    let updated_task : Types.Task = {
      id = task.id;
      cid = task.cid;
      creator = task.creator;
      storyId = task.storyId;
      nft = task.nft;
      rewardNfts = task.rewardNfts;
      nextSubmitId = task.nextSubmitId;
      status = TASK_DONE;
    };
    updateStoryTask(storyId, updated_task);
    upadteStoryTaskSubmit(storyId, taskId, updated_submit);
    // transfer NFT
    let dip721 = actor (Principal.toText(task.nft)) : Types.DIP721Interface;
    for (tokenId in Iter.fromArray(task.rewardNfts)) {
      switch (await dip721.transferFromDip721(Principal.fromActor(StortFactory), submit.creator, tokenId)) {
        case (#Ok(principal)) {};
        case (#Err(_)) {
          Prelude.unreachable();
        };
      };
    };
  };

  public query func getMagic() : async Nat {
    return 1;
  };

  public query func getTask(storyId : Nat, taskId : Nat) : async ?Types.Task {
    switch (tasks.get(storyId)) {
      case (?(tasksMap)) {
        tasksMap.get(taskId);
      };
      case null { null };
    };
  };

  public query func getTaskSubmit(storyId : Nat, taskId : Nat, submitId : Nat) : async ?Types.TaskSubmit {

    switch (submits.get(storyId)) {
      case (?(_tasks)) {
        switch (_tasks.get(taskId)) {
          case (?(_submits)) {
            _submits.get(submitId);
          };
          case null { null };
        };
      };
      case null { null };
    };
  };
  public query func getStoryTaskInfo(storyId : Nat) : async ?StoryTaskInfo {
    storyTasksInfos.get(storyId);
  };
  public query func getStory(id : Nat) : async ?Types.Story {
    stories.get(id);
  };

  public query func getSale(id : Nat) : async ?Types.Sale {
    sales.get(id);
  };

  public query func countStories() : async Nat {
    stories.size();
  };

  public query func countSales() : async Nat {
    sales.size();
  };

  // TASK UTILS
  func addStoryTask(storyId : Nat, task : Types.Task) {
    // get curr or create
    let tasksMap = switch (tasks.get(storyId)) {
      case (?(tasksMap)) {
        tasksMap;
      };
      case (null) {
        let tasksMap = HashMap.HashMap<Nat, Types.Task>(
          32,
          Nat.equal,
          Hash.hash,
        );
        tasksMap;
      };
    };
    // add
    tasksMap.put(task.id, task);
    // save
    tasks.put(storyId, tasksMap);
  };

  func updateStoryTask(storyId : Nat, task : Types.Task) {
    let tasksMap = ensureGet(tasks, storyId);
    tasksMap.put(task.id, task);
    tasks.put(storyId, tasksMap);
  };

  func getStoryTask(storyId : Nat, taskId : Nat) : Types.Task {
    let tasksMap = ensureGet(tasks, storyId);
    return ensureGet(tasksMap, taskId);
  };

  // TASK SUBMIT UTILS
  func getStoryTaskSubmit(storyId : Nat, taskId : Nat, submitId : Nat) : Types.TaskSubmit {
    let tasksSubmits = ensureGet(submits, storyId);
    let _submits = ensureGet(tasksSubmits, taskId);
    return ensureGet(_submits, submitId);
  };
  func addStoryTaskSubmit(storyId : Nat, taskId : Nat, submit : Types.TaskSubmit) {
    let tasksAndSubmits = switch (submits.get(storyId)) {
      case (?data) {
        data;
      };
      case null {
        let data = HashMap.HashMap<Nat, HashMap.HashMap<Nat, Types.TaskSubmit>>(
          32,
          Nat.equal,
          Hash.hash,
        );
        data;
      };
    };
    let submits_ = switch (tasksAndSubmits.get(taskId)) {
      case (?data) data;
      case null {
        HashMap.HashMap<Nat, Types.TaskSubmit>(
          32,
          Nat.equal,
          Hash.hash,
        );
      };
    };
    submits_.put(submit.id, submit);
    tasksAndSubmits.put(taskId, submits_);
    submits.put(storyId, tasksAndSubmits);
  };
  func upadteStoryTaskSubmit(storyId : Nat, taskId : Nat, submit : Types.TaskSubmit) {
    let _tasks = ensureGet(submits, storyId);
    let _submits = ensureGet(_tasks, taskId);
    _submits.put(submit.id, submit);
    _tasks.put(taskId, _submits);
    submits.put(storyId, _tasks);
  };

  func ensureGet<T>(store : HashMap.HashMap<Nat, T>, key : Nat) : T {
    let val = switch (store.get(key)) {
      case (?(data)) {
        data;
      };
      case null {
        Prelude.unreachable();
      };
    };
  };

  // For Upgrade
  // stories, sales, storyTasksInfos, tasks, submits
  stable var entriesStories : [Types.Story] = [];
  stable var entriesSales : [Types.Sale] = [];
  stable var entriesStoryTasksInfos : [StoryTaskInfo] = [];
  stable var entriesTasks : [Types.Task] = [];
  stable var entriesSubmits : [Types.TaskSubmit] = [];

  system func preupgrade() {
    // stories
    entriesStories := Iter.toArray(stories.vals());
    // sales
    entriesSales := Iter.toArray(sales.vals());
    // storyTasksInfos
    entriesStoryTasksInfos := Iter.toArray(storyTasksInfos.vals());

    // tasks
    var bufTasks = Buffer.Buffer<Types.Task>(10);
    for (oneStoryTasks in tasks.vals()) {
      for (task in oneStoryTasks.vals()) {
        bufTasks.add(task);
      };
    };
    entriesTasks := Buffer.toArray(bufTasks);

    // submits
    var bufSubmits = Buffer.Buffer<Types.TaskSubmit>(10);
    for (oneStorySubmits in submits.vals()) {
      for (oneTaskSubmits in oneStorySubmits.vals()) {
        for (submit in oneTaskSubmits.vals()) {
          bufSubmits.add(submit);
        };
      };
    };
    entriesSubmits := Buffer.toArray(bufSubmits);
  };

  system func postupgrade() {

    // stories
    for (entry in entriesStories.vals()) {
      stories.put(entry.id, entry);
    };
    entriesStories := [];

    // sales
    for (entry in entriesSales.vals()) {
      sales.put(entry.id, entry);
    };
    entriesSales := [];

    // storyTasksInfos
    for (entry in entriesStoryTasksInfos.vals()) {
      storyTasksInfos.put(entry.storyId, entry);
    };
    entriesStoryTasksInfos := [];

    // tasks
    for (entry in entriesTasks.vals()) {
      addStoryTask(entry.storyId, entry);
    };
    entriesTasks := [];

    // submits
    for (entry in entriesSubmits.vals()) {
      addStoryTaskSubmit(entry.storyId, entry.taskId, entry);
    };
    entriesSubmits := [];
  };
};
