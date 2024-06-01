import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3001'
});

export const createUser = (user) => api.post('/users', user);
export const getUsers = () => api.get('/users');
export const updateUser = (id, user) => api.put(`/users/${id}`, user);
