let db;
let questionCount = 0;
let checkForSubmit = 0;
const userData = {};
const submit_button = document.getElementById("id_submit_button");
initDatabase();

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
            return is_checkBox_checked = false;
        }
    }
    return is_checkBox_checked="true/false";
}

function sendTestIntoDB(){
    const testName = document.getElementById("id_input_test_name");
    const stmtTitleTest = db.prepare("SELECT 1 FROM tests WHERE title = ? AND user_id = ?");
    stmtTitleTest.bind([testName.value, getUserData().id]); // Передаємо параметри без вкладеного масиву
    const TitleTestExists = stmtTitleTest.step();

    if(TitleTestExists){
        alert("You have already created a test with this name");
        return true;
    } 
    for(let i=1; i<=questionCount; i++){
        let is_checkBox_checked = false;
        const questionName = document.getElementById(`question${i}`);
        if(questionName===null){
            continue;
        }
        const scoreName = document.getElementById(`score${i}`);    
        const form_checkBox = document.querySelector(`#id-div-multiple-choice-options${i}`);
        const checkboxes = form_checkBox.querySelectorAll('input[type="checkbox"]');
        const form_of_CheckBox = document.getElementById(`id-div-multiple-choice-options${i}`);
        is_checkBox_checked = isCheckBoxsEmpty(form_of_CheckBox, checkboxes, is_checkBox_checked, i);
        switch(true){
            case(!testName.value):
                highlightElement(testName);
                return true;
            case(!questionName.value):
                highlightElement(questionName);
                questionName.scrollIntoView({ behavior: 'smooth' });
                return true;
            case(!scoreName.value):
                highlightElement(scoreName);
                scoreName.scrollIntoView({ behavior: 'smooth' });
                return true;
            case(is_checkBox_checked===false):
                return true;  
        }
    }
    const userData = getUserData();
    db.run("INSERT INTO tests (user_id, title) VALUES (?, ?)", [userData.id, testName.value]);
    addTest();
    saveDatabase();
    viewDatabase();
}

function addTest() {
    for (let i = 1; i <= questionCount; i++) {
        const test_id = getLastRecord("tests")[0];
        const text_question = document.getElementById(`question${i}`);
        if(text_question===null){
            continue;
        }
        let response_type;
        const rating = document.getElementById(`score${i}`).value;
        const selectorOptions = document.getElementById(`id-div-multiple-choice-options${i}`);
        response_type = selectorOptions.style.display === 'block' ? "multiple" : "true/false";
        db.run("INSERT INTO questions (test_id, text, response_type, rating) VALUES (?, ?, ?, ?)", [test_id, text_question.value, response_type, rating]);

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

function addQuestionForm(copyData = null) {
    const container = document.getElementById('questionsContainer');
    let checkBoxCount = 1;
    submit_button.style.visibility = 'visible';
    questionCount++;
    checkForSubmit++;
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

    const multipleChoiceOptions = document.createElement('div');
    multipleChoiceOptions.classList.add('options-container', 'multiple-choice-options');
    multipleChoiceOptions.id = `id-div-multiple-choice-options${questionCount}`;
    multipleChoiceOptions.style.display = 'none';
    const id_checkBox_Fectch = questionCount;
    if (copyData && copyData.options.length>0) {
        copyData.options.forEach(option => addCheckboxOption(id_checkBox_Fectch, multipleChoiceOptions, checkBoxCount++,  option));
    } else {
        addCheckboxOption(id_checkBox_Fectch, multipleChoiceOptions, checkBoxCount++);
    }
    const addOptionButton = document.createElement('button');
    addOptionButton.type = 'button';
    addOptionButton.textContent = 'Add option';
    addOptionButton.onclick = () => {
        addCheckboxOption(id_checkBox_Fectch, multipleChoiceOptions, checkBoxCount++);
    }
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
    copyButton.onclick = () => {
        const questionData = {
            question: questionInput.value,
            type: typeSelect.value,
            score: scoreInput.value,
            options: []
        };
        if (typeSelect.value === 'multipleChoice') {
            for(i = 1; i<checkBoxCount; i++){
                const optionInput = document.getElementById(`multipleChoiceText${questionCount}${i}[]`);
                questionData.options.push(optionInput.value);
            }
        }
        addQuestionForm(questionData);
    };
    
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
    switch(true){
        case(!optionText):
            container.insertBefore(optionDiv, container.lastElementChild); 
            break;
        case(optionText!==''):
            container.appendChild(optionDiv, container.lastElementChild); 
            break;
    }       
}

function highlightElement(element) {
    element.classList.add('highlight-animated');
    
    setTimeout(() => {
        element.classList.remove('highlight-animated');
    }, 2000);
}
