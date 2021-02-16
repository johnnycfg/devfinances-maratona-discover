const Modal = {
    modalToggle () {
        document
            .querySelector('.modal-overlay')
            .classList
            .toggle('active')
    }  
}

const EditModal = {
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

    
    update(transaction, index) {
        let newArrObj = Transaction.all.map(function(t, i){
            if (index === i) {
                t.description = transaction.description;
                t.amount = transaction.amount;
                t.date = transaction.date;
            }
            
            return t;
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
    populate() {
        DOM.clearTransactions();

        let page = state.page - 1;
        let start = page * state.perPage;
        let end = start + state.perPage;

        const paginatedRows = Transaction.all.slice(start, end);

        paginatedRows.forEach(function(transaction, index) {
            let newIndex = index + start;
            DOM.addTransaction(transaction, newIndex);
        });
    },
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
                <img class="action-icon" onclick="EditForm.edit(${index})" src="./assets/pencil.svg" alt="Editar transação">
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
    
    formatAmountInverse(value) {
        value = value / 100;

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

const EditForm = {
    description: document.querySelector('input#description-edit'),
    amount: document.querySelector('input#amount-edit'),
    date: document.querySelector('input#date-edit'),
    index: document.querySelector('input#index'),

    edit(index) {
        EditModal.modalToggle();

        Transaction.all.forEach(function(transaction, i) {
            if (index === i) {
                EditForm.setValues(transaction, index);
            }
        });
    },
    setValues(transaction, index) {
        EditForm.description.value = transaction.description;
        EditForm.amount.value = Utils.formatAmountInverse(transaction.amount);
        EditForm.date.value = Utils.formatDateInverse(transaction.date);
        EditForm.index.value = index;
    },
    getValues() {
        return {
            description: EditForm.description.value,
            amount: EditForm.amount.value,
            date: EditForm.date.value,
        }
    },
    validateFields() {
        const {description, amount, date} = EditForm.getValues();
        
        if(
            description.trim() === "" ||
            amount.trim() === "" ||
            date.trim() === "") {
                throw new Error("Por favor, preencha todos os campos");
        }
    },
    formatValues() {
        let {description, amount, date} = EditForm.getValues();
        amount = Utils.formatAmount(amount);
        date = Utils.formatDate(date);

        return {
            description,
            amount,
            date
        }
    },
    clearFields() {
        EditForm.description.value = "";
        EditForm.amount.value = "";
        EditForm.date.value = "";
    },
    submit(event) {
        event.preventDefault();

        try {
            EditForm.validateFields();

            const transaction = EditForm.formatValues();

            Transaction.update(transaction, Number(EditForm.index.value));

            EditForm.clearFields();
            
            EditModal.modalToggle();

            App.reload();
        }   catch (error) {
            alert(error.message);
        }
    }
}


const html = {
    get(element) {
        return document.querySelector(element);
    }
}

let perPage = 5;
const state = {
    page: 1,
    perPage,
    totalPages: Math.ceil(Transaction.all.length / perPage),
}

const controls = {
    next() {
        state.page++;

        const lastPage = state.page > state.totalPages;

        if(lastPage) {
            state.page--;
        }
    },
    prev() {
        state.page--;

        if(state.page < 1) {
            state.page++;
        }
    },
    goTo(page) {
        state.page = page;

        if(page < 1) {
            state.page = 1
        }

        if(page > state.totalPages) {
            state.page = state.totalPages;
        }
    },
    createListeners() {
        html.get('.first').addEventListener('click', () => {
            controls.goTo(1);
            update();
        });

        html.get('.last').addEventListener('click', () => {
            controls.goTo(state.totalPages);
            update();
        });

        html.get('.next').addEventListener('click', () => {
            controls.next();
            update();
        });

        html.get('.prev').addEventListener('click', () => {
            controls.prev();
            update();
        });
    }
}

function update() {
    console.log(state.page);
    App.init();
}

const App = {
    init() {
        

        DOM.populate();

        DOM.updateBalance();

        Storage.set(Transaction.all);
    },

    reload() {
        DOM.clearTransactions();
        App.init();
    }
}

App.init();    

controls.createListeners();




console.log('totalPages: ' + state.totalPages);
