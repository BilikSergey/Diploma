queryCount++;
    const container = document.getElementById('resultsContainer');
    const divQueryForm = document.createElement('div');
    divQueryForm.classList.add('question-form');
    divQueryForm.dataset.queryId = queryCount;

    const divQueryFromDB = document.createElement('div');
    divQueryFromDB.classList.add('test-info');

    const divContentQueryFromDBTitle = document.createElement('div');
    divContentQueryFromDBTitle.classList.add('test-detail');
    const queryLabelTitle = document.createElement('label');
    queryLabelTitle.textContent = 'Test Name';
    const querySpanTitle = document.createElement('span');
    querySpanTitle.classList.add('test-title');
    querySpanTitle.textContent = '';
    divContentQueryFromDBTitle.appendChild('queryLabelTitle');
    divContentQueryFromDBTitle.appendChild('querySpanTitle');

    const divContentQueryFromDBAuthor = document.createElement('div');
    divContentQueryFromDBAuthor.classList.add('test-detail');
    const queryLabelAuthor = document.createElement('label');
    queryLabelAuthor.textContent = 'Author';
    const querySpanAuthor = document.createElement('span');
    querySpanAuthor.classList.add('test-title');
    querySpanAuthor.textContent = '';
    divContentQueryFromDBAuthor.appendChild('queryLabelAuthor');
    divContentQueryFromDBAuthor.appendChild('querySpanAuthor');

    const divContentQueryFromDBScore = document.createElement('div');
    divContentQueryFromDBScore.classList.add('test-detail');
    const queryLabelScore = document.createElement('label');
    queryLabelScore.textContent = 'Author';
    const querySpanScore = document.createElement('span');
    querySpanScore.classList.add('test-title');
    querySpanScore.textContent = '';
    divContentQueryFromDBScore.appendChild('queryLabelScore');
    divContentQueryFromDBScore.appendChild('querySpanScore');

    divQueryFromDB.appendChild('divContentQueryFromDBTitle');
    divQueryFromDB.appendChild('divContentQueryFromDBAuthor');
    divQueryFromDB.appendChild('divContentQueryFromDBScore');

    const btnQueryContainer = document.createElement('div');
    btnQueryContainer.classList.add('button-container');
    const btnQuery = document.createElement('button');
    btnQuery.classList.add('add-question-btn');

    divQueryForm.appendChild('divQueryFromDB');
    divQueryForm.appendChild('btnQueryContainer');
    container.appendChild('divQueryForm');