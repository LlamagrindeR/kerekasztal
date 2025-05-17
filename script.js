// script.js
import { db } from './firebase.js';

const ratingTableBody = document.getElementById('ratingTableBody');
const rangsorTableBodyRangsor = document.getElementById('rangsorTableBodyRangsor');
const defaultNames = ['Bálint', 'Szabber', 'Ivanics', 'Rásó', 'Bakos', 'Gaben'];
const allNames = [...defaultNames, 'Kolos'];
const nameColors = {
    'Bálint': '#F4B084',
    'Szabber': '#9BC2E6',
    'Ivanics': '#A9D08E',
    'Rásó': '#8EA9DB',
    'Bakos': '#FFD966',
    'Gaben': '#C9C9C9',
    'Kolos': '#C00000'
};
let defaultNameIndex = 0;
let rowCounter = 1;

window.openTab = function(tabId) {
    console.log('openTab függvény meghívva ezzel az ID-vel:', tabId);
    const tabContents = document.querySelectorAll('.tab-content');
    const tabButtons = document.querySelectorAll('.tab-button');
    console.log('tabContents:', tabContents);
    console.log('tabButtons:', tabButtons);
    tabContents.forEach(content => {
        content.classList.remove('active');
        console.log('Eltávolítva az active class innen:', content);
    });
    tabButtons.forEach(button => {
        button.classList.remove('active');
        console.log('Eltávolítva az active class innen:', button);
    });
    const targetTab = document.getElementById(tabId);
    const targetButton = document.querySelector(`.tab-button[onclick="openTab('${tabId}')"]`);
    console.log('Cél tab elem:', targetTab);
    console.log('Cél gomb elem:', targetButton);
    if (targetTab) {
        targetTab.classList.add('active');
        console.log('Hozzáadva az active class ide:', targetTab);
    }
    if (targetButton) {
        targetButton.classList.add('active');
        console.log('Hozzáadva az active class ide:', targetButton);
    }
    if (tabId === 'rangsor') {
        console.log('Rangsor fülre váltás - updateRangsorTable meghívása');
        updateRangsorTable();
    }
};

window.addRow = function() {
    console.log('addRow függvény meghívva');
    const newRowData = {
        sorszam: rowCounter,
        name: defaultNames[defaultNameIndex % defaultNames.length],
        artist: '',
        album: '',
        ratings: Array(allNames.length).fill('')
    };
    console.log('Létrehozott új sor adat:', newRowData);
    db.collection("ratings").add(newRowData)
        .then((docRef) => {
            console.log("Firestore dokumentum ID: ", docRef.id);
            addRowToTable(newRowData, docRef.id, rowCounter++);
        })
        .catch((error) => {
            console.error("Hiba történt a Firestore-ba mentéskor: ", error);
        });
    defaultNameIndex++;
    console.log('defaultNameIndex növelve:', defaultNameIndex);
};

window.deleteRow = function(button) {
    console.log('deleteRow függvény meghívva ezzel a gombbal:', button);
    const row = button.parentNode.parentNode;
    console.log('Törlendő sor:', row);
    const docId = row.dataset.docId;
    console.log('Törlendő dokumentum ID:', docId);
    if (docId) {
        db.collection("ratings").doc(docId).delete()
            .then(() => {
                console.log(`A(z) ${docId} ID-jű értékelés sikeresen törölve!`);
                row.remove();
                updateRangsorTable();
            })
            .catch((error) => {
                console.error("Hiba történt a Firestore-ból törléskor: ", error);
            });
    } else {
        console.log('A sorhoz nem tartozik docId, csak a táblázatból távolítjuk el.');
        row.remove();
        updateRangsorTable();
    }
};

function colorizeHeader() {
    const headerRow = document.querySelector('#ratingTable thead tr');
    if (headerRow) {
        allNames.forEach((name, index) => {
            const columnIndex = index + 5; // Az első értékelő oszlop indexe
            const headerCell = headerRow.querySelector(`th:nth-child(${columnIndex})`);
            if (headerCell && nameColors[name]) {
                headerCell.style.backgroundColor = nameColors[name];
                headerCell.style.color = 'white';
            }
        });
    }
}

function loadDataFromFirestore() {
    ratingTableBody.innerHTML = '';
    db.collection("ratings").orderBy('sorszam')
        .get()
        .then((querySnapshot) => {
            rowCounter = 1;
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                addRowToTable(data, doc.id, data.sorszam);
            });
            updateRangsorTable();
            colorizeHeader();
        })
        .catch((error) => {
            console.error("Hiba történt az adatok lekérésekor a Firestore-ból: ", error);
        });
}

function saveDataToFirestore(rowData, docId) {
    return db.collection("ratings").doc(docId).set(rowData)
        .then(() => {
            console.log("Adatok sikeresen mentve a Firestore-ba!");
        })
        .catch((error) => {
            console.error("Hiba történt a Firestore-ba mentéskor: ", error);
        });
}

function addRowToTable(rowData, docId, sorszam) {
    const newRow = ratingTableBody.insertRow();
    newRow.dataset.docId = docId;
    const cells = [];
    for (let i = 0; i < 13; i++) {
        cells.push(newRow.insertCell());
    }
    cells[0].textContent = sorszam;
    cells[4].textContent = rowData.average || '';

    const nameSelect = document.createElement('select');
    nameSelect.classList.add('name-select');
    defaultNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        nameSelect.appendChild(option);
    });
    const kolosOption = document.createElement('option');
    kolosOption.value = 'Kolos';
    kolosOption.textContent = 'Kolos';
    nameSelect.appendChild(kolosOption);
    nameSelect.value = rowData.name || defaultNames[defaultNameIndex % defaultNames.length];
    nameSelect.addEventListener('change', function() {
        applyRowColor(newRow);
        updateRowData(newRow, docId);
    });
    cells[1].appendChild(nameSelect);

    cells[2].innerHTML = `<input type="text" value="${rowData.artist || ''}">`;
    cells[2].setAttribute('data-label', 'Előadó');

    cells[3].innerHTML = `<input type="text" value="${rowData.album || ''}">`;
    cells[3].setAttribute('data-label', 'Albumcím');

    for (let i = 0; i < allNames.length; i++) {
        const input = document.createElement('input');
        input.type = 'number';
        input.min = '1';
        input.max = '10';
        input.step = '0.5';
        input.classList.add('rating-input');
        input.value = rowData.ratings ? (rowData.ratings[i] !== undefined ? rowData.ratings[i] : '') : '';
        input.addEventListener('change', () => {
            calculateAverage(newRow);
            updateRowData(newRow, docId);
        });
        cells[i + 5].appendChild(input);
        cells[i + 5].setAttribute('data-label', allNames[i]);
    }

    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-button');
    deleteButton.textContent = 'Törlés';
    deleteButton.addEventListener('click', () => window.deleteRow(deleteButton));
    cells[12].appendChild(deleteButton);
    cells[12].setAttribute('data-label', 'Műveletek');

    applyRowColor(newRow);
    calculateAverage(newRow);
    defaultNameIndex++;
    colorizeHeader();
}

function updateRowData(row, docId) {
    const nameSelect = row.cells[1].querySelector('select');
    const artistInput = row.cells[2].querySelector('input');
    const albumInput = row.cells[3].querySelector('input');
    const ratings = [];
    for (let i = 5; i < row.cells.length - 1; i++) {
        const input = row.cells[i].querySelector('input[type="number"]');
        ratings.push(input ? input.value : '');
    }

    const rowData = {
        sorszam: parseInt(row.cells[0].textContent),
        name: nameSelect.value,
        artist: artistInput.value,
        album: albumInput.value,
        ratings: ratings,
        average: parseFloat(row.cells[4].textContent) || ''
    };

    saveDataToFirestore(rowData, docId);
}

function getLighterColor(hex, factor) {
    let c = hex.substring(1).split('');
    if(c.length === 3){
        c= [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = '0x'+c.join('');
    return 'rgb('+[(c>>16)&255, (c>>8)&255, c&255].map(a=>Math.min(255, Math.floor(a + (255 - a) * factor))).join(',')+')';
}

function applyRowColor(row) {
    const nameCell = row.cells[1].querySelector('select');
    if (nameCell && nameCell.value) {
        const name = nameCell.value;
        const color = nameColors[name] || '';
        for (let i = 1; i <= 3; i++) {
            if (row.cells[i]) {
                row.cells[i].style.backgroundColor = color;
            }
        }
        for (let i = 4; i < row.cells.length; i++) {
            if (row.cells[i]) {
                row.cells[i].style.backgroundColor = color ? getLighterColor(color, 0.9) : '';
            }
        }
    } else {
        for (let i = 1; i < row.cells.length; i++) {
            row.cells[i].style.backgroundColor = '';
        }
    }
}

function calculateAverage(row) {
    let sum = 0;
    let count = 0;
    for (let i = 5; i < row.cells.length - 1; i++) {
        const input = row.cells[i].querySelector('input[type="number"]');
        if (input && input.value !== '') {
            sum += parseFloat(input.value);
            count++;
        }
    }
    const averageCell = row.cells[4];
    averageCell.textContent = count > 0 ? (sum / count).toFixed(2) : '';
}

function updateRangsorTable() {
    const albumRatings = {};
    for (let i = 0; i < ratingTableBody.rows.length; i++) {
        const row = ratingTableBody.rows[i];
        const albumTitleInput = row.cells[3].querySelector('input[type="text"]');
        const averageCell = row.cells[4];
        if (albumTitleInput && albumTitleInput.value && averageCell.textContent) {
            const albumTitle = albumTitleInput.value;
            const averageScore = parseFloat(averageCell.textContent);
            albumRatings[albumTitle] = albumRatings[albumTitle] || [];
            albumRatings[albumTitle].push(averageScore);
        }
    }

    const albumAverages = [];
    for (const album in albumRatings) {
        const sum = albumRatings[album].reduce((a, b) => a + b, 0);
        const avg = sum / albumRatings[album].length;
        albumAverages.push({ title: album, average: avg });
    }

    albumAverages.sort((a, b) => b.average - a.average);

    rangsor
