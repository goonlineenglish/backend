// API Configuration - Auto-detect environment
const API_URL = window.location.hostname === 'localhost' || window.location.protocol === 'file:'
    ? 'http://localhost:3001/api'
    : '/api';  // Production: same domain

// Token management
const getToken = () => localStorage.getItem('luna_token');
const setToken = (token) => localStorage.setItem('luna_token', token);
const removeToken = () => localStorage.removeItem('luna_token');

const getUser = () => {
    const user = localStorage.getItem('luna_user');
    return user ? JSON.parse(user) : null;
};
const setUser = (user) => localStorage.setItem('luna_user', JSON.stringify(user));
const removeUser = () => localStorage.removeItem('luna_user');

// API Helper
const api = {
    async request(endpoint, options = {}) {
        const token = getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers: { ...headers, ...options.headers }
            });

            if (response.status === 401) {
                removeToken();
                removeUser();
                window.location.reload();
                throw new Error('Phiên đăng nhập hết hạn');
            }

            // Handle file downloads
            if (response.headers.get('Content-Type')?.includes('application/vnd.openxmlformats') ||
                response.headers.get('Content-Type')?.includes('application/pdf')) {
                return response;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Có lỗi xảy ra');
            }

            return data;
        } catch (error) {
            if (error.message === 'Failed to fetch') {
                throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
            }
            throw error;
        }
    },

    // Auth
    login(username, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    },

    getMe() {
        return this.request('/auth/me');
    },

    // Constants
    getConstants() {
        return this.request('/constants');
    },

    // Users
    getUsers() {
        return this.request('/users');
    },

    createUser(data) {
        return this.request('/users', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    updateUser(id, data) {
        return this.request(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    deleteUser(id) {
        return this.request(`/users/${id}`, {
            method: 'DELETE'
        });
    },

    // Students
    getStudents(filters = {}) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });
        const queryString = params.toString();
        return this.request(`/students${queryString ? '?' + queryString : ''}`);
    },

    getStudent(id) {
        return this.request(`/students/${id}`);
    },

    createStudent(data) {
        return this.request('/students', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    updateStudent(id, data) {
        return this.request(`/students/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    deleteStudent(id) {
        return this.request(`/students/${id}`, {
            method: 'DELETE'
        });
    },

    // Contact History
    getHistory(studentId) {
        return this.request(`/students/${studentId}/history`);
    },

    addHistory(studentId, data) {
        return this.request(`/students/${studentId}/history`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // Stats
    getDashboard() {
        return this.request('/stats/dashboard');
    },

    getConversion() {
        return this.request('/stats/conversion');
    },

    // Export
    async exportExcel(filters = {}) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });
        const queryString = params.toString();

        const response = await this.request(`/export/students/excel${queryString ? '?' + queryString : ''}`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'luna-english-students.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
    }
};
