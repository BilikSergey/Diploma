let db;
let queryCount = 0;
async function executeFunctions() {
    await initDatabase();
    resultForReview();
}
executeFunctions();


function addQueryFromDB(teacher_name, test_name, score, date){
    queryCount++;
    const container = document.getElementById('resultsContainer');
    const divQueryForm = document.createElement('div');
    divQueryForm.classList.add('results-form');
    divQueryForm.dataset.queryId = queryCount;

    const divQueryFromDB = document.createElement('div');
    divQueryFromDB.classList.add('test-info');

    const divContentQueryFromDBTeacher = document.createElement('div');
    divContentQueryFromDBTeacher.classList.add('test-detail');
    const queryLabelTeacher = document.createElement('label');
    queryLabelTeacher.textContent = 'Teacher Name';
    const querySpanTeacher = document.createElement('span');
    querySpanTeacher.classList.add('test-title');
    querySpanTeacher.textContent = teacher_name;
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
        localStorage.setItem("teacher_name", teacher_name);
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

function resultForReview (){
    const submissions_db = db.exec("SELECT * FROM submissions WHERE student_id = ?", [getUserData().id]);

    for(let i=0; i<submissions_db[0].values.length; i++){
        const teacher_name = submissions_db[0].values[i][3];
        const user_id = db.exec("SELECT id FROM users WHERE username = ?", [submissions_db[0].values[i][3]])[0].values[0][0];
        const test_name = db.exec("SELECT title FROM tests WHERE id = ? AND user_id = ?", [submissions_db[0].values[i][1], user_id])[0].values[0][0];
        const student_score_amount = db.exec("SELECT score FROM option_responses WHERE test_id = ? AND submission_id = ?", [submissions_db[0].values[i][1], submissions_db[0].values[i][0]]);
        const date = db.exec("SELECT submission_date FROM submissions WHERE id = ?", [submissions_db[0].values[i][0]])[0].values[0][0];
        let score = 0;
        const student_score = db.exec("SELECT score FROM option_responses WHERE test_id = ? AND submission_id = ?", [submissions_db[0].values[i][1], submissions_db[0].values[i][0]]);
        for(let j=0; j<student_score_amount[0].values.length; j++){ 
            score += student_score[0].values[j][0];
        }
        addQueryFromDB(teacher_name, test_name, score, date);
    }
}