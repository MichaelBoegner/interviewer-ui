import React, { useEffect, useState } from 'react';

function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/user/dashboard', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch dashboard data');
        return res.json();
      })
      .then((data) => setUserData(data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div>Error: {error}</div>;
  if (!userData) return <div>Loading...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="mb-4">
        <p><strong>Email:</strong> {userData.email}</p>
        <p><strong>Plan:</strong> {userData.subscription}</p>
        <p><strong>Credits:</strong> {userData.credits}</p>
      </div>
      <h2 className="text-xl font-semibold mb-2">Past Interviews</h2>
      {userData.interviews.length === 0 ? (
        <p>No past interviews yet.</p>
      ) : (
        <ul className="list-disc pl-5">
          {userData.interviews.map((iv) => (
            <li key={iv.id}>
              {iv.created_at} — {iv.score}%
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Dashboard;
