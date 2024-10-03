import React, { useState } from 'react';

const DNSLookup: React.FC = () => {
  const [domain, setDomain] = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch(`http://localhost:5000/dns-lookup?domain=${domain}`);
    const data = await response.json();
    alert(`Message: ${data.message}, Domain: ${data.domain}`);
  };
  return (
    <div className='h-screen flex justify-center items-center'>
    <form onSubmit={handleSubmit}>
      <div className="flex items-center justify-center flex-col gap-2">
      <input
        type="text"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        placeholder="Enter domain (e.g., google.com)"
        className='px-4 py-2 border border-purple-400 w-[400px] text-center'
      />
      <button type="submit" className='bg-purple-400 hover:bg-purple-700 px-6 py-2 rounded-2xl text-white font-bold'>Lookup</button>
      </div>
    </form>
    </div>
  );
};

export default DNSLookup;
