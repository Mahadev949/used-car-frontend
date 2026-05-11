import http from 'http';

const data = JSON.stringify({
    brand: "Tata",
    model: "Safari",
    year: 2018,
    kms_driven: 120000,
    fuel_type: "Diesel",
    transmission: "MT",
    variant: "4X2 GX DICOR",
    owner_type: "first owner",
    city: "mumbai",
    user_id: 4
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/predict',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (d) => body += d);
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response:', body);
        process.exit(res.statusCode === 200 ? 0 : 1);
    });
});

req.on('error', (e) => {
    console.error('Error:', e);
    process.exit(1);
});

req.write(data);
req.end();
