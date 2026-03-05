import React, { createContext, useContext } from 'react';

const NotificationContext = createContext({});
export const NotificationProvider = ({ children }: { children: React.ReactNode }) => <NotificationContext.Provider value={{}}>{children}</NotificationContext.Provider>;
export const useNotification = () => useContext(NotificationContext);
