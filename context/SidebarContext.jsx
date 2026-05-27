import React, { createContext, useContext } from 'react';

const SidebarContext = createContext({
  openSidebar: () => {},
});

export function SidebarProvider({ value, children }) {
  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  return useContext(SidebarContext);
}
