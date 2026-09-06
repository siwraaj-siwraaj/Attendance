import Map "mo:core/Map";
import List "mo:core/List";

module {
  type AttendanceKey = (Nat, Nat, Text);
  type AttendanceValue = { #present; #absent; #partial : Float };

  type WorkColumn = {
    id : Text;
    name : Text;
    workType : Text;
  };

  type Labour = {
    id : Nat;
    name : Text;
    createdAt : Int;
  };

  type OldContract = {
    id : Nat;
    name : Text;
    multiplier : Float;
    contractAmount : Float;
    machineExpenses : Float;
    bedAmount : Float;
    paperAmount : Float;
    workColumns : [WorkColumn];
    settled : Bool;
    createdAt : Int;
  };

  type NewContract = {
    id : Nat;
    name : Text;
    multiplier : Float;
    contractAmount : Float;
    machineExpenses : Float;
    bedAmount : Float;
    paperAmount : Float;
    meshAmount : Float;
    workColumns : [WorkColumn];
    settled : Bool;
    createdAt : Int;
  };

  type Advance = {
    id : Nat;
    contractId : Nat;
    labourId : Nat;
    amount : Float;
    note : Text;
    createdAt : Int;
  };

  type OldActor = {
    labours : List.List<Labour>;
    contracts : List.List<OldContract>;
    attendance : Map.Map<AttendanceKey, AttendanceValue>;
    advances : List.List<Advance>;
    state : { var nextLabourId : Nat; var nextContractId : Nat; var nextAdvanceId : Nat };
  };

  type NewActor = {
    labours : List.List<Labour>;
    contracts : List.List<NewContract>;
    attendance : Map.Map<AttendanceKey, AttendanceValue>;
    advances : List.List<Advance>;
    state : { var nextLabourId : Nat; var nextContractId : Nat; var nextAdvanceId : Nat };
  };

  public func migration(old : OldActor) : NewActor {
    let contracts = old.contracts.map<OldContract, NewContract>(
      func(c) {
        let meshAmount = c.contractAmount - (c.bedAmount + c.paperAmount + c.machineExpenses);
        { c with meshAmount };
      }
    );
    {
      labours = old.labours;
      contracts;
      attendance = old.attendance;
      advances = old.advances;
      state = old.state;
    };
  };
};
