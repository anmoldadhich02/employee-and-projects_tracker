const http = require('http');

const PORT = 5001;

const request = (method, path, body = null, token = null) => {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : '';
        const options = {
            hostname: 'localhost',
            port: PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
        if (body) {
            options.headers['Content-Length'] = Buffer.byteLength(payload);
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = data ? JSON.parse(data) : {};
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: data });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (body) {
            req.write(payload);
        }
        req.end();
    });
};

const runTest = async () => {
    try {
        console.log('Logging in as Admin...');
        const adminLogin = await request('POST', '/api/users/login', {
            email: 'admin@archfirm.com',
            password: 'admin123'
        });
        if (adminLogin.status !== 200) {
            throw new Error(`Admin login failed: ${JSON.stringify(adminLogin.data)}`);
        }
        const adminToken = adminLogin.data.token;
        console.log('✔ Admin logged in.');

        console.log('Creating a test employee...');
        const email = `test_emp_dashboard_${Date.now()}@example.com`;
        const createEmp = await request('POST', '/api/users', {
            name: 'Overview Test Employee',
            email: email,
            phone_number: '1234567890',
            designation: 'Architectural Staff',
            password: 'password123',
            role: 'Employee'
        }, adminToken);
        if (createEmp.status !== 201) {
            throw new Error(`Failed to create employee: ${JSON.stringify(createEmp.data)}`);
        }
        console.log(`✔ Created employee: ${email}`);

        console.log('Logging in as the new test employee...');
        const loginRes = await request('POST', '/api/users/login', {
            email: email,
            password: 'password123'
        });

        if (loginRes.status !== 200) {
            throw new Error(`Employee login failed: ${JSON.stringify(loginRes.data)}`);
        }
        const token = loginRes.data.token;
        console.log('✔ Employee logged in.');

        console.log('Fetching dashboard stats as employee...');
        const dashboardRes = await request('GET', '/api/users/dashboard', null, token);
        
        console.log(`Status returned: ${dashboardRes.status}`);
        if (dashboardRes.status === 200) {
            console.log('✔ SUCCESS! Employee successfully retrieved dashboard stats.');
            console.log('Keys in response:', Object.keys(dashboardRes.data));
            console.log('Stats:', dashboardRes.data.stats);
        } else {
            console.log('❌ FAILED! Employee got status:', dashboardRes.status, dashboardRes.data);
            process.exitCode = 1;
        }
    } catch (e) {
        console.error('❌ Test execution failed:', e.message);
        process.exitCode = 1;
    }
};

runTest();
