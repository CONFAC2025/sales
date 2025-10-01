import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  GridLegacy as Grid,
  DialogActions,
  Button,
  Chip,
} from '@mui/material';
import { getCustomersByRegistrant } from '../services/adminService';
import type { CustomerDetailsResponse } from '../services/adminService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CustomerDetailsModalProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
}

const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({ open, onClose, userId }) => {
  const [data, setData] = useState<CustomerDetailsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && userId) {
      setLoading(true);
      getCustomersByRegistrant(userId)
        .then(response => setData(response))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open, userId]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>고객 상세 정보</DialogTitle>
      <DialogContent>
        {loading && <Typography>Loading...</Typography>}
        {data && (
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid xs={12} md={6}>
              <Typography variant="h6" gutterBottom>상태별 통계</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.stats.byStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Grid>
            <Grid xs={12} md={6}>
              <Typography variant="h6" gutterBottom>유입 경로별 통계</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.stats.bySource}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="source" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Grid>
            <Grid xs={12}>
              <Typography variant="h6" gutterBottom>고객 목록</Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>이름</TableCell>
                      <TableCell>연락처</TableCell>
                      <TableCell>상태</TableCell>
                      <TableCell>등록일</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.customers.map((customer: any) => (
                      <TableRow key={customer.id}>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell>{customer.phone}</TableCell>
                        <TableCell><Chip label={customer.status} size="small" /></TableCell>
                        <TableCell>{new Date(customer.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerDetailsModal;
