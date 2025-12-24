const hostedApiUrl = 'https://leadflow-ai-backend-1e2b.onrender.com/api';
const localApiUrl = 'http://localhost:3000/api';
const API_URL = window.LEADFLOW_API_URL
    || (window.location.hostname === 'localhost' ? localApiUrl : hostedApiUrl);
