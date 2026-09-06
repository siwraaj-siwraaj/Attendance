import List "mo:core/List";
import Time "mo:core/Time";
import TypesAdvance "../types/advance";

module {
  public type Advance = TypesAdvance.Advance;

  public func listAdvances(advances : List.List<Advance>) : [Advance] {
    advances.toArray();
  };

  public func listByContract(advances : List.List<Advance>, contractId : Nat) : [Advance] {
    advances.filter(func(a) { a.contractId == contractId }).toArray();
  };

  public func addAdvance(
    advances : List.List<Advance>,
    state : { var nextAdvanceId : Nat },
    contractId : Nat,
    labourId : Nat,
    amount : Float,
    note : Text,
  ) : Advance {
    let id = state.nextAdvanceId;
    state.nextAdvanceId += 1;
    let advance : Advance = {
      id;
      contractId;
      labourId;
      amount;
      note;
      createdAt = Time.now();
    };
    advances.add(advance);
    advance;
  };

  public func updateAdvance(advances : List.List<Advance>, id : Nat, amount : Float, note : Text) : ?Advance {
    var found : ?Advance = null;
    advances.mapInPlace(func(a) {
      if (a.id == id) {
        let updated = { a with amount; note };
        found := ?updated;
        updated;
      } else { a };
    });
    found;
  };

  public func deleteAdvance(advances : List.List<Advance>, id : Nat) : Bool {
    let sizeBefore = advances.size();
    let filtered = advances.filter(func(a) { a.id != id });
    advances.clear();
    advances.append(filtered);
    advances.size() < sizeBefore;
  };
}
