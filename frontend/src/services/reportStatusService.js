import axios from 'axios';
const API = 'http://localhost:3001';
export async function updateReportStatus(reportId, status, changedBy) {
    const res = await axios.patch(`${API}/reports/${reportId}/status`, { status, changed_by: changedBy });
    return res.data;
}
export async function pauseReport(reportId, reason, note, changedBy) {
    const res = await axios.post(`${API}/reports/${reportId}/pause`, { reason, note, changed_by: changedBy });
    return res.data;
}
export async function resumeReport(reportId, changedBy) {
    const res = await axios.post(`${API}/reports/${reportId}/resume`, { changed_by: changedBy });
    return res.data;
}
export async function getReportStatusHistory(reportId) {
    const res = await axios.get(`${API}/reports/${reportId}/status-history`);
    return res.data;
}
