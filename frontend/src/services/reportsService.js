import axios from 'axios';

export async function getReports() {
    const res = await axios.get('http://localhost:3001/reports');
    return res.data;
}

export async function getReportsByUserId(userId) {
    const res = await axios.get(`http://localhost:3001/reports/${userId}`);
    return res.data;
}

export async function getReportById(reportId) {
    const res = await axios.get(
        `http://localhost:3001/reports/detail/${reportId}`
    );

    return res.data;
}