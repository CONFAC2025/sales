import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CustomerForm from '../components/CustomerForm';
import { createCustomer } from '../services/customerService';
import type { CreateCustomerDto } from '../services/customerService';

import toast from 'react-hot-toast';

const CreateCustomerPage: React.FC = () => {
  const navigate = useNavigate();

  const handleCreateCustomer = async (data: CreateCustomerDto) => {
    try {
      await createCustomer(data);
      toast.success('신규 고객이 등록되었습니다.');
      navigate('/customers');
    } catch (error: any) {
      console.error('Failed to create customer', error);
      toast.error(`고객 등록 실패: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleSubmit = (data: CreateCustomerDto | Partial<CreateCustomerDto>) => {
    // The form is for creation, so we assert that the data is a full CreateCustomerDto.
    handleCreateCustomer(data as CreateCustomerDto);
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          신규 고객 등록
        </Typography>
        <CustomerForm onSubmit={handleSubmit} />
      </Box>
    </Container>
  );
};

export default CreateCustomerPage;
