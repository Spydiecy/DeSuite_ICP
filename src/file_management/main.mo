import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Option "mo:base/Option";

actor FileManagement {
    type FileId = Nat;
    type UserId = Principal;

    type File = {
        id: FileId;
        name: Text;
        contentType: Text;
        size: Nat;
        data: Blob;
        owner: UserId;
        createdAt: Int;
    };

    // Constants
    let MAX_FILE_SIZE : Nat = 10 * 1024 * 1024; // 10 MB
    let MAX_USER_STORAGE : Nat = 100 * 1024 * 1024; // 100 MB per user
    let MAX_FILES_PER_USER : Nat = 100;

    private stable var nextFileId: FileId = 0;
    private stable var filesEntries : [(FileId, File)] = [];
    private var files = HashMap.HashMap<FileId, File>(1, Nat.equal, Nat32.fromNat);
    private var userFiles = HashMap.HashMap<UserId, [FileId]>(1, Principal.equal, Principal.hash);
    private var userStorage = HashMap.HashMap<UserId, Nat>(1, Principal.equal, Principal.hash);

    public shared(msg) func uploadFile(name: Text, contentType: Text, data: Blob) : async Result.Result<FileId, Text> {
        let caller = msg.caller;
        let fileSize = data.size();

        if (fileSize > MAX_FILE_SIZE) {
            return #err("File size exceeds the maximum allowed size of 10 MB");
        };

        let userCurrentStorage = Option.get(userStorage.get(caller), 0);
        if (userCurrentStorage + fileSize > MAX_USER_STORAGE) {
            return #err("Uploading this file would exceed your storage quota of 100 MB");
        };

        let userCurrentFiles = Option.get(userFiles.get(caller), []);
        if (userCurrentFiles.size() >= MAX_FILES_PER_USER) {
            return #err("You have reached the maximum number of files (100) allowed per user");
        };

        let fileId = nextFileId;
        nextFileId += 1;

        let newFile : File = {
            id = fileId;
            name = name;
            contentType = contentType;
            size = fileSize;
            data = data;
            owner = caller;
            createdAt = Time.now();
        };

        files.put(fileId, newFile);
        
        switch (userFiles.get(caller)) {
            case (null) { userFiles.put(caller, [fileId]); };
            case (?existingFiles) {
                userFiles.put(caller, Array.append(existingFiles, [fileId]));
            };
        };

        userStorage.put(caller, userCurrentStorage + fileSize);

        #ok(fileId)
    };

    public shared(msg) func getFile(fileId: FileId) : async Result.Result<File, Text> {
        switch (files.get(fileId)) {
            case (?file) {
                if (file.owner == msg.caller) {
                    #ok(file)
                } else {
                    #err("Access denied")
                }
            };
            case (null) { #err("File not found") };
        }
    };

    public shared(msg) func getUserFiles() : async [FileId] {
        Option.get(userFiles.get(msg.caller), [])
    };

    public shared(msg) func deleteFile(fileId: FileId) : async Result.Result<(), Text> {
        switch (files.get(fileId)) {
            case (?file) {
                if (file.owner == msg.caller) {
                    files.delete(fileId);
                    switch (userFiles.get(msg.caller)) {
                        case (?fileIds) {
                            let updatedFileIds = Array.filter(fileIds, func (id: FileId) : Bool { id != fileId });
                            userFiles.put(msg.caller, updatedFileIds);
                        };
                        case (null) {};
                    };
                    // Update user storage
                    let userCurrentStorage = Option.get(userStorage.get(msg.caller), 0);
                    userStorage.put(msg.caller, userCurrentStorage - file.size);
                    #ok()
                } else {
                    #err("Access denied")
                }
            };
            case (null) { #err("File not found") };
        }
    };

    public shared(msg) func downloadFile(fileId: FileId) : async Result.Result<Blob, Text> {
        switch (files.get(fileId)) {
            case (?file) {
                if (file.owner == msg.caller) {
                    #ok(file.data)
                } else {
                    #err("Access denied")
                }
            };
            case (null) { #err("File not found") };
        }
    };

    public shared(msg) func getUserStorageUsage() : async Nat {
        Option.get(userStorage.get(msg.caller), 0)
    };

    system func preupgrade() {
        filesEntries := Iter.toArray(files.entries());
    };

    system func postupgrade() {
        files := HashMap.fromIter<FileId, File>(filesEntries.vals(), 1, Nat.equal, Nat32.fromNat);
        userFiles := HashMap.HashMap<UserId, [FileId]>(1, Principal.equal, Principal.hash);
        userStorage := HashMap.HashMap<UserId, Nat>(1, Principal.equal, Principal.hash);

        for ((fileId, file) in filesEntries.vals()) {
            switch (userFiles.get(file.owner)) {
                case (null) { userFiles.put(file.owner, [fileId]); };
                case (?existingFiles) {
                    userFiles.put(file.owner, Array.append(existingFiles, [fileId]));
                };
            };
            
            let userCurrentStorage = Option.get(userStorage.get(file.owner), 0);
            userStorage.put(file.owner, userCurrentStorage + file.size);
        };

        filesEntries := [];
    };
}