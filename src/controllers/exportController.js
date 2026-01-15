const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const db = require('../config/database');
const path = require('path');

const exportController = {
    // Export students to Excel
    excel: async (req, res) => {
        if (req.user.role === 'consultant') {
            return res.status(403).json({ error: 'Không có quyền xuất báo cáo' });
        }

        const { status, leadSource, course } = req.query;

        let query = `
      SELECT s.*, u.fullName as assignedToName 
      FROM students s
      LEFT JOIN users u ON s.assignedTo = u.id
      WHERE 1=1
    `;
        const params = [];

        if (status) {
            query += ' AND s.status = ?';
            params.push(status);
        }
        if (leadSource) {
            query += ' AND s.leadSource = ?';
            params.push(leadSource);
        }
        if (course) {
            query += ' AND s.interestedCourse = ?';
            params.push(course);
        }

        query += ' ORDER BY s.createdAt DESC';

        const students = db.prepare(query).all(...params);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Danh sách học sinh');

        // Header styling
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 8 },
            { header: 'Họ tên học sinh', key: 'fullName', width: 25 },
            { header: 'Ngày sinh', key: 'dateOfBirth', width: 12 },
            { header: 'Tên phụ huynh', key: 'parentName', width: 25 },
            { header: 'SĐT phụ huynh', key: 'parentPhone', width: 15 },
            { header: 'Email', key: 'parentEmail', width: 25 },
            { header: 'Facebook', key: 'parentFacebook', width: 20 },
            { header: 'Trình độ', key: 'englishLevel', width: 15 },
            { header: 'Khóa học quan tâm', key: 'interestedCourse', width: 20 },
            { header: 'Nguồn', key: 'leadSource', width: 12 },
            { header: 'Trạng thái', key: 'status', width: 15 },
            { header: 'Người phụ trách', key: 'assignedToName', width: 20 },
            { header: 'Ngày tạo', key: 'createdAt', width: 18 }
        ];

        // Style header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

        // Add data
        students.forEach(student => {
            worksheet.addRow(student);
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=luna-english-students.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    },

    // Export students to PDF
    pdf: (req, res) => {
        if (req.user.role === 'consultant') {
            return res.status(403).json({ error: 'Không có quyền xuất báo cáo' });
        }

        const { status, leadSource, course } = req.query;

        let query = `
      SELECT s.*, u.fullName as assignedToName 
      FROM students s
      LEFT JOIN users u ON s.assignedTo = u.id
      WHERE 1=1
    `;
        const params = [];

        if (status) {
            query += ' AND s.status = ?';
            params.push(status);
        }
        if (leadSource) {
            query += ' AND s.leadSource = ?';
            params.push(leadSource);
        }
        if (course) {
            query += ' AND s.interestedCourse = ?';
            params.push(course);
        }

        query += ' ORDER BY s.createdAt DESC';

        const students = db.prepare(query).all(...params);

        // Create PDF
        const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=luna-english-students.pdf');

        doc.pipe(res);

        // Register Vietnamese font
        const fontPath = path.join(__dirname, '..', '..', 'fonts', 'Roboto-Regular.ttf');
        try {
            doc.registerFont('Vietnamese', fontPath);
            doc.font('Vietnamese');
        } catch (e) {
            // Fallback to Helvetica if custom font not available
            doc.font('Helvetica');
        }

        // Title
        doc.fontSize(18).text('DANH SACH HOC SINH - LUNA ENGLISH', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Ngay xuat: ${new Date().toLocaleDateString('vi-VN')}`, { align: 'center' });
        doc.moveDown(2);

        // Table header
        const tableTop = 150;
        const colWidths = [30, 120, 100, 100, 80, 80, 100];
        const headers = ['STT', 'Ho ten', 'Phu huynh', 'SDT', 'Khoa hoc', 'Trang thai', 'Nguoi PT'];

        let x = 50;
        doc.fontSize(10).font('Helvetica-Bold');
        headers.forEach((header, i) => {
            doc.text(header, x, tableTop, { width: colWidths[i], align: 'left' });
            x += colWidths[i];
        });

        // Table rows
        doc.font('Helvetica');
        let y = tableTop + 20;
        students.forEach((student, index) => {
            if (y > 500) {
                doc.addPage();
                y = 50;
            }

            x = 50;
            const rowData = [
                (index + 1).toString(),
                student.fullName || '',
                student.parentName || '',
                student.parentPhone || '',
                student.interestedCourse || '',
                student.status || '',
                student.assignedToName || ''
            ];

            rowData.forEach((cell, i) => {
                doc.text(cell.substring(0, 20), x, y, { width: colWidths[i], align: 'left' });
                x += colWidths[i];
            });

            y += 20;
        });

        // Summary
        doc.moveDown(2);
        doc.text(`Tong so: ${students.length} hoc sinh`);

        doc.end();
    }
};

module.exports = exportController;
