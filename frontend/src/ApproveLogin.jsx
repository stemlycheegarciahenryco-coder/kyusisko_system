import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import api from './api';

export default function ApproveLogin() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [result, setResult] = useState(null);

  const respond = async (decision) => {
    try {
      const res = await api.post('/auth/respond-login-approval', { token, decision });
      setResult(res.data.message);
    } catch (err) {
      setResult(err.response?.data?.error || "Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-sm">
        {result ? (
          <p className="font-bold">{result}</p>
        ) : (
          <>
            <h2 className="font-black text-xl mb-4">Was this you?</h2>
            <button onClick={() => respond('approved')} className="bg-[#093fb4] text-white px-6 py-3 rounded-xl mr-3">Yes, approve</button>
            <button onClick={() => respond('denied')} className="bg-red-500 text-white px-6 py-3 rounded-xl">Not me, deny</button>
          </>
        )}
      </div>
    </div>
  );
}