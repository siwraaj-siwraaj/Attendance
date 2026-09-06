import Map "mo:core/Map";
import List "mo:core/List";

module {
  type AttendanceKey = (Nat, Nat, Text);
  type AttendanceValue = { #present; #absent; #partial : Float };

  type AdminCredentials = { username : Text; passwordHash : Text };

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

  type Contract = {
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
    contracts : List.List<Contract>;
    attendance : Map.Map<AttendanceKey, AttendanceValue>;
    advances : List.List<Advance>;
    adminCreds : { var value : ?AdminCredentials };
    state : { var nextLabourId : Nat; var nextContractId : Nat; var nextAdvanceId : Nat };
  };

  type NewActor = {
    labours : List.List<Labour>;
    contracts : List.List<Contract>;
    attendance : Map.Map<AttendanceKey, AttendanceValue>;
    advances : List.List<Advance>;
    state : { var nextLabourId : Nat; var nextContractId : Nat; var nextAdvanceId : Nat };
  };

  public func migration(old : OldActor) : NewActor {
    {
      labours = old.labours;
      contracts = old.contracts;
      attendance = old.attendance;
      advances = old.advances;
      state = old.state;
    };
  };
};
