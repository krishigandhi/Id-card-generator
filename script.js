const excelInput = document.getElementById("excel-input");
const excelStatus = document.getElementById("excel-status");
const zipInput = document.getElementById("zip-input");
const zipStatus = document.getElementById("zip-status");
const genBtn = document.getElementById("generate-btn");

// excelInput.addEventListener("change", function(event) {
//     const file = event.target.files[0];
//     // Handle Excel file selection
    
// });

function checkBothUploaded() {
    if (excelInput.files[0] && zipInput.files[0]) {
        genBtn.removeAttribute("disabled");
    } else {
       genBtn.setAttribute("disabled", true);
    }
}

excelInput.addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file) {
        excelStatus.textContent = file.name;
        excelStatus.classList.add("success");
        checkBothUploaded();
    }
});

zipInput.addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file) {
        zipStatus.textContent = file.name;
        zipStatus.classList.add("success");
        checkBothUploaded();
    }
});

genBtn.addEventListener("click", function() {
    const excelFile = excelInput.files[0];
    const zipFile = zipInput.files[0];

    const excelReader = new FileReader();
    excelReader.onload = function(e) {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const students = XLSX.utils.sheet_to_json(sheet);

        JSZip.loadAsync(zipFile).then(function(zip) {
            const photoPromises = students.map(function(student) {
                const filename = student["Photo Filename"];
                const zipEntry = zip.files[filename];

                if (zipEntry) {
                    return zipEntry.async("base64").then(function(base64) {
                        student.photoURL = "data:image/jpeg;base64," + base64;
                        return student;
                    });
                } else {
                    student.photoURL = null;
                    return Promise.resolve(student);
                }
            });

            Promise.all(photoPromises).then(function(studentsWithPhotos) {
                console.log(studentsWithPhotos);
                generateCards(studentsWithPhotos);
            });
        });
    };

    excelReader.readAsArrayBuffer(excelFile);
});

function generateCards(students) {
    const container = document.getElementById("cards-container");
    const outputSection = document.getElementById("output-section");
    
    container.innerHTML = "";
    outputSection.classList.remove("hidden");

    students.forEach(function(student) {
        const card = document.createElement("div");
        card.classList.add("id-card");

        card.innerHTML = `
            <div class="card-header">
                <div class="school-name">Sunrise School</div>
                <div class="card-title">Student Identity Card</div>
            </div>
            <div class="card-body">
                <img src="${student.photoURL || 'https://via.placeholder.com/80'}" alt="Photo" class="student-photo" />
                <div class="student-info">
                    <h3>${student["Name"]}</h3>
                    <p><span>Roll No:</span> ${student["Roll Number"]}</p>
                    <p><span>DOB:</span> ${student["DOB"]}</p>
                </div>
            </div>
            <div class="card-footer">Valid for Academic Year 2024-25</div>
            <button class="download-btn" onclick="downloadCard(this)">Download</button>
        `;

        container.appendChild(card);
    });
}

function downloadCard(btn) {
    const card = btn.closest(".id-card");
    html2canvas(card).then(function(canvas) {
        const link = document.createElement("a");
        link.download = "id-card.png";
        link.href = canvas.toDataURL();
        link.click();
    });
}