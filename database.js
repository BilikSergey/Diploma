let db;
const authContainer = document.getElementById('auth-container');

showAuthForm();
initDatabase();


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
            id REAL PRIMARY KEY,
            test_id INTEGER,
            text TEXT NOT NULL,
            response_type TEXT NOT NULL,
            rating INTEGER,
            FOREIGN KEY (test_id) REFERENCES tests(id)
        );
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS options (
            id REAL PRIMARY KEY,
            question_id INTEGER,
            option_id INTEGER,
            text TEXT NOT NULL,
            is_correct TEXT NOT NULL
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
        resultUsers[0].values.forEach(row => {
            console.log(`ID: ${row[0]}, Username: ${row[1]}, Email: ${row[2]}, Password: ${row[3]} Role: ${row[4]}`);
        });
    } else {
        console.log("No users found in the database.");
    }
    if (resultTests.length > 0 && resultTests[0].values.length > 0) {
        resultTests[0].values.forEach(row => {
              console.log(`ID: ${row[0]}, user_id: ${row[1]}, title: ${row[2]}`);
        });
     } else {
        console.log("No tests found in the database.");
      }

     if (resultQuestions.length > 0 && resultQuestions[0].values.length > 0) {
          resultQuestions[0].values.forEach(row => {
               console.log(`ID: ${row[0]}, test_id: ${row[1]}, text: ${row[2]}, response_type: ${row[3]}, rating: ${row[4]}`);
        });
       } else {
          console.log("No questions found in the database.");
       }

     if (resultOptions.length > 0 && resultOptions[0].values.length > 0) {
          resultOptions[0].values.forEach(row => {
            console.log(`ID: ${row[0]}, question_id: ${row[1]}, text: ${row[2]}, is_correct: ${row[3]}`);
          });
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

// Функція для додавання користувача
function addUser(username, email, password, role) {
    db.run("INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)", [username, email, password, role]);
    saveDatabase();
    console.log("User succesfully added");
}

function findUserByEmail(email) {
    const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
    const result = stmt.get([email]);
    stmt.free();
    return result;
}

// Функція для відображення форми авторизації
function showAuthForm() {
    authContainer.innerHTML = `
        <h2>Authorization</h2>
        <form id="auth-form">
            <label for="email">Email:</label>
            <input type="text" id="email" name="email"><br><br>
            <label for="password">Password:</label>
            <input type="password" id="password" name="password"><br><br>
            <button id="id_login_button" type="button">Login</button>
        </form>
        <p>Don't register yet? <a href="#" id="register-link">Registration</a></p>
    `;
    
    // Додаємо обробник для переходу до реєстрації
    document.getElementById('register-link').addEventListener('click', (event) => {
        event.preventDefault();
        showRegisterForm();
    });
    document.getElementById("id_login_button").addEventListener('click', () =>{
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const user = findUserByEmail(email);
        switch(true){
        case(email===""):
            alert("Fill input 'Email'");
            break;
        case (user.length===[].length):
            alert("User with this email didn't register");
            break;
        case(password===""):
            alert("Fill input 'Password'");
            break;
        case(user&&password!==user[3]):
            alert("Password is not correct");
            break;
        case(user[4]==="student"&&password===user[3]):
            saveUserData(user)
            window.location.href = 'cabinet_student.html';
            break;
        case(user[4]==="teacher"&&password===user[3]):
            saveUserData(user)
            window.location.href = 'cabinet_teacher.html';
            break;
        }
    });
}

// Функція для відображення форми реєстрації
function showRegisterForm() {
    authContainer.innerHTML = `
        <h2>Registration</h2>
        <form id="register-form">
            <label for="new-name">Name:</label>
            <input type="text" id="new-name" name="name"><br><br>
            <label for="new-email">Email:</label>
            <input type="email" id="new-email" name="email"><br><br>
            <label for="new-password">Password:</label>
            <input type="password" id="new-password" name="password"><br><br>
            <label for="role">Role:</label>
            <select id="role" name="role">
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
            </select>
            <button id="submit" type="button">Sign up</button>
        </form>
        <p>Are you registered? <a href="#" id="login-link">Login</a></p>
    `;
    // Додаємо обробник для повернення до авторизації
    document.getElementById('login-link').addEventListener('click', (event) => {
        event.preventDefault();
        showAuthForm();
    });

    document.getElementById('submit').addEventListener('click', () =>{
        const username = document.getElementById('new-name').value;
        const email = document.getElementById('new-email').value;
        const password = document.getElementById('new-password').value;
        const role = document.getElementById('role').value;

        const stmt = db.prepare("SELECT 1 FROM users WHERE email = ?");
        stmt.bind([email]);
        const emailExists = stmt.step(); // Повертає true, якщо є результат (тобто email існує)

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const checkedEmail = emailRegex.test(email);

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        const checkedPass = passwordRegex.test(password);

        switch(true){
            case (username===""):
                alert("Fill input 'Name'");
                break;
            case (email===""):
                alert("Fill input 'Email'");
                break;
            case (!checkedEmail):
                alert("Please enter a valid email address");
                break;
            case (emailExists):
                alert("The email already exists");
                break;
            case (password===""):
                alert("Fill input 'Password'");
                break;
            case (!checkedPass):
                alert("Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character");
                break;
            case (true):
                addUser(username, email, password, role);
                event.preventDefault();
                showAuthForm();
                break;
        }
    });
}

// Зберегти дані користувача після авторизації
function saveUserData(user) {
    localStorage.setItem("userId", user[0]);
    localStorage.setItem("userName", user[1]);
    localStorage.setItem("userEmail", user[2]);
    localStorage.setItem("userPassword", user[3]);
    localStorage.setItem("userRole", user[4]);
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




