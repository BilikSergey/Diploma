function sendResultOfStudent(){
    db.run("INSERT INTO submissions (test_id, student_id) VALUES (?, ?)", [test_id[0].values[0][0], getUserData().id]);
    let counterI = 0;
    for(let i = 1; i<=questionCount; i++){  
        let counterJ = 0;
        db.run("INSERT INTO responses (test_id, submission_id, question_id) VALUES (?, ?, ?)", [test_id[0].values[0][0], getLastRecord("submissions")[0], questionsData[0].values[counterI][0]]);
        const optionData = db.exec(`SELECT * FROM options WHERE question_id = ${questionsData[0].values[counterI][0]}`);
        const form_checkBox = document.querySelector(`#id-div-multiple-choice-options${i}`);
        const trueRadio = document.getElementById(`id_true${i}`);
        if(form_checkBox){
            const checkboxes = form_checkBox.querySelectorAll('input[type="checkbox"]');
            for(let j = 1; j<=checkboxes.length; j++){           
                const response_checkBox = document.getElementById(`multipleChoice${i}${j}[]`);
                if(response_checkBox.checked){
                    db.run("INSERT INTO option_responses (test_id, submission_id, question_id, selected_option_id, score) VALUES (?, ?, ?, ?, ?)", [test_id[0].values[0][0], getLastRecord("submissions")[0], questionsData[0].values[counterI][0], optionData[0].values[counterJ][0], optionData[0].values[counterJ][4]]);
                }
                counterJ++;
            }
        } else {     
            if(trueRadio.checked){
                db.run("INSERT INTO option_responses (test_id, submission_id, question_id, selected_option_id, score) VALUES (?, ?, ?, ?, ?)", [test_id[0].values[0][0], getLastRecord("submissions")[0], questionsData[0].values[0][0], optionData[0].values[0][0], optionData[0].values[0][4]]);
            } else {
                db.run("INSERT INTO option_responses (test_id, submission_id, question_id, selected_option_id, score) VALUES (?, ?, ?, ?, ?)", [test_id[0].values[0][0], getLastRecord("submissions")[0], questionsData[0].values[1][0], optionData[0].values[1][0], optionData[0].values[1][4]]);
            }
        }
        counterI++;
    }
    saveDatabase();
    viewDatabase();
    clearTestData();
    window.location.href = "cabinet_student.html";
    console.log("Data succesfully added");
}