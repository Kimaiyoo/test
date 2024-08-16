document.addEventListener('DOMContentLoaded', function() {

    // Handle Registration Form
    if (window.location.pathname.includes('register.html')) {
        handleRegistrationForm();
    }

    // Handle Login Form
    if (window.location.pathname.includes('login.html')) {
        handleLoginForm();
    }

    // Handle Add Expense Form
    if (window.location.pathname.includes('add_expense.html')) {
        handleExpenseForm('POST');
    }

    // Handle View Expenses
    if (window.location.pathname.includes('view_expense.html')) {
        fetchExpenses();
    }

    // Handle Edit Expense Form
    if (window.location.pathname.includes('edit_expense.html')) {
        handleExpenseEditForm();
    }
});

function handleRegistrationForm() {
    const registerForm = document.getElementById('registerForm');

    if (registerForm) {
        registerForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            })
            .then(response => response.json())
            .then(data => {
                if (data.message === 'User registered successfully') {
                    window.location.href = './login.html';
                } else {
                    alert('Registration failed: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred during registration.');
            });
        });
    } else {
        console.error('Registration form element not found.');
    }
}

function handleLoginForm() {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            })
            .then(response => response.json())
            .then(data => {
                if (data.token) {
                    localStorage.setItem('authToken', data.token);
                    window.location.href = './add_expense.html';
                } else {
                    alert('Login failed: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred during login.');
            });
        });
    } else {
        console.error('Login form element not found.');
    }
}

function handleExpenseForm(method) {
    const expenseForm = document.getElementById('expenseForm');

    if (expenseForm) {
        expenseForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const date = document.getElementById('date').value;
            const description = document.getElementById('description').value;
            const amount = parseFloat(document.getElementById('amount').value);

            fetch('/api/expenses', {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ date, description, amount })
            })
            .then(response => response.json())
            .then(data => {
                if (data.message === 'Expense added successfully' || data.message === 'Expense updated successfully') {
                    window.location.href = './view_expense.html';
                } else {
                    alert('Failed to add/update expense: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while adding/updating the expense.');
            });
        });
    } else {
        console.error('Expense form element not found.');
    }
}

function fetchExpenses() {
    const token = localStorage.getItem('authToken');
    fetch('/api/expenses', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        const tbody = document.querySelector('tbody');
        tbody.innerHTML = '';
        data.forEach(expense => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(expense.date).toISOString().split('T')[0]}</td>
                <td>${expense.description}</td>
                <td>$${expense.amount.toFixed(2)}</td>
                <td>
                    <a href="./edit_expense.html?id=${expense.expense_id}">Edit</a> |
                    <a href="#" data-id="${expense.expense_id}" class="delete-expense">Delete</a>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-expense').forEach(button => {
            button.addEventListener('click', function(event) {
                event.preventDefault();
                const expenseId = this.getAttribute('data-id');
                deleteExpense(expenseId);
            });
        });
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function deleteExpense(id) {
    const token = localStorage.getItem('authToken');
    fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'Expense deleted successfully') {
            fetchExpenses();
        } else {
            alert('Failed to delete expense: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function handleExpenseEditForm() {
    const urlParams = new URLSearchParams(window.location.search);
    const expenseId = urlParams.get('id');

    if (expenseId) {
        fetchExpenseDetails(expenseId);

        function fetchExpenseDetails(id) {
            const token = localStorage.getItem('authToken');
            fetch(`/api/expenses/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.expense) {
                    document.getElementById('date').value = new Date(data.expense.date).toISOString().split('T')[0];
                    document.getElementById('description').value = data.expense.description;
                    document.getElementById('amount').value = data.expense.amount;
                } else {
                    alert('Expense not found');
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        }

        document.querySelector('form').addEventListener('submit', function(event) {
            event.preventDefault();

            const date = document.getElementById('date').value;
            const description = document.getElementById('description').value;
            const amount = parseFloat(document.getElementById('amount').value);

            fetch(`/api/expenses/${expenseId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ date, description, amount })
            })
            .then(response => response.json())
            .then(data => {
                if (data.message === 'Expense updated successfully') {
                    window.location.href = './view_expense.html';
                } else {
                    alert('Failed to update expense: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        });
    } else {
        alert('No expense ID provided');
    }
}
