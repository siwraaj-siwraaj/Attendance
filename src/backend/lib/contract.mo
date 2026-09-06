import List "mo:core/List";
import Time "mo:core/Time";
import Array "mo:core/Array";
import TypesContract "../types/contract";

module {
  public type Contract = TypesContract.Contract;
  public type WorkColumn = TypesContract.WorkColumn;

  let defaultColumns : [WorkColumn] = [
    { id = "bed"; name = "Bed"; workType = "bed" },
    { id = "paper"; name = "Paper"; workType = "paper" },
    { id = "mesh"; name = "Mesh"; workType = "mesh" },
  ];

  public func listContracts(contracts : List.List<Contract>) : [Contract] {
    contracts.toArray();
  };

  public func addContract(
    contracts : List.List<Contract>,
    state : { var nextContractId : Nat },
    name : Text,
    multiplier : Float,
    contractAmount : Float,
    machineExpenses : Float,
    bedAmount : Float,
    paperAmount : Float,
    meshAmountOpt : ?Float,
  ) : Contract {
    let id = state.nextContractId;
    state.nextContractId += 1;
    let meshAmount = switch (meshAmountOpt) {
      case (?m) m;
      case null contractAmount - (bedAmount + paperAmount + machineExpenses);
    };
    let contract : Contract = {
      id;
      name;
      multiplier;
      contractAmount;
      machineExpenses;
      bedAmount;
      paperAmount;
      meshAmount;
      workColumns = defaultColumns;
      settled = false;
      createdAt = Time.now();
    };
    contracts.add(contract);
    contract;
  };

  public func updateContract(
    contracts : List.List<Contract>,
    id : Nat,
    name : Text,
    multiplier : Float,
    contractAmount : Float,
    machineExpenses : Float,
    bedAmount : Float,
    paperAmount : Float,
    meshAmountOpt : ?Float,
  ) : ?Contract {
    var found : ?Contract = null;
    contracts.mapInPlace(func(c) {
      if (c.id == id) {
        let meshAmount = switch (meshAmountOpt) {
          case (?m) m;
          case null contractAmount - (bedAmount + paperAmount + machineExpenses);
        };
        let updated = { c with name; multiplier; contractAmount; machineExpenses; bedAmount; paperAmount; meshAmount };
        found := ?updated;
        updated;
      } else { c };
    });
    found;
  };

  public func addWorkColumn(contracts : List.List<Contract>, contractId : Nat, name : Text, workType : Text) : ?Contract {
    var found : ?Contract = null;
    contracts.mapInPlace(func(c) {
      if (c.id == contractId) {
        // count existing columns with same workType for suffix
        let count = c.workColumns.filter(func(col) = col.workType == workType).size();
        let newId = workType # "-" # Nat.toText(count + 1);
        // Blank name → auto-generate default like "Bed 1", "Paper 2", "Mesh 3".
        let prefix = switch (workType) {
          case "bed" "Bed";
          case "paper" "Paper";
          case "mesh" "Mesh";
          case _ workType;
        };
        let resolvedName = if (name == "") {
          prefix # " " # Nat.toText(count + 1);
        } else { name };
        let newCol : WorkColumn = { id = newId; name = resolvedName; workType };
        let updated = { c with workColumns = c.workColumns.concat([newCol]) };
        found := ?updated;
        updated;
      } else { c };
    });
    found;
  };

  public func updateWorkColumn(contracts : List.List<Contract>, contractId : Nat, columnId : Text, name : Text) : ?Contract {
    var found : ?Contract = null;
    contracts.mapInPlace(func(c) {
      if (c.id == contractId) {
        let newCols = c.workColumns.map(func(col) {
          if (col.id == columnId) { { col with name } } else { col };
        });
        let updated = { c with workColumns = newCols };
        found := ?updated;
        updated;
      } else { c };
    });
    found;
  };

  public func removeWorkColumn(contracts : List.List<Contract>, contractId : Nat, columnId : Text) : ?Contract {
    var found : ?Contract = null;
    contracts.mapInPlace(func(c) {
      if (c.id == contractId) {
        let newCols = c.workColumns.filter(func(col) = col.id != columnId);
        let updated = { c with workColumns = newCols };
        found := ?updated;
        updated;
      } else { c };
    });
    found;
  };

  public func markSettled(contracts : List.List<Contract>, id : Nat, settled : Bool) : ?Contract {
    var found : ?Contract = null;
    contracts.mapInPlace(func(c) {
      if (c.id == id) {
        let updated = { c with settled };
        found := ?updated;
        updated;
      } else { c };
    });
    found;
  };

  public func deleteContract(contracts : List.List<Contract>, id : Nat) : Bool {
    // Only delete if settled
    let target = contracts.find(func(c) { c.id == id });
    switch (target) {
      case (?c) {
        if (not c.settled) return false;
        let filtered = contracts.filter(func(c2) { c2.id != id });
        contracts.clear();
        contracts.append(filtered);
        true;
      };
      case null false;
    };
  };
}
