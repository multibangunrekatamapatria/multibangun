
import { User } from '../types';

const USERS_KEY = 'mrp_portal_users';

const DEFAULT_USERS: User[] = [
  {
    id: '1',
    username: 'admin',
    password: '12345',
    role: 'admin',
    fullName: 'Main Administrator',
    department: 'Management'
  },
  {
    id: '2',
    username: 'rifa',
    password: '12345',
    role: 'user',
    fullName: 'Rifa',
    department: 'Secretary'
  },
  {
    id: '3',
    username: 'sandra',
    password: '240298',
    role: 'user',
    fullName: 'Sandra',
    department: 'Purchasing'
  }
];

export const getUsers = (): User[] => {
  const data = localStorage.getItem(USERS_KEY);
  if (!data) {
    localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
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
