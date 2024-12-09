let db;
let questionCount = 0;
const testInfo = getTestData();
let user_id;
let test_id;
let questionsData;
let submission_id;

async function executeFunctions() {
  // eslint-disable-next-line no-undef
  await initDatabase();
  user_id = db.exec(
    `SELECT id FROM users WHERE username = '${testInfo.user_name}'`,
  );
  // eslint-disable-next-line no-undef
  if (getUserData().role === "teacher") {
    test_id = db.exec(
      // eslint-disable-next-line no-undef
      `SELECT id FROM tests WHERE user_id = '${getUserData().id}' AND title = '${testInfo.test_name}'`,
    )[0].values[0][0];
  } else {
    test_id = db.exec(
      `SELECT id FROM tests WHERE user_id = '${user_id[0].values[0][0]}' AND title = '${testInfo.test_name}'`,
    )[0].values[0][0];
  }
  questionsData = db.exec(`SELECT * FROM questions WHERE test_id = ${test_id}`);
  // eslint-disable-next-line no-undef
  if (getUserData().role === "teacher") {
    submission_id = db.exec(
      `SELECT id FROM submissions WHERE test_id = ${test_id} AND student_id = ${user_id[0].values[0][0]}`,
    )[0].values[0][0];
  } else {
    submission_id = db.exec(
      // eslint-disable-next-line no-undef
      `SELECT id FROM submissions WHERE test_id = ${test_id} AND student_id = ${getUserData().id}`,
    )[0].values[0][0];
  }
  let scoreCount = 0;
  const submitButton = document.getElementById("id_submit_button");
  for (let i = 0; i < questionsData[0].values.length; i++) {
    scoreCount += questionsData[0].values[i][4];
  }
  if (testInfo.score != scoreCount) {
    submitButton.style.visibility = "visible";
  }
  generateTest();
}
executeFunctions();

async function generateTest() {
  const testName = document.getElementById("id_input_test_name");
  testName.textContent = testInfo.test_name;
  for (let i = 0; i < questionsData[0].values.length; i++) {
    const optionData = db.exec(
      `SELECT * FROM options WHERE question_id = ${questionsData[0].values[i][0]}`,
    );
    const container = document.getElementById("questionsContainer");
    questionCount++;
    const questionForm = document.createElement("div");
    questionForm.classList.add("question-form");
    questionForm.dataset.questionId = questionCount;

    const questionLabel = document.createElement("label");
    questionLabel.textContent = "Questions:";
    questionForm.appendChild(questionLabel);

    const questionInput = document.createElement("input");
    questionInput.type = "text";
    questionInput.readOnly = true;
    questionInput.placeholder = "The content of the question";
    questionInput.id = `question${questionCount}`;
    questionInput.name = `question${questionCount}`;
    questionInput.value = questionsData[0].values[i][2];
    questionForm.appendChild(questionInput);
    const checkedOption = db.exec(
      "SELECT selected_option_id FROM option_responses WHERE test_id = ? AND question_id = ?",
      [test_id, questionsData[0].values[i][0]],
    );
    let styleForTrue = "";
    let styleForFalse = "";
    let correctCheck = "";
    let uncorrectCheck = "";
    switch (questionsData[0].values[i][3]) {
      case "true/false":
        if (optionData[0].values[0][4] === "true") {
          styleForTrue = "correctOptions";
          styleForFalse = "uncorrectOptions";
          correctCheck = "✔";
          uncorrectCheck = "✖";
        } else {
          styleForTrue = "uncorrectOptions";
          styleForFalse = "correctOptions";
          correctCheck = "✖";
          uncorrectCheck = "✔";
        }
        if (optionData[0].values[0][0] === checkedOption[0].values[0][0]) {
          const trueFalseOptionsTrue = document.createElement("div");
          trueFalseOptionsTrue.classList.add("true-false-options");
          trueFalseOptionsTrue.innerHTML = `
                        <label class=${styleForTrue}><input id="id_true${questionCount}" checked disabled  type="radio" name="answer${questionCount}" value="true">True ${correctCheck}</label>
                        <label class=${styleForFalse}><input id="id_false${questionCount}" disabled  type="radio" name="answer${questionCount}" value="false">False ${uncorrectCheck}</label>
                    `;
          questionForm.appendChild(trueFalseOptionsTrue);
        } else {
          const trueFalseOptionsFalse = document.createElement("div");
          trueFalseOptionsFalse.classList.add("true-false-options");
          trueFalseOptionsFalse.innerHTML = `
                        <label class=${styleForTrue}><input id="id_true${questionCount}" disabled  type="radio" name="answer${questionCount}" value="true">True ${correctCheck}</label>
                        <label class=${styleForFalse}><input id="id_false${questionCount}" checked disabled  type="radio" name="answer${questionCount}" value="false">False ${uncorrectCheck}</label>
                    `;
          questionForm.appendChild(trueFalseOptionsFalse);
        }
        break;
      case "multiple":
        const multipleChoiceOptions = document.createElement("div");
        multipleChoiceOptions.classList.add(
          "options-container",
          "multiple-choice-options",
        );
        multipleChoiceOptions.id = `id-div-multiple-choice-options${questionCount}`;
        multipleChoiceOptions.style.display = "block";
        const id_checkBox_Fectch = questionCount;
        for (let j = 0; j < optionData[0].values.length; j++) {
          addCheckboxOption(
            id_checkBox_Fectch,
            multipleChoiceOptions,
            optionData[0].values[j][3],
            j,
            optionData,
          );
          questionForm.appendChild(multipleChoiceOptions);
        }
        break;
    }
    const scoreContainer = document.createElement("div");
    scoreContainer.classList.add("score-container");

    const scoreLabel = document.createElement("label");
    scoreLabel.textContent = "Score";
    scoreContainer.appendChild(scoreLabel);

    const scoreInput = document.createElement("label");
    scoreInput.id = `score${questionCount}`;
    scoreInput.name = `score${questionCount}`;
    scoreInput.textContent = `${getScoreOfStudent(i)}/${questionsData[0].values[i][4]}`;
    scoreContainer.appendChild(scoreInput);
    questionForm.appendChild(scoreContainer);
    container.appendChild(questionForm);
  }
}

function addCheckboxOption(
  id_checkBox_Fectch,
  container,
  optionDataText,
  j,
  optionData,
) {
  const question_id = id_checkBox_Fectch - 1;
  const checkedOption = db.exec(
    "SELECT selected_option_id FROM option_responses WHERE submission_id = ? AND test_id = ? AND question_id = ?",
    [submission_id, test_id, questionsData[0].values[question_id][0]],
  );
  const correctCheckOption = db.exec(
    "SELECT is_correct FROM options WHERE test_id = ? AND question_id = ?",
    [test_id, questionsData[0].values[question_id][0]],
  )[0].values[j][0];
  const optionDiv = document.createElement("div");
  optionDiv.classList.add("multiple-choice-option");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.disabled = true;
  for (let i = 0; i < checkedOption[0].values.length; i++) {
    if (optionData[0].values[j][0] === checkedOption[0].values[i][0]) {
      checkbox.checked = true;
    }
  }
  j++;
  checkbox.id = `multipleChoice${id_checkBox_Fectch}${j}[]`;

  const optionInput = document.createElement("input");
  optionInput.type = "text";
  optionInput.readOnly = true;
  optionInput.id = `multipleChoiceText${id_checkBox_Fectch}${j}[]`;
  optionInput.placeholder = "Answer option";
  optionInput.value = optionDataText;

  const iscorrectCheck = document.createElement("button");
  if (correctCheckOption === "true") {
    iscorrectCheck.textContent = "✅";
    optionInput.classList.add("correctOptions");
  } else {
    iscorrectCheck.textContent = "❌";
    optionInput.classList.add("uncorrectOptions");
  }

  optionDiv.appendChild(checkbox);
  optionDiv.appendChild(optionInput);
  optionDiv.appendChild(iscorrectCheck);
  container.appendChild(optionDiv, container.lastElementChild);
}

function getTestData() {
  return {
    user_name: localStorage.getItem("user_name"),
    test_name: localStorage.getItem("test_name"),
    score: localStorage.getItem("score"),
    date: localStorage.getItem("date"),
  };
}

function getScoreOfStudent(i) {
  let score = 0;
  const questionsDb = db.exec("SELECT * FROM questions WHERE test_id = ?", [
    test_id,
  ]);
  for (let j = i; j < questionsDb[0].values.length; j++) {
    const optionsDb = db.exec("SELECT * FROM options WHERE question_id = ?", [
      questionsDb[0].values[j][0],
    ]);
    let countOfCorrectResponses = 0;

    for (let k = 0; k < optionsDb[0].values.length; k++) {
      if (optionsDb[0].values[k][4] === "true") countOfCorrectResponses++;
    }
    const student_score_question = db.exec(
      "SELECT score FROM option_responses WHERE test_id = ? AND submission_id = ? AND question_id = ?",
      [test_id, submission_id, questionsDb[0].values[j][0]],
    );
    if (student_score_question[0].values.length === countOfCorrectResponses) {
      for (let k = 0; k < countOfCorrectResponses; k++) {
        if (student_score_question[0].values[k][0] > 0) {
          score += student_score_question[0].values[k][0];
        }
      }
      if (questionsDb[0].values[j][4] !== score) score = 0;
    }
    return score;
  }
}

document
  .getElementById("id_submit_button")
  .addEventListener("click", async () => {
    for (let i = 1; i <= questionCount; i++) {
      let text = document.getElementById("id_input_test_name").textContent;
      const questionText = document.getElementById(`question${i}`).value;
      const scoreText = document.getElementById(`score${i}`).textContent;
      const isAnswerCorrect = scoreText.split("/");
      if (isAnswerCorrect[0] !== isAnswerCorrect[1]) {
        text += " " + questionText;
        console.log(text);
        const results = await getSearchResults(text);
        displayResults(results);
      }
    }
  });

async function getSearchResults(query) {
  const response = await fetch("http://localhost:3000/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: query }),
  });

  const data = await response.json();
  return data;
}

function displayResults(results) {
  const resultsContainer = document.getElementById("questionsContainer");
  resultsContainer.innerHTML = `<p>Результати пошуку: </p><pre>${results}</pre>`;
}
