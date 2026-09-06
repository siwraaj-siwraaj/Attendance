import List "mo:core/List";
import Map "mo:core/Map";
import TypesAuth "../types/auth";
import TypesAdvance "../types/advance";
import AdvanceLib "../lib/advance";
import AuthLib "../lib/auth";

mixin (users : Map.Map<Text, TypesAuth.User>, session : { var currentUser : ?Text }, advances : List.List<TypesAdvance.Advance>, state : { var nextAdvanceId : Nat }, currentUser : () -> Text) {
  public query func getAdvances() : async [TypesAdvance.Advance] {
    AuthLib.requireApproved(users, currentUser());
    AdvanceLib.listAdvances(advances);
  };

  public query func getAdvancesByContract(contractId : Nat) : async [TypesAdvance.Advance] {
    AuthLib.requireApproved(users, currentUser());
    AdvanceLib.listByContract(advances, contractId);
  };

  public shared func addAdvance(
    contractId : Nat,
    labourId : Nat,
    amount : Float,
    note : Text,
  ) : async { #ok : TypesAdvance.Advance; #err : Text } {
    AuthLib.requireRole(users, currentUser(), #admin);
    let adv = AdvanceLib.addAdvance(advances, state, contractId, labourId, amount, note);
    #ok adv;
  };

  public shared func updateAdvance(id : Nat, amount : Float, note : Text) : async { #ok : TypesAdvance.Advance; #err : Text } {
    AuthLib.requireRole(users, currentUser(), #admin);
    switch (AdvanceLib.updateAdvance(advances, id, amount, note)) {
      case (?a) #ok a;
      case null #err "Advance not found";
    };
  };

  public shared func deleteAdvance(id : Nat) : async { #ok : Bool; #err : Text } {
    AuthLib.requireRole(users, currentUser(), #admin);
    if (AdvanceLib.deleteAdvance(advances, id)) #ok true
    else #err "Advance not found";
  };
}
