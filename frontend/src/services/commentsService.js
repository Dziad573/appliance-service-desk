import axios from 'axios';

const API_URL = 'http://localhost:3001';

export async function getComments(reportId) {
    const res = await axios.get(`${API_URL}/reports/${reportId}/comments`);
    return res.data;
}

export async function addComment(reportId, { user_id, content, parent_comment_id = null }) {
    const res = await axios.post(`${API_URL}/reports/${reportId}/comments`, {
        user_id,
        content,
        parent_comment_id
    });
    return res.data;
}
