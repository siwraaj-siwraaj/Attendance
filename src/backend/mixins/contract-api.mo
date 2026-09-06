import List "mo:core/List";
import Map "mo:core/Map";
import TypesAuth "../types/auth";
import TypesContract "../types/contract";
import ContractLib "../lib/contract";
import AuthLib "../lib/auth";

mixin (users : Map.Map<Text, TypesAuth.User>, session : { var currentUser : ?Text }, contracts : List.List<TypesContract.Contract>, state : { var nextContractId : Nat }, currentUser : () -> Text) {
  public query func getContracts() : async [TypesContract.Contract] {
    AuthLib.requireApproved(users, currentUser());
    ContractLib.listContracts(contracts);
  };

  public shared func addContract(
    name : Text,
    multiplier : Float,
    contractAmount : Float,
    machineExpenses : Float,
    bedAmount : Float,
    paperAmount : Float,
    meshAmount : ?Float,
  ) : async { #ok : TypesContract.Contract; #err : Text } {
    AuthLib.requireRole(users, currentUser(), #contractOnly);
    let c = ContractLib.addContract(contracts, state, name, multiplier, contractAmount, machineExpenses, bedAmount, paperAmount, meshAmount);
    #ok c;
  };

  public shared func updateContract(
    id : Nat,
    name : Text,
    multiplier : Float,
    contractAmount : Float,
    machineExpenses : Float,
    bedAmount : Float,
    paperAmount : Float,
    meshAmount : ?Float,
  ) : async { #ok : TypesContract.Contract; #err : Text } {
    AuthLib.requireRole(users, currentUser(), #contractOnly);
    switch (ContractLib.updateContract(contracts, id, name, multiplier, contractAmount, machineExpenses, bedAmount, paperAmount, meshAmount)) {
      case (?c) #ok c;
      case null #err "Contract not found";
    };
  };

  public shared func addWorkColumn(contractId : Nat, name : Text, workType : Text) : async { #ok : TypesContract.Contract; #err : Text } {
    AuthLib.requireRole(users, currentUser(), #contractOnly);
    switch (ContractLib.addWorkColumn(contracts, contractId, name, workType)) {
      case (?c) #ok c;
      case null #err "Contract not found";
    };
  };

  public shared func updateWorkColumn(contractId : Nat, columnId : Text, name : Text) : async { #ok : TypesContract.Contract; #err : Text } {
    AuthLib.requireRole(users, currentUser(), #contractOnly);
    switch (ContractLib.updateWorkColumn(contracts, contractId, columnId, name)) {
      case (?c) #ok c;
      case null #err "Contract or column not found";
    };
  };

  public shared func removeWorkColumn(contractId : Nat, columnId : Text) : async { #ok : TypesContract.Contract; #err : Text } {
    AuthLib.requireRole(users, currentUser(), #contractOnly);
    switch (ContractLib.removeWorkColumn(contracts, contractId, columnId)) {
      case (?c) #ok c;
      case null #err "Contract or column not found";
    };
  };

  public shared func markContractSettled(id : Nat, settled : Bool) : async { #ok : TypesContract.Contract; #err : Text } {
    AuthLib.requireRole(users, currentUser(), #contractOnly);
    switch (ContractLib.markSettled(contracts, id, settled)) {
      case (?c) #ok c;
      case null #err "Contract not found";
    };
  };

  public shared func deleteContract(id : Nat) : async { #ok : Bool; #err : Text } {
    AuthLib.requireRole(users, currentUser(), #contractOnly);
    if (ContractLib.deleteContract(contracts, id)) #ok true
    else #err "Contract not found or not settled";
  };
}
