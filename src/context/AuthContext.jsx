import axios from 'axios';

// When deployed on Railway/Netlify, set REACT_APP_API_URL to your backend URL
// Locally it uses localhost:5000
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const API = axios.create({ baseURL: BASE_URL });
