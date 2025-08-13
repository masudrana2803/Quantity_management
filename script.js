const COMPANY_NAME = "Your Company Name";
const LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/a/ab/Logo_TV_2015.png";

const loggedInUser = localStorage.getItem("loggedInUser");
if (!loggedInUser) {
    window.location.href = "login.html";
}

let data = JSON.parse(localStorage.getItem(`records_${loggedInUser}`)) || [];

let editIndex = -1;

const idInput = document.getElementById("idInput");
const typeInput = document.getElementById("typeInput");
const brandInput = document.getElementById("brandInput");
const qtyInput = document.getElementById("qtyInput");
const personInput = document.getElementById("personInput");
const addBtn = document.getElementById("addBtn");

const totalQtySpan = document.getElementById("totalQty");
const maxDateSpan = document.getElementById("maxDate");
const tbody = document.querySelector("#dataTable tbody");

const personListDiv = document.getElementById("personList");
const personTableTbody = document.querySelector("#personTable tbody");
const myChartCanvas = document.getElementById("myChart");
let myChart = null; // To store the chart instance

function validateInputs() {
    return idInput.value.trim() !== "" &&
           typeInput.value.trim() !== "" &&
           brandInput.value.trim() !== "" &&
           qtyInput.value.trim() !== "" &&
           !isNaN(parseInt(qtyInput.value)) &&
           personInput.value.trim() !== "";
}

function showMessage(msg, isError = false) {
    let msgDiv = document.getElementById("msgDiv");
    if (!msgDiv) {
        msgDiv = document.createElement("div");
        msgDiv.id = "msgDiv";
        msgDiv.style.position = "fixed";
        msgDiv.style.top = "20px";
        msgDiv.style.left = "50%";
        msgDiv.style.transform = "translateX(-50%)";
        msgDiv.style.padding = "12px 20px";
        msgDiv.style.borderRadius = "8px";
        msgDiv.style.fontWeight = "600";
        msgDiv.style.zIndex = 9999;
        msgDiv.style.minWidth = "220px";
        msgDiv.style.textAlign = "center";
        document.body.appendChild(msgDiv);
    }
    msgDiv.style.background = isError ? "#dc3545" : "#28a745";
    msgDiv.style.color = "white";
    msgDiv.textContent = msg;
    msgDiv.style.opacity = "1";

    setTimeout(() => {
        msgDiv.style.opacity = "0";
    }, 2500);
}

function resetInputs() {
    idInput.value = "";
    typeInput.value = "";
    brandInput.value = "";
    qtyInput.value = "";
    personInput.value = "";
    idInput.focus();
    addBtn.disabled = true;
}

function updateTable() {
    tbody.innerHTML = "";
    data.forEach((row, index) => {
        const tr = document.createElement("tr");
        tr.style.opacity = 0;
        const personNames = Array.isArray(row.person) ? row.person.join(', ') : row.person;
        tr.innerHTML = `
            <td>${row.id}</td>
            <td>${row.type}</td>
            <td>${row.brand}</td>
            <td>${row.qty}</td>
            <td>${row.date}</td>
            <td>${personNames}</td>
            <td><button class="editBtn" data-index="${index}">Edit</button></td>
            <td><button class="deleteBtn" data-index="${index}">Delete</button></td>
        `;
        tbody.appendChild(tr);
        // Fade-in effect
        setTimeout(() => {
            tr.style.transition = "opacity 0.5s ease-in";
            tr.style.opacity = 1;
        }, 10);
    });

    // Attach edit handlers
    document.querySelectorAll(".editBtn").forEach(btn => {
        btn.addEventListener("click", e => {
            const password = prompt("Enter password to edit:");
            const correctPassword = "edit123"; // Set your fixed password here
            if (password === correctPassword) {
                editIndex = parseInt(e.target.dataset.index);
                const row = data[editIndex];
                idInput.value = row.id;
                typeInput.value = row.type;
                brandInput.value = row.brand;
                qtyInput.value = row.qty;
                personInput.value = Array.isArray(row.person) ? row.person.join(', ') : row.person;
                addBtn.textContent = "Save Changes";
                addBtn.disabled = false;
                idInput.focus();
            } else {
                showMessage("Incorrect password!", true);
            }
        });
    });

    // Attach delete handlers
    document.querySelectorAll(".deleteBtn").forEach(btn => {
        btn.addEventListener("click", e => {
            const password = prompt("Enter password to delete:");
            const correctPassword = "delete123"; // Set your fixed password here
            if (password === correctPassword) {
                const indexToDelete = parseInt(e.target.dataset.index);
                if (confirm("Are you sure you want to delete this record?")) {
                    data.splice(indexToDelete, 1);
                    localStorage.setItem(`records_${loggedInUser}`, JSON.stringify(data));
                    updateAll();
                    showMessage("Record deleted successfully!");
                }
            } else {
                showMessage("Incorrect password!", true);
            }
        });
    });

    // Update stats
    const totalQty = data.reduce((sum, r) => sum + r.qty, 0);
    totalQtySpan.textContent = totalQty;

    let dateMap = {};
    data.forEach(r => {
        if (!dateMap[r.date]) dateMap[r.date] = 0;
        dateMap[r.date] += r.qty;
    });
    let maxDate = Object.keys(dateMap).reduce((a, b) => dateMap[a] > dateMap[b] ? a : b, "");
    maxDateSpan.textContent = maxDate || "N/A";
}

function updateGraphs(graphType) {
    if (myChart) {
        myChart.destroy();
    }
    
    document.querySelector('.chart-section').style.display = 'block';
    let labels = [];
    let quantities = [];
    let title = "";

    const aggregatedData = {};

    switch (graphType) {
        case 'month':
            title = "Month-wise";
            const monthLabels = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            data.forEach(item => {
                const month = new Date(item.date).getMonth();
                if (!aggregatedData[month]) {
                    aggregatedData[month] = 0;
                }
                aggregatedData[month] += item.qty;
            });
            labels = monthLabels;
            quantities = labels.map((_, index) => aggregatedData[index] || 0);
            break;
        case 'person':
            title = "Person-wise";
            data.forEach(item => {
                const persons = Array.isArray(item.person) ? item.person : [item.person];
                persons.forEach(person => {
                    if (!aggregatedData[person]) {
                        aggregatedData[person] = 0;
                    }
                    aggregatedData[person] += item.qty;
                });
            });
            labels = Object.keys(aggregatedData);
            quantities = Object.values(aggregatedData);
            break;
        case 'id':
            title = "ID-wise";
            data.forEach(item => {
                if (!aggregatedData[item.id]) {
                    aggregatedData[item.id] = 0;
                }
                aggregatedData[item.id] += item.qty;
            });
            labels = Object.keys(aggregatedData);
            quantities = Object.values(aggregatedData);
            break;
        case 'type':
            title = "Type-wise";
            data.forEach(item => {
                if (!aggregatedData[item.type]) {
                    aggregatedData[item.type] = 0;
                }
                aggregatedData[item.type] += item.qty;
            });
            labels = Object.keys(aggregatedData);
            quantities = Object.values(aggregatedData);
            break;
        case 'brand':
            title = "Brand-wise";
            data.forEach(item => {
                if (!aggregatedData[item.brand]) {
                    aggregatedData[item.brand] = 0;
                }
                aggregatedData[item.brand] += item.qty;
            });
            labels = Object.keys(aggregatedData);
            quantities = Object.values(aggregatedData);
            break;
    }
    
    document.getElementById("chartTitle").textContent = title;
    
    myChart = new Chart(myChartCanvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Quantity',
                data: quantities,
                backgroundColor: 'rgba(33, 147, 176, 0.5)',
                borderColor: 'rgba(33, 147, 176, 1)',
                borderWidth: 1
            }]
        },
        options: {
            maintainAspectRatio: false,
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}


function updatePersonList() {
    const people = [...new Set(data.flatMap(item => Array.isArray(item.person) ? item.person : [item.person]))];
    personListDiv.innerHTML = people.map(person => `<button class="personBtn">${person}</button>`).join(" ");

    document.querySelectorAll(".personBtn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const selectedPerson = e.target.textContent;
            showPersonRecords(selectedPerson);
        });
    });
}

function showPersonRecords(person) {
    const personRecords = data.filter(item => {
        const persons = Array.isArray(item.person) ? item.person : [item.person];
        return persons.includes(person);
    });
    personTableTbody.innerHTML = personRecords.map(item => `
        <tr>
            <td>${item.id}</td>
            <td>${item.type}</td>
            <td>${item.brand}</td>
            <td>${item.qty}</td>
            <td>${item.date}</td>
        </tr>
    `).join("");
    document.getElementById("personTable").style.display = "table";
}

function updateAll() {
    updateTable();
    updatePersonList();
}


function saveData() {
    const id = idInput.value.trim();
    const type = typeInput.value.trim();
    const brand = brandInput.value.trim();
    const qty = parseInt(qtyInput.value.trim());
    const person = personInput.value.trim();
    const date = new Date().toISOString().split("T")[0];

    if (!validateInputs()) {
        showMessage("Please fill all fields correctly!", true);
        return;
    }

    if (editIndex > -1) {
        // Save edit
        data[editIndex].id = id;
        data[editIndex].type = type;
        data[editIndex].brand = brand;
        data[editIndex].qty = qty;
        data[editIndex].person = person.split(',').map(p => p.trim());
        // date unchanged
        editIndex = -1;
        addBtn.textContent = "Add";
        showMessage("Record updated successfully!");
    } else {
        // Add new or increment
        let existing = data.find(r => r.id === id && r.type === type && r.brand === brand && r.date === date);
        if (existing) {
            existing.qty += qty;
            const persons = Array.isArray(existing.person) ? existing.person : [existing.person];
            if (!persons.includes(person)) {
                persons.push(person);
                existing.person = persons;
            }
            showMessage("Quantity and person updated for existing ID today!");
        } else {
            data.push({ id, type, brand, qty, date, person: [person] });
            showMessage("New record added!");
        }
    }

    localStorage.setItem(`records_${loggedInUser}`, JSON.stringify(data));
    updateAll();
    resetInputs();
}

// Event listeners
addBtn.addEventListener("click", saveData);

[idInput, typeInput, brandInput, qtyInput, personInput].forEach(input => {
    input.addEventListener("input", () => {
        addBtn.disabled = !validateInputs();
    });

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && validateInputs() && !addBtn.disabled) {
            e.preventDefault();
            saveData();
        }
    });
});

document.querySelectorAll('.graph-options button').forEach(button => {
    button.addEventListener('click', (e) => {
        updateGraphs(e.target.dataset.graph);
    });
});

document.getElementById("downloadExcel").addEventListener("click", () => {
    let ws_data = [[COMPANY_NAME], []];
    const tableData = data.map(r => [r.id, r.type, r.brand, r.qty, r.date, Array.isArray(r.person) ? r.person.join(', ') : r.person]);
    const headers = ["ID", "Type", "Brand", "Quantity", "Date", "Person"];
    ws_data.push(headers, ...tableData);

    let ws = XLSX.utils.aoa_to_sheet(ws_data);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Records");
    XLSX.writeFile(wb, `${loggedInUser}_records.xlsx`);
});

document.getElementById("downloadPDF").addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const imgProps = new Image();
    imgProps.src = LOGO_URL;

    imgProps.onload = () => {
        const imgWidth = 40;
        const imgHeight = (imgProps.height / imgProps.width) * imgWidth;

        doc.addImage(imgProps, "PNG", 14, 10, imgWidth, imgHeight);
        doc.setFontSize(18);
        doc.text(COMPANY_NAME, 60, 25);

        let tableData = data.map(r => [r.id, r.type, r.brand, r.qty, r.date, Array.isArray(r.person) ? r.person.join(', ') : r.person]);

        doc.autoTable({
            head: [["ID", "Type", "Brand", "Quantity", "Date", "Person"]],
            body: tableData,
            startY: 40 + imgHeight,
            styles: { fontSize: 10 }
        });

        doc.save(`${loggedInUser}_records.pdf`);
    };

    imgProps.onerror = () => {
        doc.setFontSize(18);
        doc.text(COMPANY_NAME, 14, 25);
        let tableData = data.map(r => [r.id, r.type, r.brand, r.qty, r.date, Array.isArray(r.person) ? r.person.join(', ') : r.person]);
        doc.autoTable({
            head: [["ID", "Type", "Brand", "Quantity", "Date", "Person"]],
            body: tableData,
            startY: 35,
            styles: { fontSize: 10 }
        });
        doc.save(`${loggedInUser}_records.pdf`);
    };
});

document.getElementById("logoutBtn").addEventListener("click", () => {
    if(confirm("Are you sure you want to logout?")) {
        localStorage.removeItem("loggedInUser");
        window.location.href = "login.html";
    }
});

// Initialize
updateAll();
addBtn.disabled = true;