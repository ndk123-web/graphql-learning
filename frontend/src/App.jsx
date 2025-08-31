
import React, { useState } from 'react';
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  gql,
  useQuery,
  useMutation,
  useSubscription,
  createHttpLink,
} from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { split } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';

// HTTP Link for queries and mutations
const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
});

// WebSocket Link for subscriptions
const wsLink = new GraphQLWsLink(
  createClient({
    url: 'ws://localhost:4000/graphql',
  })
);

// Split link to route operations
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

// Apollo Client setup
const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

// GraphQL Queries
const GET_ALL_USERS = gql`
  query GetAllUsers {
    users {
      id
      name
      age
      salary
      department
    }
  }
`;

const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      age
      salary
      department
    }
  }
`;

const GET_USERS_BY_DEPARTMENT = gql`
  query GetUsersByDepartment($department: String!) {
    usersByDepartment(department: $department) {
      id
      name
      age
      salary
      department
    }
  }
`;

// GraphQL Mutations
const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      name
      age
      salary
      department
    }
  }
`;

const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      name
      age
      salary
      department
    }
  }
`;

const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;

// GraphQL Subscriptions
const USER_CREATED_SUBSCRIPTION = gql`
  subscription UserCreated {
    userCreated {
      id
      name
      age
      salary
      department
    }
  }
`;

const USER_UPDATED_SUBSCRIPTION = gql`
  subscription UserUpdated {
    userUpdated {
      id
      name
      age
      salary
      department
    }
  }
`;

const USER_DELETED_SUBSCRIPTION = gql`
  subscription UserDeleted {
    userDeleted
  }
`;

// User Form Component
function UserForm({ user, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(
    user || { name: '', age: '', salary: '', department: '' }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      age: parseInt(formData.age),
      salary: parseFloat(formData.salary),
      department: formData.department,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-100 p-4 rounded mb-4">
      <h3 className="text-lg font-semibold mb-3">
        {user ? 'Update User' : 'Create New User'}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="p-2 border rounded"
          required
        />
        <input
          type="number"
          placeholder="Age"
          value={formData.age}
          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
          className="p-2 border rounded"
          required
        />
        <input
          type="number"
          placeholder="Salary"
          value={formData.salary}
          onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
          className="p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Department"
          value={formData.department}
          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          className="p-2 border rounded"
          required
        />
      </div>
      <div className="mt-4 space-x-2">
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {user ? 'Update' : 'Create'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

// User List Component
function UserList() {
  const [editingUser, setEditingUser] = useState(null);
  const [departmentFilter, setDepartmentFilter] = useState('');

  const { loading, error, data, refetch } = useQuery(GET_ALL_USERS);
  const [createUser] = useMutation(CREATE_USER, {
    refetchQueries: [{ query: GET_ALL_USERS }],
  });
  const [updateUser] = useMutation(UPDATE_USER, {
    refetchQueries: [{ query: GET_ALL_USERS }],
  });
  const [deleteUser] = useMutation(DELETE_USER, {
    refetchQueries: [{ query: GET_ALL_USERS }],
  });

  // Subscriptions
  useSubscription(USER_CREATED_SUBSCRIPTION, {
    onData: ({ data }) => {
      console.log('New user created:', data.data.userCreated);
      refetch();
    },
  });

  useSubscription(USER_UPDATED_SUBSCRIPTION, {
    onData: ({ data }) => {
      console.log('User updated:', data.data.userUpdated);
      refetch();
    },
  });

  useSubscription(USER_DELETED_SUBSCRIPTION, {
    onData: ({ data }) => {
      console.log('User deleted:', data.data.userDeleted);
      refetch();
    },
  });

  const handleCreateUser = async (userData) => {
    try {
      await createUser({ variables: { input: userData } });
      alert('User created successfully!');
    } catch (err) {
      alert('Error creating user: ' + err.message);
    }
  };

  const handleUpdateUser = async (userData) => {
    try {
      await updateUser({
        variables: { id: editingUser.id, input: userData },
      });
      setEditingUser(null);
      alert('User updated successfully!');
    } catch (err) {
      alert('Error updating user: ' + err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser({ variables: { id } });
        alert('User deleted successfully!');
      } catch (err) {
        alert('Error deleting user: ' + err.message);
      }
    }
  };

  if (loading) return <div className="text-center py-4">Loading users...</div>;
  if (error) return <div className="text-red-500 text-center py-4">Error: {error.message}</div>;

  const departments = [...new Set(data.users.map(user => user.department))];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8">GraphQL User Management</h1>

      {/* Create User Form */}
      {!editingUser && (
        <UserForm onSubmit={handleCreateUser} />
      )}

      {/* Edit User Form */}
      {editingUser && (
        <UserForm
          user={editingUser}
          onSubmit={handleUpdateUser}
          onCancel={() => setEditingUser(null)}
        />
      )}

      {/* Department Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Filter by Department:</label>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">All Departments</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Age
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Salary
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.users
              .filter(user => 
                !departmentFilter || user.department === departmentFilter
              )
              .map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.age}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${user.salary.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Live Updates Indicator */}
      <div className="mt-4 text-center text-sm text-gray-600">
        🔄 Real-time updates enabled via GraphQL subscriptions
      </div>
    </div>
  );
}

export default UserList;