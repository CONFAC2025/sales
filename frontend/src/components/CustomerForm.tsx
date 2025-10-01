import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { CreateCustomerDto, UpdateCustomerDto } from '../services/customerService';

interface CustomerFormProps {
  initialData?: CreateCustomerDto | UpdateCustomerDto;
  onSubmit: (data: CreateCustomerDto | UpdateCustomerDto) => void;
  isEdit?: boolean;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ initialData, onSubmit, isEdit = false }) => {
  const [formData, setFormData] = useState<CreateCustomerDto | UpdateCustomerDto>({
    name: '',
    phone: '',
    status: 'REGISTERED',
    notes: '',
    interestedProperty: '',
    potential: 'MEDIUM',
    source: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name as string]: value }));
  };
  
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name as string]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <TextField margin="normal" required fullWidth name="name" label="이름" value={formData.name} onChange={handleChange} />
      <TextField margin="normal" required fullWidth name="phone" label="연락처" value={formData.phone} onChange={handleChange} />
      <TextField margin="normal" fullWidth name="interestedProperty" label="관심 물건" value={formData.interestedProperty || ''} onChange={handleChange} />
      <TextField margin="normal" fullWidth name="source" label="유입 경로" value={formData.source || ''} onChange={handleChange} />
      
      <FormControl fullWidth margin="normal">
        <InputLabel>성향 (가능성)</InputLabel>
        <Select name="potential" value={formData.potential || 'MEDIUM'} label="성향 (가능성)" onChange={handleSelectChange}>
          <MenuItem value="HIGH">상</MenuItem>
          <MenuItem value="MEDIUM">중</MenuItem>
          <MenuItem value="LOW">하</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth margin="normal">
        <InputLabel>상태</InputLabel>
        <Select name="status" value={formData.status} label="상태" onChange={handleSelectChange}>
          <MenuItem value="REGISTERED">등록</MenuItem>
          <MenuItem value="VISITED">방문</MenuItem>
          <MenuItem value="CONSULTED">상담</MenuItem>
          <MenuItem value="CONTRACTED">계약</MenuItem>
          <MenuItem value="CANCELLED">취소</MenuItem>
        </Select>
      </FormControl>

      <TextField margin="normal" fullWidth name="notes" label="메모" multiline rows={4} value={formData.notes || ''} onChange={handleChange} />
      
      <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
        {isEdit ? '고객 정보 수정' : '신규 고객 등록'}
      </Button>
    </Box>
  );
};

export default CustomerForm;
