import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, MenuItem, Select, FormControl, InputLabel, GridLegacy as Grid } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { CreateUserPayload } from '../types/admin';
import type { Department, Team } from '../services/organizationService';
import { getDepartments, getTeams } from '../services/organizationService';
import { UserType } from '@prisma/client';
import toast from 'react-hot-toast';

interface UserFormProps {
  onSubmit: (data: CreateUserPayload) => void;
  onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<CreateUserPayload>({
    userId: '',
    name: '',
    phone: '',
    password: '',
    userType: UserType.SALES_STAFF,
    departmentId: '',
    teamId: '',
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    const fetchOrgData = async () => {
      try {
        const [depts, tms] = await Promise.all([getDepartments(), getTeams()]);
        setDepartments(depts);
        setTeams(tms);
      } catch (error) {
        console.error("Failed to fetch organization data for form", error);
      }
    };
    fetchOrgData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: CreateUserPayload) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent<any>) => {
    const { name, value } = e.target;
    if (name === 'departmentId') {
      setFormData((prev: CreateUserPayload) => ({ ...prev, departmentId: value, teamId: '' }));
    } else {
      setFormData((prev: CreateUserPayload) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId || !formData.name || !formData.phone) {
      toast.error('ID, 이름, 연락처는 필수 항목입니다.');
      return;
    }
    const dataToSubmit = {
      ...formData,
      departmentId: formData.departmentId || undefined,
      teamId: formData.teamId || undefined,
    };
    onSubmit(dataToSubmit);
  };

  const filteredTeams = teams.filter(team => team.departmentId === formData.departmentId);

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField margin="dense" required fullWidth name="userId" label="사용자 ID" value={formData.userId} onChange={handleChange} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField margin="dense" required fullWidth name="name" label="이름" value={formData.name} onChange={handleChange} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField margin="dense" required fullWidth name="phone" label="연락처" value={formData.phone} onChange={handleChange} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField margin="dense" fullWidth name="password" label="비밀번호 (미입력 시 1234)" type="password" value={formData.password} onChange={handleChange} />
        </Grid>
        <Grid item xs={12}>
          <FormControl fullWidth margin="dense">
            <InputLabel>사용자 유형</InputLabel>
            <Select name="userType" value={formData.userType} label="사용자 유형" onChange={handleSelectChange}>
              {Object.values(UserType).map(type => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth margin="dense">
            <InputLabel>부서(본부)</InputLabel>
            <Select name="departmentId" value={formData.departmentId} label="부서(본부)" onChange={handleSelectChange}>
              <MenuItem value=""><em>없음</em></MenuItem>
              {departments.map(dept => <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth margin="dense" disabled={!formData.departmentId}>
            <InputLabel>팀</InputLabel>
            <Select name="teamId" value={formData.teamId} label="팀" onChange={handleSelectChange}>
              <MenuItem value=""><em>없음</em></MenuItem>
              {filteredTeams.map(team => <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button onClick={onCancel} sx={{ mr: 1 }}>취소</Button>
        <Button type="submit" variant="contained">등록</Button>
      </Box>
    </Box>
  );
};

export default UserForm;