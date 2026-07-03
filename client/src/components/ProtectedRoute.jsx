import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, roleRequired }) => {
    const token = localStorage.getItem('adminToken');
    const role = localStorage.getItem('adminRole');

    if (!token) {
        return <Navigate to="/admin/login" replace />;
    }

    if (roleRequired && role !== roleRequired) {
        return <Navigate to="/admin" replace />;
    }

    return children;
};

export default ProtectedRoute;
