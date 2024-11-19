import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DataTable } from './DataTable';
import { UserForm } from './UserForm';
import { Toast } from './Toast';
import { userService } from '../services/userService';

export const UserManagement = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: userService.getUsers
  });

  const createMutation = useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      Toast.success('User created successfully');
      refetch();
      setIsFormOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: userService.updateUser,
    onSuccess: () => {
      Toast.success('User updated successfully');
      refetch();
      setIsFormOpen(false);
    }
  });

  const columns = [
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'role', headerName: 'Role', width: 120 },
    { field: 'status', headerName: 'Status', width: 120 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(params.row)}
            className="p-2 bg-blue-500 text-white rounded"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(params.row.id)}
            className="p-2 bg-red-500 text-white rounded"
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  const handleSubmit = async (data) => {
    if (selectedUser) {
      updateMutation.mutate({ id: selectedUser.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button
          onClick={() => {
            setSelectedUser(null);
            setIsFormOpen(true);
          }}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Add User
        </button>
      </div>

      <DataTable
        rows={users || []}
        columns={columns}
        loading={isLoading}
        pageSize={10}
      />

      {isFormOpen && (
        <UserForm
          initialData={selectedUser}
          onSubmit={handleSubmit}
          onClose={() => setIsFormOpen(false)}
          isLoading={createMutation.isLoading || updateMutation.isLoading}
        />
      )}
    </div>
  );
};