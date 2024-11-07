let db;
let queryCount = 0;
async function executeInitAndQuery(){
    await initDatabase();
    resultOfTestsSearch();
}

executeInitAndQuery();

function addQueryFromDB(title, score){
    queryCount++;
    const container = document.getElementById('testsContainer');
    const divQueryForm = document.createElement('div');
    divQueryForm.classList.add('results-form');
    divQueryForm.dataset.queryId = queryCount;

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

    const divContentQueryFromDBScore = document.createElement('div');
    divContentQueryFromDBScore.classList.add('test-detail');
    const queryLabelScore = document.createElement('label');
    queryLabelScore.textContent = 'Score';
    const querySpanScore = document.createElement('span');
    querySpanScore.classList.add('test-title');
    querySpanScore.textContent = score;
    divContentQueryFromDBScore.appendChild(queryLabelScore);
    divContentQueryFromDBScore.appendChild(querySpanScore);

    divQueryFromDB.appendChild(divContentQueryFromDBTitle);
    divQueryFromDB.appendChild(divContentQueryFromDBScore);

    const btnQueryContainer = document.createElement('div');
    btnQueryContainer.classList.add('button-container');
    const btnQuery = document.createElement('button');
    btnQuery.textContent = 'Edit test';
    btnQuery.classList.add('start-test-btn');
    btnQuery.onclick = () => {
        localStorage.setItem("title", title);
        window.location.href = 'edit_test.html';
    }
    btnQueryContainer.appendChild(btnQuery);
    divQueryForm.appendChild(divQueryFromDB);
    divQueryForm.appendChild(btnQueryContainer);
    container.appendChild(divQueryForm);
}

async function resultOfTestsSearch (){
    const resultsTests = db.exec(`SELECT * FROM tests WHERE user_id = ?`, [getUserData().id]);
    for(let i=0; i<resultsTests[0].values.length; i++){
        const title = resultsTests[0].values[i][2];
        const amountOfQuestion = db.exec("SELECT * FROM questions WHERE test_id = ?", [resultsTests[0].values[i][0]]);
        let score = 0;
        for(let j=0; j<amountOfQuestion[0].values.length; j++){
            const singleScore = db.exec("SELECT rating FROM questions WHERE test_id = ?", [resultsTests[0].values[i][0]])[0].values[0][0];
            score += singleScore;
        } 
        addQueryFromDB(title, score);
    }
}