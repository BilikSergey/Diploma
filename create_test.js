let db;
let questionCount = 0;
let checkForSubmit = 0;
const userData = {};
const submit_button = document.getElementById("id_submit_button");
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




        function sendTestIntoDB(){
            const userData = getUserData();
            const testName = document.getElementById("id_input_test_name").value;
            db.run("INSERT INTO tests (user_id, title) VALUES (?, ?)", [userData.id, testName]);
            addTest();
            saveDatabase();
            viewDatabase();
        }


        function addTest() {
            for (let i = 1; i <= questionCount; i++) {
                const resultTests = db.exec("SELECT * FROM tests;");
                const test_id = resultTests[0].values.length;
                const text_question = document.getElementById(`question${i}`).value;
                let response_type;
                const rating = document.getElementById(`score${i}`).value;
                const selectorOptions = document.getElementById(`id-div-multiple-choice-options${i}`);
                response_type = selectorOptions.style.display === 'block' ? "multiple" : "true/false";
                const id_test_question = parseFloat(`${test_id}.${i}`); 
                db.run("INSERT INTO questions (id, test_id, text, response_type, rating) VALUES (?, ?, ?, ?, ?)", [id_test_question, test_id, text_question, response_type, rating]);
        
                const form_checkBox = document.querySelector(`#id-div-multiple-choice-options${i}`);
                const checkboxes = form_checkBox.querySelectorAll('input[type="checkbox"]');
                const form_of_CheckBox = document.getElementById(`id-div-multiple-choice-options${i}`);
                if (form_of_CheckBox.style.display === "block") {
                    for (let j = 1; j <= checkboxes.length; j++) {
                        const response_text = document.getElementById(`multipleChoiceText${i}${j}[]`).value;
                        const response_checkBox = document.getElementById(`multipleChoice${i}${j}[]`);
                        const id_test_option = parseFloat(`${test_id}.${i}${j}`); 
                        db.run("INSERT INTO options (id, question_id, option_id, text, is_correct) VALUES (?, ?, ?, ?, ?)", [id_test_option, id_test_question, j, response_text, response_checkBox.checked ? "true" : "false"]);
                    }
                } else {
                    for (let j = 1; j <= 2; j++) {
                        const radio_is_checked_true = document.getElementById(`id_true${i}`);
                        const radio_is_checked_false = document.getElementById(`id_false${i}`);
                        const id_test_option = parseFloat(`${test_id}.${i}${j}`); 
                        switch (true) {
                            case (j === 1 && radio_is_checked_true.checked):
                                db.run("INSERT INTO options (id, question_id, option_id, text, is_correct) VALUES (?, ?, ?, ?, ?)", [id_test_option, id_test_question, j, "true", "true"]);
                                break;
                            case (j === 1 && !radio_is_checked_true.checked):
                                db.run("INSERT INTO options (id, question_id, option_id, text, is_correct) VALUES (?, ?, ?, ?, ?)", [id_test_option, id_test_question, j, "true", "false"]);
                                break;
                            case (j === 2 && radio_is_checked_false.checked):
                                db.run("INSERT INTO options (id, question_id, option_id, text, is_correct) VALUES (?, ?, ?, ?, ?)", [id_test_option, id_test_question, j, "false", "true"]);
                                break;
                            case (j === 2 && !radio_is_checked_false.checked):
                                db.run("INSERT INTO options (id, question_id, option_id, text, is_correct) VALUES (?, ?, ?, ?, ?)", [id_test_option, id_test_question, j, "false", "false"]);
                                break;
                        }
                    }
                }
            }
        }
        

        // Отримати дані користувача
        function getUserData() {
            return {
                id: localStorage.getItem("userId"),
                name: localStorage.getItem("userName"),
                email: localStorage.getItem("userEmail"),
                password: localStorage.getItem("userPassword"),
                role: localStorage.getItem("userRole")
            };
        }

        function addQuestionForm(copyData = null) {
            let checkBoxCount = 1;
            submit_button.style.visibility = 'visible';
            questionCount++;
            checkForSubmit++;
            const container = document.getElementById('questionsContainer');
            const questionForm = document.createElement('div');
            questionForm.classList.add('question-form');
            questionForm.dataset.questionId = questionCount;

            const questionLabel = document.createElement('label');
            questionLabel.textContent = 'Запитання:';
            questionForm.appendChild(questionLabel);

            const questionInput = document.createElement('input');
            questionInput.type = 'text';
            questionInput.id = `question${questionCount}`;
            questionInput.name = `question${questionCount}`;
            questionInput.value = copyData ? copyData.question : '';
            questionForm.appendChild(questionInput);

            const typeSelect = document.createElement('select');
            typeSelect.name = `questionType${questionCount}`;
            typeSelect.onchange = (e) => toggleOptions(e.target, questionForm);

            const trueFalseOption = new Option('True/False', 'trueFalse');
            const multipleChoiceOption = new Option('Multiple Choice', 'multipleChoice');
            typeSelect.append(trueFalseOption, multipleChoiceOption);
            if (copyData) {
                typeSelect.value = copyData.type;
            }
            questionForm.appendChild(typeSelect);

            // True/False options
            const trueFalseOptions = document.createElement('div');
            trueFalseOptions.classList.add('true-false-options');
            trueFalseOptions.innerHTML = `
                <label><input id="id_true${questionCount}" type="radio" name="answer${questionCount}" value="true">True</label>
                <label><input id="id_false${questionCount}" type="radio" name="answer${questionCount}" value="false">False</label>
            `;
            questionForm.appendChild(trueFalseOptions);

            // Multiple Choice options
            const multipleChoiceOptions = document.createElement('div');
            multipleChoiceOptions.classList.add('options-container', 'multiple-choice-options');
            multipleChoiceOptions.id = `id-div-multiple-choice-options${questionCount}`;
            // multipleChoiceOptions.name = `name-div-multiple-choice-options${questionCount}`;
            multipleChoiceOptions.style.display = 'none';

            if (copyData && copyData.options) {
                copyData.options.forEach(option => addCheckboxOption(id_checkBox_Fectch, multipleChoiceOptions, checkBoxCount, option));
                checkBoxCount++;
            }
            const addOptionButton = document.createElement('button');
            addOptionButton.type = 'button';
            addOptionButton.textContent = 'Додати варіант';
            const id_checkBox_Fectch = questionCount;
            addOptionButton.onclick = () => {addCheckboxOption(id_checkBox_Fectch, multipleChoiceOptions, checkBoxCount); checkBoxCount++;}
            multipleChoiceOptions.appendChild(addOptionButton);
            questionForm.appendChild(multipleChoiceOptions);

            // Score container
            const scoreContainer = document.createElement('div');
            scoreContainer.classList.add('score-container');

            const scoreLabel = document.createElement('label');
            scoreLabel.textContent = 'Оцінка:';
            scoreContainer.appendChild(scoreLabel);

            const scoreInput = document.createElement('input');
            scoreInput.type = 'number';
            scoreInput.id = `score${questionCount}`;
            scoreInput.name = `score${questionCount}`;
            scoreInput.onkey = 'return isNumberKey(event)';
            scoreInput.style.width = `65px`;
            scoreInput.value = copyData ? copyData.score : '';
            scoreInput.min = 0;
            scoreContainer.appendChild(scoreInput);

            questionForm.appendChild(scoreContainer);

            const buttonsForm = document.createElement('div');
            buttonsForm.classList.add('button-container');
            const copyButton = document.createElement('button');
            copyButton.type = 'button';
            copyButton.textContent = 'Копіювати питання';
            copyButton.onclick = () => addQuestionForm({
                question: questionInput.value,
                type: typeSelect.value,
                score: scoreInput.value,
                options: [...multipleChoiceOptions.querySelectorAll('input[type="text"]')].map(input => input.value)
            });
            buttonsForm.appendChild(copyButton);
            questionForm.appendChild(buttonsForm);

            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.textContent = 'Видалити питання';
            deleteButton.onclick = () => {
                checkForSubmit--;
                questionForm.remove();
                if(checkForSubmit===0){submit_button.style.visibility = 'hidden';}
            }
            buttonsForm.appendChild(deleteButton);
            questionForm.appendChild(buttonsForm);

            container.appendChild(questionForm);
            if (copyData && copyData.type === 'multipleChoice') {
                typeSelect.dispatchEvent(new Event('change'));
            }
        }

        function toggleOptions(selectElement, questionForm) {
            const trueFalseOptions = questionForm.querySelector('.true-false-options');
            const multipleChoiceOptions = questionForm.querySelector('.multiple-choice-options');
            if (selectElement.value === 'trueFalse') {
                trueFalseOptions.style.display = 'flex';
                multipleChoiceOptions.style.display = 'none';
            } else {
                trueFalseOptions.style.display = 'none';
                multipleChoiceOptions.style.display = 'block';
            }
        }

        function addCheckboxOption(id_checkBox_Fectch, container, checkBoxCount, optionText = '') {
            const optionDiv = document.createElement('div');
            optionDiv.classList.add('multiple-choice-option');
        
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `multipleChoice${id_checkBox_Fectch}${checkBoxCount}[]`;
        
            const optionInput = document.createElement('input');
            optionInput.type = 'text';
            optionInput.id = `multipleChoiceText${id_checkBox_Fectch}${checkBoxCount}[]`;
            optionInput.placeholder = 'Варіант відповіді';
            optionInput.value = optionText; // Якщо є текст варіанту, вставляємо його            

            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.textContent = '❌'; // Хрестик для видалення
            deleteButton.onclick = () => optionDiv.remove(); // Видаляє даний варіант
        
            optionDiv.appendChild(checkbox);
            optionDiv.appendChild(optionInput);
            optionDiv.appendChild(deleteButton); // Додаємо кнопку видалення
            container.insertBefore(optionDiv, container.lastElementChild);            
        }
        
        //Контроль уведення оцінки
        function isNumberKey(evt) {
            // Отримуємо код клавіші
            const charCode = evt.which ? evt.which : evt.keyCode;
            // Дозволяємо тільки цифри (коди від 48 до 57)
            if (charCode < 48 || charCode > 57) {
                evt.preventDefault();
                return false;
            }
            return true;
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
            console.log(`ID: ${row[0]}, option_id: ${row[1]} question_id: ${row[2]}, text: ${row[3]}, is_correct: ${row[4]}`);
          });
          console.log("___________________________________________");
    } else {
        console.log("No options found in the database.");
    }
}


        // Функція для видалення тетсу за ID
        function deleteUserById(userId) {
            const stmt = db.prepare("DELETE FROM tests WHERE id = ?;");
            stmt.run([userId]);
            stmt.free();
            console.log(`Test with ID ${userId} has been deleted.`);
        }

        function dropTable() {
            // Видаляємо таблицю tests
            db.run("DROP TABLE IF EXISTS tests;");
            console.log("Table 'tests' has been deleted.");
        }