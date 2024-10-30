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
            text TEXT NOT NULL,
            is_correct TEXT NOT NULL,
            FOREIGN KEY (question_id) REFERENCES questions(id)
        );
    `);
}

        function sendTestIntoDB(){
            
        }

        // Функція для додавання тесту
        function addUser() {
            getUserData(userData);
            const testName = document.getElementById("id_input_test_name");
            db.run("INSERT INTO tests (user_id, title) VALUES (?, ?)", [userData.id, testName]);

            
        }

        // Отримати дані користувача
        function getUserData(userData) {
            userData = {
                id: localStorage.getItem("userId"),
                name: localStorage.getItem("userName"),
                email: localStorage.getItem("userEmail"),
                password: localStorage.getItem("userPassword"),
                role: localStorage.getItem("userRole")
            };
            return userData;
        }

        function addIdInTable () {
            const request = indexedDB.open("DatabaseDiploma", 3);            

            request.onsuccess = (event) => {
                const db = event.target.result;

                // Спочатку отримуємо `id` з першої таблиці, наприклад, з таблиці "testsDatabase"
                const transaction = db.transaction(["usersDatabase", "testsDatabase", "questionsDatabase", "optionsDatabase"], "readwrite");
                const testsStore = transaction.objectStore("testsDatabase");
                const questionsStore = transaction.objectStore("questionsDatabase");
                const optionsStore = transaction.objectStore("optionsDatabase");

                // Шукаємо запис з `id = 1`, але це може бути інший критерій
                const getRequest = testsStore.openCursor(null, "prev"); 

                for(let i = 1; i>=questionCount;i++)
                getRequest.onsuccess = (event) => {
                    const record = event.target.result;

                    if (record) {
                        const testId = record.id; // Отримуємо `id`, щоб вставити в іншу таблицю
                        const textId = document.getElementById(`question${i}`);
                        const selectorOptions = document.getElementById("id-div-multiple-choice-options");
                        const ratingId = document.getElementById(`score${i}`);
                        let responseType;

                        if(selectorOptions.style.display == 'block'){
                            responseType = "multiple";
                        } else {
                            responseType = "true/false";
                        }

                        const newQuestion = {
                            test_id: testId, // Використовуємо отриманий `id`
                            text: textId,
                            response_type: responseType,
                            rating: ratingId
                        };
                        questionsStore.add(newQuestion); // Додаємо новий запис в "questionsDatabase"
                    }
                };

                getRequest.onerror = (event) => {
                    console.error("Помилка при отриманні id з таблиці:", event);
                };

                const getRequest2 = questionsStore.get(i);
                getRequest2.onsuccess = (event) => {
                    const record = event.target.result;

                    if (record) {
                        const questionId = record.id; // Отримуємо `id`, щоб вставити в іншу таблицю
                        const textId = document.getElementById(`question${questionCount}`);
                        const selectorOptions = document.getElementById("id-div-multiple-choice-options");
                        let responseType;
                        
                        for(let i = 1; i>=questionCount;i++){
                            let response_text;
                            if(record.response_type=="multiple"){
                                response_text = document.getElementById(`multipleChoiceText${questionCount}${checkBoxCount}[]`);
                            } else {
                                
                            }
                            const newOption = {
                                question_id: questionId, // Використовуємо отриманий `id`
                                text: textId,
                                is_correct: ratingId
                            };

                        }
                        

                        
                        questionsStore.add(newQuestion); // Додаємо новий запис в "questionsDatabase"
                    }
                };
            };

            getRequest2.onerror = (event) => {
                console.error("Помилка відкриття бази даних:", event);
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
            multipleChoiceOptions.id = 'id-div-multiple-choice-options';
            multipleChoiceOptions.style.display = 'none';

            if (copyData && copyData.options) {
                copyData.options.forEach(option => addCheckboxOption(multipleChoiceOptions, checkBoxCount, option));
                checkBoxCount++;
            }
            const addOptionButton = document.createElement('button');
            addOptionButton.type = 'button';
            addOptionButton.textContent = 'Додати варіант';
            addOptionButton.onclick = () => {addCheckboxOption(multipleChoiceOptions, checkBoxCount); checkBoxCount++;}
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

        function addCheckboxOption(container, checkBoxCount, optionText = '') {
            const optionDiv = document.createElement('div');
            optionDiv.classList.add('multiple-choice-option');
        
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `multipleChoice${questionCount}${checkBoxCount}[]`;
        
            const optionInput = document.createElement('input');
            optionInput.type = 'text';
            optionInput.id = `multipleChoiceText${questionCount}${checkBoxCount}[]`;
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