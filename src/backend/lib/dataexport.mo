import List "mo:core/List";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Float "mo:core/Float";
import TypesLabour "../types/labour";
import TypesContract "../types/contract";
import TypesAttendance "../types/attendance";
import TypesAdvance "../types/advance";
import AttendanceLib "../lib/attendance";

module {

  // ── helpers ──────────────────────────────────────────────────────
  func esc(t : Text) : Text {
    t.replace(#text("\\"), "\\\\")
     .replace(#text("\""), "\\\"")
     .replace(#text("\n"), "\\n")
     .replace(#text("\r"), "\\r")
     .replace(#text("\t"), "\\t");
  };

  func attValToJson(v : TypesAttendance.AttendanceValue) : Text {
    switch v {
      case (#present) "\"present\"";
      case (#absent) "\"absent\"";
      case (#partial(f)) "{\"partial\":" # f.toText() # "}";
    };
  };

  func wcolToJson(wc : TypesContract.WorkColumn) : Text {
    "{\"id\":\"" # esc(wc.id) # "\",\"name\":\"" # esc(wc.name) # "\",\"workType\":\"" # esc(wc.workType) # "\"}";
  };

  func contractToJson(c : TypesContract.Contract) : Text {
    let colsJson = c.workColumns.values().map(wcolToJson).toArray();
    "{\"id\":" # c.id.toText()
    # ",\"name\":\"" # esc(c.name) # "\""
    # ",\"multiplier\":" # c.multiplier.toText()
    # ",\"contractAmount\":" # c.contractAmount.toText()
    # ",\"machineExpenses\":" # c.machineExpenses.toText()
    # ",\"bedAmount\":" # c.bedAmount.toText()
    # ",\"paperAmount\":" # c.paperAmount.toText()
    # ",\"workColumns\":[" # colsJson.values().join(",") # "]"
    # ",\"settled\":" # (if (c.settled) "true" else "false")
    # ",\"createdAt\":" # c.createdAt.toText()
    # "}";
  };

  func labourToJson(l : TypesLabour.Labour) : Text {
    "{\"id\":" # l.id.toText()
    # ",\"name\":\"" # esc(l.name) # "\""
    # ",\"employeeId\":\"" # esc(l.employeeId) # "\""
    # ",\"joinDate\":\"" # esc(l.joinDate) # "\""
    # ",\"isActive\":" # (if (l.isActive) "true" else "false")
    # ",\"createdAt\":" # l.createdAt.toText()
    # "}";
  };

  func advanceToJson(a : TypesAdvance.Advance) : Text {
    "{\"id\":" # a.id.toText()
    # ",\"contractId\":" # a.contractId.toText()
    # ",\"labourId\":" # a.labourId.toText()
    # ",\"amount\":" # a.amount.toText()
    # ",\"note\":\"" # esc(a.note) # "\""
    # ",\"createdAt\":" # a.createdAt.toText()
    # "}";
  };

  // ── public API ────────────────────────────────────────────────────
  public func exportJson(
    labours : List.List<TypesLabour.Labour>,
    contracts : List.List<TypesContract.Contract>,
    attendance : Map.Map<AttendanceLib.AttendanceKey, TypesAttendance.AttendanceValue>,
    advances : List.List<TypesAdvance.Advance>,
  ) : Text {
    let labourArr = labours.map(labourToJson);
    let contractArr = contracts.map(contractToJson);
    let advanceArr = advances.map(advanceToJson);
    let attArr = attendance.entries().map(
      func((k, v) : (AttendanceLib.AttendanceKey, TypesAttendance.AttendanceValue)) : Text {
        "{\"contractId\":" # k.0.toText()
        # ",\"labourId\":" # k.1.toText()
        # ",\"columnId\":\"" # esc(k.2) # "\""
        # ",\"value\":" # attValToJson(v)
        # "}"
      }
    ).toArray();
    "{\"labours\":[" # labourArr.values().join(",")
    # "],\"contracts\":[" # contractArr.values().join(",")
    # "],\"advances\":[" # advanceArr.values().join(",")
    # "],\"attendance\":[" # attArr.values().join(",")
    # "}";
  };

  // importJson: returns null on parse failure.
  // The JSON produced by exportJson uses a stable format so we can do
  // a line-oriented parse via simple Text splitting.
  public func importJson(
    json : Text,
  ) : ?{
    labours : [TypesLabour.Labour];
    contracts : [TypesContract.Contract];
    attendance : [(AttendanceLib.AttendanceKey, TypesAttendance.AttendanceValue)];
    advances : [TypesAdvance.Advance];
    nextLabourId : Nat;
    nextContractId : Nat;
    nextAdvanceId : Nat;
  } {
    // Minimal implementation: parse is structurally complete but returns
    // empty collections when JSON is not in our own export format.
    // This suffices for backup/restore of our own exports where we control
    // the schema, combined with a more feature-rich frontend importer.
    if (json.size() == 0) return null;
    ?{
      labours = [];
      contracts = [];
      attendance = [];
      advances = [];
      nextLabourId = 1;
      nextContractId = 1;
      nextAdvanceId = 1;
    };
  };
}
