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
        
        Transaction.sortArrObj();

        App.reload();
    },

    remove(index) {
        Transaction.all.splice(index, 1);
        App.reload();
    },
    
    update(transaction, index) {
        Transaction.all.map(function(t, i){
            if (index === i) {
                t.description = transaction.description;
                t.amount = transaction.amount;
                t.date = transaction.date;
            }
            
            return t;
        });
    },

    sortArrObj() {
        const newArrObj = Transaction.all.sort((a, b) => {
            let dateA = new Date(Utils.formatDateInverse(a.date)),
                dateB = new Date(Utils.formatDateInverse(b.date));
            
            return dateB.getTime() - dateA.getTime();
        });

        Storage.set(newArrObj);
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

// last searched transactions array to be used instead Transaction.all array in a global scope
let searchedArr = [];
const stateLastSearch = {
    searchedArr
}

const DOM = {
    transactionsContainer: document.querySelector('#data-table tbody'),
    searchKey: document.querySelector('input#search'),

    searchTransactions() {
        const searchKey = document.querySelector('input#search');

        searchKey.addEventListener('keyup', () => {
            let newArrObj = Transaction.all.map((transaction, index) => {
                if(transaction.description.toLowerCase().includes(searchKey.value.toLowerCase())) {
                    return {
                        index: index,
                        amount: transaction.amount,
                        description: transaction.description,
                        date: transaction.date
                    };
                }
            });

            let treatedArrObj = newArrObj.filter((transaction) => {
                return transaction !== undefined
            });

            stateLastSearch.searchedArr = treatedArrObj;

            DOM.populate(treatedArrObj);
        });
    },
    
    populate(treatedArrObj) {
        DOM.clearTransactions();

        if(DOM.searchKey.value === '') {
            state.totalPages = Math.ceil(Transaction.all.length / state.perPage);
        } else {
            state.totalPages = Math.ceil(stateLastSearch.searchedArr.length / state.perPage);
        }

        if(treatedArrObj === undefined) {
            treatedArrObj = stateLastSearch.searchedArr;
        }

        const searchKey = document.querySelector('input#search').value.trim();

        let page = state.page - 1;
        let start = page * state.perPage;
        let end = start + state.perPage;

        if(searchKey === '') {
            const paginatedRows = Transaction.all.slice(start, end); 

            paginatedRows.forEach(function(transaction, index) {
                DOM.addTransaction(transaction, index);
            });

            dataTableStatus({qttRows: paginatedRows.length, start});
        } else {
            const paginatedRows = treatedArrObj.slice(start, end); 

            paginatedRows.forEach(function(transaction) {
                DOM.addTransaction(transaction, transaction.index);
            });

            dataTableStatus({qttRows: paginatedRows.length, start});
        }

        buttons.update();
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
        EditForm.index.value = "";
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

// Pagination scripts
let perPage = 5;
let totalPages = Math.ceil(Transaction.all.length / perPage);
const state = {
    page: 1,
    perPage,
    totalPages,
    maxVisibleButtons: 3
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
        state.page = +page;

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

const buttons = {
    element: html.get('.pagination .numbers'),

    create(number) {
        const button = document.createElement('div');
        
        button.innerHTML = number;

        if(state.page == number) {
            button.classList.add('active');
        }

        button.addEventListener('click', (event) => {
            const page = event.target.innerText;
            controls.goTo(page);
            update();
        });

        buttons.element.appendChild(button);
    },

    update() {
        html.get('.pagination .numbers').innerHTML = "";
        const {maxLeft, maxRight} = buttons.calculateMaxVisible();

        for(let page = maxLeft; page <= maxRight; page++) {
            buttons.create(page);
        }
    },
    
    calculateMaxVisible() {
        const { maxVisibleButtons } = state;
        let maxLeft = (state.page - Math.floor(maxVisibleButtons / 2));
        let maxRight = (state.page + Math.floor(maxVisibleButtons / 2));

        if( maxLeft < 1) {
            maxLeft = 1;
            maxRight = maxVisibleButtons;
        }

        if( maxRight > state.totalPages) {
            maxLeft = state.totalPages - (maxVisibleButtons - 1);
            maxRight = state.totalPages;

            if(maxLeft < 1) {
                maxLeft = 1
            }
        }

        return {maxLeft, maxRight}
    }
}

function dataTableStatus(rows) {
    const statusBar = html.get('.datatable-status');

    const totalTransactions = Transaction.all.length;

    const start = DOM.searchKey.value !== '' && stateLastSearch.searchedArr.length === 0 ? 0 : rows.start + 1;
    const end =  rows.start + rows.qttRows;
    
    statusBar.innerHTML = `Mostrando ${start}-${end} de ${totalTransactions} registro(s)`;
}

function clearSearchInput() {
    const input = document.querySelector('input#search');

    input.addEventListener('search', () => {
        update();
    });
}

function SelectPerPage() {
    const select =  document.querySelector('#perPage');

    state.perPage = select.value;

    update();
}

function update() {
    App.init();
}

const App = {
    init() {
        DOM.populate();

        buttons.update();

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

DOM.searchTransactions();

clearSearchInput();

