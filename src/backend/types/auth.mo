module {
  // The four application roles. Every signed-in user has exactly one role.
  // Unassigned users are pending approval and cannot access data.
  public type Role = {
    #admin;
    #attendanceOnly;
    #contractOnly;
    #viewOnly;
  };

  // Approval lifecycle for a user account.
  public type UserStatus = {
    #pending;
    #approved;
    #revoked;
  };

  // Credentials submitted by the login form. Username is the account key;
  // password is compared against the stored hash.
  public type Credentials = {
    username : Text;
    password : Text;
  };

  // Internal (non-shared) user record, keyed by username. `var` fields make
  // this non-shared, so it is never exposed across the API boundary directly.
  // `passwordHash` is a salted hash of the password; the plaintext is never
  // stored.
  public type User = {
    username : Text;
    var passwordHash : Text;
    var role : Role;
    var status : UserStatus;
    var name : ?Text;
    var email : ?Text;
  };

  // Shared public view of a user, used by the admin panel and caller queries.
  // Never includes the password hash.
  public type UserInfo = {
    username : Text;
    role : Role;
    status : UserStatus;
    name : ?Text;
    email : ?Text;
  };

  // Result of a successful login: the signed-in user's identity and role.
  public type AuthResult = {
    username : Text;
    role : Role;
    status : UserStatus;
  };
}
