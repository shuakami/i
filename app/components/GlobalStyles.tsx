import React from 'react';

const GlobalStyles = () => (
  <style jsx global>{`
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .animate-fadeInUp {
      animation: fadeInUp 0.8s ease-out;
      animation-fill-mode: both;
    }
  `}</style>
);

export default GlobalStyles; 