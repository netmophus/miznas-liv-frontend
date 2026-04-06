import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import './PageLayout.css';

const PageLayout = ({ children, showNavbar = true, showFooter = true }) => {
  return (
    <div className="page-layout">
      {showNavbar && <Navbar />}
      <main className="page-content">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

export default PageLayout;

