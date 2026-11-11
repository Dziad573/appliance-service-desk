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

export async function createReport(reportData) {
    const res = await axios.post('http://localhost:3001/reports', reportData);
    return res.data;
}
export async function updateServiceNote(reportId, field, value, userId) {
    const res = await axios.patch(`http://localhost:3001/reports/${reportId}/service-notes`, {
        field, value, user_id: userId
    });
    return res.data;
}

export async function saveQualityResult(reportId, data) {
    const res = await axios.post(`http://localhost:3001/reports/${reportId}/quality-result`, data);
    return res.data;
}
