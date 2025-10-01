import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, CircularProgress } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import CustomerForm from '../components/CustomerForm';
import { getCustomerById, updateCustomer } from '../services/customerService';
import type { UpdateCustomerDto } from '../services/customerService';
import type { Customer } from '../types/customer';

const EditCustomerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getCustomerById(id)
        .then(data => {
          setCustomer(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [id]);

  const handleSubmit = async (data: UpdateCustomerDto) => {
    if (!id) return;
    try {
      await updateCustomer(id, data);
      navigate('/customers');
    } catch (error) {
      console.error('Failed to update customer', error);
      // TODO: Show error message to user
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (!customer) {
    return <Typography>Customer not found.</Typography>;
  }
  
  // Prepare initial data for the form, excluding fields not in the form
  const { id: customerId, createdAt, updatedAt, registeredById, ...initialData } = customer;

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          고객 정보 수정
        </Typography>
        <CustomerForm onSubmit={handleSubmit} initialData={initialData} isEdit />
      </Box>
    </Container>
  );
};

export default EditCustomerPage;
