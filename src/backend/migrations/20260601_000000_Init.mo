import Map "mo:core/Map";
import List "mo:core/List";

module {
  type OldActor = {};

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

  type NewActor = {
    labours : List.List<Labour>;
    contracts : List.List<Contract>;
    attendance : Map.Map<AttendanceKey, AttendanceValue>;
    advances : List.List<Advance>;
    adminCreds : { var value : ?AdminCredentials };
    state : { var nextLabourId : Nat; var nextContractId : Nat; var nextAdvanceId : Nat };
  };

  public func migration(_ : OldActor) : NewActor {
    {
      labours = List.empty<Labour>();
      contracts = List.empty<Contract>();
      attendance = Map.empty<AttendanceKey, AttendanceValue>();
      advances = List.empty<Advance>();
      adminCreds = { var value = null };
      state = { var nextLabourId = 1; var nextContractId = 1; var nextAdvanceId = 1 };
    };
  };
};
