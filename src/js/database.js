export class DatabaseManager {
  constructor() {
    this.db = null;
  }

  getUserData() {
    return {
      id: localStorage.getItem("userId"),
      name: localStorage.getItem("userName"),
      email: localStorage.getItem("userEmail"),
      password: localStorage.getItem("userPassword"),
      role: localStorage.getItem("userRole"),
    };
  }

  async init() {
    // eslint-disable-next-line no-undef
    const SQL = await initSqlJs({
      // eslint-disable-next-line no-unused-vars
      locateFile: (file) =>
        `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/sql-wasm.wasm`,
    });
    this.db = new SQL.Database();
    this.createTables();

    // Спробуємо завантажити базу даних з IndexedDB
    const storedData = await this.loadDatabase();
    if (storedData) {
      this.db = new SQL.Database(new Uint8Array(storedData));
    }
  }

  createTables() {
    this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        );
    `);
    this.db.run(`
          CREATE TABLE IF NOT EXISTS tests (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER,
              title TEXT NOT NULL,
              time_of_starting TIMESTAMP,
              time_of_ending TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id)
          );
      `);
    this.db.run(`
          CREATE TABLE IF NOT EXISTS questions (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              test_id INTEGER,
              text TEXT NOT NULL,
              response_type TEXT NOT NULL,
              rating INTEGER,
              FOREIGN KEY (test_id) REFERENCES tests(id)
          );
      `);
    this.db.run(`
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
    this.db.run(`
          CREATE TABLE IF NOT EXISTS submissions (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              test_id INTEGER,
              student_id INTEGER,
              teacher_name TEXT NOT NULL,
              submission_date TIMESTAMP,
              FOREIGN KEY (test_id) REFERENCES tests(id),
              FOREIGN KEY (student_id) REFERENCES users(id),
              FOREIGN KEY (teacher_name) REFERENCES users(username)
          );
      `);
    this.db.run(`
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
    this.db.run(`
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

  async loadDatabase() {
    // eslint-disable-next-line no-unused-vars
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("DatabaseDiploma", 1);

      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(
          [
            "usersDatabase",
            "testsDatabase",
            "questionsDatabase",
            "optionsDatabase",
          ],
          "readwrite"
        );
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

  saveDatabase() {
    const binaryArray = this.db.export();
    const request = indexedDB.open("DatabaseDiploma", 1);

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(
        [
          "usersDatabase",
          "testsDatabase",
          "questionsDatabase",
          "optionsDatabase",
        ],
        "readwrite"
      );
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
}

export class TablesManager {
  constructor(database) {
    this.database = database;
  }

  addIntoTable(tableName, columnsString, questionMarkString, valuesArray) {
    this.database.db.run(
      `INSERT INTO ${tableName} (${columnsString}) VALUES (${questionMarkString})`,
      valuesArray
    );
  }

  deleteUserById(tableName, columnId) {
    this.database.db.run(`DELETE FROM ${tableName} WHERE id = ?`, [columnId]);
  }

  viewAllTable(tableName) {
    const result = this.database.db.exec(`SELECT * FROM ${tableName};`);
    return console.log(result.length > 0 ? result[0].values : []);
  }
}

export class QuestionAdder {
  constructor() {
    this.checkBoxCount = 1;
  }

  addQuestionForm(
    submit_button,
    questionCount,
    checkForSubmit,
    copyData = null
  ) {
    const container = document.getElementById("questionsContainer");
    let checkBoxCount = 1;
    const questionForm = document.createElement("div");
    const questionLabel = document.createElement("label");
    const questionInput = document.createElement("input");
    const typeSelect = document.createElement("select");
    const trueFalseOption = new Option("True/False", "trueFalse");
    const multipleChoiceOption = new Option(
      "Multiple Choice",
      "multipleChoice"
    );
    const trueFalseOptions = document.createElement("div");
    const multipleChoiceOptions = document.createElement("div");
    const addOptionButton = document.createElement("button");
    const scoreContainer = document.createElement("div");
    const scoreLabel = document.createElement("label");
    const scoreInput = document.createElement("input");
    const buttonsForm = document.createElement("div");
    submit_button.style.visibility = "visible";
    questionCount++;
    checkForSubmit++;
    questionForm.classList.add("question-form");
    questionForm.dataset.questionId = questionCount;
    questionLabel.textContent = "Questions:";
    questionForm.appendChild(questionLabel);
    questionInput.type = "text";
    questionInput.placeholder = "The content of the question";
    questionInput.id = `question${questionCount}`;
    questionInput.name = `question${questionCount}`;
    questionInput.value = copyData ? copyData.question : "";
    questionForm.appendChild(questionInput);
    typeSelect.name = `questionType${questionCount}`;
    typeSelect.onchange = (e) => this.toggleOptions(e.target, questionForm);
    typeSelect.append(trueFalseOption, multipleChoiceOption);
    if (copyData) {
      typeSelect.value = copyData.type;
    }
    questionForm.appendChild(typeSelect);
    trueFalseOptions.classList.add("true-false-options");
    trueFalseOptions.innerHTML = `
          <label><input id="id_true${questionCount}" checked type="radio" name="answer${questionCount}" value="true">True</label>
          <label><input id="id_false${questionCount}" type="radio" name="answer${questionCount}" value="false">False</label>
      `;
    questionForm.appendChild(trueFalseOptions);

    multipleChoiceOptions.classList.add(
      "options-container",
      "multiple-choice-options"
    );
    multipleChoiceOptions.id = `id-div-multiple-choice-options${questionCount}`;
    multipleChoiceOptions.style.display = "none";
    const id_checkBox_Fectch = questionCount;
    if (copyData && copyData.options.length > 0) {
      copyData.options.forEach((option) =>
        this.addCheckboxOption(
          id_checkBox_Fectch,
          multipleChoiceOptions,
          checkBoxCount++,
          option
        )
      );
    } else {
      this.addCheckboxOption(
        id_checkBox_Fectch,
        multipleChoiceOptions,
        checkBoxCount++
      );
    }
    addOptionButton.type = "button";
    addOptionButton.textContent = "Add option";
    addOptionButton.onclick = () => {
      this.addCheckboxOption(
        id_checkBox_Fectch,
        multipleChoiceOptions,
        checkBoxCount++
      );
    };
    multipleChoiceOptions.appendChild(addOptionButton);
    questionForm.appendChild(multipleChoiceOptions);
    scoreContainer.classList.add("score-container");
    scoreLabel.textContent = "Score";
    scoreContainer.appendChild(scoreLabel);
    scoreInput.type = "number";
    scoreInput.id = `score${questionCount}`;
    scoreInput.name = `score${questionCount}`;
    scoreInput.style.width = `65px`;
    scoreInput.value = copyData ? copyData.score : "";
    scoreInput.min = 0;
    scoreContainer.appendChild(scoreInput);
    scoreInput.onkeydown = function (event) {
      if (isNaN(event.key) && event.key !== "Backspace") {
        event.preventDefault();
      }
    };
    questionForm.appendChild(scoreContainer);
    buttonsForm.classList.add("button-container");
    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.textContent = "Copy question";
    copyButton.id = `copyQuestion${questionCount}`;
    copyButton.classList.add("copyQuestionClass");
    // const copyCount = questionCount;
    // copyButton.onclick = () => {
    //   const questionData = {
    //     question: questionInput.value,
    //     type: typeSelect.value,
    //     score: scoreInput.value,
    //     options: [],
    //   };
    //   if (typeSelect.value === "multipleChoice") {
    //     const getMultipleElement = document.getElementById(
    //       `id-div-multiple-choice-options${copyCount}`
    //     );
    //     const copyCheckBoxCount =
    //       getMultipleElement.querySelectorAll("[type='checkbox']");
    //     for (let i = 1; i <= copyCheckBoxCount.length; i++) {
    //       const optionInput = document.getElementById(
    //         `multipleChoiceText${copyCount}${i}[]`
    //       );
    //       questionData.options.push(optionInput.value);
    //       console.log(questionData, copyCount, copyCheckBoxCount.length);
    //     }
    //   }
    //   this.addQuestionForm(
    //     submit_button,
    //     questionCount,
    //     checkForSubmit,
    //     questionData
    //   );
    // };
    buttonsForm.appendChild(copyButton);
    questionForm.appendChild(buttonsForm);
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete question";
    deleteButton.onclick = () => {
      checkForSubmit--;
      questionCount--;
      questionForm.remove();
      if (checkForSubmit === 0) {
        submit_button.style.visibility = "hidden";
      }
    };
    buttonsForm.appendChild(deleteButton);
    questionForm.appendChild(buttonsForm);
    container.appendChild(questionForm);
    if (copyData && copyData.type === "multipleChoice") {
      typeSelect.dispatchEvent(new Event("change"));
    }
    console.log("class :", questionCount)
    return questionCount;
  }

  toggleOptions(selectElement, questionForm) {
    const trueFalseOptions = questionForm.querySelector(".true-false-options");
    const multipleChoiceOptions = questionForm.querySelector(
      ".multiple-choice-options"
    );
    if (selectElement.value === "trueFalse") {
      trueFalseOptions.style.display = "flex";
      multipleChoiceOptions.style.display = "none";
    } else {
      trueFalseOptions.style.display = "none";
      multipleChoiceOptions.style.display = "block";
    }
  }

  addCheckboxOption(
    id_checkBox_Fectch,
    container,
    secondCounter,
    optionText = ""
  ) {
    const optionDiv = document.createElement("div");
    optionDiv.classList.add("multiple-choice-option");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `multipleChoice${id_checkBox_Fectch}${secondCounter}[]`;

    const optionInput = document.createElement("input");
    optionInput.type = "text";
    optionInput.id = `multipleChoiceText${id_checkBox_Fectch}${secondCounter}[]`;
    optionInput.placeholder = "Answer option";
    optionInput.value = optionText; // Якщо є текст варіанту, вставляємо його

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.id = `delete-button${id_checkBox_Fectch}`;
    deleteButton.textContent = "❌"; // Хрестик для видалення
    deleteButton.onclick = () => {
      const formCheckBoxs = document.getElementById(
        `id-div-multiple-choice-options${id_checkBox_Fectch}`
      );
      const amountOfCheckBoxs =
      formCheckBoxs.querySelectorAll('[type="checkbox"]');
      const stringID = String(optionInput.id);
      const thirdFromEnd = stringID[stringID.length - 3];
      const idForChange = Number(thirdFromEnd);
      let j = idForChange;
      console.log(idForChange, amountOfCheckBoxs.length);
      for (let i = idForChange; i < amountOfCheckBoxs.length; i++) {
        j++;
        console.log(id_checkBox_Fectch, idForChange);
        const amountOfCheckBoxsText = document.getElementById(
          `multipleChoiceText${id_checkBox_Fectch}${j}[]`
        );
        amountOfCheckBoxsText.id = `multipleChoiceText${id_checkBox_Fectch}${i}[]`;
        const amountOfCheckBoxs = document.getElementById(
          `multipleChoice${id_checkBox_Fectch}${j}[]`
        );
        amountOfCheckBoxs.id = `multipleChoice${id_checkBox_Fectch}${i}[]`;
      }
      this.checkBoxCount = this.checkBoxCount - 1;
      optionDiv.remove();
    };
    if (secondCounter === 1) {
      deleteButton.style.visibility = "hidden";
    }

    optionDiv.appendChild(checkbox);
    optionDiv.appendChild(optionInput);
    optionDiv.appendChild(deleteButton); // Додаємо кнопку видалення
    switch (true) {
      case !optionText:
        container.insertBefore(optionDiv, container.lastElementChild);
        break;
      case optionText !== "":
        container.appendChild(optionDiv, container.lastElementChild);
        break;
    }
  }
}
