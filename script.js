import { showAuthForm, showRegisterForm, viewDatabase, addUser} from "./database.js";

// submit_button.addEventListener('click', () => {
//     const username = document.getElementById('new-name').value;
//     const email = document.getElementById('new-email').value;
//     const password = document.getElementById('new-password').value;
//     const role = document.getElementById('role').value;
//     const submit_button = document.getElementById('submit_button_id');
//     addUser(username, email, password, role);
//  });





// Показуємо форму авторизації при завантаженні
showAuthForm();
addUser();
// viewDatabase();
