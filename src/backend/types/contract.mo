module {
  public type WorkColumn = {
    id : Text;
    name : Text;
    workType : Text;
  };

  public type Contract = {
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
}
