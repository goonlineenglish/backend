module.exports = {
    jwtSecret: process.env.JWT_SECRET || 'luna-english-super-secret-key-2024',
    jwtExpiresIn: '24h',

    // Student statuses
    studentStatuses: [
        'Mới',
        'Đang tư vấn',
        'Test đầu vào',
        'Chờ kết quả',
        'Đã đăng ký',
        'Từ chối',
        'Tạm hoãn'
    ],

    // Courses at Luna English
    courses: [
        'Buttercup',
        'Primary Success',
        'Tiểu học cơ bản',
        'Trung học cơ bản',
        'Trung học nâng cao'
    ],

    // Lead sources
    leadSources: [
        'Facebook',
        'Website',
        'Giới thiệu',
        'Zalo',
        'Đi ngang',
        'Khác'
    ],

    // English levels
    englishLevels: [
        'Chưa biết',
        'Beginner',
        'Elementary',
        'Pre-Intermediate',
        'Intermediate',
        'Upper-Intermediate',
        'Advanced'
    ],

    // Contact types
    contactTypes: [
        'Gọi điện',
        'Nhắn tin',
        'Gặp trực tiếp',
        'Email',
        'Zalo/Facebook'
    ],

    // Status suggestions
    statusSuggestions: {
        'Mới': 'Gọi điện trong 24h để tư vấn',
        'Đang tư vấn': 'Follow-up sau 2-3 ngày',
        'Test đầu vào': 'Nhắc lịch test trước 1 ngày',
        'Chờ kết quả': 'Thông báo kết quả trong 24h',
        'Đã đăng ký': 'Gửi thông tin lớp học',
        'Từ chối': 'Lưu lý do, follow-up sau 3 tháng',
        'Tạm hoãn': 'Follow-up theo thời gian hẹn'
    }
};
