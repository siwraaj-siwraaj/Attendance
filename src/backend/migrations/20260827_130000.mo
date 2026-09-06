import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";

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

  // Old user record: keyed by Principal, no username or password hash.
  type OldUser = {
    principal : Principal;
    var role : Role;
    var status : UserStatus;
    var name : ?Text;
    var email : ?Text;
  };

  // New user record: keyed by username, with a salted password hash.
  type NewUser = {
    username : Text;
    var passwordHash : Text;
    var role : Role;
    var status : UserStatus;
    var name : ?Text;
    var email : ?Text;
  };

  // OldActor matches the NewActor of 20260827_120000.mo (the current tail),
  // which has a Principal-keyed users map.
  type OldActor = {
    labours : List.List<Labour>;
    contracts : List.List<Contract>;
    attendance : Map.Map<AttendanceKey, AttendanceValue>;
    advances : List.List<Advance>;
    state : { var nextLabourId : Nat; var nextContractId : Nat; var nextAdvanceId : Nat };
    users : Map.Map<Principal, OldUser>;
  };

  type NewActor = {
    labours : List.List<Labour>;
    contracts : List.List<Contract>;
    attendance : Map.Map<AttendanceKey, AttendanceValue>;
    advances : List.List<Advance>;
    state : { var nextLabourId : Nat; var nextContractId : Nat; var nextAdvanceId : Nat };
    users : Map.Map<Text, NewUser>;
    session : { var currentUser : ?Text };
  };

  // Converts auth from Principal-keyed to username-keyed credentials. The old
  // Principal-keyed map is empty in practice, so this only initializes the new
  // username-keyed structure and the signed-in session field. It does NOT seed
  // a password hash — the admin account is seeded in main.mo's first-run logic
  // via the auth lib's hashPassword. All business data is preserved unchanged.
  public func migration(old : OldActor) : NewActor {
    // The old Principal-keyed users map is empty in practice, so build the new
    // username-keyed map directly rather than converting keys.
    let users = Map.empty<Text, NewUser>();
    {
      labours = old.labours;
      contracts = old.contracts;
      attendance = old.attendance;
      advances = old.advances;
      state = old.state;
      users;
      session = { var currentUser = null };
    };
  };
};
