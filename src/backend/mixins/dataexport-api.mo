import List "mo:core/List";
import Map "mo:core/Map";
import TypesAuth "../types/auth";
import TypesLabour "../types/labour";
import TypesContract "../types/contract";
import TypesAttendance "../types/attendance";
import TypesAdvance "../types/advance";
import AttendanceLib "../lib/attendance";
import DataExportLib "../lib/dataexport";
import AuthLib "../lib/auth";

mixin (
  users : Map.Map<Text, TypesAuth.User>,
  session : { var currentUser : ?Text },
  labours : List.List<TypesLabour.Labour>,
  contracts : List.List<TypesContract.Contract>,
  attendance : Map.Map<AttendanceLib.AttendanceKey, TypesAttendance.AttendanceValue>,
  advances : List.List<TypesAdvance.Advance>,
  state : { var nextLabourId : Nat; var nextContractId : Nat; var nextAdvanceId : Nat },
  currentUser : () -> Text,
) {
  public query func exportData() : async Text {
    AuthLib.requireApproved(users, currentUser());
    DataExportLib.exportJson(labours, contracts, attendance, advances);
  };

  public shared func importData(json : Text) : async { #ok : Bool; #err : Text } {
    AuthLib.requireRole(users, currentUser(), #admin);
    switch (DataExportLib.importJson(json)) {
      case null { #err "Invalid backup data" };
      case (?data) {
        // Restore labours
        labours.clear();
        for (l in data.labours.values()) { labours.add(l) };

        // Restore contracts
        contracts.clear();
        for (c in data.contracts.values()) { contracts.add(c) };

        // Restore advances
        advances.clear();
        for (a in data.advances.values()) { advances.add(a) };

        // Restore attendance
        attendance.clear();
        for ((k, v) in data.attendance.values()) {
          attendance.add(AttendanceLib.compareKey, k, v);
        };

        // Restore counters
        state.nextLabourId := data.nextLabourId;
        state.nextContractId := data.nextContractId;
        state.nextAdvanceId := data.nextAdvanceId;

        #ok true;
      };
    };
  };
}
