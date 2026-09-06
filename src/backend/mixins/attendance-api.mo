import Map "mo:core/Map";
import Nat "mo:core/Nat";
import List "mo:core/List";
import TypesAuth "../types/auth";
import TypesAttendance "../types/attendance";
import AttendanceLib "../lib/attendance";
import AuthLib "../lib/auth";

mixin (users : Map.Map<Text, TypesAuth.User>, session : { var currentUser : ?Text }, attendance : Map.Map<AttendanceLib.AttendanceKey, TypesAttendance.AttendanceValue>, currentUser : () -> Text) {
  public query func getAttendance(contractId : Nat) : async [TypesAttendance.AttendanceRecord] {
    AuthLib.requireApproved(users, currentUser());
    AttendanceLib.getByContract(attendance, contractId);
  };

  public query func getAllAttendance() : async [TypesAttendance.AttendanceRecord] {
    AuthLib.requireApproved(users, currentUser());
    AttendanceLib.getAll(attendance);
  };

  public shared func setAttendance(
    contractId : Nat,
    labourId : Nat,
    columnId : Text,
    value : TypesAttendance.AttendanceValue,
  ) : async { #ok : Bool; #err : Text } {
    AuthLib.requireRole(users, currentUser(), #attendanceOnly);
    let ok = AttendanceLib.setAttendance(attendance, contractId, labourId, columnId, value);
    if ok #ok true else #err "Failed to set attendance";
  };

  public shared func batchSaveAttendance(
    updates : [(Nat, Nat, Text, TypesAttendance.AttendanceValue)]
  ) : async [Bool] {
    AuthLib.requireRole(users, currentUser(), #attendanceOnly);
    let buf = List.empty<Bool>();
    for ((contractId, labourId, columnId, value) in updates.vals()) {
      let ok = AttendanceLib.setAttendance(attendance, contractId, labourId, columnId, value);
      buf.add(ok);
    };
    buf.toArray();
  };
}
