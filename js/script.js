// Basic JavaScript file for future financial calculations and interactions

document.addEventListener('DOMContentLoaded', () => {
    console.log('Financial Planner Loaded');

    // Active navigation link highlighting
    const navLinks = document.querySelectorAll('header nav ul li a');
    const currentPath = window.location.pathname.split('/').pop();

    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href').split('/').pop();
        if (linkPath === currentPath || (currentPath === '' && linkPath === 'index.html')) {
            link.classList.add('active');
        }
    });

    // Expense Tracker Functionality
    const expenseForm = document.getElementById('expense-form');
    const expenseDescriptionInput = document.getElementById('expense-description');
    const expenseAmountInput = document.getElementById('expense-amount');
    const expenseList = document.getElementById('expense-list');
    const totalExpensesAmount = document.getElementById('total-expenses-amount');
    const expenseFormError = document.getElementById('expense-form-error'); // Added

    let expenses = [];

    function renderExpenses() {
        // Clear existing list items
        expenseList.innerHTML = '';
        let total = 0;

        if (expenses.length === 0 && expenseList) {
            expenseList.innerHTML = '<li>No expenses added yet.</li>';
        } else {
            expenses.forEach(expense => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <span>${expense.description}</span>
                    <span>&dollar;${expense.amount.toFixed(2)}</span>
                `;
                expenseList.appendChild(listItem);
                total += expense.amount;
            });
        }
        if (totalExpensesAmount) {
            totalExpensesAmount.textContent = total.toFixed(2);
        }
    }

    if (expenseForm) {
        expenseForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const description = expenseDescriptionInput.value.trim();
            const amount = parseFloat(expenseAmountInput.value);

            if (expenseFormError) expenseFormError.textContent = ''; // Clear previous error

            if (description === '' || isNaN(amount) || amount <= 0) {
                if (expenseFormError) expenseFormError.textContent = 'Please enter a valid description and amount.';
                return;
            }

            const newExpense = {
                id: Date.now(), // Simple unique ID
                description,
                amount
            };

            expenses.push(newExpense);
            renderExpenses();

            // Clear form fields
            expenseDescriptionInput.value = '';
            expenseAmountInput.value = '';
        });
    }

    // Initial render for expenses page (if on that page)
    if (expenseList && totalExpensesAmount && (window.location.pathname.endsWith('expenses.html') || window.location.pathname.endsWith('expenses.html/'))) {
        renderExpenses();
    }

    // Savings Tracker Functionality
    const savingsForm = document.getElementById('savings-form');
    const savingsDescriptionInput = document.getElementById('savings-description');
    const savingsAmountInput = document.getElementById('savings-amount');
    const savingsList = document.getElementById('savings-list');
    const totalSavingsAmount = document.getElementById('total-savings-amount');
    const savingsFormError = document.getElementById('savings-form-error'); // Added

    let savings = [];

    function renderSavings() {
        savingsList.innerHTML = ''; // Clear existing list items
        let total = 0;

        if (savings.length === 0 && savingsList) {
            savingsList.innerHTML = '<li>No savings contributions added yet.</li>';
        } else {
            savings.forEach(saving => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <span>${saving.description}</span>
                    <span>&dollar;${saving.amount.toFixed(2)}</span>
                `;
                savingsList.appendChild(listItem);
                total += saving.amount;
            });
        }
        if (totalSavingsAmount) {
            totalSavingsAmount.textContent = total.toFixed(2);
        }
    }

    if (savingsForm) {
        savingsForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const description = savingsDescriptionInput.value.trim();
            const amount = parseFloat(savingsAmountInput.value);

            if (savingsFormError) savingsFormError.textContent = ''; // Clear previous error

            if (description === '' || isNaN(amount) || amount <= 0) {
                if (savingsFormError) savingsFormError.textContent = 'Please enter a valid description and amount.';
                return;
            }

            const newSaving = {
                id: Date.now(), // Simple unique ID
                description,
                amount
            };

            savings.push(newSaving);
            renderSavings();

            // Clear form fields
            savingsDescriptionInput.value = '';
            savingsAmountInput.value = '';
        });
    }

    // Initial render for savings page (if on that page)
    if (savingsList && totalSavingsAmount && (window.location.pathname.endsWith('savings.html') || window.location.pathname.endsWith('savings.html/'))) {
        renderSavings();
    }
});
