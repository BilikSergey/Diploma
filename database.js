let db;

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
            const transaction = db.transaction(["database"], "readonly");
            const objectStore = transaction.objectStore("database");
            const getRequest = objectStore.get(1);

            getRequest.onsuccess = (event) => {
                resolve(event.target.result ? event.target.result.data : null);
            };
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            db.createObjectStore("database", { keyPath: "id" });
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
        const transaction = db.transaction(["database"], "readwrite");
        const objectStore = transaction.objectStore("database");
        objectStore.put({ id: 1, data: binaryArray });
    };

    request.onupgradeneeded = (event) => {
        const db = event.target.result;
        db.createObjectStore("database", { keyPath: "id" });
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
}
// Виведення даних через консоль
function viewDatabase() {
    const result = db.exec("SELECT * FROM users;");
    if (result.length > 0 && result[0].values.length > 0) {
        result[0].values.forEach(row => {
            console.log(`ID: ${row[0]}, Username: ${row[1]}, Email: ${row[2]}, Password: ${row[3]} Role: ${row[4]}`);
        });
    } else {
        console.log("No users found in the database.");
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
initDatabase();

// Функція для додавання користувача
function addUser(username, email, password, role) {
    db.run("INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)", [username, email, password, role]);
    saveDatabase();
    console.log("User succesfully added");
}

const authContainer = document.getElementById('auth-container');

// Функція для відображення форми авторизації
function showAuthForm() {
    authContainer.innerHTML = `
        <h2>Авторизуйтесь</h2>
        <form id="auth-form">
            <label for="email">Email:</label>
            <input type="text" id="email" name="email" required><br><br>
            <label for="password">Пароль:</label>
            <input type="password" id="password" name="password" required><br><br>
            <button type="submit">Увійти</button>
        </form>
        <p>Ще не зареєстровані? <a href="#" id="register-link">Зареєструйтесь тут</a></p>
    `;
    
    // Додаємо обробник для переходу до реєстрації
    document.getElementById('register-link').addEventListener('click', (event) => {
        event.preventDefault();
        showRegisterForm();
    });
}



showAuthForm();

// Функція для відображення форми реєстрації
function showRegisterForm() {
    authContainer.innerHTML = `
        <h2>Реєстрація</h2>
        <form id="register-form">
            <label for="new-name">Name:</label>
            <input type="text" id="new-name" name="name" required><br><br>
            <label for="new-email">Email:</label>
            <input type="email" id="new-email" name="email" required 
            pattern="[A-Za-z0-9]+@[A-Za-z0-9]+[A-Za-z0-9]+" 
            title="Please enter a valid email address"/><br><br>
            <label for="new-password">Пароль:</label>
            <input type="password" id="new-password" name="password" required 
               pattern="^[A-Za-z\d@$!%*?&]{6,20}$" 
                title="Password must have 6 symbols at least "/><br><br>
            <label for="role">Role:</label>
            <select id="role" name="role" required>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
            </select>
            <button id="submit" type="button">Submit</button>
        </form>
        <p>Вже зареєстровані? <a href="#" id="login-link">Увійдіть тут</a></p>
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
    
    // if (!checkEmailExists(email)) {
    //     //додавання користувача в БД
    //     document.getElementById("submit").addEventListener("click", async function(event) {
    //         event.preventDefault(); // Запобігаємо стандартному надсиланню форм
            
    //             alert("This email is already registered. Please use a different one.");            
    //             // Додаємо нового користувача до бази
    //             addUser(username, email, password, role);
    //             event.target.submit(); // Відправляємо форму, якщо email унікальний
    //     });
    // }
    
    

    // async function checkEmailExists(email) {
    //     const stmt = db.prepare("SELECT 1 FROM users WHERE email = ?");
    //     stmt.bind([email]);
    //     const exists = stmt.step();
    //     stmt.free();
    //     return exists;
    // }

    // document.getElementById('submit_button_id').addEventListener('click', () => {        
    //     const username = document.getElementById('new-name').value;
    //     const email = document.getElementById('new-email').value;
    //     const password = document.getElementById('new-password').value;
    //     const role = document.getElementById('role').value;

    //     const stmt = db.prepare("SELECT 1 FROM users WHERE email = ?");
    //     stmt.bind([email]);
    //     const emailExists = stmt.step(); // Повертає true, якщо є результат (тобто email існує)

    //     const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    //     const checkedEmail = emailRegex.test(email);

    //     const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    //     const checkedPass = passwordRegex.test(password);


    //             addUser(username, email, password, role);
    //             event.preventDefault();
    //             showAuthForm();
            
        
    //  });
    
}
