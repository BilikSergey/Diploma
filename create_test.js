let db;
let questionCount = 0;
let checkForSubmit = 0;
const submit_button = document.getElementById("id_submit_button");
initDatabase();


        function sendTestIntoDB(){
            
        }

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
        // Створення таблиці користувачів
        function createTables() {
            db.run(`
                CREATE TABLE IF NOT EXISTS tests (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    title TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );
            `);
            saveDatabase();
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


        function addQuestionForm(copyData = null) {
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
                <label><input type="radio" name="answer${questionCount}" value="true">True</label>
                <label><input type="radio" name="answer${questionCount}" value="false">False</label>
            `;
            questionForm.appendChild(trueFalseOptions);

            // Multiple Choice options
            const multipleChoiceOptions = document.createElement('div');
            multipleChoiceOptions.classList.add('options-container', 'multiple-choice-options');
            multipleChoiceOptions.style.display = 'none';

            if (copyData && copyData.options) {
                copyData.options.forEach(option => addCheckboxOption(multipleChoiceOptions, questionCount, option));
            }

            const addOptionButton = document.createElement('button');
            addOptionButton.type = 'button';
            addOptionButton.textContent = 'Додати варіант';
            addOptionButton.onclick = () => addCheckboxOption(multipleChoiceOptions, questionCount);
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

        function addCheckboxOption(container, questionId, optionText = '') {
            const optionDiv = document.createElement('div');
            optionDiv.classList.add('multiple-choice-option');
        
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = `multipleChoice${questionId}[]`;
        
            const optionInput = document.createElement('input');
            optionInput.type = 'text';
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
        










        // Виведення даних через консоль
        function viewDatabase() {
            const result = db.exec("SELECT * FROM tests;");
            if (result.length > 0 && result[0].values.length > 0) {
                result[0].values.forEach(row => {
                    console.log(`ID: ${row[0]}, user_id: ${row[1]}, title: ${row[2]}`);
                });
            } else {
                console.log("No tests found in the database.");
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