let db;
let queryCount = 0;
let sortOrder = {
    time: true, 
    title: true, 
};

async function executeFunctions() {
    await initDatabase();
    if(getUserData().role==="teacher"){
        resultForReviewForTeacher();
    } else {
        resultForReviewForStudent();
    }
}
executeFunctions();

function addQueryFromDB(user_name, test_name, score, date, stringUserRole){
    queryCount++;
    const container = document.getElementById('resultsContainer');
    const divQueryForm = document.createElement('div');
    divQueryForm.classList.add('results-form');
    divQueryForm.dataset.queryId = queryCount;
    divQueryForm.dataset.author = user_name;
    divQueryForm.dataset.title = test_name;
    divQueryForm.dataset.date = date;

    const divQueryFromDB = document.createElement('div');
    divQueryFromDB.classList.add('test-info');

    const divContentQueryFromDBTeacher = document.createElement('div');
    divContentQueryFromDBTeacher.classList.add('test-detail');
    const queryLabelTeacher = document.createElement('label');
    queryLabelTeacher.textContent = `${stringUserRole} Name`;
    const querySpanTeacher = document.createElement('span');
    querySpanTeacher.classList.add('test-title');
    querySpanTeacher.textContent = user_name;
    divContentQueryFromDBTeacher.appendChild(queryLabelTeacher);
    divContentQueryFromDBTeacher.appendChild(querySpanTeacher);

    const divContentQueryFromDBTitle = document.createElement('div');
    divContentQueryFromDBTitle.classList.add('test-detail');
    const queryLabelTitle = document.createElement('label');
    queryLabelTitle.textContent = 'Test Name';
    const querySpanTitle = document.createElement('span');
    querySpanTitle.classList.add('test-title');
    querySpanTitle.textContent = test_name;
    divContentQueryFromDBTitle.appendChild(queryLabelTitle);
    divContentQueryFromDBTitle.appendChild(querySpanTitle);

    const divContentQueryFromDBDate = document.createElement('div');
    divContentQueryFromDBDate.classList.add('test-detail');
    const queryLabelDate = document.createElement('label');
    queryLabelDate.textContent = 'Date';
    const querySpanDate = document.createElement('span');
    querySpanDate.classList.add('test-title');
    querySpanDate.textContent = date;
    divContentQueryFromDBDate.appendChild(queryLabelDate);
    divContentQueryFromDBDate.appendChild(querySpanDate);

    const divContentQueryFromDBScore = document.createElement('div');
    divContentQueryFromDBScore.classList.add('test-detail');
    const queryLabelScore = document.createElement('label');
    queryLabelScore.textContent = 'Score';
    const querySpanScore = document.createElement('span');
    querySpanScore.classList.add('test-title');
    querySpanScore.textContent = score;
    divContentQueryFromDBScore.appendChild(queryLabelScore);
    divContentQueryFromDBScore.appendChild(querySpanScore);

    divQueryFromDB.appendChild(divContentQueryFromDBTeacher);
    divQueryFromDB.appendChild(divContentQueryFromDBTitle);
    divQueryFromDB.appendChild(divContentQueryFromDBDate);
    divQueryFromDB.appendChild(divContentQueryFromDBScore);

    const btnQueryContainer = document.createElement('div');
    btnQueryContainer.classList.add('button-container');
    const btnQuery = document.createElement('button');
    btnQuery.textContent = 'Pass the test';
    btnQuery.classList.add('start-test-btn');
    btnQuery.onclick = () => {
        localStorage.setItem("user_name", user_name);
        localStorage.setItem("test_name", test_name);
        localStorage.setItem("score", score);
        localStorage.setItem("date", date);
        window.location.href = 'view_the_passed_result.html';
    }
    btnQueryContainer.appendChild(btnQuery);
    divQueryForm.appendChild(divQueryFromDB);
    divQueryForm.appendChild(btnQueryContainer);
    container.appendChild(divQueryForm);
}

async function resultForReviewForTeacher(){
    const tests_id = db.exec("SELECT * FROM tests WHERE user_id = ?", [getUserData().id]);
    for (let k = 0; k < tests_id[0].values.length; k++) {
        const testId = tests_id[0].values[k][0];
        const submissions_db = db.exec("SELECT * FROM submissions WHERE test_id = ?", [testId]);

        if (submissions_db && submissions_db[0] && submissions_db[0].values && submissions_db[0].values.length > 0) {
            for (let i = 0; i < submissions_db[0].values.length; i++) {
                const userId = submissions_db[0].values[i][2];
                const submissionId = submissions_db[0].values[i][0];

                const user_name = db.exec("SELECT username FROM users WHERE id = ?", [userId])[0].values[0][0];
                const test_name = db.exec("SELECT title FROM tests WHERE id = ?", [testId])[0].values[0][0];
                const date = db.exec("SELECT submission_date FROM submissions WHERE id = ?", [submissionId])[0].values[0][0];

                let score = 0;
                const student_scores = db.exec("SELECT score FROM option_responses WHERE test_id = ? AND submission_id = ?", [testId, submissionId]);

                for (let j = 0; j < student_scores[0].values.length; j++) {
                    score += student_scores[0].values[j][0];
                }
                const stringUserRole = "Student";
                addQueryFromDB(user_name, test_name, score, date, stringUserRole);
            }
        } 
    }
}

async function resultForReviewForStudent (){
    const submissions_db = db.exec("SELECT * FROM submissions WHERE student_id = ?", [getUserData().id]);

    for(let i=0; i<submissions_db[0].values.length; i++){
        const stringUserRole = "Teacher";
        const user_name = submissions_db[0].values[i][3];
        const user_id = db.exec("SELECT id FROM users WHERE username = ?", [submissions_db[0].values[i][3]])[0].values[0][0];
        const test_name = db.exec("SELECT title FROM tests WHERE id = ? AND user_id = ?", [submissions_db[0].values[i][1], user_id])[0].values[0][0];
        const date = db.exec("SELECT submission_date FROM submissions WHERE id = ?", [submissions_db[0].values[i][0]])[0].values[0][0];
        let score = 0;
        const questionsDb = db.exec("SELECT * FROM questions WHERE test_id = ?", [submissions_db[0].values[i][1]]);
        console.log(questionsDb);
        for(let j=0; j<questionsDb[0].values.length; j++){ 
            const optionsDb = db.exec("SELECT * FROM options WHERE question_id = ?", [questionsDb[0].values[j][0]]);
            let countOfCorrectResponses = 0;

            for(let k=0; k<optionsDb[0].values.length; k++){
                if(optionsDb[0].values[k][4]==="true") countOfCorrectResponses++;
            }
            console.log(countOfCorrectResponses);
            const student_score_question = db.exec("SELECT score FROM option_responses WHERE test_id = ? AND submission_id = ? AND question_id = ?", [submissions_db[0].values[i][1], submissions_db[0].values[i][0], questionsDb[0].values[j][0]]);
            console.log(student_score_question[0].values.length);
            if(student_score_question[0].values.length===countOfCorrectResponses){
                let partOfScore = 0;
                for(let k=0; k<countOfCorrectResponses; k++){
                    if(student_score_question[0].values[k][0]>0){
                        partOfScore += student_score_question[0].values[k][0];
                    } 
                }
                if(questionsDb[0].values[j][4]!==partOfScore) partOfScore = 0;
                score +=partOfScore;
            }
        }
        addQueryFromDB(user_name, test_name, score, date, stringUserRole);
    }
}

document.getElementById("searchInput").addEventListener("input", () => {
    const searchInput = document.getElementById("searchInput").value;
    const container = document.querySelector(".questions-container");
    container.innerHTML = '';
    if(getUserData().role==="teacher"){
        resultForReviewForTeacher();
    } else {
        resultForReviewForStudent();
    }
    const forms = Array.from(container.getElementsByClassName("results-form"));
    if(searchInput!==''){
        forms.forEach(form => {
            if(searchInput.toLowerCase()==form.dataset.author.toLowerCase()||searchInput.toLowerCase()==form.dataset.title.toLowerCase()||searchInput.toLowerCase()==form.dataset.date.toLowerCase()){
                console.log(form.dataset.author);
                container.appendChild(form);
            } else {
                container.removeChild(form);
            }
        });
    }
});

