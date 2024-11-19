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

    this.tableColumnsStringUsers = "username, email, password, role";
    this.tableColumnsStringTests =
      "user_id, title, time_of_starting, time_of_ending";
    this.tableColumnsStringQuestions = "test_id, text, response_type, rating";
    this.tableColumnsStringOptions = "question_id, test_id, text, is_correct";

    this.tableQuestionMarkStringUsers = "?, ?, ?, ?";
    this.tableQuestionMarkStringTests = "?, ?, ?, ?";
    this.tableQuestionMarkStringQuestions = "?, ?, ?, ?";
    this.tableQuestionMarkStringOptions = "?, ?, ?, ?";
  }

  addIntoTable(checkingTableName, valuesArray) {
    let tableName;
    let columnsString;
    let questionMarkString;
    switch (true) {
      case checkingTableName === "users":
        tableName = "users";
        columnsString = this.tableColumnsStringUsers;
        questionMarkString = this.tableQuestionMarkStringUsers;
        break;
      case checkingTableName === "tests":
        tableName = "tests";
        columnsString = this.tableColumnsStringTests;
        questionMarkString = this.tableQuestionMarkStringTests;
        break;
      case checkingTableName === "questions":
        tableName = "questions";
        columnsString = this.tableColumnsStringQuestions;
        questionMarkString = this.tableQuestionMarkStringQuestions;
        break;
      case checkingTableName === "options":
        tableName = "options";
        columnsString = this.tableColumnsStringOptions;
        questionMarkString = this.tableQuestionMarkStringOptions;
        break;
    }
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
    this.checkBoxCount = 1;
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
          this.checkBoxCount++,
          option
        )
      );
    } else {
      this.addCheckboxOption(
        id_checkBox_Fectch,
        multipleChoiceOptions,
        this.checkBoxCount++
      );
    }
    addOptionButton.type = "button";
    addOptionButton.textContent = "Add option";
    addOptionButton.onclick = () => {
      this.addCheckboxOption(
        id_checkBox_Fectch,
        multipleChoiceOptions,
        this.checkBoxCount++
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
    console.log("class :", questionCount);
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
    optionDiv.id = `multiple-choice-option-id${id_checkBox_Fectch}${secondCounter}`;

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
    deleteButton.classList.add("delete-button-class");
    deleteButton.id = `delete-button${id_checkBox_Fectch}${secondCounter}`;
    deleteButton.textContent = "❌"; // Хрестик для видалення

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

  deleteCheckBoxOption(event) {
    const buttonFullId = event.target.id;
    const fullStringID = buttonFullId.slice(-2);
    const questionID = buttonFullId[buttonFullId.length - 2];
    const optionID = buttonFullId[buttonFullId.length - 1];
    let buttonNumId = Number(fullStringID);
    const questionNumId = Number(questionID);
    const optionNumId = Number(optionID);
    const formCheckBoxs = document.getElementById(
      `id-div-multiple-choice-options${questionNumId}`
    );
    const amountOfCheckBoxs =
      formCheckBoxs.querySelectorAll('[type="checkbox"]');
    const optionDiv = document.getElementById(
      `multiple-choice-option-id${buttonNumId}`
    );
    let newID = buttonNumId;
    for (let i = optionNumId; i < amountOfCheckBoxs.length; i++) {
      buttonNumId++;
      console.log(buttonNumId, newID, optionNumId, i);
      const amountOfCheckBoxsText = document.getElementById(
        `multipleChoiceText${buttonNumId}[]`
      );
      amountOfCheckBoxsText.id = `multipleChoiceText${newID}[]`;
      const amountOfCheckBoxs = document.getElementById(
        `multipleChoice${buttonNumId}[]`
      );
      amountOfCheckBoxs.id = `multipleChoice${newID}[]`;
      const amountOfDelete = document.getElementById(
        `delete-button${buttonNumId}`
      );
      amountOfDelete.id = `delete-button${newID}`;
      const amountOfOptionDiv = document.getElementById(
        `multiple-choice-option-id${buttonNumId}`
      );
      amountOfOptionDiv.id = `multiple-choice-option-id${newID}`;
      newID++;
    }
    optionDiv.remove();
    const updateAmountOfCheckBoxs =
      formCheckBoxs.querySelectorAll('[type="checkbox"]');
    this.checkBoxCount = updateAmountOfCheckBoxs.length + 1;
  }

  copyQuestion(submit_button, questionCount, checkForSubmit, event) {
    const buttonFullId = event.target.id;
    const buttonNumId = buttonFullId[buttonFullId.length - 1]; // Останній символ ID кнопки

    // Отримуємо елементи з відповідними ID
    const questionTitle = document.getElementById(`question${buttonNumId}`);
    const typeSelect = document.querySelector(
      `[name="questionType${buttonNumId}"]`
    );
    const scoreInput = document.getElementById(`score${buttonNumId}`);
    console.log(questionTitle, typeSelect, scoreInput);

    // Перевіряємо чи елементи існують
    if (!questionTitle || !typeSelect || !scoreInput) {
      console.error("Не вдалося знайти потрібні елементи!");
      return;
    }

    const questionData = {
      question: questionTitle.value,
      type: typeSelect.value,
      score: scoreInput.value,
      options: [],
    };

    // const trueFalseOption  = document.querySelector("[name='true-false-options']");
    if (typeSelect.value === "multipleChoice") {
      const getMultipleElement = document.getElementById(
        `id-div-multiple-choice-options${buttonNumId}`
      );

      if (getMultipleElement) {
        const checkBoxList =
          getMultipleElement.querySelectorAll("[type='checkbox']");
        for (let j = 1; j <= checkBoxList.length; j++) {
          const optionInput = document.getElementById(
            `multipleChoiceText${buttonNumId}${j}[]`
          );
          questionData.options.push(optionInput.value);
        }
      }
    }
    const newCounter = this.addQuestionForm(
      submit_button,
      questionCount,
      checkForSubmit,
      questionData
    );
    return newCounter;
  }
}

export class IntoDBTestAdderChecker {
  constructor(database, tablesManager) {
    this.database = database;
    this.tablesManager = tablesManager;
  }

  sendTestIntoDB(questionCount) {
    const testName = document.getElementById("id_input_test_name");
    const startTime = document.getElementById("test-datetime-start");
    const endTime = document.getElementById("test-datetime-end");
    const stmtTitleTest = this.database.db.prepare(
      "SELECT 1 FROM tests WHERE title = ? AND user_id = ?"
    );
    stmtTitleTest.bind([testName.value, this.database.getUserData().id]); // Передаємо параметри без вкладеного масиву
    const TitleTestExists = stmtTitleTest.step();

    if (TitleTestExists) {
      alert("You have already created a test with this name");
      return true;
    }
    for (let i = 1; i <= questionCount; i++) {
      let is_checkBox_checked = false;
      const questionName = document.getElementById(`question${i}`);
      if (questionName === null) {
        continue;
      }
      const scoreName = document.getElementById(`score${i}`);
      const form_checkBox = document.querySelector(
        `#id-div-multiple-choice-options${i}`
      );
      const checkboxes = form_checkBox.querySelectorAll(
        'input[type="checkbox"]'
      );
      const form_of_CheckBox = document.getElementById(
        `id-div-multiple-choice-options${i}`
      );
      is_checkBox_checked = this.isCheckBoxsEmpty(
        form_of_CheckBox,
        checkboxes,
        is_checkBox_checked,
        i
      );
      switch (true) {
        case !testName.value:
          this.highlightElement(testName);
          return true;
        case !questionName.value:
          this.highlightElement(questionName);
          questionName.scrollIntoView({ behavior: "smooth" });
          return true;
        case !scoreName.value:
          this.highlightElement(scoreName);
          scoreName.scrollIntoView({ behavior: "smooth" });
          return true;
        case is_checkBox_checked === false:
          return true;
      }
    }
    const userData = this.database.getUserData();
    const valuesArray = [
      userData.id,
      testName.value,
      startTime.value,
      endTime.value,
    ];
    this.tablesManager.addIntoTable("tests", valuesArray);
    this.addTest(questionCount);
    this.database.saveDatabase();
    // setTimeout(() => {
    //   window.location.href = "cabinet_teacher.html";
    // }, 500);
  }

  isCheckBoxsEmpty(form_of_CheckBox, checkboxes, is_checkBox_checked, i) {
    if (form_of_CheckBox.style.display === "block") {
      for (let j = 1; j <= checkboxes.length; j++) {
        const response_text = document.getElementById(
          `multipleChoiceText${i}${j}[]`
        );
        const response_checkBox = document.getElementById(
          `multipleChoice${i}${j}[]`
        );
        if (!response_text.value) {
          this.highlightElement(response_text);
          response_text.scrollIntoView({ behavior: "smooth" });
          return (is_checkBox_checked = false);
        }
        if (response_checkBox.checked) {
          is_checkBox_checked = true;
        }
      }
      if (!is_checkBox_checked) {
        this.highlightElement(form_of_CheckBox);
        form_of_CheckBox.scrollIntoView({ behavior: "smooth" });
        return (is_checkBox_checked = false);
      }
    }
    return (is_checkBox_checked = "true/false");
  }

  highlightElement(element) {
    element.classList.add("highlight-animated");

    setTimeout(() => {
      element.classList.remove("highlight-animated");
    }, 2000);
  }

  addTest(questionCount) {
    for (let i = 1; i <= questionCount; i++) {
      const test_id = this.getLastRecord("tests")[0];
      const text_question = document.getElementById(`question${i}`);
      if (text_question === null) {
        continue;
      }
      let response_type;
      const rating = document.getElementById(`score${i}`).value;
      const selectorOptions = document.getElementById(
        `id-div-multiple-choice-options${i}`
      );
      response_type =
        selectorOptions.style.display === "block" ? "multiple" : "true/false";
      const valuesArray = [test_id, text_question.value, response_type, rating];
      this.tablesManager.addIntoTable("questions", valuesArray);

      const id_test_question = this.getLastRecord("questions")[0];
      const form_checkBox = document.querySelector(
        `#id-div-multiple-choice-options${i}`
      );
      const checkboxes = form_checkBox.querySelectorAll(
        'input[type="checkbox"]'
      );
      const form_of_CheckBox = document.getElementById(
        `id-div-multiple-choice-options${i}`
      );
      if (form_of_CheckBox.style.display === "block") {
        for (let j = 1; j <= checkboxes.length; j++) {
          const response_text = document.getElementById(
            `multipleChoiceText${i}${j}[]`
          ).value;
          const response_checkBox = document.getElementById(
            `multipleChoice${i}${j}[]`
          );
          const valuesArray = [
            id_test_question,
            test_id,
            response_text,
            response_checkBox.checked ? "true" : "false",
          ];
          this.tablesManager.addIntoTable("options", valuesArray);
        }
      } else {
        for (let j = 1; j <= 2; j++) {
          let valuesArray;
          const radio_is_checked_true = document.getElementById(`id_true${i}`);
          const radio_is_checked_false = document.getElementById(
            `id_false${i}`
          );
          switch (true) {
            case j === 1 && radio_is_checked_true.checked:
              valuesArray = [id_test_question, test_id, "true", "true"];
              this.tablesManager.addIntoTable("options", valuesArray);
              break;
            case j === 1 && !radio_is_checked_true.checked:
              valuesArray = [id_test_question, test_id, "true", "false"];
              this.tablesManager.addIntoTable("options", valuesArray);
              break;
            case j === 2 && radio_is_checked_false.checked:
              valuesArray = [id_test_question, test_id, "false", "true"];
              this.tablesManager.addIntoTable("options", valuesArray);
              break;
            case j === 2 && !radio_is_checked_false.checked:
              valuesArray = [id_test_question, test_id, "false", "false"];
              this.tablesManager.addIntoTable("options", valuesArray);
              break;
          }
        }
      }
    }
  }

  getLastRecord(table_name) {
    const query = `SELECT * FROM ${table_name} ORDER BY id DESC LIMIT 1`;
    try {
      const result = this.database.db.exec(query);
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
}
