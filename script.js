let expenses = [];

function addExpense() {
  const title = document.getElementById('expenseTitle').value;
  const amount = parseFloat(document.getElementById('expenseAmount').value);
  const income = parseFloat(document.getElementById('incomeInput').value);
  
  if (title && !isNaN(amount)) {
    expenses.push({ title, amount });
    document.getElementById('expenseTitle').value = '';
    document.getElementById('expenseAmount').value = '';
    renderExpenses();
    calculateSummary(income);
  }
}

function renderExpenses() {
  const list = document.getElementById('expenseList');
  list.innerHTML = '';
  expenses.forEach(e => {
    const li = document.createElement('li');
    li.textContent = `${e.title}: ₹${e.amount}`;
    list.appendChild(li);
  });
}

function calculateSummary(income) {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const balance = income - total;

  document.getElementById('total').textContent = `Total Expenses: ₹${total.toFixed(2)}`;
  document.getElementById('balance').textContent = `Remaining Balance: ₹${balance.toFixed(2)}`;

  updateChart(income);
}

function updateChart(income) {
  const rule1 = {
    Needs: income * 0.5,
    Wants: income * 0.3,
    Savings: income * 0.2
  };
  const rule2 = {
    Invest: income * 0.2,
    Spend: income * 0.8
  };

  const data = {
    labels: ['50/30/20 Rule', 'Buffett Rule'],
    datasets: [
      {
        label: 'Needs',
        data: [rule1.Needs, 0],
        backgroundColor: '#8884d8'
      },
      {
        label: 'Wants',
        data: [rule1.Wants, 0],
        backgroundColor: '#82ca9d'
      },
      {
        label: 'Savings',
        data: [rule1.Savings, 0],
        backgroundColor: '#ffc658'
      },
      {
        label: 'Invest',
        data: [0, rule2.Invest],
        backgroundColor: '#ff7300'
      },
      {
        label: 'Spend',
        data: [0, rule2.Spend],
        backgroundColor: '#0088FE'
      }
    ]
  };

  if (window.barChart) {
    window.barChart.data = data;
    window.barChart.update();
  } else {
    const ctx = document.getElementById('barChart').getContext('2d');
    window.barChart = new Chart(ctx, {
      type: 'bar',
      data,
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: 'Suggested Allocation (Financial Rules)' }
        }
      }
    });
  }
}
