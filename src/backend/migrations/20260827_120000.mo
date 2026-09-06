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

  type Labour = {
    id : Nat;
    name : Text;
    employeeId : Text;
    joinDate : Text;
    isActive : Bool;
    createdAt : Int;
  };

  type Role = { #admin; #attendanceOnly; #contractOnly; #viewOnly };
  type UserStatus = { #pending; #approved; #revoked };
  type User = {
    principal : Principal;
    var role : Role;
    var status : UserStatus;
    var name : ?Text;
    var email : ?Text;
  };

  // OldActor matches the NewActor of 20260827_000000.mo (the current tail),
  // which has no adminCreds field.
  type OldActor = {
    labours : List.List<Labour>;
    contracts : List.List<Contract>;
    attendance : Map.Map<AttendanceKey, AttendanceValue>;
    advances : List.List<Advance>;
    state : { var nextLabourId : Nat; var nextContractId : Nat; var nextAdvanceId : Nat };
  };

  type NewActor = {
    labours : List.List<Labour>;
    contracts : List.List<Contract>;
    attendance : Map.Map<AttendanceKey, AttendanceValue>;
    advances : List.List<Advance>;
    state : { var nextLabourId : Nat; var nextContractId : Nat; var nextAdvanceId : Nat };
    users : Map.Map<Principal, User>;
  };

  // Adds the users stable field backing the role/approval system. It starts
  // empty; the first user to register is auto-granted the Admin role at
  // runtime. All existing business data is preserved unchanged.
  public func migration(old : OldActor) : NewActor {
    {
      labours = old.labours;
      contracts = old.contracts;
      attendance = old.attendance;
      advances = old.advances;
      state = old.state;
      users = Map.empty();
    };
  };
};
