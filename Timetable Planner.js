document.addEventListener('DOMContentLoaded', () => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    { time: '8:30 - 9:30', isBreak: false, label: '' },
    { time: '9:30 - 10:30', isBreak: false, label: '' },
    { time: '10:30 - 10:45', isBreak: true, label: 'Short Break' },
    { time: '10:45 - 11:45', isBreak: false, label: '' },
    { time: '11:45 - 12:45', isBreak: false, label: '' },
    { time: '12:45 - 1:30', isBreak: true, label: 'Lunch Break' },
    { time: '1:30 - 2:30', isBreak: false, label: '' },
    { time: '2:30 - 3:30', isBreak: false, label: '' },
    { time: '3:30 - 4:30', isBreak: false, label: '' },
  ];

  const classes = ['Cloud Computing A', 'Cloud Computing B', 'Cloud  C'];

  // Load subjects+teachers from localStorage or default
  let subjects = JSON.parse(localStorage.getItem('subjects')) || {
    HTML: ['Teacher A', 'Teacher B'],
    Java: ['Teacher C', 'Teacher D'],
    'Cloud Computing': ['Teacher E', 'Teacher F'],
    Excel: ['Teacher G', 'Teacher H'],
    IDE: ['Teacher I', 'Teacher J'],
  };

  const timetablesContainer = document.getElementById('timetables-container');
  const messageContainer = document.getElementById('message-container');
  const messageText = document.getElementById('message-text');

  // Period map
  const periodMap = {};
  let p = 1;
  for (const slot of timeSlots) {
    if (!slot.isBreak) periodMap[slot.time] = `Period ${p++}`;
  }

  // Load / initialize timetableData
  let timetableData = JSON.parse(localStorage.getItem('timetableData')) || {};

  classes.forEach((className) => {
    if (!timetableData[className]) timetableData[className] = {};
    days.forEach((day) => {
      if (!timetableData[className][day]) timetableData[className][day] = {};
      timeSlots.forEach((slot) => {
        const existing = timetableData[className][day][slot.time];
        if (slot.isBreak) {
          timetableData[className][day][slot.time] = { subject: slot.label, teacher: '' };
        } else if (!existing) {
          timetableData[className][day][slot.time] = { subject: '', teacher: '' };
        } else if (typeof existing === 'string') {
          timetableData[className][day][slot.time] = { subject: existing, teacher: '' };
        } else {
          timetableData[className][day][slot.time].subject ||= '';
          timetableData[className][day][slot.time].teacher ||= '';
        }
      });
    });
  });

  // Show popup
  function showMessage(msg, type = 'success') {
    messageText.textContent = msg;
    messageContainer.classList.remove(
      'hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700'
    );
    if (type === 'error') {
      messageContainer.classList.add('bg-red-100', 'text-red-700');
    } else {
      messageContainer.classList.add('bg-green-100', 'text-green-700');
    }
    messageContainer.classList.add('show');
    setTimeout(() => {
      messageContainer.classList.remove('show');
      setTimeout(() => messageContainer.classList.add('hidden'), 400);
    }, 2500);
  }

  // --- Teacher Management Panel ---
  const subjectPicker = document.getElementById('subject-picker');
  const teacherInput = document.getElementById('teacher-input');
  const addTeacherBtn = document.getElementById('add-teacher-btn');
  const teacherList = document.getElementById('teacher-list');

  function renderTeacherList() {
    teacherList.innerHTML = '';
    const subj = subjectPicker.value;
    if (subj && subjects[subj]) {
      subjects[subj].forEach((t) => {
        const li = document.createElement('li');
        li.classList.add('teacher-item');
        li.innerHTML = `
          <span>${t}</span>
          <button class="remove-teacher-btn" data-subject="${subj}" data-teacher="${t}">❌</button>
        `;
        teacherList.appendChild(li);
      });

      // attach remove events
      document.querySelectorAll('.remove-teacher-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const subj = e.target.dataset.subject;
          const teacher = e.target.dataset.teacher;

          // Remove teacher from subject list
          subjects[subj] = subjects[subj].filter((name) => name !== teacher);
          localStorage.setItem('subjects', JSON.stringify(subjects));

          // also clear this teacher from timetable if used
          classes.forEach((className) => {
            days.forEach((day) => {
              timeSlots.forEach((slot) => {
                const cell = timetableData[className][day][slot.time];
                if (!slot.isBreak && cell.teacher === teacher && cell.subject === subj) {
                  cell.teacher = '';
                }
              });
            });
          });
          localStorage.setItem('timetableData', JSON.stringify(timetableData));

          renderTeacherList();
          renderTimetables();
          showMessage(`🗑️ Removed ${teacher} from ${subj}`, 'success');
        });
      });
    }
  }

  subjectPicker?.addEventListener('change', renderTeacherList);

  addTeacherBtn?.addEventListener('click', () => {
    const subj = subjectPicker.value;
    const teacher = teacherInput.value.trim();
    if (!subj) {
      showMessage('⚠️ Please select a subject first!', 'error');
      return;
    }
    if (!teacher) {
      showMessage('⚠️ Please enter a teacher name!', 'error');
      return;
    }
    if (!subjects[subj].includes(teacher)) {
      subjects[subj].push(teacher);
      localStorage.setItem('subjects', JSON.stringify(subjects));
      renderTeacherList();
      renderTimetables();
      showMessage(`✅ Added ${teacher} to ${subj}`, 'success');
    } else {
      showMessage('⚠️ Teacher already exists for this subject.', 'error');
    }
    teacherInput.value = '';
  });

    // --- Subject Management Panel ---
  const subjectInput = document.getElementById('subject-input');
  const addSubjectBtn = document.getElementById('add-subject-btn');
  const subjectList = document.getElementById('subject-list');

  function renderSubjectList() {
    subjectList.innerHTML = '';
    Object.keys(subjects).forEach((subj) => {
      const li = document.createElement('li');
      li.classList.add('subject-item');
      li.innerHTML = `
        <span>${subj}</span>
        <button class="remove-subject-btn" data-subject="${subj}">❌</button>
      `;
      subjectList.appendChild(li);
    });

    // attach remove events
    document.querySelectorAll('.remove-subject-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const subj = e.target.dataset.subject;
        delete subjects[subj];
        localStorage.setItem('subjects', JSON.stringify(subjects));

        // Clear timetable entries using this subject
        classes.forEach((className) => {
          days.forEach((day) => {
            timeSlots.forEach((slot) => {
              const cell = timetableData[className][day][slot.time];
              if (!slot.isBreak && cell.subject === subj) {
                cell.subject = '';
                cell.teacher = '';
              }
            });
          });
        });
        localStorage.setItem('timetableData', JSON.stringify(timetableData));

        renderSubjectList();
        renderTeacherList();
        renderTimetables();
        showMessage(`🗑️ Removed subject ${subj}`, 'success');
      });
    });

    // update teacher panel subject dropdown
    subjectPicker.innerHTML =
      '<option value="">-- Select Subject --</option>' +
      Object.keys(subjects).map((s) => `<option value="${s}">${s}</option>`).join('');
  }

  addSubjectBtn?.addEventListener('click', () => {
    const subj = subjectInput.value.trim();
    if (!subj) {
      showMessage('⚠️ Please enter a subject name!', 'error');
      return;
    }
    if (!subjects[subj]) {
      subjects[subj] = [];
      localStorage.setItem('subjects', JSON.stringify(subjects));
      renderSubjectList();
      renderTeacherList();
      renderTimetables();
      showMessage(`✅ Added subject ${subj}`, 'success');
    } else {
      showMessage('⚠️ Subject already exists!', 'error');
    }
    subjectInput.value = '';
  });

  renderSubjectList();

  // --- Render Timetables ---
  function renderTimetables() {
    timetablesContainer.innerHTML = '';

    classes.forEach((className, index) => {
      const timetableDiv = document.createElement('div');
      timetableDiv.id = `timetable-${index}`;
      timetableDiv.classList.add(
        'p-4','bg-white','rounded-2xl','shadow-xl','mb-6','timetable-container'
      );

      let tableHTML = `
        <h2 class="text-2xl font-bold text-gray-800 mb-4 text-center">${className} Timetable</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full bg-white border-collapse rounded-xl overflow-hidden timetable-table">
            <thead class="bg-blue-600 text-white">
              <tr>
                <th class="py-3 px-4 border-r border-gray-200">Time</th>
                ${days.map((day) => `<th class="py-3 px-4 border-r border-gray-200">${day}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
      `;

      timeSlots.forEach((slot) => {
        tableHTML += `<tr>`;
        // Time + Period
        tableHTML += `
          <td class="py-3 px-4 border-r border-gray-200 font-medium text-gray-700 text-center">
            ${
              slot.isBreak
                ? `<div class="flex flex-col items-center justify-center">
                     <span class="text-blue-500 font-bold">${slot.label}</span>
                     <span class="text-sm font-semibold text-gray-600 mt-1">${slot.time}</span>
                   </div>`
                : `<div class="flex flex-col items-center">
                     <span class="block text-lg text-blue-600 font-bold">${periodMap[slot.time] || ''}</span>
                     <span class="block mt-1">${slot.time}</span>
                   </div>`
            }
          </td>
        `;

        // Cells
        days.forEach((day) => {
          const cell = timetableData[className][day][slot.time];
          const isBreakCell = slot.isBreak;
          tableHTML += `<td class="py-3 px-4 border-r border-gray-200 ${isBreakCell ? 'bg-blue-100 text-center align-middle' : ''}">`;

          if (isBreakCell) {
            tableHTML += `
              <div class="flex items-center justify-center h-full">
                <span class="text-blue-500 font-bold text-lg">${slot.label}</span>
              </div>
            `;
          } else {
            const curSubject = cell?.subject || '';
            const curTeacher = cell?.teacher || '';

            const subjectOptions = Object.keys(subjects)
              .map((s) => `<option value="${s}" ${s === curSubject ? 'selected' : ''}>${s}</option>`)
              .join('');

            const teacherOptions = curSubject && subjects[curSubject]
              ? subjects[curSubject].map(
                  (t) => `<option value="${t}" ${t === curTeacher ? 'selected' : ''}>${t}</option>`
                ).join('')
              : '';

            tableHTML += `
              <select class="subject-select" data-class="${className}" data-day="${day}" data-time="${slot.time}">
                <option value="">Select Subject</option>
                ${subjectOptions}
              </select>
              <span class="pdf-text">${curSubject}</span>

              <select class="teacher-select" data-class="${className}" data-day="${day}" data-time="${slot.time}">
                <option value="">Select Teacher</option>
                ${teacherOptions}
              </select>
              <span class="pdf-text">${curTeacher}</span>
            `;
          }
          tableHTML += `</td>`;
        });

        tableHTML += `</tr>`;
      });

      tableHTML += `</tbody></table></div>`;
      // Buttons
      tableHTML += `
        <div class="flex justify-center gap-4 mt-4">
          <button class="download-btn px-6 py-2 btn-primary rounded-lg shadow-md" data-class="${className}" data-index="${index}">
            📥  Download ${className} Timetable
          </button>
          <button class="reset-btn px-6 py-2 bg-red-600 text-white rounded-lg shadow-md" data-class="${className}">
           🔄  Reset ${className}
          </button>
        </div>
      `;

      timetableDiv.innerHTML = tableHTML;
      timetablesContainer.appendChild(timetableDiv);
    });

    // ---- Event handlers ----

    // Subject changes
    document.querySelectorAll('.subject-select').forEach((select) => {
      select.addEventListener('change', (e) => {
        const className = e.target.dataset.class;
        const day = e.target.dataset.day;
        const time = e.target.dataset.time;
        const newSubject = e.target.value;

        timetableData[className][day][time].subject = newSubject;
        timetableData[className][day][time].teacher = '';
        localStorage.setItem('timetableData', JSON.stringify(timetableData));
        renderTimetables();
      });
    });

    // Teacher changes → conflict check
    document.querySelectorAll('.teacher-select').forEach((select) => {
      select.addEventListener('change', (e) => {
        const className = e.target.dataset.class;
        const day = e.target.dataset.day;
        const time = e.target.dataset.time;
        const newTeacher = e.target.value;
        const subject = timetableData[className][day][time].subject;

        if (subject !== '' && newTeacher !== '') {
          let conflictClass = null;
          for (const otherClass of classes) {
            if (otherClass !== className) {
              const otherCell = timetableData[otherClass]?.[day]?.[time];
              if (otherCell && otherCell.subject === subject && otherCell.teacher === newTeacher) {
                conflictClass = otherClass;
                break;
              }
            }
          }
          if (conflictClass) {
            const periodNumber = periodMap[time] || 'this period';
            showMessage(
              `☹️ ${subject} with ${newTeacher} is already scheduled in ${conflictClass} for ${periodNumber}.`,
              'error'
            );
            e.target.value = timetableData[className][day][time].teacher || '';
            return;
          }
        }

        timetableData[className][day][time].teacher = newTeacher;
        localStorage.setItem('timetableData', JSON.stringify(timetableData));
      });
    });

    // Download timetable
    document.querySelectorAll('.download-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const index = btn.dataset.index;
        const className = btn.dataset.class;
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const margin = 10;
        const a4Width = 210;

        const element = document.getElementById(`timetable-${index}`);
        if (!element) return;

        element.querySelectorAll('select').forEach((sel) => {
          const span = sel.nextElementSibling;
          if (span) span.textContent = sel.value || '';
        });

        element.setAttribute('data-exporting', 'true');
        showMessage(`📥 Downloading ${className} timetable...`, 'success');

        const canvas = await html2canvas(element, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = a4Width - 2 * margin;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        doc.addImage(imgData, 'PNG', margin, 15, imgWidth, imgHeight);
        doc.save(`${className}-timetable.pdf`);

        element.removeAttribute('data-exporting');
      });
    });

    // Reset timetable
    document.querySelectorAll('.reset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const className = btn.dataset.class;
        days.forEach((day) => {
          timeSlots.forEach((slot) => {
            if (slot.isBreak) {
              timetableData[className][day][slot.time] = { subject: slot.label, teacher: '' };
            } else {
              timetableData[className][day][slot.time] = { subject: '', teacher: '' };
            }
          });
        });
        localStorage.setItem('timetableData', JSON.stringify(timetableData));
        renderTimetables();
        showMessage(`✅ ${className} timetable has been reset.`, 'success');
      });
    });
  }

  renderTimetables();
  renderTeacherList();
});
