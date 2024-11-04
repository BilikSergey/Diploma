let db;
let questionCount = 0;
const testInfo = getTestData();
const user_id = db.exec(`SELECT id FROM users WHERE username = '${testInfo.author}'`);
const test_id = db.exec(`SELECT id FROM tests WHERE user_id = '${user_id[0].values[0][0]}' AND title = '${testInfo.title}'`);
const questionsData = db.exec(`SELECT * FROM questions WHERE test_id = ${test_id[0].values[0][0]}`);
async function executeFunctions() {
    await initDatabase();
    generateTest();
}
executeFunctions();

async function generateTest(){
    for(let i = 0; i<questionsData[0].values.length; i++){
        const optionData = db.exec(`SELECT * FROM options WHERE question_id = ${questionsData[0].values[i][0]}`);
        const container = document.getElementById('questionsContainer');
        questionCount++;
        const questionForm = document.createElement('div');
        questionForm.classList.add('question-form');
        questionForm.dataset.questionId = questionCount;

        const questionLabel = document.createElement('label');
        questionLabel.textContent = 'Questions:';
        questionForm.appendChild(questionLabel);

        const questionInput = document.createElement('input');
        questionInput.type = 'text';
        questionInput.readOnly = true;  
        questionInput.placeholder = 'The content of the question'
        questionInput.id = `question${questionCount}`;
        questionInput.name = `question${questionCount}`;
        questionInput.value = questionsData[0].values[i][2];
        questionForm.appendChild(questionInput);

        switch(questionsData[0].values[i][3]){
            case ("true/false"):
                const trueFalseOptions = document.createElement('div');
                trueFalseOptions.classList.add('true-false-options');
                trueFalseOptions.innerHTML = `
                    <label><input id="id_true${questionCount}" checked type="radio" name="answer${questionCount}" value="true">True</label>
                    <label><input id="id_false${questionCount}" type="radio" name="answer${questionCount}" value="false">False</label>
                `;
                questionForm.appendChild(trueFalseOptions);
                break;
            case ("multiple"):
                const multipleChoiceOptions = document.createElement('div');
                multipleChoiceOptions.classList.add('options-container', 'multiple-choice-options');
                multipleChoiceOptions.id = `id-div-multiple-choice-options${questionCount}`;
                multipleChoiceOptions.style.display = 'block';
                const id_checkBox_Fectch = questionCount;
                for(let j = 0; j <optionData[0].values.length; j++){
                    addCheckboxOption(id_checkBox_Fectch, multipleChoiceOptions, optionData[0].values[j][3], j);
                    questionForm.appendChild(multipleChoiceOptions);
                }
                break;
        }
        const scoreContainer = document.createElement('div');
        scoreContainer.classList.add('score-container');

        const scoreLabel = document.createElement('label');
        scoreLabel.textContent = 'Score';
        scoreContainer.appendChild(scoreLabel);

        const scoreInput = document.createElement('label');
        scoreInput.id = `score${questionCount}`;
        scoreInput.name = `score${questionCount}`;
        scoreInput.textContent = questionsData[0].values[i][4];
        scoreContainer.appendChild(scoreInput);
        questionForm.appendChild(scoreContainer);
        container.appendChild(questionForm);
    }
    
}

function addCheckboxOption(id_checkBox_Fectch, container, optionDataText, j) { 
    const optionDiv = document.createElement('div');
    optionDiv.classList.add('multiple-choice-option');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `multipleChoice${id_checkBox_Fectch}${j++}[]`;

    const optionInput = document.createElement('input');
    optionInput.type = 'text';
    optionInput.readOnly = true;
    optionInput.id = `multipleChoiceText${id_checkBox_Fectch}${j++}[]`;
    optionInput.placeholder = 'Answer option';
    optionInput.value = optionDataText;    

    optionDiv.appendChild(checkbox);
    optionDiv.appendChild(optionInput);
    // container.insertBefore(optionDiv, container.lastElementChild); 
    container.appendChild(optionDiv, container.lastElementChild);       
}

function getTestData(){
    return {
        title: localStorage.getItem("title"),
        author: localStorage.getItem("author"),
        score: localStorage.getItem("score")
    }
}

function sendResultOfStudent(){
    db.run("INSERT INTO submissions (test_id, student_id) VALUES (?, ?)", [test_id, getUserData().id]);

    db.run("INSERT INTO responses (test_id, submission_id, question_id) VALUES (?, ?, ?)", [test_id, getLastRecord("submissions")[0], questionsData[0].values[i][0]]);

    for(let i = 1; i<=questionCount; i++){
        const optionData = db.exec(`SELECT * FROM options WHERE question_id = ${questionsData[0].values[i][0]}`);
        const form_checkBox = document.querySelector(`#id-div-multiple-choice-options${i}`);
        if(form_checkBox){
            for(let j = 1; j<=questionCount; j++){            
                const response_checkBox = document.getElementById(`multipleChoice${i}${j}[]`);
                if(response_checkBox.checked===true){
                    db.run("INSERT INTO option_responses (test_id, submission_id, question_id, selected_option_id, score) VALUES (?, ?, ?, ?, ?)", [test_id, getLastRecord("submissions")[0], questionsData[0].values[i][0], optionData[0].values[j][0], optionData[0].values[j][4]]);
                }
            }
        }
    }
    saveDatabase();
    console.log("Data succesfully added");
    
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
