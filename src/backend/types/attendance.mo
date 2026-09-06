module {
  public type AttendanceValue = {
    #present;
    #absent;
    #partial : Float;
  };

  public type AttendanceRecord = {
    contractId : Nat;
    labourId : Nat;
    columnId : Text;
    value : AttendanceValue;
  };
}
