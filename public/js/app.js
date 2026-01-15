// Luna English CRM - Main Application
(function () {
    'use strict';

    // State
    let constants = {};
    let currentStudentId = null;
    let editingStudentId = null;
    let editingUserId = null;

    // DOM Elements
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);

    // Initialize
    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        const token = getToken();
        const user = getUser();

        if (token && user) {
            try {
                await api.getMe();
                showMainApp();
                await loadConstants();
                setupEventListeners();
                navigateTo('dashboard');
            } catch (error) {
                showLoginPage();
            }
        } else {
            showLoginPage();
        }

        setupLoginForm();
    }

    // ==========================================
    // Authentication
    // ==========================================
    function showLoginPage() {
        $('#login-page').classList.remove('hidden');
        $('#main-app').classList.add('hidden');
    }

    function showMainApp() {
        $('#login-page').classList.add('hidden');
        $('#main-app').classList.remove('hidden');
        updateUserInfo();
    }

    function setupLoginForm() {
        $('#login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = $('#username').value;
            const password = $('#password').value;
            const errorEl = $('#login-error');

            try {
                const data = await api.login(username, password);
                setToken(data.token);
                setUser(data.user);
                showMainApp();
                await loadConstants();
                setupEventListeners();
                navigateTo('dashboard');
            } catch (error) {
                errorEl.textContent = error.message;
            }
        });
    }

    function updateUserInfo() {
        const user = getUser();
        if (user) {
            $('#user-name').textContent = user.fullName;
            $('#user-avatar').textContent = user.fullName.charAt(0).toUpperCase();

            const roleNames = {
                admin: 'Quản trị viên',
                manager: 'Quản lý',
                consultant: 'Tư vấn viên'
            };
            $('#user-role').textContent = roleNames[user.role] || user.role;

            // Show/hide admin menu items
            $$('.admin-only').forEach(el => {
                if (user.role === 'admin') {
                    el.classList.remove('hidden');
                } else {
                    el.classList.add('hidden');
                }
            });
        }
    }

    // ==========================================
    // Constants
    // ==========================================
    async function loadConstants() {
        try {
            constants = await api.getConstants();
            populateSelects();
        } catch (error) {
            console.error('Failed to load constants:', error);
        }
    }

    function populateSelects() {
        // Status selects
        const statusSelects = [$('#filter-status'), $('#student-status')];
        statusSelects.forEach(select => {
            if (!select) return;
            const currentValue = select.value;
            select.innerHTML = '<option value="">Chọn trạng thái</option>';
            constants.statuses?.forEach(status => {
                select.innerHTML += `<option value="${status}">${status}</option>`;
            });
            select.value = currentValue;
        });

        // Course selects
        const courseSelects = [$('#filter-course'), $('#student-course')];
        courseSelects.forEach(select => {
            if (!select) return;
            const currentValue = select.value;
            select.innerHTML = '<option value="">Chọn khóa học</option>';
            constants.courses?.forEach(course => {
                select.innerHTML += `<option value="${course}">${course}</option>`;
            });
            select.value = currentValue;
        });

        // Lead source selects
        const sourceSelects = [$('#filter-source'), $('#student-source')];
        sourceSelects.forEach(select => {
            if (!select) return;
            const currentValue = select.value;
            select.innerHTML = '<option value="">Chọn nguồn</option>';
            constants.leadSources?.forEach(source => {
                select.innerHTML += `<option value="${source}">${source}</option>`;
            });
            select.value = currentValue;
        });

        // English level select
        const levelSelect = $('#student-level');
        if (levelSelect) {
            levelSelect.innerHTML = '<option value="">Chọn trình độ</option>';
            constants.englishLevels?.forEach(level => {
                levelSelect.innerHTML += `<option value="${level}">${level}</option>`;
            });
        }

        // Contact type select
        const contactSelect = $('#history-type');
        if (contactSelect) {
            contactSelect.innerHTML = '';
            constants.contactTypes?.forEach(type => {
                contactSelect.innerHTML += `<option value="${type}">${type}</option>`;
            });
        }
    }

    // ==========================================
    // Navigation
    // ==========================================
    function setupEventListeners() {
        // Navigation
        $$('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                navigateTo(page);
            });
        });

        // Logout
        $('#logout-btn').addEventListener('click', () => {
            removeToken();
            removeUser();
            showLoginPage();
        });

        // Students page
        $('#add-student-btn')?.addEventListener('click', () => openStudentModal());
        $('#export-excel-btn')?.addEventListener('click', exportStudents);

        // Search and filters
        $('#search-input')?.addEventListener('input', debounce(loadStudents, 300));
        $('#filter-status')?.addEventListener('change', loadStudents);
        $('#filter-course')?.addEventListener('change', loadStudents);
        $('#filter-source')?.addEventListener('change', loadStudents);

        // Student modal
        $('#close-student-modal')?.addEventListener('click', closeStudentModal);
        $('#cancel-student-btn')?.addEventListener('click', closeStudentModal);
        $('#student-form')?.addEventListener('submit', saveStudent);
        $('#student-status')?.addEventListener('change', updateStatusSuggestion);

        // Student detail modal
        $('#close-detail-modal')?.addEventListener('click', closeDetailModal);
        $('#add-history-btn')?.addEventListener('click', () => openHistoryModal());

        // History modal
        $('#close-history-modal')?.addEventListener('click', closeHistoryModal);
        $('#cancel-history-btn')?.addEventListener('click', closeHistoryModal);
        $('#history-form')?.addEventListener('submit', saveHistory);

        // Users page (admin only)
        $('#add-user-btn')?.addEventListener('click', () => openUserModal());
        $('#close-user-modal')?.addEventListener('click', closeUserModal);
        $('#cancel-user-btn')?.addEventListener('click', closeUserModal);
        $('#user-form')?.addEventListener('submit', saveUser);

        // Close modals on backdrop click
        $$('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    function navigateTo(page) {
        // Update nav
        $$('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Show/hide pages
        $$('.content-page').forEach(p => p.classList.add('hidden'));
        $(`#${page}-page`)?.classList.remove('hidden');

        // Load page data
        switch (page) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'students':
                loadStudents();
                break;
            case 'users':
                loadUsers();
                break;
        }
    }

    // ==========================================
    // Dashboard
    // ==========================================
    async function loadDashboard() {
        const user = getUser();
        if (user.role === 'consultant') {
            $('#dashboard-page').innerHTML = `
        <div class="page-header">
          <h2>Dashboard</h2>
          <p class="page-subtitle">Xin chào, ${user.fullName}!</p>
        </div>
        <div class="card">
          <div class="card-body">
            <p>Vui lòng chuyển sang trang "Học sinh" để xem danh sách học sinh được giao.</p>
          </div>
        </div>
      `;
            return;
        }

        try {
            const [dashboard, conversion] = await Promise.all([
                api.getDashboard(),
                api.getConversion()
            ]);

            // Update stats
            $('#stat-total .stat-number').textContent = dashboard.totalStudents;
            $('#stat-new .stat-number').textContent = dashboard.newThisMonth;
            $('#stat-registered .stat-number').textContent = conversion.conversionRate + '%';
            $('#stat-followup .stat-number').textContent = dashboard.needFollowUp?.length || 0;

            // Status chart
            renderStatusChart(dashboard.byStatus);

            // Course chart
            renderCourseChart(dashboard.byCourse);

            // Recent students
            renderRecentStudents(dashboard.recentStudents);

            // Follow-up list
            renderFollowUpList(dashboard.needFollowUp);

        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    function renderStatusChart(data) {
        const container = $('#status-chart');
        if (!container || !data?.length) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📊</div><p>Chưa có dữ liệu</p></div>';
            return;
        }

        const total = data.reduce((sum, item) => sum + item.count, 0);
        const statusClasses = {
            'Mới': 'status-moi',
            'Đang tư vấn': 'status-tuvan',
            'Test đầu vào': 'status-test',
            'Đã đăng ký': 'status-dangky',
            'Từ chối': 'status-tuchoi'
        };

        container.innerHTML = data.map(item => {
            const percent = ((item.count / total) * 100).toFixed(0);
            const cls = statusClasses[item.status] || 'default';
            return `
        <div class="chart-bar">
          <span class="chart-bar-label">${item.status}</span>
          <div class="chart-bar-track">
            <div class="chart-bar-fill ${cls}" style="width: ${percent}%">${item.count}</div>
          </div>
        </div>
      `;
        }).join('');
    }

    function renderCourseChart(data) {
        const container = $('#course-chart');
        if (!container || !data?.length) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📚</div><p>Chưa có dữ liệu</p></div>';
            return;
        }

        const total = data.reduce((sum, item) => sum + item.count, 0);
        const colors = ['status-moi', 'status-tuvan', 'status-test', 'status-dangky', 'default'];

        container.innerHTML = data.map((item, i) => {
            const percent = ((item.count / total) * 100).toFixed(0);
            return `
        <div class="chart-bar">
          <span class="chart-bar-label">${item.course || 'Không xác định'}</span>
          <div class="chart-bar-track">
            <div class="chart-bar-fill ${colors[i % colors.length]}" style="width: ${percent}%">${item.count}</div>
          </div>
        </div>
      `;
        }).join('');
    }

    function renderRecentStudents(students) {
        const container = $('#recent-students');
        if (!container) return;

        if (!students?.length) {
            container.innerHTML = '<div class="empty-state"><p>Chưa có học sinh nào</p></div>';
            return;
        }

        container.innerHTML = students.map(student => `
      <div class="recent-item" onclick="viewStudent(${student.id})">
        <div class="recent-item-info">
          <h4>${student.fullName}</h4>
          <span>${formatDate(student.createdAt)} • ${student.assignedToName || 'Chưa phân công'}</span>
        </div>
        <span class="status-badge ${getStatusClass(student.status)}">${student.status}</span>
      </div>
    `).join('');
    }

    function renderFollowUpList(items) {
        const container = $('#followup-list');
        if (!container) return;

        if (!items?.length) {
            container.innerHTML = '<div class="empty-state"><p>Không có học sinh cần follow-up</p></div>';
            return;
        }

        container.innerHTML = items.map(item => `
      <div class="followup-item" onclick="viewStudent(${item.id})">
        <div>
          <h4>${item.fullName}</h4>
          <span>${item.nextAction || 'Liên hệ lại'}</span>
        </div>
        <span class="status-badge ${getStatusClass(item.status)}">${item.status}</span>
      </div>
    `).join('');
    }

    // ==========================================
    // Students
    // ==========================================
    async function loadStudents() {
        const filters = {
            search: $('#search-input')?.value || '',
            status: $('#filter-status')?.value || '',
            course: $('#filter-course')?.value || '',
            leadSource: $('#filter-source')?.value || ''
        };

        try {
            const students = await api.getStudents(filters);
            renderStudentsTable(students);
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    function renderStudentsTable(students) {
        const tbody = $('#students-tbody');
        if (!tbody) return;

        if (!students?.length) {
            tbody.innerHTML = `
        <tr>
          <td colspan="8" class="empty-state">
            <div class="empty-state-icon">👨‍🎓</div>
            <p>Chưa có học sinh nào</p>
          </td>
        </tr>
      `;
            return;
        }

        tbody.innerHTML = students.map(student => `
      <tr>
        <td>
          <strong>${student.fullName}</strong>
          ${student.dateOfBirth ? `<br><small style="color: var(--text-muted)">${formatDate(student.dateOfBirth)}</small>` : ''}
        </td>
        <td>${student.parentName || '-'}</td>
        <td>${student.parentPhone || '-'}</td>
        <td>${student.interestedCourse || '-'}</td>
        <td><span class="status-badge ${getStatusClass(student.status)}">${student.status}</span></td>
        <td>${student.leadSource || '-'}</td>
        <td>${student.assignedToName || '-'}</td>
        <td>
          <div class="action-btns">
            <button class="action-btn" onclick="viewStudent(${student.id})" title="Xem chi tiết">👁️</button>
            <button class="action-btn" onclick="editStudent(${student.id})" title="Sửa">✏️</button>
            <button class="action-btn delete" onclick="deleteStudent(${student.id})" title="Xóa">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
    }

    function openStudentModal(student = null) {
        editingStudentId = student?.id || null;
        $('#student-modal-title').textContent = student ? 'Chỉnh sửa học sinh' : 'Thêm học sinh mới';

        // Reset form
        $('#student-form').reset();
        $('#status-suggestion').textContent = '';

        if (student) {
            $('#student-fullName').value = student.fullName || '';
            $('#student-dob').value = student.dateOfBirth || '';
            $('#student-parentName').value = student.parentName || '';
            $('#student-parentPhone').value = student.parentPhone || '';
            $('#student-parentEmail').value = student.parentEmail || '';
            $('#student-parentFacebook').value = student.parentFacebook || '';
            $('#student-level').value = student.englishLevel || '';
            $('#student-course').value = student.interestedCourse || '';
            $('#student-source').value = student.leadSource || '';
            $('#student-status').value = student.status || 'Mới';
            $('#student-testResult').value = student.testResult || '';
            $('#student-assignedClass').value = student.assignedClass || '';
            $('#student-notes').value = student.notes || '';
            updateStatusSuggestion();
        }

        // Show/hide assigned class based on status
        updateClassFieldVisibility();

        $('#student-modal').classList.add('active');
    }

    function closeStudentModal() {
        $('#student-modal').classList.remove('active');
        editingStudentId = null;
    }

    async function saveStudent(e) {
        e.preventDefault();

        const data = {
            fullName: $('#student-fullName').value,
            dateOfBirth: $('#student-dob').value || null,
            parentName: $('#student-parentName').value || null,
            parentPhone: $('#student-parentPhone').value || null,
            parentEmail: $('#student-parentEmail').value || null,
            parentFacebook: $('#student-parentFacebook').value || null,
            englishLevel: $('#student-level').value || null,
            interestedCourse: $('#student-course').value || null,
            leadSource: $('#student-source').value || null,
            status: $('#student-status').value || 'Mới',
            testResult: $('#student-testResult').value || null,
            assignedClass: $('#student-assignedClass').value || null,
            notes: $('#student-notes').value || null
        };

        try {
            if (editingStudentId) {
                await api.updateStudent(editingStudentId, data);
                showToast('Cập nhật học sinh thành công!');
            } else {
                await api.createStudent(data);
                showToast('Thêm học sinh thành công!');
            }
            closeStudentModal();
            loadStudents();
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    function updateStatusSuggestion() {
        const status = $('#student-status').value;
        const suggestion = constants.statusSuggestions?.[status] || '';
        $('#status-suggestion').textContent = suggestion ? `💡 Đề xuất: ${suggestion}` : '';
        updateClassFieldVisibility();
    }

    // Show "Assigned Class" field only when status is "Đã đăng ký"
    function updateClassFieldVisibility() {
        const status = $('#student-status').value;
        const classGroup = $('#assigned-class-group');
        if (classGroup) {
            if (status === 'Đã đăng ký') {
                classGroup.style.display = 'block';
            } else {
                classGroup.style.display = 'none';
            }
        }
    }

    // Make functions global for onclick handlers
    window.viewStudent = async function (id) {
        currentStudentId = id;
        try {
            const [student, history] = await Promise.all([
                api.getStudent(id),
                api.getHistory(id)
            ]);

            renderStudentDetail(student);
            renderHistoryList(history);
            $('#student-detail-modal').classList.add('active');
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    window.editStudent = async function (id) {
        try {
            const student = await api.getStudent(id);
            openStudentModal(student);
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    window.deleteStudent = async function (id) {
        if (!confirm('Bạn có chắc chắn muốn xóa học sinh này?')) return;

        try {
            await api.deleteStudent(id);
            showToast('Xóa học sinh thành công!');
            loadStudents();
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    function renderStudentDetail(student) {
        const container = $('#student-detail-content');
        if (!container) return;

        container.innerHTML = `
      <div class="detail-row">
        <span class="detail-label">Họ tên học sinh</span>
        <span class="detail-value"><strong>${student.fullName}</strong></span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Ngày sinh</span>
        <span class="detail-value">${formatDate(student.dateOfBirth) || '-'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Tên phụ huynh</span>
        <span class="detail-value">${student.parentName || '-'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">SĐT phụ huynh</span>
        <span class="detail-value">${student.parentPhone || '-'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Email</span>
        <span class="detail-value">${student.parentEmail || '-'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Facebook</span>
        <span class="detail-value">${student.parentFacebook || '-'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Trình độ</span>
        <span class="detail-value">${student.englishLevel || '-'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Khóa học quan tâm</span>
        <span class="detail-value">${student.interestedCourse || '-'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Nguồn</span>
        <span class="detail-value">${student.leadSource || '-'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Trạng thái</span>
        <span class="detail-value"><span class="status-badge ${getStatusClass(student.status)}">${student.status}</span></span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Kết quả test</span>
        <span class="detail-value">${student.testResult || '-'}</span>
      </div>
      ${student.status === 'Đã đăng ký' && student.assignedClass ? `
        <div class="detail-row">
          <span class="detail-label">Xếp lớp</span>
          <span class="detail-value"><strong>${student.assignedClass}</strong></span>
        </div>
      ` : ''}
      ${student.statusSuggestion ? `
        <div class="suggestion-box">💡 ${student.statusSuggestion}</div>
      ` : ''}
      ${student.notes ? `
        <div class="detail-row">
          <span class="detail-label">Ghi chú</span>
          <span class="detail-value">${student.notes}</span>
        </div>
      ` : ''}
    `;
    }

    function renderHistoryList(history) {
        const container = $('#history-list');
        if (!container) return;

        if (!history?.length) {
            container.innerHTML = '<div class="empty-state"><p>Chưa có lịch sử tư vấn</p></div>';
            return;
        }

        container.innerHTML = history.map(item => `
      <div class="history-item">
        <div class="history-meta">
          <span class="history-type">${item.contactType}</span>
          <span class="history-date">${formatDateTime(item.createdAt)} • ${item.userName}</span>
        </div>
        <div class="history-content">${item.content}</div>
        ${item.nextAction ? `
          <div class="history-next">
            📅 ${item.nextAction}${item.nextContactDate ? ` - ${formatDate(item.nextContactDate)}` : ''}
          </div>
        ` : ''}
      </div>
    `).join('');
    }

    function closeDetailModal() {
        $('#student-detail-modal').classList.remove('active');
        currentStudentId = null;
    }

    // History modal
    function openHistoryModal() {
        $('#history-form').reset();
        $('#history-modal').classList.add('active');
    }

    function closeHistoryModal() {
        $('#history-modal').classList.remove('active');
    }

    async function saveHistory(e) {
        e.preventDefault();

        if (!currentStudentId) return;

        const data = {
            contactType: $('#history-type').value,
            content: $('#history-content').value,
            nextAction: $('#history-nextAction').value || null,
            nextContactDate: $('#history-nextDate').value || null
        };

        try {
            await api.addHistory(currentStudentId, data);
            showToast('Thêm lịch sử tư vấn thành công!');
            closeHistoryModal();

            // Reload history
            const history = await api.getHistory(currentStudentId);
            renderHistoryList(history);
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    async function exportStudents() {
        try {
            await api.exportExcel({
                status: $('#filter-status')?.value || '',
                course: $('#filter-course')?.value || '',
                leadSource: $('#filter-source')?.value || ''
            });
            showToast('Xuất file Excel thành công!');
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    // ==========================================
    // Users (Admin only)
    // ==========================================
    async function loadUsers() {
        const user = getUser();
        if (user.role !== 'admin') {
            navigateTo('dashboard');
            return;
        }

        try {
            const users = await api.getUsers();
            renderUsersTable(users);
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    function renderUsersTable(users) {
        const tbody = $('#users-tbody');
        if (!tbody) return;

        const roleNames = {
            admin: 'Quản trị viên',
            manager: 'Quản lý',
            consultant: 'Tư vấn viên'
        };

        tbody.innerHTML = users.map(user => `
      <tr>
        <td><strong>${user.fullName}</strong></td>
        <td>${user.username}</td>
        <td>${user.email || '-'}</td>
        <td>${roleNames[user.role] || user.role}</td>
        <td>${formatDate(user.createdAt)}</td>
        <td>
          <div class="action-btns">
            <button class="action-btn" onclick="editUser(${user.id})" title="Sửa">✏️</button>
            <button class="action-btn delete" onclick="deleteUser(${user.id})" title="Xóa">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
    }

    function openUserModal(user = null) {
        editingUserId = user?.id || null;
        $('#user-modal-title').textContent = user ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới';
        $('#password-hint').style.display = user ? 'block' : 'none';
        $('#user-password').required = !user;

        $('#user-form').reset();

        if (user) {
            $('#user-fullName').value = user.fullName || '';
            $('#user-username').value = user.username || '';
            $('#user-email').value = user.email || '';
            $('#user-role').value = user.role || 'consultant';
            $('#user-username').disabled = true;
        } else {
            $('#user-username').disabled = false;
        }

        $('#user-modal').classList.add('active');
    }

    function closeUserModal() {
        $('#user-modal').classList.remove('active');
        editingUserId = null;
    }

    async function saveUser(e) {
        e.preventDefault();

        const data = {
            fullName: $('#user-fullName').value,
            username: $('#user-username').value,
            email: $('#user-email').value || null,
            role: $('#user-role').value
        };

        const password = $('#user-password').value;
        if (password) {
            data.password = password;
        }

        try {
            if (editingUserId) {
                await api.updateUser(editingUserId, data);
                showToast('Cập nhật nhân viên thành công!');
            } else {
                await api.createUser(data);
                showToast('Thêm nhân viên thành công!');
            }
            closeUserModal();
            loadUsers();
        } catch (error) {
            showToast(error.message, 'error');
        }
    }

    window.editUser = async function (id) {
        try {
            // Get user data (we could call API, but for now just find from table)
            const users = await api.getUsers();
            const user = users.find(u => u.id === id);
            if (user) {
                openUserModal(user);
            }
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    window.deleteUser = async function (id) {
        if (!confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) return;

        try {
            await api.deleteUser(id);
            showToast('Xóa nhân viên thành công!');
            loadUsers();
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    // ==========================================
    // Utilities
    // ==========================================
    function getStatusClass(status) {
        const classes = {
            'Mới': 'status-moi',
            'Đang tư vấn': 'status-tuvan',
            'Test đầu vào': 'status-test',
            'Chờ kết quả': 'status-chokq',
            'Đã đăng ký': 'status-dangky',
            'Từ chối': 'status-tuchoi',
            'Tạm hoãn': 'status-tamhoan'
        };
        return classes[status] || '';
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN');
    }

    function formatDateTime(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleString('vi-VN');
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function showToast(message, type = 'success') {
        const toast = $('#toast');
        toast.textContent = message;
        toast.className = `toast show ${type}`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

})();
