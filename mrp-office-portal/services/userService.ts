
import { User } from '../types';

const USERS_KEY = 'mrp_portal_users';

const DEFAULT_ADMIN: User = {
  id: '1',
  username: 'admin',
  password: 'admin123',
  role: 'admin',
  fullName: 'Main Administrator',
  department: 'Management'
};

export const getUsers = (): User[] => {
  const data = localStorage.getItem(USERS_KEY);
  if (!data) {
    localStorage.setItem(USERS_KEY, JSON.stringify([DEFAULT_ADMIN]));
    return [DEFAULT_ADMIN];
  }
  return JSON.parse(data);
};

export const saveUser = (userData: Partial<User>): User => {
  const users = getUsers();
  const newUser: User = {
    id: crypto.randomUUID(),
    username: userData.username || '',
    password: userData.password || 'password123',
    role: userData.role || 'user',
    fullName: userData.fullName || '',
    department: userData.department || 'General',
  };
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]));
  return newUser;
};

export const deleteUser = (id: string) => {
  const users = getUsers().filter(u => u.id !== id && u.username !== 'admin');
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};
