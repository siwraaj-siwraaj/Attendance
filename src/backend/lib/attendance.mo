import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Order "mo:core/Order";
import TypesAttendance "../types/attendance";

module {
  public type AttendanceValue = TypesAttendance.AttendanceValue;
  public type AttendanceRecord = TypesAttendance.AttendanceRecord;

  // Key is (contractId, labourId, columnId)
  public type AttendanceKey = (Nat, Nat, Text);

  public func compareKey(a : AttendanceKey, b : AttendanceKey) : Order.Order {
    let c0 = Nat.compare(a.0, b.0);
    if (not c0.isEqual()) return c0;
    let c1 = Nat.compare(a.1, b.1);
    if (not c1.isEqual()) return c1;
    Text.compare(a.2, b.2);
  };

  public func getByContract(attendance : Map.Map<AttendanceKey, AttendanceValue>, contractId : Nat) : [AttendanceRecord] {
    attendance.entries().filter(func((k, _v)) { k.0 == contractId }).map(func((k, v)) {
      { contractId = k.0; labourId = k.1; columnId = k.2; value = v };
    }).toArray();
  };

  public func getAll(attendance : Map.Map<AttendanceKey, AttendanceValue>) : [AttendanceRecord] {
    attendance.entries().map(func((k, v)) {
      { contractId = k.0; labourId = k.1; columnId = k.2; value = v };
    }).toArray();
  };

  public func setAttendance(
    attendance : Map.Map<AttendanceKey, AttendanceValue>,
    contractId : Nat,
    labourId : Nat,
    columnId : Text,
    value : AttendanceValue,
  ) : Bool {
    attendance.add(compareKey, (contractId, labourId, columnId), value);
    true;
  };
}
