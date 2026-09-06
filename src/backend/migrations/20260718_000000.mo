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

  // OldActor matches the NewActor of 20260604_120000_RemoveAdminCreds.mo,
  // the current tail of the migration chain (no adminCreds field).
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
    adminCreds : { var value : ?AdminCredentials };
  };

  // Re-introduces admin credential storage and seeds the default admin
  // credentials (username "admin", password "admin123") so the admin can sign
  // in immediately on first deploy. The password is stored as a hash; the
  // frontend communicates the defaults to the operator.
  public func migration(old : OldActor) : NewActor {
    {
      labours = old.labours;
      contracts = old.contracts;
      attendance = old.attendance;
      advances = old.advances;
      state = old.state;
      adminCreds = { var value = ?{ username = "admin"; passwordHash = "c63bc483" } };
    };
  };
};
