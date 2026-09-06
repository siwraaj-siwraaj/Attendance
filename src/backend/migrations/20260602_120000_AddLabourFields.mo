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

  type Contract = {
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

  type OldLabour = {
    id : Nat;
    name : Text;
    createdAt : Int;
  };

  type NewLabour = {
    id : Nat;
    name : Text;
    employeeId : Text;
    joinDate : Text;
    isActive : Bool;
    createdAt : Int;
  };

  type OldActor = {
    labours : List.List<OldLabour>;
    contracts : List.List<Contract>;
    attendance : Map.Map<AttendanceKey, AttendanceValue>;
    advances : List.List<Advance>;
    state : { var nextLabourId : Nat; var nextContractId : Nat; var nextAdvanceId : Nat };
  };

  type NewActor = {
    labours : List.List<NewLabour>;
    contracts : List.List<Contract>;
    attendance : Map.Map<AttendanceKey, AttendanceValue>;
    advances : List.List<Advance>;
    state : { var nextLabourId : Nat; var nextContractId : Nat; var nextAdvanceId : Nat };
  };

  public func migration(old : OldActor) : NewActor {
    let labours = old.labours.map<OldLabour, NewLabour>(
      func(l) {
        { l with employeeId = ""; joinDate = ""; isActive = true };
      }
    );
    {
      labours;
      contracts = old.contracts;
      attendance = old.attendance;
      advances = old.advances;
      state = old.state;
    };
  };
};
