import Cycles "mo:base/ExperimentalCycles";
import StoryNFT "./nft";
import Types "./types";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Int32 "mo:base/Int32";
import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import NftTypes "./nft_types";
import Principal "mo:base/Principal";
import Finds "../finds/token";

actor StortFactory {
  type Stories = HashMap.HashMap<Nat, Types.Story>;
  type Sales = HashMap.HashMap<Nat, Types.Sale>;

  var nextId : Nat = 1;
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

  // publish story
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
};
