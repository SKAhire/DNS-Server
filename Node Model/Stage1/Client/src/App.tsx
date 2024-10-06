import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DNSLookup from "./components/Dns-lookup"

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DNSLookup />} />
        {/* Add other routes here if needed */}
      </Routes>
    </Router>
  );
};

export default App;
