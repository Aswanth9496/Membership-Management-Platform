import React from 'react';

export const UserLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <header>User Header</header>
      <main>{children}</main>
    </div>
  );
};
