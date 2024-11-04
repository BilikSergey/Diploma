// Ініціалізація бази даних
async function initDatabase() {
    const SQL = await initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/sql-wasm.wasm` });
    db = new SQL.Database();
    createTables();

    // Спробуємо завантажити базу даних з IndexedDB
    const storedData = await loadDatabase();
    if (storedData) {
        db = new SQL.Database(new Uint8Array(storedData));
    }
}

// Завантажити базу даних з IndexedDB
async function loadDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("DatabaseDiploma", 1);
        
        request.onerror = (event) => {
            console.error("Database error:", event);
            resolve(null);
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(["usersDatabase", "testsDatabase", "questionsDatabase", "optionsDatabase"], "readwrite");
            const usersStore = transaction.objectStore("usersDatabase");
            const testsStore = transaction.objectStore("testsDatabase");
            const questionsStore = transaction.objectStore("questionsDatabase");
            const optionsStore = transaction.objectStore("optionsDatabase");

            const getRequestUsers = usersStore.get(1);
            const getRequestTests = testsStore.get(1);
            const getRequestQuestions = questionsStore.get(1);
            const getRequestOptions = optionsStore.get(1);

            getRequestUsers.onsuccess = (event) => {
                resolve(event.target.result ? event.target.result.data : null);
            };
            getRequestTests.onsuccess = (event) => {
                resolve(event.target.result ? event.target.result.data : null);
            };
            getRequestQuestions.onsuccess = (event) => {
                resolve(event.target.result ? event.target.result.data : null);
            };
            getRequestOptions.onsuccess = (event) => {
                resolve(event.target.result ? event.target.result.data : null);
            };
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            db.createObjectStore("usersDatabase", { keyPath: "id" });
            db.createObjectStore("testsDatabase", { keyPath: "id" });
            db.createObjectStore("questionsDatabase", { keyPath: "id" });
            db.createObjectStore("optionsDatabase", { keyPath: "id" });
        };
    });
}

// Зберегти базу даних в IndexedDB
async function saveDatabase() {
    const binaryArray = db.export();
    const request = indexedDB.open("DatabaseDiploma", 1);

    request.onerror = (event) => {
        console.error("Database error:", event);
    };

    request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(["usersDatabase", "testsDatabase", "questionsDatabase", "optionsDatabase"], "readwrite");
        const usersStore = transaction.objectStore("usersDatabase");
        const testsStore = transaction.objectStore("testsDatabase");
        const questionsStore = transaction.objectStore("questionsDatabase");
        const optionsStore = transaction.objectStore("optionsDatabase");
        usersStore.put({ id: 1, data: binaryArray });
        testsStore.put({ id: 1, data: binaryArray });
        questionsStore.put({ id: 1, data: binaryArray });
        optionsStore.put({ id: 1, data: binaryArray });
    };

    request.onupgradeneeded = (event) => {
        const db = event.target.result;
        db.createObjectStore("usersDatabase", { keyPath: "id" });
        db.createObjectStore("testsDatabase", { keyPath: "id" });
        db.createObjectStore("questionsDatabase", { keyPath: "id" });
        db.createObjectStore("optionsDatabase", { keyPath: "id" });
    };
}

// Створення таблиці користувачів
function createTables() {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        );
    `);        
    db.run(`
        CREATE TABLE IF NOT EXISTS tests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            test_id INTEGER,
            text TEXT NOT NULL,
            response_type TEXT NOT NULL,
            rating INTEGER,
            FOREIGN KEY (test_id) REFERENCES tests(id)
        );
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS options (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_id INTEGER,
            test_id INTEGER,
            text TEXT NOT NULL,
            is_correct TEXT NOT NULL,
            FOREIGN KEY (question_id) REFERENCES questions(id),
            FOREIGN KEY (test_id) REFERENCES tests(id)
        );
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            test_id INTEGER,
            student_id INTEGER,
            submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (test_id) REFERENCES tests(id),
            FOREIGN KEY (student_id) REFERENCES users(id)
        );
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS responses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            test_id INTEGER,
            submission_id INTEGER,
            question_id INTEGER,
            FOREIGN KEY (test_id) REFERENCES tests(id),
            FOREIGN KEY (submission_id) REFERENCES submissions(id),
            FOREIGN KEY (question_id) REFERENCES questions(id)
        );
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS option_responses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            test_id INTEGER,
            submission_id INTEGER,
            question_id INTEGER,
            selected_option_id INTEGER,
            score INTEGER,
            FOREIGN KEY (test_id) REFERENCES tests(id),
            FOREIGN KEY (submission_id) REFERENCES submissions(id),
            FOREIGN KEY (question_id) REFERENCES questions(id)
        );
    `);
}

// Виведення даних через консоль
function viewDatabase() {
    const resultUsers = db.exec("SELECT * FROM users;");
    const resultTests = db.exec("SELECT * FROM tests;");
    const resultQuestions = db.exec("SELECT * FROM questions;");
    const resultOptions = db.exec("SELECT * FROM options;");
    if (resultUsers.length > 0 && resultUsers[0].values.length > 0) {
        console.log("users Database");
        resultUsers[0].values.forEach(row => {
            console.log(`ID: ${row[0]}, Username: ${row[1]}, Email: ${row[2]}, Password: ${row[3]} Role: ${row[4]}`);
        });
        console.log("___________________________________________");
    } else {
        console.log("No users found in the database.");
    }
    if (resultTests.length > 0 && resultTests[0].values.length > 0) {
        console.log("tests Database");
        resultTests[0].values.forEach(row => {
            console.log(`ID: ${row[0]}, user_id: ${row[1]}, title: ${row[2]}`);
        });
        console.log("___________________________________________");
    } else {
        console.log("No tests found in the database.");
    }

    if (resultQuestions.length > 0 && resultQuestions[0].values.length > 0) {
        console.log("questions Database");
        resultQuestions[0].values.forEach(row => {
            console.log(`ID: ${row[0]}, test_id: ${row[1]}, text: ${row[2]}, response_type: ${row[3]}, rating: ${row[4]}`);
        });
        console.log("___________________________________________");
    } else {
        console.log("No questions found in the database.");
    }

    if (resultOptions.length > 0 && resultOptions[0].values.length > 0) {
        console.log("options Database");
        resultOptions[0].values.forEach(row => {
            console.log(`ID: ${row[0]}, question_id: ${row[1]} test_id: ${row[2]}, text: ${row[3]}, is_correct: ${row[4]}`);
        });
        console.log("___________________________________________");
    } else {
        console.log("No options found in the database.");
    }
}

// Функція для видалення користувача за ID
function deleteUserById(userId) {
    const stmt = db.prepare("DELETE FROM users WHERE id = ?;");
    stmt.run([userId]);
    stmt.free();
    console.log(`User with ID ${userId} has been deleted.`);
}

function dropTable() {
    // Видаляємо таблицю users
    db.run("DROP TABLE IF EXISTS users;");
    console.log("Table 'users' has been deleted.");
}

function getUserData() {
    return {
        id: localStorage.getItem("userId"),
        name: localStorage.getItem("userName"),
        email: localStorage.getItem("userEmail"),
        password: localStorage.getItem("userPassword"),
        role: localStorage.getItem("userRole")
    };
}

function clearUserData() {
    localStorage.clear();
    window.location.href = 'welcome.html';
}

// Поверхневе копіювання
function shallowEqual(obj1, obj2) {
    if (Object.keys(obj1).length !== Object.keys(obj2).length) {
        return false;
    }
    for (let key in obj1) {
        if (obj1[key] !== obj2[key]) {
            return false;
        }
    }
    return true;
}

function viewTestsOfUser(id) {
    const queryUsers = `SELECT * FROM users WHERE id = ${id}`;
    try {
        const resultUsers = db.exec(queryUsers);
        if (resultUsers.length > 0) {
            resultUsers[0].values.forEach(row => {
                console.log(`ID: ${row[0]}, Username: ${row[1]}, Email: ${row[2]}, Password: ${row[3]} Role: ${row[4]}`);
            });
        } else {
            console.log("Запис з таким id не знайдено.");
        }
    } catch (error) {
        console.error("Помилка виконання запиту:", error);
    }

    const queryTests = `SELECT * FROM tests WHERE user_id = ${id}`;
    try {
        const resultTests = db.exec(queryTests);
        if (resultTests.length > 0) {
            resultTests[0].values.forEach(row => {
                console.log(`ID: ${row[0]}, user_id: ${row[1]}, title: ${row[2]}`);
            });
        } else {
            console.log("Запис з таким id не знайдено.");
        }
    } catch (error) {
        console.error("Помилка виконання запиту:", error);
    }
}

function viewContentOfTest(id) {
    const queryQuestion = `SELECT * FROM questions WHERE test_id = ${id}`;
    try {
        const resultQuestions = db.exec(queryQuestion);
        if (resultQuestions.length > 0 && resultQuestions[0].values.length > 0) {
            console.log("questions Database");
              resultQuestions[0].values.forEach(row => {
                console.log(`ID: ${row[0]}, test_id: ${row[1]}, text: ${row[2]}, response_type: ${row[3]}, rating: ${row[4]}`);
            });
            console.log("___________________________________________");
           } else {
              console.log("No questions found in the database.");
           }
    } catch (error) {
        console.error("Помилка виконання запиту:", error);
    }

    const queryOption = `SELECT * FROM options WHERE test_id = ${id}`;
    try {
        const resultOptions = db.exec(queryOption);
        if (resultOptions.length > 0 && resultOptions[0].values.length > 0) {
            console.log("options Database");
              resultOptions[0].values.forEach(row => {
                console.log(`ID: ${row[0]}, question_id: ${row[1]} test_id: ${row[2]}, text: ${row[3]}, is_correct: ${row[4]}`);
              });
              console.log("___________________________________________");
        } else {
            console.log("No options found in the database.");
        }
    } catch (error) {
        console.error("Помилка виконання запиту:", error);
    }
}