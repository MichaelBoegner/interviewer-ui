import React, { useEffect, useState } from 'react';

function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/user/dashboard`, {
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
    <div className="p-6 max-w-3xl mx-auto text-green-400 bg-black min-h-screen">
      <h1 className="text-2xl font-bold mb-4 border-b border-green-500 pb-2">DASHBOARD</h1>

      <div className="mb-6">
        <p><strong>Email:</strong> {userData.email}</p>
        <p><strong>Plan:</strong> {userData.plan || "Free"}</p>
        <p><strong>Individual Credits:</strong> {userData.individaul_credits}</p>
        <p><strong>Subscription Credits:</strong> {userData.subscription_credits}</p>
        <p><strong>Total Credits:</strong> {userData.individaul_credits + userData.subscription_credits}</p>
      </div>

      <h2 className="text-xl font-semibold mb-2">Past Interviews</h2>
      {!userData.past_interviews || userData.past_interviews.length === 0 ? (
        <p>No past interviews yet.</p>
      ) : (
        <ul className="list-disc pl-5">
          {userData.past_interviews.map((iv) => (
            <li key={iv.id}>
              {new Date(iv.started_at).toLocaleString()} — {iv.score ?? "N/A"}%
              <br />
              <span className="text-sm text-green-300">{iv.feedback}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Dashboard;
