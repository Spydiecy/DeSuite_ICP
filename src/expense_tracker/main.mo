import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Float "mo:base/Float";
import Int "mo:base/Int";
import Char "mo:base/Char";

actor ExpenseTracker {
    type ExpenseId = Nat;
    type UserId = Principal;

    type Expense = {
        id: ExpenseId;
        amount: Float;
        category: Text;
        description: Text;
        date: Int;
        owner: UserId;
    };

    private func natHash(n: Nat) : Nat32 {
        return Nat32.fromNat(n);
    };

    private stable var nextExpenseId: ExpenseId = 0;
    private stable var expensesEntries : [(ExpenseId, Expense)] = [];
    private var expenses = HashMap.HashMap<ExpenseId, Expense>(1, Nat.equal, natHash);
    private var userExpenses = HashMap.HashMap<UserId, [ExpenseId]>(1, Principal.equal, Principal.hash);

    // Helper function to convert text to float
    private func textToFloat(t : Text) : ?Float {
        var int : Int = 0;
        var frac : Float = 0;
        var div : Float = 1;
        var isNeg = false;
        for (c in t.chars()) {
            if (c == '-') {
                isNeg := true;
            } else if (c == '.') {
                div := 10;
            } else if (c >= '0' and c <= '9') {
                let digit = Nat32.toNat(Char.toNat32(c) - 48);
                if (div == 1) {
                    int := int * 10 + digit;
                } else {
                    frac += Float.fromInt(digit) / div;
                    div *= 10;
                };
            } else {
                return null;
            };
        };
        let result = Float.fromInt(int) + frac;
        ?( if (isNeg) -result else result )
    };

    // Helper function to convert text to Int
    private func textToInt(t : Text) : ?Int {
        var int : Int = 0;
        var isNeg = false;
        for (c in t.chars()) {
            if (c == '-') {
                isNeg := true;
            } else if (c >= '0' and c <= '9') {
                int := int * 10 + Nat32.toNat(Char.toNat32(c) - 48);
            } else {
                return null;
            };
        };
        ?( if (isNeg) -int else int )
    };

    public shared(msg) func addExpense(amount: Float, category: Text, description: Text, date: Int) : async Result.Result<ExpenseId, Text> {
        let caller = msg.caller;
        let expenseId = nextExpenseId;
        nextExpenseId += 1;

        let newExpense : Expense = {
            id = expenseId;
            amount = amount;
            category = category;
            description = description;
            date = date;
            owner = caller;
        };

        expenses.put(expenseId, newExpense);
        
        switch (userExpenses.get(caller)) {
            case (null) { userExpenses.put(caller, [expenseId]); };
            case (?existingExpenses) {
                userExpenses.put(caller, Array.append(existingExpenses, [expenseId]));
            };
        };

        #ok(expenseId)
    };

    public shared(msg) func updateExpense(expenseId: ExpenseId, amount: Float, category: Text, description: Text, date: Int) : async Result.Result<(), Text> {
        switch (expenses.get(expenseId)) {
            case (?expense) {
                if (expense.owner == msg.caller) {
                    let updatedExpense : Expense = {
                        id = expense.id;
                        amount = amount;
                        category = category;
                        description = description;
                        date = date;
                        owner = expense.owner;
                    };
                    expenses.put(expenseId, updatedExpense);
                    #ok()
                } else {
                    #err("Access denied")
                }
            };
            case (null) { #err("Expense not found") };
        }
    };

    public shared(msg) func deleteExpense(expenseId: ExpenseId) : async Result.Result<(), Text> {
        switch (expenses.get(expenseId)) {
            case (?expense) {
                if (expense.owner == msg.caller) {
                    expenses.delete(expenseId);
                    switch (userExpenses.get(msg.caller)) {
                        case (?userExpenseIds) {
                            let updatedUserExpenses = Array.filter(userExpenseIds, func (id: ExpenseId) : Bool { id != expenseId });
                            userExpenses.put(msg.caller, updatedUserExpenses);
                        };
                        case (null) {};
                    };
                    #ok()
                } else {
                    #err("Access denied")
                }
            };
            case (null) { #err("Expense not found") };
        }
    };

    public query(msg) func getExpense(expenseId: ExpenseId) : async Result.Result<Expense, Text> {
        switch (expenses.get(expenseId)) {
            case (?expense) {
                if (expense.owner == msg.caller) {
                    #ok(expense)
                } else {
                    #err("Access denied")
                }
            };
            case (null) { #err("Expense not found") };
        }
    };

    public query(msg) func getUserExpenses() : async [Expense] {
        switch (userExpenses.get(msg.caller)) {
            case (?expenseIds) {
                Array.mapFilter(expenseIds, func (id: ExpenseId) : ?Expense { expenses.get(id) })
            };
            case (null) { [] };
        }
    };

    public shared(msg) func importExpensesFromCSV(csvData: [Text]) : async Result.Result<Nat, Text> {
        var importedCount = 0;
        for (row in csvData.vals()) {
            let fields = Iter.toArray(Text.split(row, #text(",")));
            if (fields.size() == 4) {
                switch (textToFloat(fields[0]), textToInt(fields[3])) {
                    case (?amount, ?date) {
                        let result = await addExpense(amount, fields[1], fields[2], date);
                        switch (result) {
                            case (#ok(_)) { importedCount += 1; };
                            case (#err(_)) {};
                        };
                    };
                    case (_, _) {};
                };
            };
        };
        #ok(importedCount)
    };

    public query(msg) func exportExpensesToCSV() : async Text {
        let userExpensesList = switch (userExpenses.get(msg.caller)) {
            case (?expenseIds) {
                Array.mapFilter(expenseIds, func (id: ExpenseId) : ?Expense { expenses.get(id) })
            };
            case (null) { [] };
        };

        let csvRows = Array.map<Expense, Text>(userExpensesList, func (expense : Expense) : Text {
            Float.toText(expense.amount) # "," #
            expense.category # "," #
            expense.description # "," #
            Int.toText(expense.date)
        });

        Text.join("\n", csvRows.vals())
    };

    system func preupgrade() {
        expensesEntries := Iter.toArray(expenses.entries());
    };

    system func postupgrade() {
        expenses := HashMap.fromIter<ExpenseId, Expense>(expensesEntries.vals(), 1, Nat.equal, natHash);
        expensesEntries := [];

        for ((expenseId, expense) in expenses.entries()) {
            switch (userExpenses.get(expense.owner)) {
                case (null) { userExpenses.put(expense.owner, [expenseId]); };
                case (?existingExpenses) {
                    let alreadyExists = Option.isSome(Array.find(existingExpenses, func (id: ExpenseId) : Bool { id == expenseId }));
                    if (not alreadyExists) {
                        userExpenses.put(expense.owner, Array.append(existingExpenses, [expenseId]));
                    };
                };
            };
        };
    };
}