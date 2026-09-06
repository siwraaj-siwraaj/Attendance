import List "mo:core/List";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import TypesAuth "types/auth";
import TypesLabour "types/labour";
import TypesContract "types/contract";
import TypesAttendance "types/attendance";
import TypesAdvance "types/advance";
import AttendanceLib "lib/attendance";
import AuthLib "lib/auth";
import AuthMixin "mixins/auth-api";
import LabourMixin "mixins/labour-api";
import ContractMixin "mixins/contract-api";
import AttendanceMixin "mixins/attendance-api";
import AdvanceMixin "mixins/advance-api";
import DataExportMixin "mixins/dataexport-api";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import ListEntity "mo:caffeineai-oql/ListEntity";
import FloatValue "mo:caffeineai-oql/FloatValue";
import BoolValue "mo:caffeineai-oql/BoolValue";
import IntValue "mo:caffeineai-oql/IntValue";
import NatValue "mo:caffeineai-oql/NatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import RecordValue "mo:caffeineai-oql/RecordValue";

actor {
  let users : Map.Map<Text, TypesAuth.User>;
  let session : { var currentUser : ?Text };
  let labours : List.List<TypesLabour.Labour>;
  let contracts : List.List<TypesContract.Contract>;
  let attendance : Map.Map<AttendanceLib.AttendanceKey, TypesAttendance.AttendanceValue>;
  let advances : List.List<TypesAdvance.Advance>;
  let state : { var nextLabourId : Nat; var nextContractId : Nat; var nextAdvanceId : Nat };

  // First-run seeding: when no accounts exist yet, create the admin account.
  // The password hash is computed here via the auth lib (not in the migration),
  // so the plaintext is never stored and the hash scheme stays in one place.
  if (users.size() == 0) {
    users.add("siwraaj", {
      username = "siwraaj";
      var passwordHash = AuthLib.hashPassword("74482");
      var role : TypesAuth.Role = #admin;
      var status : TypesAuth.UserStatus = #approved;
      var name : ?Text = null;
      var email : ?Text = null;
    });
  };

  // Resolve the signed-in user's username from the shared session record.
  // Defined once here and passed into the domain mixins so the private
  // definitions do not collide when included into the single actor block.
  // Traps when no user is signed in.
  func currentUser() : Text {
    switch (session.currentUser) {
      case (?u) u;
      case null { Runtime.trap("Not signed in") };
    };
  };

  include AuthMixin(users, session);
  include LabourMixin(users, session, labours, state, currentUser);
  include ContractMixin(users, session, contracts, state, currentUser);
  include AttendanceMixin(users, session, attendance, currentUser);
  include AdvanceMixin(users, session, advances, state, currentUser);
  include DataExportMixin(users, session, labours, contracts, attendance, advances, state, currentUser);

  // OQL (Data Intelligence) — exposes schema() and execute(qJson) query methods.
  // Every persisted collection is a queryable entity. Authorization is
  // per-entity; this operational data has no per-user ownership, so all
  // entities are #controllerOnly (the Data Intelligence controller reads,
  // others denied). Auth is username-keyed (users is Map<Text, User>, the
  // signed-in user lives in session.currentUser); the app's RBAC gates
  // access at the application layer, and OQL exposes no Principal-based
  // ownership scoping — the old model is not used here.
  // Helper to render the attendance variant as a queryable text value.
  func attendanceValueText(v : TypesAttendance.AttendanceValue) : Text = switch v {
    case (#present) "present";
    case (#absent) "absent";
    case (#partial(_f)) "partial";
  };

  include Expose({
    entities = [
      // Labour — flat record of primitives, auto-derived.
      labours.toEntity("labour", "Labour", "id")
        .sample({ id = 0; name = ""; employeeId = ""; joinDate = ""; isActive = false; createdAt = 0 })
        .controllerOnly()
        .build(),

      // Contract — manual: workColumns is a nested array (not a flat
      // queryable column), so we declare each scalar field explicitly.
      contracts.toEntityManual("contract", "Contract", "id")
        .payload("id", func(c : TypesContract.Contract) : Nat = c.id)
        .payload("name", func(c : TypesContract.Contract) : Text = c.name)
        .payload("multiplier", func(c : TypesContract.Contract) : Float = c.multiplier)
        .payload("contractAmount", func(c : TypesContract.Contract) : Float = c.contractAmount)
        .payload("machineExpenses", func(c : TypesContract.Contract) : Float = c.machineExpenses)
        .payload("bedAmount", func(c : TypesContract.Contract) : Float = c.bedAmount)
        .payload("paperAmount", func(c : TypesContract.Contract) : Float = c.paperAmount)
        .payload("meshAmount", func(c : TypesContract.Contract) : Float = c.meshAmount)
        .payload("settled", func(c : TypesContract.Contract) : Bool = c.settled)
        .payload("createdAt", func(c : TypesContract.Contract) : Int = c.createdAt)
        .sample({
          id = 0;
          name = "";
          multiplier = 1.0;
          contractAmount = 0.0;
          machineExpenses = 0.0;
          bedAmount = 0.0;
          paperAmount = 0.0;
          meshAmount = 0.0;
          workColumns = [];
          settled = false;
          createdAt = 0;
        })
        .controllerOnly()
        .build(),

      // Advance — flat record of primitives, auto-derived.
      advances.toEntity("advance", "Advance", "id")
        .sample({ id = 0; contractId = 0; labourId = 0; amount = 0.0; note = ""; createdAt = 0 })
        .controllerOnly()
        .build(),

      // Attendance — stored as Map<(contractId, labourId, columnId), value>.
      // Manual: Map.toEntityManual only exposes values, so use Entity.manual
      // with attendance.entries() to iterate (key, value) tuples directly.
      Entity.manual<(AttendanceLib.AttendanceKey, TypesAttendance.AttendanceValue)>("attendance", func () { attendance.entries() }, "Attendance", "contractId")
        .payload("contractId", func(((cId, _lId, _col), _v) : (AttendanceLib.AttendanceKey, TypesAttendance.AttendanceValue)) : Nat = cId)
        .payload("labourId", func(((_cId, lId, _col), _v) : (AttendanceLib.AttendanceKey, TypesAttendance.AttendanceValue)) : Nat = lId)
        .payload("columnId", func(((_cId, _lId, col), _v) : (AttendanceLib.AttendanceKey, TypesAttendance.AttendanceValue)) : Text = col)
        .payload("value", func((_k, v) : (AttendanceLib.AttendanceKey, TypesAttendance.AttendanceValue)) : Text = attendanceValueText(v))
        .domain("value", [#text("present"), #text("absent"), #text("partial")])
        .sample(((0, 0, ""), #present))
        .controllerOnly()
        .build(),
    ];
  });
};
