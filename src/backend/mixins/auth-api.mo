import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import AuthLib "../lib/auth";
import Types "../types/auth";

// The auth mixin tracks the signed-in user in a shared `session` record
// (declared once in main.mo and passed by reference). Mixins cannot hold
// stable state of their own, so the current-user field lives in that record.
mixin (users : Map.Map<Text, Types.User>, session : { var currentUser : ?Text }) {
  // Trap unless the caller is signed in and holds the admin role.
  func requireAdmin() {
    switch (session.currentUser) {
      case (?u) { AuthLib.requireRole(users, u, #admin) };
      case null { Runtime.trap("Not signed in") };
    };
  };

  // Authenticate a username/password pair and return the signed-in user info.
  // Returns null when the credentials are invalid, keeping the user on the
  // login page. The caller's identity is resolved by username, not Principal.
  public shared func login(creds : Types.Credentials) : async ?Types.AuthResult {
    switch (AuthLib.authenticate(users, creds)) {
      case (?result) {
        session.currentUser := ?result.username;
        ?result
      };
      case null { null };
    };
  };

  // Sign out the current caller. Returns the user to the login page.
  public shared func logout() : async () {
    session.currentUser := null;
  };

  // The signed-in user's assigned role, or null when pending/unassigned.
  public query func getCallerRole() : async ?Types.Role {
    switch (session.currentUser) {
      case (?u) AuthLib.getRole(users, u);
      case null null;
    };
  };

  // The signed-in user's approval status.
  public query func getCallerStatus() : async Types.UserStatus {
    switch (session.currentUser) {
      case (?u) AuthLib.getStatus(users, u);
      case null #pending;
    };
  };

  // Admin panel: list all users with role and approval status. Admin only.
  public query func listUsers() : async [Types.UserInfo] {
    requireAdmin();
    AuthLib.listUsers(users)
  };

  // Admin panel: create a new user account with a username and password.
  // Admin only. Returns false when the username is already taken.
  public shared func createUser(username : Text, password : Text, role : Types.Role) : async Bool {
    requireAdmin();
    AuthLib.createUser(users, username, password, role, #approved)
  };

  // Admin panel: change any user's username and/or password. Admin only.
  // Returns false when the new username is already taken by another account.
  public shared func updateUserCredentials(oldUsername : Text, newUsername : Text, newPassword : ?Text) : async Bool {
    requireAdmin();
    AuthLib.updateUserCredentials(users, oldUsername, newUsername, newPassword)
  };

  // Approve a pending user and assign their role in a single action. Admin only.
  public shared func approveUser(username : Text, role : Types.Role) : async () {
    requireAdmin();
    AuthLib.approveUser(users, username, role)
  };

  // Change any user's role. Admin only.
  public shared func setUserRole(username : Text, role : Types.Role) : async () {
    requireAdmin();
    AuthLib.setRole(users, username, role)
  };

  // Revoke a user's access. Admin only.
  public shared func revokeAccess(username : Text) : async () {
    requireAdmin();
    AuthLib.revoke(users, username)
  };
}
