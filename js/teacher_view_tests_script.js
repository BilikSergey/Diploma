let db;
let queryCount = 0;
async function executeInitAndQuery() {
  // eslint-disable-next-line no-undef
  await initDatabase();
  resultOfTestsSearch();
}

executeInitAndQuery();

function addQueryFromDB(title, score) {
  queryCount++;
  const container = document.getElementById("testsContainer");
  const divQueryForm = document.createElement("div");
  divQueryForm.classList.add("results-form");
  divQueryForm.dataset.queryId = queryCount;

  const divQueryFromDB = document.createElement("div");
  divQueryFromDB.classList.add("test-info");

  const divContentQueryFromDBTitle = document.createElement("div");
  divContentQueryFromDBTitle.classList.add("test-detail");
  const queryLabelTitle = document.createElement("label");
  queryLabelTitle.textContent = "Test Name";
  const querySpanTitle = document.createElement("span");
  querySpanTitle.classList.add("test-title");
  querySpanTitle.textContent = title;
  divContentQueryFromDBTitle.appendChild(queryLabelTitle);
  divContentQueryFromDBTitle.appendChild(querySpanTitle);

  const divContentQueryFromDBScore = document.createElement("div");
  divContentQueryFromDBScore.classList.add("test-detail");
  const queryLabelScore = document.createElement("label");
  queryLabelScore.textContent = "Score";
  const querySpanScore = document.createElement("span");
  querySpanScore.classList.add("test-title");
  querySpanScore.textContent = score;
  divContentQueryFromDBScore.appendChild(queryLabelScore);
  divContentQueryFromDBScore.appendChild(querySpanScore);

  divQueryFromDB.appendChild(divContentQueryFromDBTitle);
  divQueryFromDB.appendChild(divContentQueryFromDBScore);

  const btnQueryContainer = document.createElement("div");
  btnQueryContainer.classList.add("button-container");
  const btnQuery = document.createElement("button");
  btnQuery.textContent = "Edit test";
  btnQuery.classList.add("start-test-btn");
  btnQuery.onclick = () => {
    localStorage.setItem("title", title);
    window.location.href = "edit_test.html";
  };
  const btnQueryDelete = document.createElement("button");
  btnQueryDelete.textContent = "Delete test";
  btnQueryDelete.classList.add("start-test-btn");
  btnQueryDelete.onclick = () => {
    const test_id = db.exec(
      "SELECT id FROM tests WHERE title = ? AND user_id = ?",
      // eslint-disable-next-line no-undef
      [title, getUserData().id],
    )[0].values[0][0];
    deletePriorTableInfo(test_id);
    // eslint-disable-next-line no-undef
    saveDatabase();
    setTimeout(() => {
      location.reload(true);
    }, 500);
  };
  btnQueryContainer.appendChild(btnQuery);
  btnQueryContainer.appendChild(btnQueryDelete);
  divQueryForm.appendChild(divQueryFromDB);
  divQueryForm.appendChild(btnQueryContainer);
  container.appendChild(divQueryForm);
}

async function resultOfTestsSearch() {
  const resultsTests = db.exec(`SELECT * FROM tests WHERE user_id = ?`, [
    // eslint-disable-next-line no-undef
    getUserData().id,
  ]);
  for (let i = 0; i < resultsTests[0].values.length; i++) {
    const title = resultsTests[0].values[i][2];
    const amountOfQuestion = db.exec(
      "SELECT * FROM questions WHERE test_id = ?",
      [resultsTests[0].values[i][0]],
    );
    let score = 0;
    for (let j = 0; j < amountOfQuestion[0].values.length; j++) {
      const singleScore = db.exec(
        "SELECT rating FROM questions WHERE test_id = ?",
        [resultsTests[0].values[i][0]],
      )[0].values[0][0];
      score += singleScore;
    }
    addQueryFromDB(title, score);
  }
}

function deletePriorTableInfo(test_id) {
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
