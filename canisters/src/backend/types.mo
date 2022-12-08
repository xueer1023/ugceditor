import Nat "mo:base/Nat";
import Int32 "mo:base/Int32";
import Text "mo:base/Text";
import NftTypes "./nft_types";

module {
  public type Sale = {
    id : Nat;
    total : Nat;
    sold : Nat;
    authorReserved : Nat;
    authorClaimed : Nat;
    recv : Principal;
    token : Principal;
    price : Nat;
    nft : Principal;
    uriPrefix : Text;
  };

  public type Story = {
    id : Nat;
    author : Principal;
    cid : Text;
  };

  public type Task = {
    id : Nat;
    storyId : Nat;
    cid : Text;
    creator : Principal;
    nft : Principal;
    rewardNfts : [Nat64];
    nextSubmitId : Nat;
    status : Nat;
    // 1 TODO
    // 2 DONE
    // 3 CANCELLED
  };
  public type TaskSubmit = {
    id : Nat;
    storyId : Nat;
    taskId : Nat;
    creator : Principal;
    cid : Text;
    status : Nat;
    // 1 PENDING
    // 2 APPROVED,
    // 3 WITHDRAWED
  };

  public type TxReceipt = {
    #Ok : Nat;
    #Err : {
      #InsufficientAllowance;
      #InsufficientBalance;
      #ErrorOperationStyle;
      #Unauthorized;
      #LedgerTrap;
      #ErrorTo;
      #Other : Text;
      #BlockUsed;
      #AmountTooSmall;
    };
  };

  public type DIP20Interface = actor {
    transfer : (Principal, Nat) -> async TxReceipt;
    transferFrom : (Principal, Principal, Nat) -> async TxReceipt;
    balanceOf : (who : Principal) -> async Nat;
    // allowance : (owner: Principal, spender: Principal) -> async Nat;
    // getMetadata: () -> async Metadata;
  };

  public type DIP721Interface = actor {
    mintDip721 : (Principal, NftTypes.MetadataDesc) -> async NftTypes.MintReceipt;
    totalSupplyDip721 : () -> async Nat64;
    ownerOfDip721 : (Nat64) -> async NftTypes.OwnerResult;
    transferFromDip721 : (
      Principal,
      Principal,
      NftTypes.TokenId,
    ) -> async NftTypes.TxReceipt;
  };
};
