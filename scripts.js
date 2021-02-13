const Modal = {
    modalToggle () {
        document
            .querySelector('.modal-overlay')
            .classList
            .toggle('active')
    }  
}

const ModalEdit = {
    modalToggle () {
        document
            .querySelector('.modal-overlay-edit')
            .classList
            .toggle('active')
    }  
}

const Storage = {
    get() {
        return JSON.parse(localStorage.getItem("dev.finances:transactions")) || [];
    },
    set(transactions) {
        localStorage.setItem(
            "dev.finances:transactions",
            JSON.stringify(transactions)
        );
    }
}

const Transaction = {
    all: Storage.get(),

    add(transaction) {
        Transaction.all.push(transaction);
        App.reload();
    },

    remove(index) {
        Transaction.all.splice(index, 1);
        App.reload();
    },

    edit(index) {
        ModalEdit.modalToggle();
        description = document.querySelector('input#description-edit');
        amount = document.querySelector('input#amount-edit');
        date = document.querySelector('input#date-edit');

        Transaction.all.forEach(function(item, i) {
            if (index === i) {
                description.value = item.description;
                amount.value = item.amount;
                date.value = Utils.formatDateInverse(item.date);
            }
        });
    },

    incomes () {
        let income = 0;

        Transaction.all.forEach((transaction) => {
           if(transaction.amount > 0) {
               income+= transaction.amount;
           } 
        });

        return income;
    },

    expenses () {
        let expense = 0;

        Transaction.all.forEach((transaction) => {
           if(transaction.amount < 0) {
            expense+= transaction.amount;
           } 
        });

        return expense;
    },

    total () {
        let total = 0;

        total = this.incomes() + this.expenses();

        return total;
    }
}

const DOM = {
    transactionsContainer: document.querySelector('#data-table tbody'),

    addTransaction(transaction, index) {
        const tr = document.createElement('tr');
        tr.innerHTML = DOM.innerHMTLTransaction(transaction, index);
        tr.dataset.index = index;

        DOM.transactionsContainer.appendChild(tr);
    },
    innerHMTLTransaction(transaction, index) {
        const CSSclass = transaction.amount > 0 ? "income" : "expense";

        const amount = Utils.formatCurrency(transaction.amount);

        const html = `
            <td class="description">${transaction.description}</td>
            <td class="${CSSclass}">${amount}</td>
            <td class="date">${transaction.date}</td>
            <td>
                <img class="action-icon" onclick="Transaction.remove(${index})" src="./assets/minus.svg" alt="Remover transação">
                <img class="action-icon" onclick="Transaction.edit(${index})" src="./assets/pencil.svg" alt="Editar transação">
            </td>
        `;

        return html;
    },
    updateBalance() {
        document
            .getElementById('incomeDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.incomes());
        
        document
            .getElementById('expenseDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.expenses());
        
        document
            .getElementById('totalDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.total());
    },

    clearTransactions() {
        DOM.transactionsContainer.innerHTML = "";
    }
}

const Utils = {
    formatAmount(value) {
        value = value * 100;
        
        return value;
    },
    formatDate(date) {
        const splittedDate = date.split("-");
        return `${splittedDate[2]}/${splittedDate[1]}/${splittedDate[0]}`
    },
    formatDateInverse(date) {
        const splittedDate = date.split("/");
        return `${splittedDate[2]}-${splittedDate[1]}-${splittedDate[0]}`
    },

    formatCurrency(value) { 
        const signal = Number(value) < 0 ? "-" : "";

        value = String(value).replace(/\D/g, "");

        value = Number(value) / 100;

        value = value.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });

        return signal + value
    }
}

const Form = {
    description: document.querySelector('input#description'),
    amount: document.querySelector('input#amount'),
    date: document.querySelector('input#date'),

    getValues() {
        return {
            description: Form.description.value,
            amount: Form.amount.value,
            date: Form.date.value,
        }
    },
    valideFields() {
        const {description, amount, date} = Form.getValues();
        
        if(
            description.trim() === "" ||
            amount.trim() === "" ||
            date.trim() === "") {
                throw new Error("Por favor, preencha todos os campos");
        }
    },
    formatValues() {
        let {description, amount, date} = Form.getValues();
        amount = Utils.formatAmount(amount);
        date = Utils.formatDate(date);

        return {
            description,
            amount,
            date
        }
    },
    clearFields() {
        Form.description.value = "";
        Form.amount.value = "";
        Form.date.value = "";
    },
    submit(event) {
        event.preventDefault();

        try {
            Form.valideFields();

            const transaction = Form.formatValues();

            Transaction.add(transaction);

            Form.clearFields();
            
            Modal.modalToggle();

            App.reload();
        }   catch (error) {
            alert(error.message);
        }
    }
}

const App = {
    init() {
        Transaction.all.forEach(function(transaction, index) {
            DOM.addTransaction(transaction, index);
        });

        DOM.updateBalance();

        Storage.set(Transaction.all);
    },

    reload() {
        DOM.clearTransactions();
        App.init();
    }
}

App.init();    



//Transaction.edit(1);