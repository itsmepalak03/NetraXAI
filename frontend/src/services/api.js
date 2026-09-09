import axios from 'axios'

const api = axios.create({ baseURL: '' })

export const Patients = {
  create: (data) => api.post('/api/patients', data).then(r => r.data),
  list: () => api.get('/api/patients').then(r => r.data),
  get: (id) => api.get(`/api/patients/${id}`).then(r => r.data),
}

export const Screenings = {
  create: (patientId) => api.post('/api/screenings', { patient_id: patientId }).then(r => r.data),
  list: () => api.get('/api/screenings').then(r => r.data),
  get: (id) => api.get(`/api/screenings/${id}`).then(r => r.data),
  upload: (id, file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/api/screenings/${id}/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },
  quality: (id) => api.get(`/api/screenings/${id}/quality`).then(r => r.data),
  analyze: (id) => api.post(`/api/screenings/${id}/analyze`).then(r => r.data),
  lesions: (id) => api.get(`/api/screenings/${id}/lesions`).then(r => r.data),
  explainability: (id) => api.get(`/api/screenings/${id}/explainability`).then(r => r.data),
  review: (id, data) => api.post(`/api/screenings/${id}/review`, data).then(r => r.data),
  reportUrl: (id) => `/api/screenings/${id}/report`,
}

export const Analytics = {
  get: () => api.get('/api/analytics').then(r => r.data),
}

export const Simulation = {
  run: (data) => api.post('/api/simulation', data).then(r => r.data),
}

export default api
