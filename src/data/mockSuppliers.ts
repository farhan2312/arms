// mockSuppliers — 5 agri-input suppliers for procurement POs

export interface Supplier {
  id: string;
  name: string;
  gstin: string;
  contact: string;       // primary contact name
  phone: string;
  email: string;
  address: string;
}

export const mockSuppliers: Supplier[] = [
  {
    id: 'sup-001',
    name: 'AgriChem Distributors Pvt Ltd',
    gstin: '27AACCA1234F1Z5',
    contact: 'Rajesh Kulkarni',
    phone: '+91 98220 11223',
    email: 'orders@agrichem.in',
    address: 'Plot 14, MIDC Industrial Area, Akola, Maharashtra — 444004',
  },
  {
    id: 'sup-002',
    name: 'Syngenta India Limited',
    gstin: '27AADCS4567G1ZA',
    contact: 'Priya Sharma',
    phone: '+91 99212 44556',
    email: 'trade.india@syngenta.com',
    address: 'Office 5B, Mithona Towers, Pune, Maharashtra — 411001',
  },
  {
    id: 'sup-003',
    name: 'Bayer CropScience Ltd',
    gstin: '27AAACB2345H1Z1',
    contact: 'Vikram Nair',
    phone: '+91 98450 77889',
    email: 'agribusiness@bayer.com',
    address: 'Bayer House, Central Avenue, Nagpur, Maharashtra — 440010',
  },
  {
    id: 'sup-004',
    name: 'UPL Limited — Crop Protection',
    gstin: '27AAACU9876J1ZQ',
    contact: 'Sunita Desai',
    phone: '+91 98330 55667',
    email: 'procurement@upl-ltd.com',
    address: '3-11 G.I.D.C., Vapi, Gujarat — 396195',
  },
  {
    id: 'sup-005',
    name: 'PI Industries Ltd',
    gstin: '08AAACP1234K1ZD',
    contact: 'Anil Mehta',
    phone: '+91 98765 22334',
    email: 'supply@piindustries.com',
    address: 'PI House, Phase-III, Industrial Area, Udaipur, Rajasthan — 313003',
  },
];

export const supplierById = new Map(mockSuppliers.map(s => [s.id, s]));
