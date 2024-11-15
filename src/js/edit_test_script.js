let db;
let questionCount = 0;
let checkForSubmit = 0;
let checkBoxCount = 1;
let j = 0;
const testInfo = getTestData();
let test_id;
let questionsData;

async function executeFunctions() {
  await initDatabase();
  test_id = db.exec(`SELECT id FROM tests WHERE user_id = ? AND title = ?`, [
    getUserData().id,
    testInfo.title,
  ])[0].values[0][0];
  questionsData = db.exec(`SELECT * FROM questions WHERE test_id = ${test_id}`);
  const submit_btn = document.getElementById("id_submit_button");
  submit_btn.style.visibility = "visible";
  for (let i = 0; i < questionsData[0].values.length; i++) {
    generateTest(i);
  }
}
executeFunctions();

function isCheckBoxsEmpty(
  form_of_CheckBox,
  checkboxes,
  is_checkBox_checked,
  i,
) {
  if (form_of_CheckBox.style.display === "block") {
    for (let j = 1; j <= checkboxes.length; j++) {
      const response_text = document.getElementById(
        `multipleChoiceText${i}${j}[]`,
      );
      const response_checkBox = document.getElementById(
        `multipleChoice${i}${j}[]`,
      );
      if (!response_text.value) {
        highlightElement(response_text);
        response_text.scrollIntoView({ behavior: "smooth" });
        return (is_checkBox_checked = false);
      }
      if (response_checkBox.checked) {
        is_checkBox_checked = true;
      }
    }
    if (!is_checkBox_checked) {
      highlightElement(form_of_CheckBox);
      form_of_CheckBox.scrollIntoView({ behavior: "smooth" });
      return (is_checkBox_checked = false);
    }
  }
  return (is_checkBox_checked = "true/false");
}

function sendTestIntoDB() {
  const testName = document.getElementById("id_input_test_name");
  const stmtTitleTest = db.prepare(
    "SELECT 1 FROM tests WHERE title = ? AND user_id = ?",
  );
  stmtTitleTest.bind([testName.value, getUserData().id]); // Передаємо параметри без вкладеного масиву
  const TitleTestExists = stmtTitleTest.step();
  if (TitleTestExists && testName.value !== getTestData().title) {
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
      `#id-div-multiple-choice-options${i}`,
    );
    const checkboxes = form_checkBox.querySelectorAll('input[type="checkbox"]');
    const form_of_CheckBox = document.getElementById(
      `id-div-multiple-choice-options${i}`,
    );
    is_checkBox_checked = isCheckBoxsEmpty(
      form_of_CheckBox,
      checkboxes,
      is_checkBox_checked,
      i,
    );
    switch (true) {
      case !testName.value:
        highlightElement(testName);
        return true;
      case !questionName.value:
        highlightElement(questionName);
        questionName.scrollIntoView({ behavior: "smooth" });
        return true;
      case !scoreName.value:
        highlightElement(scoreName);
        scoreName.scrollIntoView({ behavior: "smooth" });
        return true;
      case is_checkBox_checked === false:
        return true;
    }
  }
  deletePriorTableInfo();
  const userData = getUserData();
  const timeForPassing = document.getElementById("test-datetime");
  const startTime = document.getElementById("test-datetime-start");
  const endTime = document.getElementById("test-datetime-end");
  db.run(
    "INSERT INTO tests (user_id, title, time_of_starting, time_of_ending) VALUES (?, ?, ?, ?)",
    [userData.id, testName.value, startTime.value, endTime.value],
  );
  addTest();
  saveDatabase();
  setTimeout(() => {
    window.location.href = "cabinet_teacher.html";
  }, 500);
}

function deletePriorTableInfo() {
  db.run("BEGIN TRANSACTION");
  try {
    db.exec("DELETE FROM option_responses WHERE test_id = ?", [test_id]);
    db.exec("DELETE FROM responses WHERE test_id = ?", [test_id]);
    db.exec("DELETE FROM submissions WHERE test_id = ?", [test_id]);
    db.exec("DELETE FROM options WHERE test_id = ?", [test_id]);
    db.exec("DELETE FROM questions WHERE test_id = ?", [test_id]);
    db.exec("DELETE FROM tests WHERE id = ?", [test_id]);
    db.run("COMMIT");
  } catch (error) {
    db.run("ROLLBACK");
    console.error("Error deleting test data:", error);
  }
}

function addTest() {
  for (let i = 1; i <= questionCount; i++) {
    const test_id = getLastRecord("tests")[0];
    const text_question = document.getElementById(`question${i}`);
    if (text_question === null) {
      continue;
    }
    let response_type;
    const rating = document.getElementById(`score${i}`).value;
    const selectorOptions = document.getElementById(
      `id-div-multiple-choice-options${i}`,
    );
    response_type =
      selectorOptions.style.display === "block" ? "multiple" : "true/false";
    db.run(
      "INSERT INTO questions (test_id, text, response_type, rating) VALUES (?, ?, ?, ?)",
      [test_id, text_question.value, response_type, rating],
    );

    const id_test_question = getLastRecord("questions")[0];
    const form_checkBox = document.querySelector(
      `#id-div-multiple-choice-options${i}`,
    );
    const checkboxes = form_checkBox.querySelectorAll('input[type="checkbox"]');
    const form_of_CheckBox = document.getElementById(
      `id-div-multiple-choice-options${i}`,
    );
    if (form_of_CheckBox.style.display === "block") {
      for (let j = 1; j <= checkboxes.length; j++) {
        const response_text = document.getElementById(
          `multipleChoiceText${i}${j}[]`,
        ).value;
        const response_checkBox = document.getElementById(
          `multipleChoice${i}${j}[]`,
        );
        db.run(
          "INSERT INTO options (question_id, test_id, text, is_correct) VALUES (?, ?, ?, ?)",
          [
            id_test_question,
            test_id,
            response_text,
            response_checkBox.checked ? "true" : "false",
          ],
        );
      }
    } else {
      for (let j = 1; j <= 2; j++) {
        const radio_is_checked_true = document.getElementById(`id_true${i}`);
        const radio_is_checked_false = document.getElementById(`id_false${i}`);
        switch (true) {
          case j === 1 && radio_is_checked_true.checked:
            db.run(
              "INSERT INTO options (question_id, test_id, text, is_correct) VALUES (?, ?, ?, ?)",
              [id_test_question, test_id, "true", "true"],
            );
            break;
          case j === 1 && !radio_is_checked_true.checked:
            db.run(
              "INSERT INTO options (question_id, test_id,  text, is_correct) VALUES (?, ?, ?, ?)",
              [id_test_question, test_id, "true", "false"],
            );
            break;
          case j === 2 && radio_is_checked_false.checked:
            db.run(
              "INSERT INTO options (question_id, test_id, text, is_correct) VALUES (?, ?, ?, ?)",
              [id_test_question, test_id, "false", "true"],
            );
            break;
          case j === 2 && !radio_is_checked_false.checked:
            db.run(
              "INSERT INTO options (question_id, test_id, text, is_correct) VALUES (?, ?, ?, ?)",
              [id_test_question, test_id, "false", "false"],
            );
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

async function generateTest(i) {
  const optionData = db.exec(
    `SELECT * FROM options WHERE question_id = ${questionsData[0].values[i][0]}`,
  );
  const container = document.getElementById("questionsContainer");
  const title_test = document.getElementById("id_input_test_name");
  const startTime = document.getElementById("test-datetime-start");
  const endTime = document.getElementById("test-datetime-end");
  title_test.value = getTestData().title;
  startTime.value = db.exec(`SELECT time_of_starting FROM tests WHERE id = ?`, [
    test_id,
  ])[0].values[0][0];
  endTime.value = db.exec(`SELECT time_of_ending FROM tests WHERE id = ?`, [
    test_id,
  ])[0].values[0][0];
  questionCount++;
  checkBoxCount = 1;
  j = 0;
  const questionForm = document.createElement("div");
  questionForm.classList.add("question-form");
  questionForm.dataset.questionId = questionCount;

  const questionLabel = document.createElement("label");
  questionLabel.textContent = "Questions:";
  questionForm.appendChild(questionLabel);

  const questionInput = document.createElement("input");
  questionInput.type = "text";
  questionInput.placeholder = "The content of the question";
  questionInput.id = `question${questionCount}`;
  questionInput.name = `question${questionCount}`;
  questionInput.value = questionsData[0].values[i][2];
  questionForm.appendChild(questionInput);

  const typeSelect = document.createElement("select");
  typeSelect.name = `questionType${questionCount}`;
  typeSelect.onchange = (e) => toggleOptions(e.target, questionForm);

  const trueFalseOption = new Option("True/False", "trueFalse");
  const multipleChoiceOption = new Option("Multiple Choice", "multipleChoice");
  typeSelect.append(trueFalseOption, multipleChoiceOption);
  questionForm.appendChild(typeSelect);

  // True/False options
  const trueFalseOptions = document.createElement("div");
  trueFalseOptions.classList.add("true-false-options");
  trueFalseOptions.innerHTML = `
            <label><input id="id_true${questionCount}" checked type="radio" name="answer${questionCount}" value="true">True</label>
            <label><input id="id_false${questionCount}" type="radio" name="answer${questionCount}" value="false">False</label>
        `;

  const multipleChoiceOptions = document.createElement("div");
  multipleChoiceOptions.classList.add(
    "options-container",
    "multiple-choice-options",
  );
  multipleChoiceOptions.id = `id-div-multiple-choice-options${questionCount}`;
  const id_checkBox_Fectch = questionCount;
  const addOptionButton = document.createElement("button");
  addOptionButton.type = "button";
  addOptionButton.textContent = "Add option";
  addOptionButton.onclick = () => {
    const form_checkBox = document.querySelector(
      `#id-div-multiple-choice-options${id_checkBox_Fectch}`,
    );
    let checkboxes =
      form_checkBox.querySelectorAll('input[type="checkbox"]').length + 1;
    console.log(checkboxes);
    addCheckboxOption(id_checkBox_Fectch, multipleChoiceOptions, checkboxes++);
  };

  switch (questionsData[0].values[i][3]) {
    case "true/false":
      multipleChoiceOptions.style.display = "none";
      typeSelect.value = "trueFalse";
      questionForm.appendChild(typeSelect);
      if (optionData[0].values[0][4] === "true") {
        trueFalseOptions.innerHTML = `
                        <label><input id="id_true${questionCount}" checked type="radio" name="answer${questionCount}" value="true">True</label>
                        <label><input id="id_false${questionCount}" type="radio" name="answer${questionCount}" value="false">False</label>
                    `;
        questionForm.appendChild(trueFalseOptions);
      } else {
        trueFalseOptions.innerHTML = `
                        <label><input id="id_true${questionCount}" type="radio" name="answer${questionCount}" value="true">True</label>
                        <label><input id="id_false${questionCount}" checked type="radio" name="answer${questionCount}" value="false">False</label>
                    `;
      }
      addCheckboxOption(
        id_checkBox_Fectch,
        multipleChoiceOptions,
        checkBoxCount++,
      );
      multipleChoiceOptions.appendChild(addOptionButton);
      questionForm.appendChild(trueFalseOptions);
      questionForm.appendChild(multipleChoiceOptions);
      break;
    case "multiple":
      typeSelect.value = "multipleChoice";
      questionForm.appendChild(typeSelect);
      trueFalseOptions.style.display = "none";
      multipleChoiceOptions.style.display = "block";

      for (j = 0; j < optionData[0].values.length; j++) {
        findCheckboxOption(
          id_checkBox_Fectch,
          multipleChoiceOptions,
          optionData[0].values[j][3],
          checkBoxCount++,
          optionData[0].values.length,
        );
      }
      multipleChoiceOptions.appendChild(addOptionButton);
      questionForm.appendChild(multipleChoiceOptions);
      questionForm.appendChild(trueFalseOptions);
      break;
  }

  // Score container
  const scoreContainer = document.createElement("div");
  scoreContainer.classList.add("score-container");

  const scoreLabel = document.createElement("label");
  scoreLabel.textContent = "Score";
  scoreContainer.appendChild(scoreLabel);

  const scoreInput = document.createElement("input");
  scoreInput.type = "number";
  scoreInput.id = `score${questionCount}`;
  scoreInput.name = `score${questionCount}`;
  scoreInput.style.width = `65px`;
  scoreInput.min = 0;
  scoreInput.value = questionsData[0].values[i][4];
  scoreContainer.appendChild(scoreInput);
  scoreInput.onkeydown = function (event) {
    if (isNaN(event.key) && event.key !== "Backspace") {
      event.preventDefault();
    }
  };

  questionForm.appendChild(scoreContainer);

  const buttonsForm = document.createElement("div");
  buttonsForm.classList.add("button-container");
  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.textContent = "Copy question";
  copyButton.onclick = () => {
    const count = i + 1;
    const questionData = {
      question: questionInput.value,
      type: typeSelect.value,
      score: scoreInput.value,
      options: [],
      is_checked: [],
    };
    if (typeSelect.value === "multipleChoice") {
      const form_checkBox = document.querySelector(
        `#id-div-multiple-choice-options${count}`,
      );
      const checkboxes = form_checkBox.querySelectorAll(
        'input[type="checkbox"]',
      );
      for (k = 1; k <= checkboxes.length; k++) {
        const optionInput = document.getElementById(
          `multipleChoiceText${count}${k}[]`,
        );
        questionData.options.push(optionInput.value);
        if (optionInput.checked) {
          questionData.is_checked.push("true");
        } else {
          questionData.is_checked.push("false");
        }
      }
    }
    addQuestionForm(questionData);
  };

  buttonsForm.appendChild(copyButton);
  questionForm.appendChild(buttonsForm);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.textContent = "Delete question";
  deleteButton.onclick = () => {
    checkForSubmit--;
    questionForm.remove();
    if (checkForSubmit === 0) {
      submit_button.style.visibility = "hidden";
    }
  };
  buttonsForm.appendChild(deleteButton);
  questionForm.appendChild(buttonsForm);
  container.appendChild(questionForm);
}

function addQuestionForm(copyData = null) {
  const container = document.getElementById("questionsContainer");
  checkBoxCount = 1;
  questionCount++;
  checkForSubmit++;
  const questionForm = document.createElement("div");
  questionForm.classList.add("question-form");
  questionForm.dataset.questionId = questionCount;

  const questionLabel = document.createElement("label");
  questionLabel.textContent = "Questions:";
  questionForm.appendChild(questionLabel);

  const questionInput = document.createElement("input");
  questionInput.type = "text";
  questionInput.placeholder = "The content of the question";
  questionInput.id = `question${questionCount}`;
  questionInput.name = `question${questionCount}`;
  questionInput.value = copyData ? copyData.question : "";
  questionForm.appendChild(questionInput);

  const typeSelect = document.createElement("select");
  typeSelect.name = `questionType${questionCount}`;
  typeSelect.onchange = (e) => toggleOptions(e.target, questionForm);

  const trueFalseOption = new Option("True/False", "trueFalse");
  const multipleChoiceOption = new Option("Multiple Choice", "multipleChoice");
  typeSelect.append(trueFalseOption, multipleChoiceOption);
  if (copyData) {
    typeSelect.value = copyData.type;
  }
  questionForm.appendChild(typeSelect);

  // True/False options
  const trueFalseOptions = document.createElement("div");
  trueFalseOptions.classList.add("true-false-options");
  trueFalseOptions.innerHTML = `
        <label><input id="id_true${questionCount}" checked type="radio" name="answer${questionCount}" value="true">True</label>
        <label><input id="id_false${questionCount}" type="radio" name="answer${questionCount}" value="false">False</label>
    `;
  questionForm.appendChild(trueFalseOptions);

  const multipleChoiceOptions = document.createElement("div");
  multipleChoiceOptions.classList.add(
    "options-container",
    "multiple-choice-options",
  );
  multipleChoiceOptions.id = `id-div-multiple-choice-options${questionCount}`;
  multipleChoiceOptions.style.display = "none";
  const id_checkBox_Fectch = questionCount;
  if (copyData && copyData.options.length > 0) {
    for (let i = 0; i < copyData.options.length; i++) {
      addCheckboxOption(
        id_checkBox_Fectch,
        multipleChoiceOptions,
        checkBoxCount++,
        copyData.options[i],
        copyData.is_checked[i],
      );
    }
    // copyData.options.forEach(option => addCheckboxOption(id_checkBox_Fectch, multipleChoiceOptions, checkBoxCount++,  option, copyData.is_checked));
  } else {
    addCheckboxOption(
      id_checkBox_Fectch,
      multipleChoiceOptions,
      checkBoxCount++,
    );
  }
  const addOptionButton = document.createElement("button");
  addOptionButton.type = "button";
  addOptionButton.textContent = "Add option";
  addOptionButton.onclick = () => {
    addCheckboxOption(
      id_checkBox_Fectch,
      multipleChoiceOptions,
      checkBoxCount++,
    );
  };
  multipleChoiceOptions.appendChild(addOptionButton);
  questionForm.appendChild(multipleChoiceOptions);

  // Score container
  const scoreContainer = document.createElement("div");
  scoreContainer.classList.add("score-container");

  const scoreLabel = document.createElement("label");
  scoreLabel.textContent = "Score";
  scoreContainer.appendChild(scoreLabel);

  const scoreInput = document.createElement("input");
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

  const buttonsForm = document.createElement("div");
  buttonsForm.classList.add("button-container");
  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.textContent = "Copy question";
  const copyCount = questionCount;
  copyButton.onclick = () => {
    const questionData = {
      question: questionInput.value,
      type: typeSelect.value,
      score: scoreInput.value,
      options: [],
      is_checked: [],
    };
    if (typeSelect.value === "multipleChoice") {
      const getMultipleElement = document.getElementById(
        `id-div-multiple-choice-options${copyCount}`,
      );
      const copyCheckBoxCount =
        getMultipleElement.querySelectorAll("[type='checkbox']");
      for (i = 1; i <= copyCheckBoxCount.length; i++) {
        const optionInput = document.getElementById(
          `multipleChoiceText${copyCount}${i}[]`,
        );
        questionData.options.push(optionInput.value);
        if (optionInput.checked) {
          questionData.is_checked.push("true");
        } else {
          questionData.is_checked.push("false");
        }
      }
    }
    addQuestionForm(questionData);
  };

  buttonsForm.appendChild(copyButton);
  questionForm.appendChild(buttonsForm);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.textContent = "Delete question";
  deleteButton.onclick = () => {
    checkForSubmit--;
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
}

function addCheckboxOption(
  id_checkBox_Fectch,
  container,
  k,
  optionText = "",
  is_checkBox_checked,
) {
  console.log(k);
  const optionDiv = document.createElement("div");
  optionDiv.classList.add("multiple-choice-option");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = `multipleChoice${id_checkBox_Fectch}${k}[]`;
  if (is_checkBox_checked === "true") {
    checkbox.checked = true;
  }

  const optionInput = document.createElement("input");
  optionInput.type = "text";
  optionInput.id = `multipleChoiceText${id_checkBox_Fectch}${k}[]`;
  optionInput.placeholder = "Answer option";
  optionInput.value = optionText; // Якщо є текст варіанту, вставляємо його

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.textContent = "❌"; // Хрестик для видалення
  deleteButton.onclick = () => {
    const formCheckBoxs = document.getElementById(
      `id-div-multiple-choice-options${id_checkBox_Fectch}`,
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
        `multipleChoiceText${id_checkBox_Fectch}${j}[]`,
      );
      amountOfCheckBoxsText.id = `multipleChoiceText${id_checkBox_Fectch}${i}[]`;
      const amountOfCheckBoxs = document.getElementById(
        `multipleChoice${id_checkBox_Fectch}${j}[]`,
      );
      amountOfCheckBoxs.id = `multipleChoice${id_checkBox_Fectch}${i}[]`;
    }
    checkBoxCount = checkBoxCount - 1;
    optionDiv.remove();
  };
  if (k === 1) {
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

function findCheckboxOption(
  id_checkBox_Fectch,
  container,
  optionDataText,
  k,
  maxK,
  optionText = "",
) {
  const question_id = id_checkBox_Fectch - 1;
  const checkedOption = db.exec(
    "SELECT is_correct FROM options WHERE question_id = ?",
    [questionsData[0].values[question_id][0]],
  );
  console.log(checkedOption);
  const optionDiv = document.createElement("div");
  optionDiv.classList.add("multiple-choice-option");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  if (checkedOption[0].values[k - 1][0] === "true") {
    checkbox.checked = true;
  }
  checkbox.id = `multipleChoice${id_checkBox_Fectch}${k}[]`;

  const optionInput = document.createElement("input");
  optionInput.type = "text";
  optionInput.id = `multipleChoiceText${id_checkBox_Fectch}${k}[]`;
  optionInput.placeholder = "Answer option";
  optionInput.value = optionDataText;

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.textContent = "❌"; // Хрестик для видалення
  deleteButton.onclick = () => {
    const formCheckBoxs = document.getElementById(
      `id-div-multiple-choice-options${id_checkBox_Fectch}`,
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
        `multipleChoiceText${id_checkBox_Fectch}${j}[]`,
      );
      amountOfCheckBoxsText.id = `multipleChoiceText${id_checkBox_Fectch}${i}[]`;
      const amountOfCheckBoxs = document.getElementById(
        `multipleChoice${id_checkBox_Fectch}${j}[]`,
      );
      amountOfCheckBoxs.id = `multipleChoice${id_checkBox_Fectch}${i}[]`;
    }
    checkBoxCount = checkBoxCount - 1;
    optionDiv.remove();
  };
  if (k === 1) {
    deleteButton.style.visibility = "hidden";
  }

  optionDiv.appendChild(checkbox);
  optionDiv.appendChild(optionInput);
  optionDiv.appendChild(deleteButton); // Додаємо кнопку видалення
  switch (true) {
    case k <= maxK:
      container.appendChild(optionDiv, container.lastElementChild);
      break;
    case !optionText:
      container.insertBefore(optionDiv, container.lastElementChild);
      break;
    case optionText !== "":
      container.appendChild(optionDiv, container.lastElementChild);
      break;
  }
}

function clearTestData() {
  localStorage.removeItem("teacher_name");
  localStorage.removeItem("test_name");
  localStorage.removeItem("score");
  localStorage.removeItem("date");
}

function toggleOptions(selectElement, questionForm) {
  const trueFalseOptions = questionForm.querySelector(".true-false-options");
  const multipleChoiceOptions = questionForm.querySelector(
    ".multiple-choice-options",
  );
  if (selectElement.value === "trueFalse") {
    trueFalseOptions.style.display = "flex";
    multipleChoiceOptions.style.display = "none";
  } else {
    trueFalseOptions.style.display = "none";
    multipleChoiceOptions.style.display = "block";
  }
}

function getTestData() {
  return {
    title: localStorage.getItem("title"),
  };
}
