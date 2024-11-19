import { DatabaseManager, TablesManager, QuestionAdder, IntoDBTestAdderChecker} from "./database.js";
let dbManager;
let questionManager;
let tablesManager;
let questionCount = 0;
let checkForSubmit = 0;
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

document.addEventListener("click", (event) => {
  if (event.target.classList.contains("delete-button-class")) {
    questionManager.deleteCheckBoxOption(event);
  }
});

document.addEventListener("click", (event) => {
  if (event.target.classList.contains("copyQuestionClass")) {
    const newCounter = questionManager.copyQuestion(
      submit_button,
      questionCount,
      checkForSubmit,
      event
    );

    // Оновлюємо лічильники
    console.log(newCounter);
    questionCount = newCounter;
    checkForSubmit = newCounter;
  }
});

document.getElementById("id_submit_button").addEventListener('click', () => {
  tablesManager = new TablesManager(dbManager);
  const intoDbTestManager = new IntoDBTestAdderChecker(dbManager, tablesManager);
  intoDbTestManager.sendTestIntoDB(questionCount)
  dbManager.saveDatabase();
  tablesManager.viewAllTable("tests");
  tablesManager.viewAllTable("questions");
  tablesManager.viewAllTable("options");
  console.log("Tests, questions and options added!");
});

