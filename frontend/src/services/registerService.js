import axios from 'axios';

export async function register(login, password) {
    const res = await axios.post('http://localhost:3001/register', {
        login,
        password,
        role: 'user' 
    });
    return res.data;
}