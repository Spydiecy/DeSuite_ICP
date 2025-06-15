import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Blob "mo:base/Blob";
import Nat32 "mo:base/Nat32";
import Char "mo:base/Char";

actor UserManagement {

    type User = {
        id: Principal;
        username: Text;
        firstName: Text;
        lastName: Text;
        email: Text;
        passwordHash: Text;
        profilePicture: ?Blob;
    };

    private stable var usersEntries : [(Text, User)] = [];
    private var userMap = HashMap.HashMap<Text, User>(1, Text.equal, Text.hash);
    private var emailToUsername = HashMap.HashMap<Text, Text>(1, Text.equal, Text.hash);

    // Simple hash function (not secure, for demonstration only)
    private func simpleHash(s: Text) : Text {
        var h : Nat32 = 0;
        for (c in s.chars()) {
            h := h +% Nat32.fromNat(Nat32.toNat(h << 5) + Nat32.toNat(h >> 2) + Nat32.toNat(Char.toNat32(c)));
        };
        Nat32.toText(h)
    };

    public shared(msg) func registerUser(username: Text, firstName: Text, lastName: Text, email: Text, password: Text) : async Result.Result<(), Text> {
        switch (userMap.get(username)) {
            case (?_) {
                #err("Username already exists")
            };
            case (null) {
                let newUser : User = {
                    id = msg.caller;
                    username = username;
                    firstName = firstName;
                    lastName = lastName;
                    email = email;
                    passwordHash = simpleHash(password);
                    profilePicture = null;
                };
                userMap.put(username, newUser);
                emailToUsername.put(email, username);
                #ok()
            };
        }
    };

    public query func getUser(username: Text) : async Result.Result<User, Text> {
        switch (userMap.get(username)) {
            case (?user) {
                #ok(user)
            };
            case (null) {
                #err("User not found")
            };
        }
    };

    public shared(msg) func updateUser(username: Text, firstName: Text, lastName: Text, email: Text) : async Result.Result<(), Text> {
        switch (userMap.get(username)) {
            case (?user) {
                if (user.id == msg.caller) {
                    let updatedUser : User = {
                        id = user.id;
                        username = username;
                        firstName = firstName;
                        lastName = lastName;
                        email = email;
                        passwordHash = user.passwordHash;
                        profilePicture = user.profilePicture;
                    };
                    userMap.put(username, updatedUser);
                    emailToUsername.put(email, username);
                    #ok()
                } else {
                    #err("Not authorized to update this user")
                }
            };
            case (null) {
                #err("User not found")
            };
        }
    };

    public shared(msg) func changePassword(username: Text, currentPassword: Text, newPassword: Text) : async Result.Result<(), Text> {
        switch (userMap.get(username)) {
            case (?user) {
                if (user.id == msg.caller) {
                    if (user.passwordHash == simpleHash(currentPassword)) {
                        let updatedUser : User = {
                            id = user.id;
                            username = user.username;
                            firstName = user.firstName;
                            lastName = user.lastName;
                            email = user.email;
                            passwordHash = simpleHash(newPassword);
                            profilePicture = user.profilePicture;
                        };
                        userMap.put(username, updatedUser);
                        #ok()
                    } else {
                        #err("Current password is incorrect")
                    }
                } else {
                    #err("Not authorized to change this user's password")
                }
            };
            case (null) {
                #err("User not found")
            };
        }
    };

    public shared(msg) func uploadProfilePicture(username: Text, picture: Blob) : async Result.Result<(), Text> {
        switch (userMap.get(username)) {
            case (?user) {
                if (user.id == msg.caller) {
                    let updatedUser : User = {
                        id = user.id;
                        username = user.username;
                        firstName = user.firstName;
                        lastName = user.lastName;
                        email = user.email;
                        passwordHash = user.passwordHash;
                        profilePicture = ?picture;
                    };
                    userMap.put(username, updatedUser);
                    #ok()
                } else {
                    #err("Not authorized to update this user's profile picture")
                }
            };
            case (null) {
                #err("User not found")
            };
        }
    };

    public shared(msg) func deleteUser(username: Text) : async Result.Result<(), Text> {
        switch (userMap.get(username)) {
            case (?user) {
                if (user.id == msg.caller) {
                    userMap.delete(username);
                    emailToUsername.delete(user.email);
                    #ok()
                } else {
                    #err("Not authorized to delete this user")
                }
            };
            case (null) {
                #err("User not found")
            };
        }
    };

    public query func login(usernameOrEmail: Text, password: Text) : async Result.Result<User, Text> {
        var username = usernameOrEmail;
        
        switch (emailToUsername.get(usernameOrEmail)) {
            case (?u) { username := u; };
            case (null) { /* Input might be a username, continue */ };
        };

        switch (userMap.get(username)) {
            case (?user) {
                if (user.passwordHash == simpleHash(password)) {
                    #ok(user)
                } else {
                    #err("Invalid password")
                }
            };
            case (null) {
                #err("User not found")
            };
        }
    };

    system func preupgrade() {
        usersEntries := Iter.toArray(userMap.entries());
    };

    system func postupgrade() {
        userMap := HashMap.fromIter<Text, User>(usersEntries.vals(), 1, Text.equal, Text.hash);
        usersEntries := [];
        for ((username, user) in userMap.entries()) {
            emailToUsername.put(user.email, username);
        };
    };
}