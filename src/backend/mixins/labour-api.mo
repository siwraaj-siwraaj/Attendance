import List "mo:core/List";
import Map "mo:core/Map";
import TypesAuth "../types/auth";
import TypesLabour "../types/labour";
import LabourLib "../lib/labour";
import AuthLib "../lib/auth";

mixin (users : Map.Map<Text, TypesAuth.User>, session : { var currentUser : ?Text }, labours : List.List<TypesLabour.Labour>, state : { var nextLabourId : Nat }, currentUser : () -> Text) {
  public query func getLabours() : async [TypesLabour.Labour] {
    AuthLib.requireApproved(users, currentUser());
    LabourLib.listLabours(labours);
  };

  public shared func addLabour(name : Text, employeeId : Text, joinDate : Text) : async { #ok : TypesLabour.Labour; #err : Text } {
    AuthLib.requireRole(users, currentUser(), #admin);
    let l = LabourLib.addLabour(labours, state, name, employeeId, joinDate);
    #ok l;
  };

  public shared func updateLabour(id : Nat, name : Text, employeeId : Text, joinDate : Text, isActive : Bool) : async { #ok : TypesLabour.Labour; #err : Text } {
    AuthLib.requireRole(users, currentUser(), #admin);
    switch (LabourLib.updateLabour(labours, id, name, employeeId, joinDate, isActive)) {
      case (?l) #ok l;
      case null #err "Labour not found";
    };
  };

  public query func getActiveLabours() : async [TypesLabour.Labour] {
    AuthLib.requireApproved(users, currentUser());
    labours.filter(func(l) { l.isActive }).toArray();
  };
}
