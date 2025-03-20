import { useContext } from 'react';
import UserContext, { UserContextState } from '../contexts/UserContext';

export const useUser = (): UserContextState => useContext(UserContext); 