function addInTable () {
            const request = indexedDB.open("DatabaseDiploma", 2);            

            request.onsuccess = (event) => {
                const db = event.target.result;

                // Спочатку отримуємо id з першої таблиці, наприклад, з таблиці "testsDatabase"
                const transaction = db.transaction(["testsDatabase", "questionsDatabase", "optionsDatabase"], "readwrite");
                const testsStore = transaction.objectStore("testsDatabase");
                const questionsStore = transaction.objectStore("questionsDatabase");
                const optionsStore = transaction.objectStore("optionsDatabase");

                // Шукаємо запис з id = 1, але це може бути інший критерій
                const getRequest = testsStore.openCursor(null, "prev"); 

                for(let i = 1; i<=questionCount;i++){
                    getRequest.onsuccess = (event) => {
                        const record = event.target.result;
                        if (record) {
                            const testId = record.id; // Отримуємо id, щоб вставити в іншу таблицю
                            const textId = document.getElementById(`question${i}`).value;
                            const selectorOptions = document.getElementById(`id-div-multiple-choice-options${questionCount}`);
                            const ratingId = document.getElementById(`score${i}`).value;
                            let responseType;
    
                            if(selectorOptions.style.display == 'block'){
                                responseType = "multiple";
                            } else {
                                responseType = "true/false";
                            }
    
                            const newQuestion = {
                                id: i,
                                test_id: testId, // Використовуємо отриманий id
                                text: textId,
                                response_type: responseType,
                                rating: ratingId
                            };
                            questionsStore.add(newQuestion); // Додаємо новий запис в "questionsDatabase"
                        }
                    };
    
                    getRequest.onerror = (event) => {
                        console.error("Помилка при отриманні id з таблиці:", event);
                    };
    
                    const getRequest2 = questionsStore.get(i);
                    getRequest2.onsuccess = (event) => {
                        const record = event.target.result;
                        if (record) {
                            const questionId = record.id; // Отримуємо id, щоб вставити в іншу таблицю
                            const form_checkBox = document.querySelector(`#id-div-multiple-choice-options${questionCount}`);
                            const checkboxes = form_checkBox.querySelectorAll('input[type="checkbox"]');
                            if(record.response_type=="multiple"){
                                for(let j = 1; j<=checkboxes.length;j++){
                                    const response_text = document.getElementById(`multipleChoiceText${questionCount}${j}[]`);
                                    const response_checkBox = document.getElementById(`multipleChoice${questionCount}${j}[]`);
                                    if(response_checkBox.checked){
                                        const newOption = {
                                            id: j,
                                            question_id: questionId, // Використовуємо отриманий id
                                            text: response_text,
                                            is_correct: "true"
                                        };
                                        optionsStore.add(newOption);
                                    } else{
                                        const newOption = {
                                            id: j,
                                            question_id: questionId, // Використовуємо отриманий id
                                            text: response_text,
                                            is_correct: "false"
                                        };
                                        optionsStore.add(newOption);
                                    }
                                }
                            } else {
                                for(let j = 1; j<=2;j++){
                                    let newOption = {};
                                    const radio_is_checked_true = document.getElementById(`id_true${questionCount}`);
                                    const radio_is_checked_false = document.getElementById(`id_false${questionCount}`);
                                    switch(true){
                                        case(j===1&&radio_is_checked_true.checked):
                                            newOption = {
                                                id: j,
                                                question_id: questionId, // Використовуємо отриманий id
                                                text: "true",
                                                is_correct: "true"
                                            };
                                            optionsStore.add(newOption);
                                            break;
                                        case(j===1&&!radio_is_checked_true.checked):
                                            newOption = {
                                                id: j,
                                                question_id: questionId, // Використовуємо отриманий id
                                                text: "true",
                                                is_correct: "false"
                                            };
                                            optionsStore.add(newOption);
                                            break;
                                        case(j===2&&radio_is_checked_false.checked):
                                            newOption = {
                                                id: j,
                                                question_id: questionId, // Використовуємо отриманий id
                                                text: "false",
                                                is_correct: "true"
                                            };
                                            optionsStore.add(newOption);
                                            break;
                                        case(j===2&&!radio_is_checked_false.checked):
                                            newOption = {
                                                id: j,
                                                question_id: questionId, // Використовуємо отриманий id
                                                text: "false",
                                                is_correct: "false"
                                            };
                                            optionsStore.add(newOption);
                                            break;
                                    }
                                }
                            }  
                        }
                    };
                    getRequest2.onerror = (event) => {
                        console.error("Помилка при отриманні id з таблиці:", event);
                    };
                }
            };
            request.onerror = (event) => {
                console.error("Помилка відкриття бази даних:", event);
            };
        }