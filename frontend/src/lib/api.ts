import axios from 'axios';
import { getMockResponse } from './mockData';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const tenantId = localStorage.getItem('tenantId') || 'main';
  config.headers['X-Tenant-ID'] = tenantId;

  // Intercept requests in Demo Mode with rich realistic mock data
  const isDemo = localStorage.getItem('demoMode') === 'true';
  if (isDemo) {
    const method = (config.method || 'get').toLowerCase();
    const url = config.url || '';

    if (method === 'get') {
      const mockResult = getMockResponse(url);
      if (mockResult !== null) {
        config.adapter = async (cfg) => ({
          data: mockResult,
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
          config: cfg,
          request: {},
        });
      }
    } else {
      // POST, PUT, PATCH, DELETE in demo mode: simulate success
      let parsedBody: any = {};
      try {
        parsedBody = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
      } catch {
        parsedBody = config.data || {};
      }

      // Special handling for AI Copilot chat
      if (url.includes('/ai/copilot') || url.includes('/copilot')) {
        const userPrompt = (parsedBody?.message || '').toLowerCase();
        let aiReply = "Based on current operations, your revenue this month is ₹12.41 Lakhs across confirmed delivery challans. You have 2 overdue follow-ups (notably Vikram Steel Works and Priya Fashions) and 4 low-stock items that require attention.";
        if (userPrompt.includes('customer') || userPrompt.includes('client')) {
          aiReply = "You have 12 active customer accounts. Top customer by revenue is Deepak Pharmaceuticals (₹41.2L lifetime revenue), followed by Vikram Steel Works (₹32.1L). Priya Fashions has an overdue payment follow-up.";
        } else if (userPrompt.includes('stock') || userPrompt.includes('inventory') || userPrompt.includes('low')) {
          aiReply = "Aluminium Sheet 3mm is currently OUT OF STOCK (0 units vs min 20). Copper Wire 2.5mm and Shrink Wrap Rolls are running critically low. A purchase requisition is strongly advised.";
        } else if (userPrompt.includes('revenue') || userPrompt.includes('sales') || userPrompt.includes('tax') || userPrompt.includes('gst')) {
          aiReply = "Total GST collected this period is ₹1.86L (CGST: ₹93k, SGST: ₹93k). 30-day confirmed revenue stands at ₹12.41L with an average order value of ₹1.55L.";
        }

        config.adapter = async (cfg) => ({
          data: { success: true, data: { response: aiReply, answer: aiReply } },
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
          config: cfg,
          request: {},
        });
      } else {
        config.adapter = async (cfg) => ({
          data: {
            success: true,
            data: {
              ...parsedBody,
              id: parsedBody?.id || `demo-${Date.now().toString(36)}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            message: 'Saved successfully (Demo Mode)',
          },
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
          config: cfg,
          request: {},
        });
      }
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // In demo mode, don't redirect to login — the user is using a fake token
      const isDemoMode = localStorage.getItem('demoMode') === 'true';
      if (!isDemoMode) {
        localStorage.removeItem('token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
