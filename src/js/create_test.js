import { DatabaseManager, TablesManager, QuestionAdder } from "./database.js";
let dbManager;
let questionManager;
let tablesManager;
let questionCount = 0;
let checkForSubmit = 0;
let checkBoxCount = 1;
const submit_button = document.getElementById("id_submit_button");

(async () => {
  dbManager = new DatabaseManager();
  await dbManager.init();
})();

document.getElementById("id-add-question").addEventListener("click", () => {
  questionManager = new QuestionAdder();
  const newCounter = questionManager.addQuestionForm(
    submit_button,
    questionCount,
    checkForSubmit
  );
  console.log(newCounter);
  questionCount = newCounter;
  checkForSubmit = newCounter;
});


document.addEventListener('click', (event) => {
  if (event.target.classList.contains('copyQuestionClass')) {
    const buttonFullId = event.target.id;
    const buttonNumId = buttonFullId[buttonFullId.length - 1]; // Останній символ ID кнопки
    
    // Отримуємо елементи з відповідними ID
    const questionTitle = document.getElementById(`question${buttonNumId}`);
    const typeSelect = document.querySelector(`[name="questionType${buttonNumId}"]`);
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
        const checkBoxList = getMultipleElement.querySelectorAll("[type='checkbox']");
        for (let j = 1; j <= checkBoxList.length; j++) {
          const optionInput = document.getElementById(`multipleChoiceText${buttonNumId}${j}[]`);
          questionData.options.push(optionInput.value);
        }
      }
    }
    // Виклик функції для додавання форми питання
    const newCounter = questionManager.addQuestionForm(
      submit_button,
      questionCount,
      checkForSubmit,
      questionData
    );

    // Оновлюємо лічильники
    console.log(newCounter);
    questionCount = newCounter;
    checkForSubmit = newCounter;
  }
});

      

function isCheckBoxsEmpty(
  form_of_CheckBox,
  checkboxes,
  is_checkBox_checked,
  i
) {
  if (form_of_CheckBox.style.display === "block") {
    for (let j = 1; j <= checkboxes.length; j++) {
      const response_text = document.getElementById(
        `multipleChoiceText${i}${j}[]`
      );
      const response_checkBox = document.getElementById(
        `multipleChoice${i}${j}[]`
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
  const startTime = document.getElementById("test-datetime-start");
  const endTime = document.getElementById("test-datetime-end");
  const stmtTitleTest = db.prepare(
    "SELECT 1 FROM tests WHERE title = ? AND user_id = ?"
  );
  stmtTitleTest.bind([testName.value, dbManager.getUserData().id]); // Передаємо параметри без вкладеного масиву
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
    const checkboxes = form_checkBox.querySelectorAll('input[type="checkbox"]');
    const form_of_CheckBox = document.getElementById(
      `id-div-multiple-choice-options${i}`
    );
    is_checkBox_checked = isCheckBoxsEmpty(
      form_of_CheckBox,
      checkboxes,
      is_checkBox_checked,
      i
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
  const userData = dbManager.getUserData();
  addTestAndRedirect(
    userData.id,
    testName.value,
    startTime.value,
    endTime.value
  );
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
      `id-div-multiple-choice-options${i}`
    );
    response_type =
      selectorOptions.style.display === "block" ? "multiple" : "true/false";
    db.run(
      "INSERT INTO questions (test_id, text, response_type, rating) VALUES (?, ?, ?, ?)",
      [test_id, text_question.value, response_type, rating]
    );

    const id_test_question = getLastRecord("questions")[0];
    const form_checkBox = document.querySelector(
      `#id-div-multiple-choice-options${i}`
    );
    const checkboxes = form_checkBox.querySelectorAll('input[type="checkbox"]');
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
        db.run(
          "INSERT INTO options (question_id, test_id, text, is_correct) VALUES (?, ?, ?, ?)",
          [
            id_test_question,
            test_id,
            response_text,
            response_checkBox.checked ? "true" : "false",
          ]
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
              [id_test_question, test_id, "true", "true"]
            );
            break;
          case j === 1 && !radio_is_checked_true.checked:
            db.run(
              "INSERT INTO options (question_id, test_id,  text, is_correct) VALUES (?, ?, ?, ?)",
              [id_test_question, test_id, "true", "false"]
            );
            break;
          case j === 2 && radio_is_checked_false.checked:
            db.run(
              "INSERT INTO options (question_id, test_id, text, is_correct) VALUES (?, ?, ?, ?)",
              [id_test_question, test_id, "false", "true"]
            );
            break;
          case j === 2 && !radio_is_checked_false.checked:
            db.run(
              "INSERT INTO options (question_id, test_id, text, is_correct) VALUES (?, ?, ?, ?)",
              [id_test_question, test_id, "false", "false"]
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

function highlightElement(element) {
  element.classList.add("highlight-animated");

  setTimeout(() => {
    element.classList.remove("highlight-animated");
  }, 2000);
}

async function addTestAndRedirect(userData, testName, StartTime, EndTime) {
  await db.run(
    "INSERT INTO tests (user_id, title, time_of_starting, time_of_ending) VALUES (?, ?, ?, ?)",
    [userData, testName, StartTime, EndTime]
  );
  addTest();
  await saveDatabase();
  setTimeout(() => {
    window.location.href = "cabinet_teacher.html";
  }, 500);
}
