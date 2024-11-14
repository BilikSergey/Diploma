let db;
let queryCount = 0;
let sortOrder = {
    time: true, 
    title: true, 
};
initDatabase();


// Додаємо подію для інпуту пошуку
document.getElementById("searchInput").addEventListener("input", () => {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = "";
    const searchInput = document.getElementById("searchInput").value;
    const searchWords = searchInput.toLowerCase().split(/\s+/);

    // Формуємо SQL-запит з умовами для кожного слова
    let sqlQuery = "SELECT * FROM tests WHERE ";
    let conditions = searchWords.map(word => {
        return `LOWER(title) LIKE '%${word}%'`;
    });
    sqlQuery += conditions.join(' OR ');  // Об'єднуємо умови через OR для пошуку хоча б одного співпадіння
    const resultsTests = db.exec(sqlQuery);

    sqlQuery = "SELECT * FROM users WHERE ";
    conditions = searchWords.map(word => {
        return `LOWER(username) LIKE '%${word}%'`;
    });
    sqlQuery += conditions.join(' OR ');  // Об'єднуємо умови через OR для пошуку хоча б одного співпадіння
    const resultsTeachers = db.exec(sqlQuery);
    switch(true){
        case(searchInput.length!==0 && resultsTests.length!==0 && resultsTeachers.length!==0 && resultsTeachers[0].values[0][4] === "teacher"):
            resultOfTestsSearch (resultsTests);
            resultOfTeacherSearch (resultsTeachers);
            break;
        case(searchInput.length!==0 && resultsTests.length!==0):
            console.log(resultsTests);
            resultOfTestsSearch (resultsTests);
            break;
        case(searchInput.length!==0 &&  resultsTeachers.length!==0 && resultsTeachers[0].values[0][4] === "teacher"):
            console.log(resultsTeachers); 
            resultOfTeacherSearch (resultsTeachers);
            break;
    }
});

function addQueryFromDB(title, author, score, startTime, endTime){
    queryCount++;
    const container = document.getElementById('resultsContainer');
    const divQueryForm = document.createElement('div');
    divQueryForm.classList.add('results-form');
    divQueryForm.dataset.queryId = queryCount;
    divQueryForm.dataset.author = author;
    divQueryForm.dataset.title = title;
    divQueryForm.dataset.date = '';

    const divQueryFromDB = document.createElement('div');
    divQueryFromDB.classList.add('test-info');

    const divContentQueryFromDBTitle = document.createElement('div');
    divContentQueryFromDBTitle.classList.add('test-detail');
    const queryLabelTitle = document.createElement('label');
    queryLabelTitle.textContent = 'Test Name';
    const querySpanTitle = document.createElement('span');
    querySpanTitle.classList.add('test-title');
    querySpanTitle.textContent = title;
    divContentQueryFromDBTitle.appendChild(queryLabelTitle);
    divContentQueryFromDBTitle.appendChild(querySpanTitle);

    const divContentQueryFromDBAuthor = document.createElement('div');
    divContentQueryFromDBAuthor.classList.add('test-detail');
    const queryLabelAuthor = document.createElement('label');
    queryLabelAuthor.textContent = 'Author';
    const querySpanAuthor = document.createElement('span');
    querySpanAuthor.classList.add('test-title');
    querySpanAuthor.textContent = author;
    divContentQueryFromDBAuthor.appendChild(queryLabelAuthor);
    divContentQueryFromDBAuthor.appendChild(querySpanAuthor);

    const divContentQueryFromDBScore = document.createElement('div');
    divContentQueryFromDBScore.classList.add('test-detail');
    const queryLabelScore = document.createElement('label');
    queryLabelScore.textContent = 'Score';
    const querySpanScore = document.createElement('span');
    querySpanScore.classList.add('test-title');
    querySpanScore.textContent = score;
    divContentQueryFromDBScore.appendChild(queryLabelScore);
    divContentQueryFromDBScore.appendChild(querySpanScore);

    const divContentQueryFromDBTimer = document.createElement('div');
    divContentQueryFromDBTimer.classList.add('test-detail');
    const queryLabelTimer = document.createElement('label');
    queryLabelTimer.textContent = 'Date of passing';
    const querySpanTimer = document.createElement('span');
    querySpanTimer.classList.add('test-title');
    querySpanTimer.textContent = startTime;
    divContentQueryFromDBTimer.appendChild(queryLabelTimer);
    divContentQueryFromDBTimer.appendChild(querySpanTimer);

    divQueryFromDB.appendChild(divContentQueryFromDBTitle);
    divQueryFromDB.appendChild(divContentQueryFromDBAuthor);
    divQueryFromDB.appendChild(divContentQueryFromDBScore);
    divQueryFromDB.appendChild(divContentQueryFromDBTimer);

    const btnQueryContainer = document.createElement('div');
    btnQueryContainer.classList.add('button-container');
    const btnQuery = document.createElement('button');
    btnQuery.textContent = 'Pass the test';
    
    const now = new Date();
    const timeForStart = new Date(startTime); 
    const timeForEnd = new Date(endTime); 
    if(timeForStart>now){
        btnQuery.classList.add('disable-start-test-btn');
        btnQuery.onclick = () => alert("The time for passing the exam has not come");
    } else if(timeForEnd<now){
        btnQuery.classList.add('disable-start-test-btn');
        btnQuery.onclick = () => alert("The time for passing the exam has ended");
    }else {
        btnQuery.classList.add('start-test-btn');
        btnQuery.onclick = () => {
            localStorage.setItem("title", title);
            localStorage.setItem("author", author);
            localStorage.setItem("score", score);
            document.getElementById("searchInput").value = '';
            window.location.href = 'pass_tests.html';
        }
    }
    btnQueryContainer.appendChild(btnQuery);
    divQueryForm.appendChild(divQueryFromDB);
    divQueryForm.appendChild(btnQueryContainer);
    container.appendChild(divQueryForm);
}

function resultOfTestsSearch (resultsTests){
    for(let i=0; i<resultsTests[0].values.length; i++){
        const result = db.exec("SELECT * FROM submissions WHERE test_id = ?", [resultsTests[0].values[i][0]]);
        const isTestAlreadyPassedByResultTests = result.length > 0 && result[0].values.length > 0 ? result[0].values[0][0] : null;
        if(isTestAlreadyPassedByResultTests) continue;
        const title = resultsTests[0].values[i][2];
        const author = db.exec("SELECT username FROM users WHERE id = ?", [resultsTests[0].values[i][1]])[0].values[0][0];
        const startTime = db.exec("SELECT time_of_starting FROM tests WHERE id = ?", [resultsTests[0].values[i][0]])[0].values[0][0];
        const endTime = db.exec("SELECT time_of_ending FROM tests WHERE id = ?", [resultsTests[0].values[i][0]])[0].values[0][0];
        const amountOfQuestion = db.exec("SELECT * FROM questions WHERE test_id = ?", [resultsTests[0].values[i][0]]);
        let score = 0;
        for(let j=0; j<amountOfQuestion[0].values.length; j++){
            const singleScore = db.exec("SELECT rating FROM questions WHERE test_id = ?", [resultsTests[0].values[i][0]])[0].values[0][0];
            score += singleScore;
        } 
        addQueryFromDB(title, author, score, startTime, endTime);
    }
}

function resultOfTeacherSearch (resultsTeachers){
    const amountOfTestsOfUsers = db.exec("SELECT * FROM tests WHERE user_id = ?", [resultsTeachers[0].values[0][0]]);
    for(let i=0; i<amountOfTestsOfUsers[0].values.length; i++){
        const id_test = db.exec("SELECT id FROM tests WHERE user_id = ?", [resultsTeachers[0].values[0][0]])[0].values[i][0];
        console.log(id_test);
        const result = db.exec("SELECT * FROM submissions WHERE test_id = ?", [id_test]);
        const isTestAlreadyPassedByResultTeacher = result.length > 0 && result[0].values.length > 0 ? result[0].values[0][0] : null;
        if (isTestAlreadyPassedByResultTeacher) continue;
        const title = db.exec("SELECT title FROM tests WHERE user_id = ?", [resultsTeachers[0].values[0][0]])[0].values[i][0];                
        const author = resultsTeachers[0].values[0][1];
        const startTime = db.exec("SELECT time_of_starting FROM tests WHERE id = ?", [id_test])[0].values[0][0];
        const endTime = db.exec("SELECT time_of_ending FROM tests WHERE id = ?", [id_test])[0].values[0][0];
        const amountOfQuestion = db.exec("SELECT * FROM questions WHERE test_id = ?", [id_test]);
        let score = 0;
        for(let j=0; j<amountOfQuestion[0].values.length; j++){
            const singleScore = db.exec("SELECT rating FROM questions WHERE test_id = ?", [id_test])[0].values[j][0];
            score += singleScore;
        } 
        addQueryFromDB(title, author, score, startTime, endTime);
    }
}
