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

actor TaskManager {
    type TaskId = Nat;
    type UserId = Principal;

    type Task = {
        id: TaskId;
        title: Text;
        description: Text;
        status: TaskStatus;
        dueDate: ?Int;
        createdAt: Int;
        updatedAt: Int;
        owner: UserId;
    };

    type TaskStatus = {
        #todo;
        #inProgress;
        #done;
    };

    private func natHash(n: Nat) : Nat32 {
        return Nat32.fromNat(n);
    };

    private stable var nextTaskId: TaskId = 0;
    private stable var tasksEntries : [(TaskId, Task)] = [];
    private var tasks = HashMap.HashMap<TaskId, Task>(1, Nat.equal, natHash);
    private var userTasks = HashMap.HashMap<UserId, [TaskId]>(1, Principal.equal, Principal.hash);

    public shared(msg) func createTask(title: Text, description: Text, dueDate: ?Int) : async Result.Result<TaskId, Text> {
        let caller = msg.caller;
        let taskId = nextTaskId;
        nextTaskId += 1;

        let newTask : Task = {
            id = taskId;
            title = title;
            description = description;
            status = #todo;
            dueDate = dueDate;
            createdAt = Time.now();
            updatedAt = Time.now();
            owner = caller;
        };

        tasks.put(taskId, newTask);
        
        switch (userTasks.get(caller)) {
            case (null) { userTasks.put(caller, [taskId]); };
            case (?existingTasks) {
                userTasks.put(caller, Array.append(existingTasks, [taskId]));
            };
        };

        #ok(taskId)
    };

    public shared(msg) func updateTask(taskId: TaskId, title: Text, description: Text, status: TaskStatus, dueDate: ?Int) : async Result.Result<(), Text> {
        switch (tasks.get(taskId)) {
            case (?task) {
                if (task.owner == msg.caller) {
                    let updatedTask : Task = {
                        id = task.id;
                        title = title;
                        description = description;
                        status = status;
                        dueDate = dueDate;
                        createdAt = task.createdAt;
                        updatedAt = Time.now();
                        owner = task.owner;
                    };
                    tasks.put(taskId, updatedTask);
                    #ok()
                } else {
                    #err("Access denied")
                }
            };
            case (null) { #err("Task not found") };
        }
    };

    public shared(msg) func deleteTask(taskId: TaskId) : async Result.Result<(), Text> {
        switch (tasks.get(taskId)) {
            case (?task) {
                if (task.owner == msg.caller) {
                    tasks.delete(taskId);
                    switch (userTasks.get(msg.caller)) {
                        case (?userTaskIds) {
                            let updatedUserTasks = Array.filter(userTaskIds, func (id: TaskId) : Bool { id != taskId });
                            userTasks.put(msg.caller, updatedUserTasks);
                        };
                        case (null) {};
                    };
                    #ok()
                } else {
                    #err("Access denied")
                }
            };
            case (null) { #err("Task not found") };
        }
    };

    public query(msg) func getTask(taskId: TaskId) : async Result.Result<Task, Text> {
        switch (tasks.get(taskId)) {
            case (?task) {
                if (task.owner == msg.caller) {
                    #ok(task)
                } else {
                    #err("Access denied")
                }
            };
            case (null) { #err("Task not found") };
        }
    };

    public query(msg) func getUserTasks() : async [Task] {
        switch (userTasks.get(msg.caller)) {
            case (?taskIds) {
                Array.mapFilter(taskIds, func (id: TaskId) : ?Task { tasks.get(id) })
            };
            case (null) { [] };
        }
    };

    system func preupgrade() {
        tasksEntries := Iter.toArray(tasks.entries());
    };

    system func postupgrade() {
        tasks := HashMap.fromIter<TaskId, Task>(tasksEntries.vals(), 1, Nat.equal, natHash);
        tasksEntries := [];

        for ((taskId, task) in tasks.entries()) {
            switch (userTasks.get(task.owner)) {
                case (null) { userTasks.put(task.owner, [taskId]); };
                case (?existingTasks) {
                    let alreadyExists = Option.isSome(Array.find(existingTasks, func (id: TaskId) : Bool { id == taskId }));
                    if (not alreadyExists) {
                        userTasks.put(task.owner, Array.append(existingTasks, [taskId]));
                    };
                };
            };
        };
    };
}