import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";

actor Notes {
    type NoteId = Nat;
    type UserId = Principal;

    type Note = {
        id: NoteId;
        title: Text;
        content: Text;
        owner: UserId;
        createdAt: Int;
        updatedAt: Int;
    };

    private func natHash(n: Nat) : Nat32 {
        return Nat32.fromNat(n);
    };

    private stable var nextNoteId: NoteId = 0;
    private stable var notesEntries : [(NoteId, Note)] = [];
    private var notes = HashMap.HashMap<NoteId, Note>(1, Nat.equal, natHash);
    private var userNotes = HashMap.HashMap<UserId, [NoteId]>(1, Principal.equal, Principal.hash);

    public shared(msg) func createNote(title: Text, content: Text) : async Result.Result<NoteId, Text> {
        let caller = msg.caller;
        let noteId = nextNoteId;
        nextNoteId += 1;

        let newNote : Note = {
            id = noteId;
            title = title;
            content = content;
            owner = caller;
            createdAt = Time.now();
            updatedAt = Time.now();
        };

        notes.put(noteId, newNote);
        
        switch (userNotes.get(caller)) {
            case (null) { userNotes.put(caller, [noteId]); };
            case (?existingNotes) {
                userNotes.put(caller, Array.append(existingNotes, [noteId]));
            };
        };

        #ok(noteId)
    };

    public shared(msg) func updateNote(noteId: NoteId, title: Text, content: Text) : async Result.Result<(), Text> {
        switch (notes.get(noteId)) {
            case (?note) {
                if (note.owner == msg.caller) {
                    let updatedNote : Note = {
                        id = note.id;
                        title = title;
                        content = content;
                        owner = note.owner;
                        createdAt = note.createdAt;
                        updatedAt = Time.now();
                    };
                    notes.put(noteId, updatedNote);
                    #ok()
                } else {
                    #err("Access denied")
                }
            };
            case (null) { #err("Note not found") };
        }
    };

    public shared(msg) func deleteNote(noteId: NoteId) : async Result.Result<(), Text> {
        switch (notes.get(noteId)) {
            case (?note) {
                if (note.owner == msg.caller) {
                    notes.delete(noteId);
                    switch (userNotes.get(msg.caller)) {
                        case (?userNoteIds) {
                            let updatedUserNotes = Array.filter(userNoteIds, func (id: NoteId) : Bool { id != noteId });
                            userNotes.put(msg.caller, updatedUserNotes);
                        };
                        case (null) {};
                    };
                    #ok()
                } else {
                    #err("Access denied")
                }
            };
            case (null) { #err("Note not found") };
        }
    };

    public shared(msg) func getNote(noteId: NoteId) : async Result.Result<Note, Text> {
        switch (notes.get(noteId)) {
            case (?note) {
                if (note.owner == msg.caller) {
                    #ok(note)
                } else {
                    #err("Access denied")
                }
            };
            case (null) { #err("Note not found") };
        }
    };

    public shared(msg) func getUserNotes() : async [Note] {
        switch (userNotes.get(msg.caller)) {
            case (?noteIds) {
                Array.mapFilter(noteIds, func (id: NoteId) : ?Note { notes.get(id) })
            };
            case (null) { [] };
        }
    };

    system func preupgrade() {
        notesEntries := Iter.toArray(notes.entries());
    };

    system func postupgrade() {
        notes := HashMap.fromIter<NoteId, Note>(notesEntries.vals(), 1, Nat.equal, natHash);
        notesEntries := [];

        for ((noteId, note) in notes.entries()) {
            switch (userNotes.get(note.owner)) {
                case (null) { userNotes.put(note.owner, [noteId]); };
                case (?existingNotes) {
                    let alreadyExists = Option.isSome(Array.find(existingNotes, func (id: NoteId) : Bool { id == noteId }));
                    if (not alreadyExists) {
                        userNotes.put(note.owner, Array.append(existingNotes, [noteId]));
                    };
                };
            };
        };
    };
}