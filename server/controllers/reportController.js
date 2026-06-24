const pool = require('../config/db');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');


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
// @desc    Export projects report as Excel (.xlsx)
// @route   GET /api/reports/projects
// @access  Protected (Admin / Super Admin)
const exportProjectsReport = async (req, res) => {
    try {
        const query = `
            SELECT p.name, p.location, p.site_engineer_contact, p.start_date, 
                   p.progress_percentage, p.status, u.name AS creator_name,
                   COALESCE(SUM(tl.duration_minutes), 0) / 60.0 AS total_hours
            FROM projects p
            LEFT JOIN users u ON p.created_by = u.id
            LEFT JOIN time_logs tl ON p.id = tl.project_id
            GROUP BY p.id, u.name
            ORDER BY p.created_at DESC
        `;
        const result = await pool.query(query);

        // Create Excel Workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Projects Register');
        worksheet.views = [{ showGridLines: true }];

        // Row 1: Title block
        worksheet.mergeCells('A1:H1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'Projects Master Register';
        titleCell.font = { name: 'Arial', size: 16, bold: true };
        worksheet.getRow(1).height = 35;
        titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

        // Row 2: Generated Subtitle block
        worksheet.mergeCells('A2:H2');
        const subtitleCell = worksheet.getCell('A2');
        const dateStr = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        subtitleCell.value = `Generated on: ${dateStr}`;
        subtitleCell.font = { name: 'Arial', size: 11, italic: true, color: { argb: '595959' } };
        worksheet.getRow(2).height = 20;
        subtitleCell.alignment = { vertical: 'middle', horizontal: 'left' };

        // Row 3: Blank
        worksheet.getRow(3).height = 15;

        // Row 4: Column Headers
        worksheet.getRow(4).values = [
            'Project Name', 'Location', 'Site Engineer Contact', 'Start Date', 'Progress (%)', 'Status', 'Created By', 'Total Hours Logged'
        ];
        worksheet.getRow(4).height = 28;

        // Column Widths
        worksheet.getColumn(1).width = 22; // Project Name
        worksheet.getColumn(2).width = 22; // Location
        worksheet.getColumn(3).width = 20; // Site Engineer Contact
        worksheet.getColumn(4).width = 15; // Start Date
        worksheet.getColumn(5).width = 15; // Progress (%)
        worksheet.getColumn(6).width = 15; // Status
        worksheet.getColumn(7).width = 18; // Created By
        worksheet.getColumn(8).width = 22; // Hours

        // Format header styling
        ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4'].forEach(cellRef => {
            const cell = worksheet.getCell(cellRef);
            cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '1F4E78' } // Dark steel blue
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin', color: { argb: 'A6A6A6' } },
                left: { style: 'thin', color: { argb: 'A6A6A6' } },
                bottom: { style: 'medium', color: { argb: '1B365D' } },
                right: { style: 'thin', color: { argb: 'A6A6A6' } }
            };
        });

        // Add rows
        result.rows.forEach((row, index) => {
            const rowIndex = index + 5;
            
            // Format phone number safely as text to prevent scientific notation conversion
            const phoneVal = row.site_engineer_contact ? String(row.site_engineer_contact).trim() : '---';
            const dateVal = row.start_date ? new Date(row.start_date).toISOString().split('T')[0] : '---';
            const hoursVal = parseFloat(parseFloat(row.total_hours).toFixed(2));

            worksheet.addRow([
                row.name,
                row.location || '---',
                phoneVal,
                dateVal,
                row.progress_percentage || 0,
                row.status || 'Active',
                row.creator_name || '---',
                hoursVal
            ]);

            const rowObj = worksheet.getRow(rowIndex);
            rowObj.height = 22;
            rowObj.alignment = { vertical: 'middle' };

            // Cell Alignments
            worksheet.getCell(`A${rowIndex}`).alignment = { vertical: 'middle', horizontal: 'left' };
            worksheet.getCell(`B${rowIndex}`).alignment = { vertical: 'middle', horizontal: 'left' };
            worksheet.getCell(`C${rowIndex}`).alignment = { vertical: 'middle', horizontal: 'left' };
            worksheet.getCell(`D${rowIndex}`).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell(`E${rowIndex}`).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell(`F${rowIndex}`).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell(`G${rowIndex}`).alignment = { vertical: 'middle', horizontal: 'left' };
            worksheet.getCell(`H${rowIndex}`).alignment = { vertical: 'middle', horizontal: 'right' };

            // Number formatting for Total Hours Logged
            worksheet.getCell(`H${rowIndex}`).numFmt = '#,##0.00';

            // Bold Project Name
            worksheet.getCell(`A${rowIndex}`).font = { name: 'Arial', size: 10, bold: true };

            // Borders for all cells in the row
            ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach(col => {
                const cell = worksheet.getCell(`${col}${rowIndex}`);
                if (col !== 'A') {
                    cell.font = { name: 'Arial', size: 10 };
                }
                cell.border = {
                    top: { style: 'thin', color: { argb: 'D9D9D9' } },
                    left: { style: 'thin', color: { argb: 'D9D9D9' } },
                    bottom: { style: 'thin', color: { argb: 'D9D9D9' } },
                    right: { style: 'thin', color: { argb: 'D9D9D9' } }
                };
            });

            // Status coloration formatting
            const statusCell = worksheet.getCell(`F${rowIndex}`);
            const statusStr = row.status || 'Active';
            if (statusStr === 'Active' || statusStr === 'Completed') {
                statusCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'E2EFDA' } // Light green
                };
                statusCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: '375623' } };
            } else if (statusStr === 'On Hold') {
                statusCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF2CC' } // Light yellow
                };
                statusCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'B25900' } }; // Dark orange/yellow
            } else {
                statusCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'F2F2F2' } // Light grey
                };
                statusCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: '595959' } };
            }
        });

        // Set response headers and send Excel file binary
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=projects_report.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error exporting projects register:', error.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Export employees report as Excel (.xlsx)
// @route   GET /api/reports/employees
// @access  Protected (Admin / Super Admin)
// @desc    Export employees report as Excel (.xlsx)
// @route   GET /api/reports/employees
// @access  Protected (Admin / Super Admin)
const exportEmployeesReport = async (req, res) => {
    try {
        const query = `
            SELECT u.name, u.email, u.phone_number, u.designation, u.role
            FROM users u
            WHERE u.is_deleted = FALSE
            ORDER BY u.name ASC
        `;
        const result = await pool.query(query);

        // Create Excel Workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Employees Register');
        worksheet.views = [{ showGridLines: true }];

        // Row 1: Title block
        worksheet.mergeCells('A1:E1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'Employees Master Register';
        titleCell.font = { name: 'Arial', size: 16, bold: true };
        worksheet.getRow(1).height = 35;
        titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

        // Row 2: Generated Subtitle block
        worksheet.mergeCells('A2:E2');
        const subtitleCell = worksheet.getCell('A2');
        const dateStr = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        subtitleCell.value = `Generated on: ${dateStr}`;
        subtitleCell.font = { name: 'Arial', size: 11, italic: true, color: { argb: '595959' } };
        worksheet.getRow(2).height = 20;
        subtitleCell.alignment = { vertical: 'middle', horizontal: 'left' };

        // Row 3: Blank
        worksheet.getRow(3).height = 15;

        // Row 4: Column Headers
        worksheet.getRow(4).values = [
            'Name', 'Email', 'Phone Number', 'Designation', 'Role'
        ];
        worksheet.getRow(4).height = 28;

        // Column Widths
        worksheet.getColumn(1).width = 22; // Name
        worksheet.getColumn(2).width = 28; // Email
        worksheet.getColumn(3).width = 20; // Phone Number
        worksheet.getColumn(4).width = 20; // Designation
        worksheet.getColumn(5).width = 18; // Role

        // Format header styling
        ['A4', 'B4', 'C4', 'D4', 'E4'].forEach(cellRef => {
            const cell = worksheet.getCell(cellRef);
            cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '1F4E78' } // Dark steel blue
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin', color: { argb: 'A6A6A6' } },
                left: { style: 'thin', color: { argb: 'A6A6A6' } },
                bottom: { style: 'medium', color: { argb: '1B365D' } },
                right: { style: 'thin', color: { argb: 'A6A6A6' } }
            };
        });

        // Add rows
        result.rows.forEach((row, index) => {
            const rowIndex = index + 5;
            
            // Format phone number safely as text to prevent scientific notation conversion
            const phoneVal = row.phone_number ? String(row.phone_number).trim() : '---';
            const formattedRole = row.role === 'Admin' ? 'Owner Admin' : row.role === 'Secondary Admin' ? 'Super Admin' : 'Employee';

            worksheet.addRow([
                row.name,
                row.email,
                phoneVal,
                row.designation || '---',
                formattedRole
            ]);

            const rowObj = worksheet.getRow(rowIndex);
            rowObj.height = 22;
            rowObj.alignment = { vertical: 'middle' };

            // Cell Alignments
            worksheet.getCell(`A${rowIndex}`).alignment = { vertical: 'middle', horizontal: 'left' };
            worksheet.getCell(`B${rowIndex}`).alignment = { vertical: 'middle', horizontal: 'left' };
            worksheet.getCell(`C${rowIndex}`).alignment = { vertical: 'middle', horizontal: 'left' };
            worksheet.getCell(`D${rowIndex}`).alignment = { vertical: 'middle', horizontal: 'left' };
            worksheet.getCell(`E${rowIndex}`).alignment = { vertical: 'middle', horizontal: 'center' };

            // Bold Name (now column A)
            worksheet.getCell(`A${rowIndex}`).font = { name: 'Arial', size: 10, bold: true };

            // Borders for all cells in the row
            ['A', 'B', 'C', 'D', 'E'].forEach(col => {
                const cell = worksheet.getCell(`${col}${rowIndex}`);
                if (col !== 'A') {
                    cell.font = { name: 'Arial', size: 10 };
                }
                cell.border = {
                    top: { style: 'thin', color: { argb: 'D9D9D9' } },
                    left: { style: 'thin', color: { argb: 'D9D9D9' } },
                    bottom: { style: 'thin', color: { argb: 'D9D9D9' } },
                    right: { style: 'thin', color: { argb: 'D9D9D9' } }
                };
            });
        });

        // Set response headers and send Excel file binary
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=employees_report.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error exporting employees register:', error.message);
        res.status(500).send('Server Error');
    }
};

// Helper to format date key timezone-safely (YYYY-MM-DD)
const getDateKey = (dateVal) => {
    const d = new Date(dateVal);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
};

// Helper to format date for display (e.g. Thu, 01-Jan-2026)
const formatReportDate = (dateVal) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = new Date(dateVal);
    const dayName = days[d.getDay()];
    const dayVal = String(d.getDate()).padStart(2, '0');
    const monthName = months[d.getMonth()];
    const yearVal = d.getFullYear();
    return `${dayName}, ${dayVal}-${monthName}-${yearVal}`;
};

// Helper to format timestamp to HH:MM
const formatTime = (timeVal) => {
    if (!timeVal) return '';
    const d = new Date(timeVal);
    const hrs = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${hrs}:${mins}`;
};

// Helper to format seconds to H:MM
const formatDuration = (seconds) => {
    if (seconds === undefined || seconds === null || seconds < 0) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}:${String(mins).padStart(2, '0')}`;
};

// @desc    Export attendance report as Excel (.xlsx)
// @route   GET /api/reports/attendance
// @access  Protected (Admin / Super Admin)
const exportAttendanceReport = async (req, res) => {
    const { employeeId, startDate, endDate } = req.query;
    try {
        // Find Date Range from database
        let dateRangeQuery = await pool.query('SELECT MIN(date), MAX(date) FROM attendance');
        let minDate = dateRangeQuery.rows[0].min ? new Date(dateRangeQuery.rows[0].min) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        let maxDate = dateRangeQuery.rows[0].max ? new Date(dateRangeQuery.rows[0].max) : new Date();

        if (startDate) minDate = new Date(startDate);
        if (endDate) maxDate = new Date(endDate);

        // Normalize minDate and maxDate to midnight local time to avoid timezone issues
        minDate.setHours(0, 0, 0, 0);
        maxDate.setHours(0, 0, 0, 0);

        // Generate list of dates
        const dateList = [];
        let current = new Date(minDate);
        while (current <= maxDate) {
            dateList.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        // Fetch Employees
        let empQuery = `
            SELECT id, name, designation, email 
            FROM users 
            WHERE role != 'Admin' AND is_deleted = FALSE
        `;
        const empParams = [];
        if (employeeId) {
            empQuery += ' AND id = $1';
            empParams.push(employeeId);
        }
        empQuery += ' ORDER BY name ASC';
        const empsResult = await pool.query(empQuery, empParams);

        if (empsResult.rows.length === 0) {
            return res.status(404).send('No staff accounts found');
        }

        // Create Excel Workbook
        const workbook = new ExcelJS.Workbook();

        for (const emp of empsResult.rows) {
            // Fetch attendance logs for this employee
            const attQuery = `
                SELECT date, login_time, logout_time, status, worked_seconds, current_session_start 
                FROM attendance 
                WHERE employee_id = $1
            `;
            const attResult = await pool.query(attQuery, [emp.id]);
            
            // Map logs by YYYY-MM-DD
            const attMap = {};
            attResult.rows.forEach(r => {
                const dateKey = getDateKey(r.date);
                attMap[dateKey] = r;
            });

            // Create Worksheet named: Name (ID) - clean and within max 31 chars
            let sheetName = `${emp.name} (${emp.id})`;
            if (sheetName.length > 31) {
                sheetName = sheetName.substring(0, 31);
            }
            sheetName = sheetName.replace(/[*?:\\/\[\]]/g, ''); // Remove disallowed Excel sheet chars
            const worksheet = workbook.addWorksheet(sheetName);
            worksheet.views = [{ showGridLines: true }];

            // Row 1: Title block
            worksheet.mergeCells('A1:E1');
            const titleCell = worksheet.getCell('A1');
            titleCell.value = `Daily Attendance Detail - Employee ${emp.id} : ${emp.name.toUpperCase()}`;
            titleCell.font = { name: 'Arial', size: 16, bold: true };
            worksheet.getRow(1).height = 35;
            titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

            // Row 2: Period block
            worksheet.mergeCells('A2:E2');
            const periodCell = worksheet.getCell('A2');
            const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const startStr = `${monthsShort[minDate.getMonth()]} ${String(minDate.getDate()).padStart(2, '0')} ${minDate.getFullYear()}`;
            const endStr = `${monthsShort[maxDate.getMonth()]} ${String(maxDate.getDate()).padStart(2, '0')} ${maxDate.getFullYear()}`;
            periodCell.value = `Period: ${startStr} to ${endStr}`;
            periodCell.font = { name: 'Arial', size: 11, italic: true, color: { argb: '595959' } };
            worksheet.getRow(2).height = 20;
            periodCell.alignment = { vertical: 'middle', horizontal: 'left' };

            // Row 3: Blank
            worksheet.getRow(3).height = 15;

            // Row 4: Column Headers
            worksheet.getRow(4).values = ['Date', 'Status', 'In Time', 'Out Time', 'Duration'];
            worksheet.getRow(4).height = 25;

            // Column Widths
            worksheet.getColumn(1).width = 20; // Date
            worksheet.getColumn(2).width = 12; // Status
            worksheet.getColumn(3).width = 15; // In Time
            worksheet.getColumn(4).width = 15; // Out Time
            worksheet.getColumn(5).width = 15; // Duration

            // Format header styling
            ['A4', 'B4', 'C4', 'D4', 'E4'].forEach(cellRef => {
                const cell = worksheet.getCell(cellRef);
                cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: '1F4E78' } // Dark steel blue theme
                };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'A6A6A6' } },
                    left: { style: 'thin', color: { argb: 'A6A6A6' } },
                    bottom: { style: 'medium', color: { argb: '1B365D' } },
                    right: { style: 'thin', color: { argb: 'A6A6A6' } }
                };
            });

            // Add calendar dates
            dateList.forEach((date, index) => {
                const rowIndex = index + 5;
                const dateKey = getDateKey(date);
                const att = attMap[dateKey];

                let status = 'A';
                let inTime = '';
                let outTime = '';
                let duration = '00:00';

                if (att) {
                    status = att.status ? att.status.substring(0, 1).toUpperCase() : 'P';
                    inTime = formatTime(att.login_time);
                    outTime = formatTime(att.logout_time);
                    
                    let seconds = att.worked_seconds || 0;
                    if (att.logout_time === null) {
                        const sessionStartVal = att.current_session_start || att.login_time;
                        seconds += Math.round((new Date() - new Date(sessionStartVal)) / 1000);
                    }
                    duration = formatDuration(seconds);
                }

                worksheet.addRow([
                    formatReportDate(date),
                    status,
                    inTime,
                    outTime,
                    duration
                ]);

                // Styling current data row
                const rowObj = worksheet.getRow(rowIndex);
                rowObj.height = 20;
                rowObj.alignment = { vertical: 'middle', horizontal: 'center' };

                // Left align the Date column
                worksheet.getCell(`A${rowIndex}`).alignment = { vertical: 'middle', horizontal: 'left' };

                // Borders for all cells in the row
                ['A', 'B', 'C', 'D', 'E'].forEach(col => {
                    const cell = worksheet.getCell(`${col}${rowIndex}`);
                    cell.font = { name: 'Arial', size: 10 };
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'D9D9D9' } },
                        left: { style: 'thin', color: { argb: 'D9D9D9' } },
                        bottom: { style: 'thin', color: { argb: 'D9D9D9' } },
                        right: { style: 'thin', color: { argb: 'D9D9D9' } }
                    };
                });

                // Status Column B Specific Coloration
                const statusCell = worksheet.getCell(`B${rowIndex}`);
                if (status === 'P') {
                    statusCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'E2EFDA' } // Light green
                    };
                    statusCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: '375623' } }; // Dark green text
                } else {
                    statusCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FCE4D6' } // Light pink
                    };
                    statusCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'C00000' } }; // Dark red text
                }
            });
        }

        // Set response headers and send Excel file binary
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=attendance_report.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error exporting attendance report:', error.message);
        res.status(500).send('Server Error');
    }
};


// @desc    Export site visits report as Excel (.xlsx)
// @route   GET /api/reports/site-visits
// @access  Protected (Admin / Super Admin)
const exportSiteVisitsReport = async (req, res) => {
    const { projectId, startDate, endDate } = req.query; // Optional filters
    
    try {
        let query = `
            SELECT sv.id, p.name AS project_name, COALESCE(u.name, 'Deleted Employee') AS employee_name,
                   sv.visit_date, sv.visit_time, sv.mom, sv.photo_url
            FROM site_visits sv
            JOIN projects p ON sv.project_id = p.id
            LEFT JOIN users u ON sv.employee_id = u.id
        `;
        const params = [];
        const whereClauses = [];
        if (projectId) {
            params.push(projectId);
            whereClauses.push(`sv.project_id = $${params.length}`);
        }
        if (startDate) {
            params.push(startDate);
            whereClauses.push(`sv.visit_date >= $${params.length}`);
        }
        if (endDate) {
            params.push(endDate);
            whereClauses.push(`sv.visit_date <= $${params.length}`);
        }
        if (whereClauses.length > 0) {
            query += ` WHERE ${whereClauses.join(' AND ')}`;
        }
        query += ` ORDER BY sv.visit_date DESC, sv.visit_time DESC`;

        const result = await pool.query(query, params);

        // Create Excel Workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Site Visits');
        worksheet.views = [{ showGridLines: true }];

        // Set column structures
        worksheet.columns = [
            { header: 'Project Name', key: 'project_name', width: 25 },
            { header: 'Employee Name', key: 'employee_name', width: 22 },
            { header: 'Visit Date', key: 'visit_date', width: 16 },
            { header: 'Visit Time', key: 'visit_time', width: 14 },
            { header: 'Minutes of Meeting (MOM)', key: 'mom', width: 45 },
            { header: 'Images', key: 'images', width: 55 }
        ];

        // Format header row style
        const headerRow = worksheet.getRow(1);
        headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '4A5568' } // Sleek gray theme
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'left' };
        headerRow.height = 28;

        // Iterate through rows and populate
        for (let i = 0; i < result.rows.length; i++) {
            const row = result.rows[i];
            const rowIndex = i + 2; // Row 1 is header

            const visitDateStr = row.visit_date ? new Date(row.visit_date).toISOString().split('T')[0] : '';

            // Add standard textual columns
            worksheet.addRow({
                project_name: row.project_name,
                employee_name: row.employee_name,
                visit_date: visitDateStr,
                visit_time: row.visit_time,
                mom: row.mom,
                images: '' // Placeholder, will embed images on top of this cell
            });

            // Styling row cells
            const excelRow = worksheet.getRow(rowIndex);
            excelRow.height = 95; // High row height to fit the images
            excelRow.alignment = { vertical: 'middle', wrapText: true };

            // Embed photos
            let photos = [];
            if (row.photo_url) {
                try {
                    const parsed = typeof row.photo_url === 'string' ? JSON.parse(row.photo_url) : row.photo_url;
                    if (Array.isArray(parsed)) {
                        photos = parsed;
                    } else if (parsed) {
                        photos = [parsed];
                    }
                } catch (e) {
                    photos = [row.photo_url];
                }
            }

            // Draw images side-by-side inside the cell (Col Index 6 / Column G)
            let imgCount = 0;
            const maxImagesInCell = 4;
            const imgWidth = 80; // pixels
            const imgHeight = 80; // pixels

            for (const filename of photos) {
                if (imgCount >= maxImagesInCell) break;

                let cleanPath = filename;
                if (filename.startsWith('/uploads')) {
                    cleanPath = filename.replace('/uploads', '');
                } else if (filename.startsWith('uploads')) {
                    cleanPath = filename.replace('uploads', '');
                }
                const imagePath = path.join(__dirname, '../uploads', cleanPath);

                if (fs.existsSync(imagePath)) {
                    try {
                        const imageId = workbook.addImage({
                            filename: imagePath,
                            extension: filename.split('.').pop().toLowerCase()
                        });

                        // 1 pixel ≈ 9525 EMUs
                        // 90px spacing per image (80px width + 10px spacing)
                        const emuOffset = imgCount * 90 * 9525;

                        worksheet.addImage(imageId, {
                            tl: { 
                                nativeCol: 5, // Column F
                                nativeColOff: emuOffset,
                                nativeRow: rowIndex - 1, 
                                nativeRowOff: 5 * 9525 // 5px top offset
                            },
                            br: {
                                nativeCol: 5,
                                nativeColOff: emuOffset + imgWidth * 9525,
                                nativeRow: rowIndex - 1,
                                nativeRowOff: (5 + imgHeight) * 9525
                            },
                            editAs: 'twoCell'
                        });
                        imgCount++;
                    } catch (err) {
                        console.error(`Error adding image ${filename} to Excel:`, err.message);
                    }
                }
            }
        }

        // Set response headers and send Excel file binary
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=site_visits_report.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error exporting site visits spreadsheet:', error.message);
        res.status(500).send('Server Error');
    }
};


// @desc    Export employee activity report (last time employee worked on a project) as Excel (.xlsx)
// @route   GET /api/reports/employee-activity
// @access  Protected (Admin / Super Admin)
const exportEmployeeActivityReport = async (req, res) => {
    try {
        const query = `
            SELECT 
                COALESCE(u.name, 'Deleted Employee') AS employee_name,
                p.name AS project_name,
                MAX(tl.start_time) AS last_active_time,
                COALESCE(SUM(
                    CASE 
                        WHEN tl.end_time IS NULL THEN EXTRACT(EPOCH FROM (NOW() - tl.start_time)) / 60
                        ELSE tl.duration_minutes 
                    END
                ), 0) / 60.0 AS total_hours
            FROM time_logs tl
            LEFT JOIN users u ON tl.employee_id = u.id
            JOIN projects p ON tl.project_id = p.id
            GROUP BY u.id, u.name, p.id, p.name
            ORDER BY employee_name ASC, last_active_time DESC
        `;
        const result = await pool.query(query);

        // Create Excel Workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Staff Activity Register');
        worksheet.views = [{ showGridLines: true }];

        // Row 1: Title block
        worksheet.mergeCells('A1:E1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'Staff Project Activity Register';
        titleCell.font = { name: 'Arial', size: 16, bold: true };
        worksheet.getRow(1).height = 35;
        titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

        // Row 2: Generated Subtitle block
        worksheet.mergeCells('A2:E2');
        const subtitleCell = worksheet.getCell('A2');
        const dateStr = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        subtitleCell.value = `Generated on: ${dateStr}`;
        subtitleCell.font = { name: 'Arial', size: 11, italic: true, color: { argb: '595959' } };
        worksheet.getRow(2).height = 20;
        subtitleCell.alignment = { vertical: 'middle', horizontal: 'left' };

        // Row 3: Blank
        worksheet.getRow(3).height = 15;

        // Row 4: Column Headers
        worksheet.getRow(4).values = [
            'Employee Name', 'Project Name', 'Last Worked Date', 'Last Start Time', 'Total Hours Logged'
        ];
        worksheet.getRow(4).height = 28;

        // Column Widths
        worksheet.getColumn(1).width = 22; // Employee Name
        worksheet.getColumn(2).width = 25; // Project Name
        worksheet.getColumn(3).width = 20; // Last Worked Date
        worksheet.getColumn(4).width = 18; // Last Start Time
        worksheet.getColumn(5).width = 22; // Total Hours Logged

        // Format header styling
        ['A4', 'B4', 'C4', 'D4', 'E4'].forEach(cellRef => {
            const cell = worksheet.getCell(cellRef);
            cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '1F4E78' } // Dark steel blue
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin', color: { argb: 'A6A6A6' } },
                left: { style: 'thin', color: { argb: 'A6A6A6' } },
                bottom: { style: 'medium', color: { argb: '1B365D' } },
                right: { style: 'thin', color: { argb: 'A6A6A6' } }
            };
        });

        // Add rows
        result.rows.forEach((row, index) => {
            const rowIndex = index + 5;
            
            const lastActiveDate = row.last_active_time ? formatReportDate(row.last_active_time) : '---';
            const lastActiveTime = row.last_active_time ? formatTime(row.last_active_time) : '---';
            const hoursVal = parseFloat(parseFloat(row.total_hours).toFixed(2));

            worksheet.addRow([
                row.employee_name,
                row.project_name,
                lastActiveDate,
                lastActiveTime,
                hoursVal
            ]);

            const rowObj = worksheet.getRow(rowIndex);
            rowObj.height = 22;
            rowObj.alignment = { vertical: 'middle' };

            // Cell Alignments
            worksheet.getCell(`A${rowIndex}`).alignment = { vertical: 'middle', horizontal: 'left' };
            worksheet.getCell(`B${rowIndex}`).alignment = { vertical: 'middle', horizontal: 'left' };
            worksheet.getCell(`C${rowIndex}`).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell(`D${rowIndex}`).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell(`E${rowIndex}`).alignment = { vertical: 'middle', horizontal: 'right' };

            // Number formatting for Total Hours Logged
            worksheet.getCell(`E${rowIndex}`).numFmt = '#,##0.00';

            // Bold Employee Name
            worksheet.getCell(`A${rowIndex}`).font = { name: 'Arial', size: 10, bold: true };

            // Borders for all cells in the row
            ['A', 'B', 'C', 'D', 'E'].forEach(col => {
                const cell = worksheet.getCell(`${col}${rowIndex}`);
                if (col !== 'A') {
                    cell.font = { name: 'Arial', size: 10 };
                }
                cell.border = {
                    top: { style: 'thin', color: { argb: 'D9D9D9' } },
                    left: { style: 'thin', color: { argb: 'D9D9D9' } },
                    bottom: { style: 'thin', color: { argb: 'D9D9D9' } },
                    right: { style: 'thin', color: { argb: 'D9D9D9' } }
                };
            });
        });

        // Set response headers and send Excel file binary
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=employee_project_activity_report.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error exporting employee activity report:', error.message);
        res.status(500).send('Server Error');
    }
};


module.exports = {
    exportProjectsReport,
    exportEmployeesReport,
    exportAttendanceReport,
    exportSiteVisitsReport,
    exportEmployeeActivityReport
};
