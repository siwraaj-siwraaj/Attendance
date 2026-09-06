import Char "mo:core/Char";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Nat32 "mo:core/Nat32";
import Nat64 "mo:core/Nat64";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Types "../types/auth";

module {
  // Fixed application salt mixed into every password hash. A per-user random
  // salt would be stronger, but hashPassword takes only the password, so a
  // fixed salt keeps verification deterministic while still avoiding storing
  // the plaintext.
  let SALT = "caffeine-auth-salt-v1";

  // FNV-1a 64-bit hash of a string, rendered as a 16-digit lowercase hex
  // string. A simple deterministic hash — mo:core ships no SHA256, and the
  // requirement only forbids storing plaintext.
  func hashString(s : Text) : Text {
    var h : Nat64 = 14695981039346656037;
    for (c in s.chars()) {
      h := h ^ c.toNat32().toNat64();
      // FNV-1a is defined over wrapping 64-bit arithmetic; the plain `*`
      // operator traps on overflow, so use the wrapping `*%` form.
      h := h *% 1099511628211;
    };
    toHex(h)
  };

  func toHex(n : Nat64) : Text {
    let digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
    var result = "";
    var v = n;
    for (_ in Iter.repeat(0, 16)) {
      let idx = Nat64.toNat(v & 0xF);
      result := digits[idx] # result;
      v := v >> 4;
    };
    result
  };

  // Hash a plaintext password into its stored form (salted). The plaintext is
  // never stored or returned.
  public func hashPassword(password : Text) : Text {
    hashString(SALT # password)
  };

  // Verify a submitted password against a stored hash.
  public func verifyPassword(password : Text, hash : Text) : Bool {
    hashPassword(password) == hash
  };

  // Authenticate a username/password pair. Returns the signed-in user info on
  // success, or null when the username is unknown or the password is wrong.
  public func authenticate(users : Map.Map<Text, Types.User>, creds : Types.Credentials) : ?Types.AuthResult {
    switch (users.get(creds.username)) {
      case (?user) {
        if (verifyPassword(creds.password, user.passwordHash)) {
          ?{ username = user.username; role = user.role; status = user.status }
        } else { null };
      };
      case null { null };
    };
  };

  // Resolve a signed-in user's assigned role. Returns null when the username
  // has no account or is not yet approved.
  public func getRole(users : Map.Map<Text, Types.User>, username : Text) : ?Types.Role {
    switch (users.get(username)) {
      case (?user) {
        if (user.status == #approved) { ?user.role } else { null };
      };
      case null { null };
    };
  };

  // Resolve a signed-in user's approval status. Unknown usernames are pending.
  public func getStatus(users : Map.Map<Text, Types.User>, username : Text) : Types.UserStatus {
    switch (users.get(username)) {
      case (?user) user.status;
      case null #pending;
    };
  };

  // True when the user holds the Admin role.
  public func isAdmin(users : Map.Map<Text, Types.User>, username : Text) : Bool {
    switch (users.get(username)) {
      case (?user) user.role == #admin;
      case null false;
    };
  };

  // True when the user is approved and holds at least the given role. Admin
  // satisfies every required role; otherwise the role must match exactly.
  public func hasPermission(users : Map.Map<Text, Types.User>, username : Text, required : Types.Role) : Bool {
    switch (users.get(username)) {
      case (?user) {
        if (user.status != #approved) { false }
        else if (user.role == #admin) { true }
        else { user.role == required };
      };
      case null false;
    };
  };

  // Trap unless the user is approved and holds at least the given role.
  public func requireRole(users : Map.Map<Text, Types.User>, username : Text, required : Types.Role) {
    if (not hasPermission(users, username, required)) {
      Runtime.trap("Unauthorized");
    };
  };

  // Trap unless the user is approved (any role).
  public func requireApproved(users : Map.Map<Text, Types.User>, username : Text) {
    if (getStatus(users, username) != #approved) {
      Runtime.trap("Not approved");
    };
  };

  // Create a new user account with the given credentials, role and status.
  // Returns false when the username is already taken.
  public func createUser(users : Map.Map<Text, Types.User>, username : Text, password : Text, role : Types.Role, status : Types.UserStatus) : Bool {
    switch (users.get(username)) {
      case (?_) { return false };
      case null {};
    };
    users.add(username, {
      username = username;
      var passwordHash = hashPassword(password);
      var role = role;
      var status = status;
      var name = null : ?Text;
      var email = null : ?Text;
    });
    true
  };

  // Change an existing user's username and/or password. Returns false when the
  // new username is already taken by another account.
  public func updateUserCredentials(users : Map.Map<Text, Types.User>, oldUsername : Text, newUsername : Text, newPassword : ?Text) : Bool {
    switch (users.get(oldUsername)) {
      case null { false };
      case (?user) {
        // Reject when the new username is taken by a different account.
        if (newUsername != oldUsername) {
          switch (users.get(newUsername)) {
            case (?_) { return false };
            case null {};
          };
        };
        let updated = {
          username = newUsername;
          var passwordHash = switch (newPassword) {
            case (?p) hashPassword(p);
            case null user.passwordHash;
          };
          var role = user.role;
          var status = user.status;
          var name = user.name;
          var email = user.email;
        };
        users.remove(oldUsername);
        users.add(newUsername, updated);
        true
      };
    };
  };

  // Approve a pending user and assign their role in a single action.
  public func approveUser(users : Map.Map<Text, Types.User>, username : Text, role : Types.Role) {
    switch (users.get(username)) {
      case (?user) { user.status := #approved; user.role := role };
      case null {};
    };
  };

  // Change an existing user's role.
  public func setRole(users : Map.Map<Text, Types.User>, username : Text, role : Types.Role) {
    switch (users.get(username)) {
      case (?user) { user.role := role };
      case null {};
    };
  };

  // Revoke a user's access (marks them revoked so they can no longer act).
  public func revoke(users : Map.Map<Text, Types.User>, username : Text) {
    switch (users.get(username)) {
      case (?user) { user.status := #revoked };
      case null {};
    };
  };

  // List all users with their current role and approval status (admin panel).
  public func listUsers(users : Map.Map<Text, Types.User>) : [Types.UserInfo] {
    users.values().map(func user = toPublic(user)).toArray()
  };

  // Convert an internal user record to its shared public view.
  public func toPublic(user : Types.User) : Types.UserInfo {
    {
      username = user.username;
      role = user.role;
      status = user.status;
      name = user.name;
      email = user.email;
    }
  };
}
