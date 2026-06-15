const pool = require('../config/db');

const escapeCSV = (val) => {
    if (val === null || val === undefined) return '';
    let str = String(val);
    str = str.replace(/"/g, '""');
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str}"`;
    }
    return str;
};

// @desc    Export projects report as CSV
// @route   GET /api/reports/projects
// @access  Protected (Admin / Super Admin)
const exportProjectsReport = async (req, res) => {
    try {
        const query = `
            SELECT p.id, p.name, p.location, p.site_engineer_contact, p.start_date, 
                   p.progress_percentage, p.status, u.name AS creator_name,
                   COALESCE(SUM(tl.duration_minutes), 0) / 60.0 AS total_hours
            FROM projects p
            LEFT JOIN users u ON p.created_by = u.id
            LEFT JOIN time_logs tl ON p.id = tl.project_id
            GROUP BY p.id, u.name
            ORDER BY p.created_at DESC
        `;
        const result = await pool.query(query);

        let csv = 'Project ID,Project Name,Location,Site Engineer Contact,Start Date,Progress (%),Status,Created By,Total Hours Logged\n';
        result.rows.forEach(row => {
            csv += [
                row.id,
                escapeCSV(row.name),
                escapeCSV(row.location),
                escapeCSV(row.site_engineer_contact),
                row.start_date ? new Date(row.start_date).toISOString().split('T')[0] : '',
                row.progress_percentage,
                row.status,
                escapeCSV(row.creator_name),
                parseFloat(row.total_hours).toFixed(2)
            ].join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=projects_report.csv');
        res.status(200).send(csv);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Export employees report as CSV
// @route   GET /api/reports/employees
// @access  Protected (Admin / Super Admin)
const exportEmployeesReport = async (req, res) => {
    try {
        const query = `
            SELECT u.id, u.name, u.email, u.phone_number, u.designation, u.role, u.status,
                   COALESCE(SUM(tl.duration_minutes), 0) / 60.0 AS total_hours
            FROM users u
            LEFT JOIN time_logs tl ON u.id = tl.employee_id
            GROUP BY u.id
            ORDER BY u.name ASC
        `;
        const result = await pool.query(query);

        let csv = 'Employee ID,Name,Email,Phone Number,Designation,Role,Status,Total Hours Logged\n';
        result.rows.forEach(row => {
            csv += [
                row.id,
                escapeCSV(row.name),
                escapeCSV(row.email),
                escapeCSV(row.phone_number),
                escapeCSV(row.designation),
                row.role,
                row.status,
                parseFloat(row.total_hours).toFixed(2)
            ].join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=employees_report.csv');
        res.status(200).send(csv);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Export attendance report as CSV
// @route   GET /api/reports/attendance
// @access  Protected (Admin / Super Admin)
const exportAttendanceReport = async (req, res) => {
    try {
        const query = `
            SELECT a.id, u.name AS employee_name, u.email, u.designation, 
                   a.date, a.login_time, a.logout_time, a.status,
                   EXTRACT(EPOCH FROM (a.logout_time - a.login_time))/3600.0 AS hours_worked
            FROM attendance a
            JOIN users u ON a.employee_id = u.id
            ORDER BY a.date DESC, u.name ASC
        `;
        const result = await pool.query(query);

        let csv = 'Attendance ID,Employee Name,Email,Designation,Date,Login Time,Logout Time,Status,Hours Worked\n';
        result.rows.forEach(row => {
            csv += [
                row.id,
                escapeCSV(row.employee_name),
                escapeCSV(row.email),
                escapeCSV(row.designation),
                row.date ? new Date(row.date).toISOString().split('T')[0] : '',
                row.login_time ? new Date(row.login_time).toLocaleString() : '',
                row.logout_time ? new Date(row.logout_time).toLocaleString() : 'Active/Not Logged Out',
                row.status,
                row.hours_worked ? parseFloat(row.hours_worked).toFixed(2) : '0.00'
            ].join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=attendance_report.csv');
        res.status(200).send(csv);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Export site visits report as CSV
// @route   GET /api/reports/site-visits
// @access  Protected (Admin / Super Admin)
const exportSiteVisitsReport = async (req, res) => {
    const { projectId } = req.query; // Optional filter by project
    
    try {
        let query = `
            SELECT sv.id, p.name AS project_name, u.name AS employee_name,
                   sv.visit_date, sv.visit_time, sv.mom, sv.created_at
            FROM site_visits sv
            JOIN projects p ON sv.project_id = p.id
            JOIN users u ON sv.employee_id = u.id
        `;
        const params = [];
        if (projectId) {
            query += ` WHERE sv.project_id = $1`;
            params.push(projectId);
        }
        query += ` ORDER BY sv.visit_date DESC, sv.visit_time DESC`;

        const result = await pool.query(query, params);

        let csv = 'Visit ID,Project Name,Employee Name,Visit Date,Visit Time,Minutes of Meeting (MOM),Logged At\n';
        result.rows.forEach(row => {
            csv += [
                row.id,
                escapeCSV(row.project_name),
                escapeCSV(row.employee_name),
                row.visit_date ? new Date(row.visit_date).toISOString().split('T')[0] : '',
                row.visit_time,
                escapeCSV(row.mom),
                new Date(row.created_at).toLocaleString()
            ].join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=site_visits_report.csv');
        res.status(200).send(csv);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    exportProjectsReport,
    exportEmployeesReport,
    exportAttendanceReport,
    exportSiteVisitsReport
};
