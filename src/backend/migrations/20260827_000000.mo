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

  type AdminCredentials = {
    username : Text;
    passwordHash : Text;
  };

  // OldActor matches the NewActor of 20260718_000000.mo (the current tail),
  // which includes the adminCreds field.
  type OldActor = {
    labours : List.List<Labour>;
    contracts : List.List<Contract>;
    attendance : Map.Map<AttendanceKey, AttendanceValue>;
    advances : List.List<Advance>;
    state : { var nextLabourId : Nat; var nextContractId : Nat; var nextAdvanceId : Nat };
    adminCreds : { var value : ?AdminCredentials };
  };

  type NewActor = {
    labours : List.List<Labour>;
    contracts : List.List<Contract>;
    attendance : Map.Map<AttendanceKey, AttendanceValue>;
    advances : List.List<Advance>;
    state : { var nextLabourId : Nat; var nextContractId : Nat; var nextAdvanceId : Nat };
  };

  // Removes the adminCreds stable field. The app no longer uses backend
  // authentication — the frontend uses a simple Admin/User mode selection with
  // no credentials. All business data (labours, contracts, attendance,
  // advances, state) is preserved unchanged.
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
