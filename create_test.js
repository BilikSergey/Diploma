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
                    test_id INTEGER,
                    text TEXT NOT NULL,
                    is_correct TEXT NOT NULL,
                    FOREIGN KEY (question_id) REFERENCES questions(id),
                    FOREIGN KEY (test_id) REFERENCES tests(id)
                );
            `);
        }

        function isCheckBoxsEmpty (form_of_CheckBox, checkboxes, is_checkBox_checked, i) {  
            if(form_of_CheckBox.style.display==='block'){
                for (let j = 1; j <= checkboxes.length; j++) {
                    const response_text = document.getElementById(`multipleChoiceText${i}${j}[]`);
                    const response_checkBox = document.getElementById(`multipleChoice${i}${j}[]`);
                    if(!response_text.value){
                        highlightElement(response_text);
                        response_text.scrollIntoView({ behavior: 'smooth' });
                        return is_checkBox_checked = false;
                    }     
                    if(response_checkBox.checked){
                        is_checkBox_checked=true;
                    }
                }
                if(!is_checkBox_checked){
                    highlightElement(form_of_CheckBox)
                    form_of_CheckBox.scrollIntoView({ behavior: 'smooth' });
                }
            }
            return is_checkBox_checked;
        }

        function sendTestIntoDB(){
            const testName = document.getElementById("id_input_test_name");
            for(let i=1; i<=questionCount; i++){
                let is_checkBox_checked = false;
                const questionName = document.getElementById(`question${i}`);
                const scoreName = document.getElementById(`score${i}`);    
                const form_checkBox = document.querySelector(`#id-div-multiple-choice-options${i}`);
                const checkboxes = form_checkBox.querySelectorAll('input[type="checkbox"]');
                const form_of_CheckBox = document.getElementById(`id-div-multiple-choice-options${i}`);
                is_checkBox_checked = isCheckBoxsEmpty(form_of_CheckBox, checkboxes, is_checkBox_checked, i);
                switch(true){
                    case(!testName.value):
                        highlightElement(testName);
                        break;
                    case(!questionName.value):
                        highlightElement(questionName);
                        questionName.scrollIntoView({ behavior: 'smooth' });
                        break;
                    case(!scoreName.value):
                        highlightElement(scoreName);
                        scoreName.scrollIntoView({ behavior: 'smooth' });
                        break;
                    case(!is_checkBox_checked):
                        break;
                    case(true):
                        const userData = getUserData();
                        db.run("INSERT INTO tests (user_id, title) VALUES (?, ?)", [userData.id, testName.value]);
                        addTest();
                        saveDatabase();
                        viewDatabase();
                        break;
                }
            }
        }

        function addTest() {
            for (let i = 1; i <= questionCount; i++) {
                const test_id = getLastRecord("tests")[0];
                const text_question = document.getElementById(`question${i}`).value;
                let response_type;
                const rating = document.getElementById(`score${i}`).value;
                const selectorOptions = document.getElementById(`id-div-multiple-choice-options${i}`);
                response_type = selectorOptions.style.display === 'block' ? "multiple" : "true/false";
                db.run("INSERT INTO questions (test_id, text, response_type, rating) VALUES (?, ?, ?, ?)", [test_id, text_question, response_type, rating]);

                const id_test_question = getLastRecord("questions")[0];
                const form_checkBox = document.querySelector(`#id-div-multiple-choice-options${i}`);
                const checkboxes = form_checkBox.querySelectorAll('input[type="checkbox"]');
                const form_of_CheckBox = document.getElementById(`id-div-multiple-choice-options${i}`);
                if (form_of_CheckBox.style.display === "block") {
                    for (let j = 1; j <= checkboxes.length; j++) {
                        const response_text = document.getElementById(`multipleChoiceText${i}${j}[]`).value;
                        const response_checkBox = document.getElementById(`multipleChoice${i}${j}[]`);
                        db.run("INSERT INTO options (question_id, test_id, text, is_correct) VALUES (?, ?, ?, ?)", [id_test_question, test_id, response_text, response_checkBox.checked ? "true" : "false"]);
                    }
                } else {
                    for (let j = 1; j <= 2; j++) {
                        const radio_is_checked_true = document.getElementById(`id_true${i}`);
                        const radio_is_checked_false = document.getElementById(`id_false${i}`); 
                        switch (true) {
                            case (j === 1 && radio_is_checked_true.checked):
                                db.run("INSERT INTO options (question_id, test_id, text, is_correct) VALUES (?, ?, ?, ?)", [id_test_question, test_id, "true", "true"]);
                                break;
                            case (j === 1 && !radio_is_checked_true.checked):
                                db.run("INSERT INTO options (question_id, test_id,  text, is_correct) VALUES (?, ?, ?, ?)", [id_test_question, test_id, "true", "false"]);
                                break;
                            case (j === 2 && radio_is_checked_false.checked):
                                db.run("INSERT INTO options (question_id, test_id, text, is_correct) VALUES (?, ?, ?, ?)", [id_test_question, test_id, "false", "true"]);
                                break;
                            case (j === 2 && !radio_is_checked_false.checked):
                                db.run("INSERT INTO options (question_id, test_id, text, is_correct) VALUES (?, ?, ?, ?)", [id_test_question, test_id, "false", "false"]);
                                break;
                        }
                    }
                }
            }
        }

        function getLastRecord(table_name) {
            const query = `SELECT * FROM ${table_name} ORDER BY id DESC LIMIT 1`;
        
            try {
                const result = db.exec(query);
                if (result.length > 0) {
                    return result[0].values[0]; // Повертаємо останній запис
                } else {
                    console.log("Записи не знайдено.");
                    return null;
                }
            } catch (error) {
                console.error("Помилка виконання запиту:", error);
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
            questionLabel.textContent = 'Questions:';
            questionForm.appendChild(questionLabel);

            const questionInput = document.createElement('input');
            questionInput.type = 'text';
            questionInput.placeholder = 'The content of the question'
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
                <label><input id="id_true${questionCount}" checked type="radio" name="answer${questionCount}" value="true">True</label>
                <label><input id="id_false${questionCount}" type="radio" name="answer${questionCount}" value="false">False</label>
            `;
            questionForm.appendChild(trueFalseOptions);

            // Multiple Choice options
            const multipleChoiceOptions = document.createElement('div');
            multipleChoiceOptions.classList.add('options-container', 'multiple-choice-options');
            multipleChoiceOptions.id = `id-div-multiple-choice-options${questionCount}`;
            // multipleChoiceOptions.name = `name-div-multiple-choice-options${questionCount}`;
            multipleChoiceOptions.style.display = 'none';
            const id_checkBox_Fectch = questionCount;
            addCheckboxOption(id_checkBox_Fectch, multipleChoiceOptions, checkBoxCount);
            checkBoxCount++;
            if (copyData && copyData.options) {
                copyData.options.forEach(option => addCheckboxOption(id_checkBox_Fectch, multipleChoiceOptions, checkBoxCount, option));
                checkBoxCount++;
            }
            const addOptionButton = document.createElement('button');
            addOptionButton.type = 'button';
            addOptionButton.textContent = 'Add option';
            addOptionButton.onclick = () => {addCheckboxOption(id_checkBox_Fectch, multipleChoiceOptions, checkBoxCount); checkBoxCount++;}
            multipleChoiceOptions.appendChild(addOptionButton);
            questionForm.appendChild(multipleChoiceOptions);

            // Score container
            const scoreContainer = document.createElement('div');
            scoreContainer.classList.add('score-container');

            const scoreLabel = document.createElement('label');
            scoreLabel.textContent = 'Score';
            scoreContainer.appendChild(scoreLabel);

            const scoreInput = document.createElement('input');
            scoreInput.type = 'number';
            scoreInput.id = `score${questionCount}`;
            scoreInput.name = `score${questionCount}`;
            scoreInput.style.width = `65px`;
            scoreInput.value = copyData ? copyData.score : '';
            scoreInput.min = 0;
            scoreContainer.appendChild(scoreInput);
            scoreInput.onkeydown = function(event) {
                if(isNaN(event.key) && event.key !== 'Backspace') {
                  event.preventDefault();
                }
              };

            questionForm.appendChild(scoreContainer);

            const buttonsForm = document.createElement('div');
            buttonsForm.classList.add('button-container');
            const copyButton = document.createElement('button');
            copyButton.type = 'button';
            copyButton.textContent = 'Copy question';
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
            deleteButton.textContent = 'Delete question';
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
            optionInput.placeholder = 'Answer option';
            optionInput.value = optionText; // Якщо є текст варіанту, вставляємо його            

            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            if(checkBoxCount>1){
                deleteButton.textContent = '❌'; // Хрестик для видалення
                deleteButton.onclick = () => optionDiv.remove(); // Видаляє даний варіант
            }
        
            optionDiv.appendChild(checkbox);
            optionDiv.appendChild(optionInput);
            optionDiv.appendChild(deleteButton); // Додаємо кнопку видалення
            container.insertBefore(optionDiv, container.lastElementChild);            
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
        
        function highlightElement(element) {
            element.classList.add('highlight-animated');
            
            setTimeout(() => {
                element.classList.remove('highlight-animated');
            }, 2000);
        }