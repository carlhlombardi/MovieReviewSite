// src/app/components/DataDisplay.js
"use client"; // Ensure this is at the top

import { useEffect, useState } from 'react';

const DataDisplay = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/data`);
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>Data from Database</h1>
      <ul>
        {data.map(item => (
          <li key={item.row_id}>{item.Film} - {item.Year}</li>  // Key prop added here
        ))}
      </ul>
    </div>
  );
};

export default DataDisplay;
