import List "mo:core/List";
import Time "mo:core/Time";
import Types "../types/labour";

module {
  public type Labour = Types.Labour;

  public func listLabours(labours : List.List<Labour>) : [Labour] {
    labours.toArray();
  };

  public func addLabour(labours : List.List<Labour>, state : { var nextLabourId : Nat }, name : Text, employeeId : Text, joinDate : Text) : Labour {
    let id = state.nextLabourId;
    state.nextLabourId += 1;
    let labour : Labour = { id; name; employeeId; joinDate; isActive = true; createdAt = Time.now() };
    labours.add(labour);
    labour;
  };

  public func updateLabour(labours : List.List<Labour>, id : Nat, name : Text, employeeId : Text, joinDate : Text, isActive : Bool) : ?Labour {
    var found : ?Labour = null;
    labours.mapInPlace(func(l) {
      if (l.id == id) {
        let updated = { l with name; employeeId; joinDate; isActive };
        found := ?updated;
        updated;
      } else { l };
    });
    found;
  };
}
