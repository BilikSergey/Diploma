import { DatabaseManager, TablesManager } from "./database.js";
const authContainer = document.getElementById("auth-container");
showAuthForm();
let dbManager;
let tablesManager;
let timeoutId;

(async () => {
  dbManager = new DatabaseManager();
  await dbManager.init();
})();

async function addUser(username, email, password, role) {
  const tableName = "users";
  const columnsString = "username, email, password, role";
  const questionMarkString = "?, ?, ?, ?";
  const valuesArray = [username, email, password, role];
  tablesManager = new TablesManager(dbManager);
  tablesManager.addIntoTable(tableName, columnsString, questionMarkString, valuesArray);
  dbManager.saveDatabase();
  tablesManager.viewAllTable("users");
  console.log("User added!");
}

async function hashPassword(password) {
  const textEncoder = new TextEncoder();
  const encodedPassword = textEncoder.encode(password);

  const hashBuffer = await window.crypto.subtle.digest(
    "SHA-256",
    encodedPassword
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

function findUserByEmail(email) {
  const stmt = dbManager.db.prepare("SELECT * FROM users WHERE email = ?");
  const result = stmt.get([email]);
  stmt.free();
  return result;
}

// Функція для відображення форми авторизації
function showAuthForm() {
  authContainer.innerHTML = `
        <h2>Login</h2>
        <form id="auth-form">
            <label for="email">Email:</label>
            <input type="text" id="email" name="email" class="styled-input"><br><br>
            <label for="password">Password:</label>
            <input type="password" id="password" name="password" class="styled-input"><br><br>
            <button id="id_login_button" class="submit_btn" type="button">Log in</button>
        </form>
        <p>Don't register yet? <a href="#" id="register-link">Sign up</a></p>
    `;

  // Додаємо обробник для переходу до реєстрації
  document
    .getElementById("register-link")
    .addEventListener("click", (event) => {
      event.preventDefault();
      showRegisterForm();
    });
  document
    .getElementById("id_login_button")
    .addEventListener("click", async () => {
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const hashedPassword = await hashPassword(password);
      const user = findUserByEmail(email);
      switch (true) {
        case email === "":
          showErrorMessage("Field 'Email' cannot be empty");
          break;
        case user.length === [].length:
          showErrorMessage("User with this email didn't register");
          break;
        case password === "":
          showErrorMessage("Field 'password' cannot be empty");
          break;
        case user && hashedPassword !== user[3]:
          showErrorMessage("Password is not correct");
          break;
        case user[4] === "student" && hashedPassword === user[3]:
          saveUserData(user);
          window.location.href = "cabinet_student.html";
          break;
        case user[4] === "teacher" && hashedPassword === user[3]:
          saveUserData(user);
          window.location.href = "cabinet_teacher.html";
          break;
      }
    });
}

// Функція для відображення форми реєстрації
function showRegisterForm() {
  authContainer.innerHTML = `
        <h2>Sign up</h2>
        <form id="register-form">
            <label for="new-name">Name:</label>
            <input type="text" id="new-name" name="name" class="styled-input"><br><br>
            <label for="new-email">Email:</label>
            <input type="email" id="new-email" name="email" class="styled-input"><br><br>
            <label for="new-password">Password:</label>
            <input type="password" id="new-password" name="password" class="styled-input"><br><br>
            <label for="role">Role:</label>
            <select id="role" name="role" class="styled-selector">
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
            </select>
            <button id="submit" type="button" class="submit_btn">Register</button>
        </form>
        <p>Are you registered? <a href="#" id="login-link">Login</a></p>
    `;
  // Додаємо обробник для повернення до авторизації
  document.getElementById("login-link").addEventListener("click", (event) => {
    event.preventDefault();
    showAuthForm();
  });

  document.getElementById("submit").addEventListener("click", async () => {
    const username = document.getElementById("new-name").value;
    const email = document.getElementById("new-email").value;
    const password = document.getElementById("new-password").value;
    const role = document.getElementById("role").value;
    const hashedPassword = await hashPassword(password);

    const stmtUsername = dbManager.db.prepare(
      "SELECT 1 FROM users WHERE username = ?"
    );
    stmtUsername.bind([username]);
    const usernameExists = stmtUsername.step();
    const stmtEmail = dbManager.db.prepare(
      "SELECT 1 FROM users WHERE email = ?"
    );
    stmtEmail.bind([email]);
    const emailExists = stmtEmail.step();

    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_-]{2,19}$/;
    const checkedUsername = usernameRegex.test(username);
    const emailRegex = /^[a-zA-Z0-9_%+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
    const checkedEmail = emailRegex.test(email);

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const checkedPass = passwordRegex.test(password);

    switch (true) {
      case username === "":
        showErrorMessage("Field 'username' cannot be empty");
        break;
      case !checkedUsername:
        showErrorMessage(
          "The username must contain between 3 and 20 characters and start with a letter without spaces"
        );
        break;
      case usernameExists:
        showErrorMessage("The username already exists");
        break;
      case email === "":
        showErrorMessage("Field 'email' cannot be empty");
        break;
      case !checkedEmail:
        showErrorMessage("Please enter a valid email address");
        break;
      case emailExists:
        showErrorMessage("The email already exists");
        break;
      case password === "":
        showErrorMessage("Field 'password' cannot be empty");
        break;
      case !checkedPass:
        showErrorMessage(
          "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character"
        );
        break;
      case true:
        addUser(username, email, hashedPassword, role);
        showAuthForm();
        break;
    }
  });
}

function showErrorMessage(textError) {
  clearTimeout(timeoutId);
  const errorMessage = document.getElementById("error-message");
  errorMessage.style.display = "block"; // Показати повідомлення
  errorMessage.textContent = textError;
  // Приховати повідомлення через 3 секунди
  timeoutId = setTimeout(() => {
    errorMessage.style.display = "none";
  }, 3000);
}

// Зберегти дані користувача після авторизації
function saveUserData(user) {
  localStorage.setItem("userId", user[0]);
  localStorage.setItem("userName", user[1]);
  localStorage.setItem("userEmail", user[2]);
  localStorage.setItem("userPassword", user[3]);
  localStorage.setItem("userRole", user[4]);
}
