let db;
const INDEXDB_VERSION = 1
const DATABASE = "BudgetTracker"
const OFFLINE_TRANSACTIONS = "OFFLINE_TRANSACTIONS"

// Create connection to local IndexDB - For saving offline transactions
const request = indexedDB.open(DATABASE, INDEXDB_VERSION);

// event callback when database version changes
request.onupgradeneeded = function (event) {
    // save ref to database
    const db = event.target.result;
    // create database named: OFFLINE_TRANSACTIONS
    db.createObjectStore(OFFLINE_TRANSACTIONS, { autoIncrement: true });
}

// event callback when database creation success
request.onsuccess = function (event) {
    // save reference to global db variable
    db = event.target.result;
    // if app is online, run uploadTransactions() to send all local data to server
    if (navigator.onLine) {
        uploadTransactions();
    }

}

// event callback when  upon error
request.onerror = function (event) {
    // log error if error using IndexDB
    console.error(event.target.errorCode);
}

// function to upload local data to API
function uploadTransactions() {
    const transaction = db.transaction([OFFLINE_TRANSACTIONS], 'readwrite'); // Start transaction
    const trxObjectStore = transaction.objectStore(OFFLINE_TRANSACTIONS); // Access Database
    const getAll = trxObjectStore.getAll(); // Get all transactions -> returns a promise

    // if data collected, then push to API via fetch
    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            console.log("---------- Uploading Transactions ------------")
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        console.error(serverResponse); // Something went wrong
                    }
                    // if no error then delete the transactions from database
                    // open one more transaction
                    const transaction = db.transaction(OFFLINE_TRANSACTIONS, 'readwrite');
                    const trxObjectStore = transaction.objectStore(OFFLINE_TRANSACTIONS);
                    trxObjectStore.clear();
                    console.log('All transactions saved offline have been submitted');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    }
}

// listen for app coming back online - when it comes back online, upload locally-stored trx
window.addEventListener('online', uploadTransactions);

// Helper Function to save transaction online
function saveRecord(record) {
    const transaction = db.transaction([OFFLINE_TRANSACTIONS], 'readwrite'); // Start transaction
    const trxObjectStore = transaction.objectStore(OFFLINE_TRANSACTIONS); // Access Database
    trxObjectStore.add(record); // Add record
}