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

actor CalendarManager {
    type EventId = Nat;
    type UserId = Principal;

    type Event = {
        id: EventId;
        title: Text;
        description: Text;
        startTime: Int;
        endTime: Int;
        isAllDay: Bool;
        owner: UserId;
        createdAt: Int;
        updatedAt: Int;
    };

    private func natHash(n : Nat) : Nat32 {
        return Nat32.fromNat(n);
    };

    private stable var nextEventId: EventId = 0;
    private stable var eventsEntries : [(EventId, Event)] = [];
    private var events = HashMap.HashMap<EventId, Event>(1, Nat.equal, natHash);
    private var userEvents = HashMap.HashMap<UserId, [EventId]>(1, Principal.equal, Principal.hash);

    public shared(msg) func createEvent(title: Text, description: Text, startTime: Int, endTime: Int, isAllDay: Bool) : async Result.Result<EventId, Text> {
        let caller = msg.caller;
        let eventId = nextEventId;
        nextEventId += 1;

        let newEvent : Event = {
            id = eventId;
            title = title;
            description = description;
            startTime = startTime;
            endTime = endTime;
            isAllDay = isAllDay;
            owner = caller;
            createdAt = Time.now();
            updatedAt = Time.now();
        };

        events.put(eventId, newEvent);
        
        switch (userEvents.get(caller)) {
            case (null) { userEvents.put(caller, [eventId]); };
            case (?existingEvents) {
                userEvents.put(caller, Array.append(existingEvents, [eventId]));
            };
        };

        #ok(eventId)
    };

    public shared(msg) func updateEvent(eventId: EventId, title: Text, description: Text, startTime: Int, endTime: Int, isAllDay: Bool) : async Result.Result<(), Text> {
        switch (events.get(eventId)) {
            case (?event) {
                if (event.owner == msg.caller) {
                    let updatedEvent : Event = {
                        id = event.id;
                        title = title;
                        description = description;
                        startTime = startTime;
                        endTime = endTime;
                        isAllDay = isAllDay;
                        owner = event.owner;
                        createdAt = event.createdAt;
                        updatedAt = Time.now();
                    };
                    events.put(eventId, updatedEvent);
                    #ok()
                } else {
                    #err("Access denied")
                }
            };
            case (null) { #err("Event not found") };
        }
    };

    public shared(msg) func deleteEvent(eventId: EventId) : async Result.Result<(), Text> {
        switch (events.get(eventId)) {
            case (?event) {
                if (event.owner == msg.caller) {
                    events.delete(eventId);
                    switch (userEvents.get(msg.caller)) {
                        case (?userEventIds) {
                            let updatedUserEvents = Array.filter(userEventIds, func (id: EventId) : Bool { id != eventId });
                            userEvents.put(msg.caller, updatedUserEvents);
                        };
                        case (null) {};
                    };
                    #ok()
                } else {
                    #err("Access denied")
                }
            };
            case (null) { #err("Event not found") };
        }
    };

    public query(msg) func getEvent(eventId: EventId) : async Result.Result<Event, Text> {
        switch (events.get(eventId)) {
            case (?event) {
                if (event.owner == msg.caller) {
                    #ok(event)
                } else {
                    #err("Access denied")
                }
            };
            case (null) { #err("Event not found") };
        }
    };

    public query(msg) func getUserEvents() : async [Event] {
        switch (userEvents.get(msg.caller)) {
            case (?eventIds) {
                Array.mapFilter(eventIds, func (id: EventId) : ?Event { events.get(id) })
            };
            case (null) { [] };
        }
    };

    system func preupgrade() {
        eventsEntries := Iter.toArray(events.entries());
    };

    system func postupgrade() {
        events := HashMap.fromIter<EventId, Event>(eventsEntries.vals(), 1, Nat.equal, natHash);
        eventsEntries := [];

        for ((eventId, event) in events.entries()) {
            switch (userEvents.get(event.owner)) {
                case (null) { userEvents.put(event.owner, [eventId]); };
                case (?existingEvents) {
                    let alreadyExists = Option.isSome(Array.find(existingEvents, func (id: EventId) : Bool { id == eventId }));
                    if (not alreadyExists) {
                        userEvents.put(event.owner, Array.append(existingEvents, [eventId]));
                    };
                };
            };
        };
    };
}