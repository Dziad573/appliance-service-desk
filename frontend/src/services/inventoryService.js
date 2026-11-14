import axios from 'axios';
const API = 'http://localhost:3001/inventory';
export const getBrands = async () => (await axios.get(`${API}/brands`)).data;
export const createBrand = async (data) => (await axios.post(`${API}/brands`, data)).data;
export const getItems = async (activeOnly = false) => (await axios.get(`${API}/items`, { params: { activeOnly } })).data;
export const createItem = async (data) => (await axios.post(`${API}/items`, data)).data;
export const setItemActive = async (id, is_active) => (await axios.patch(`${API}/items/${id}`, { is_active })).data;
export const getWarehouses = async () => (await axios.get(`${API}/warehouses`)).data;
export const createWarehouse = async (data) => (await axios.post(`${API}/warehouses`, data)).data;
export const getResources = async () => (await axios.get(`${API}/resources`)).data;
export const receiveStock = async (data) => (await axios.post(`${API}/receipts`, data)).data;
export const deleteBrand = async (id) => (await axios.delete(`${API}/brands/${id}`)).data;
export const getReportParts = async (reportId) => (await axios.get(`http://localhost:3001/reports/${reportId}/parts`)).data;
export const issueReportPart = async (reportId, data) => (await axios.post(`http://localhost:3001/reports/${reportId}/parts`, data)).data;
export const returnReportPart = async (reportId, partId, returned_by) => (await axios.delete(`http://localhost:3001/reports/${reportId}/parts/${partId}`, { data: { returned_by } })).data;

export const updateItem = async (id, data) => (await axios.patch(`${API}/items/${id}`, data)).data;
export const transactStock = async (data) => (await axios.post(`${API}/stock-transactions`, data)).data;

export const getStockDocuments = async (direction) => (await axios.get(`${API}/documents`, { params: { direction } })).data;
export const createStockDocument = async (data) => (await axios.post(`${API}/documents`, data)).data;
