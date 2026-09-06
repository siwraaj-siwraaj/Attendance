module {
  public type Timestamp = Int;
  public type LabourId = Nat;
  public type ContractId = Nat;
  public type AdvanceId = Nat;

  public type Result<T, E> = { #ok : T; #err : E };
}
