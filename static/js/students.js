document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('studentSearch');
    const studentCards = document.querySelectorAll('.student-card');

    // Search functionality
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        
        studentCards.forEach(card => {
            const name = card.querySelector('h3').textContent.toLowerCase();
            const enrollment = card.querySelector('.enrollment').textContent.toLowerCase();
            const email = card.querySelector('.email').textContent.toLowerCase();
            
            if (name.includes(searchTerm) || 
                enrollment.includes(searchTerm) || 
                email.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });

    // Sort functionality
    const sortSelect = document.getElementById('sortStudents');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            const sortBy = this.value;
            const studentsArray = Array.from(studentCards);
            
            studentsArray.sort((a, b) => {
                const aValue = a.querySelector(sortBy === 'name' ? 'h3' : '.enrollment').textContent;
                const bValue = b.querySelector(sortBy === 'name' ? 'h3' : '.enrollment').textContent;
                return aValue.localeCompare(bValue);
            });
            
            const container = document.querySelector('.students-grid');
            studentsArray.forEach(card => container.appendChild(card));
        });
    }
});

function toggleDetails(enrollment, branch, year) {
    const detailsDiv = document.getElementById(`details-${enrollment}`);
    const card = document.getElementById(`card-${enrollment}`);
    
    if (detailsDiv.style.display === 'none' || !detailsDiv.style.display) {
        fetchStudentFiles(enrollment, branch, year);
        detailsDiv.style.display = 'block';
        card.classList.add('expanded');
    } else {
        detailsDiv.style.display = 'none';
        card.classList.remove('expanded');
    }
}

function fetchStudentFiles(enrollment, branch, year) {
    fetch(`/api/student_files/${branch}/${year}/${enrollment}`)
        .then(response => response.json())
        .then(data => {
            updateFileList('assignments', enrollment, data.assignments);
            updateFileList('projects', enrollment, data.projects);
            updateFileList('reports', enrollment, data.reports);
        });
}

function updateFileList(section, enrollment, files) {
    const container = document.getElementById(`${section}-${enrollment}`);
    container.innerHTML = files.map(file => `
        <div class="file-item">
            <span>${file}</span>
            <a href="/download/${section}/${file}" class="download-link">
                <i class="fas fa-download"></i> Download
            </a>
        </div>
    `).join('');
}

// Export functionality
function exportStudentList() {
    const students = Array.from(document.querySelectorAll('.student-card')).map(card => {
        return {
            name: card.querySelector('h3').textContent,
            enrollment: card.querySelector('.enrollment').textContent,
            email: card.querySelector('.email').textContent
        };
    });
    
    const csv = convertToCSV(students);
    downloadCSV(csv, 'students_list.csv');
}

function convertToCSV(objArray) {
    const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    let str = `${Object.keys(array[0]).join(',')}\r\n`;

    for (let i = 0; i < array.length; i++) {
        let line = '';
        for (let index in array[i]) {
            if (line != '') line += ',';
            line += array[i][index];
        }
        str += line + '\r\n';
    }
    return str;
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
