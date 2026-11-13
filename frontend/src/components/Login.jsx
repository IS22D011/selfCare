import { useState } from 'react';
import API from '../api';

export default function Login({ onLoginSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await API.post('token/', { username, password });
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            onLoginSuccess();
        } catch (err) {
            setError('Нэвтрэх нэр эсвэл нууц үг буруу байна.');
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-slate-100">
            <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-md w-96">
                <h2 className="text-2xl font-bold mb-6 text-center text-slate-800">Жин Хасах Апп</h2>
                {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
                
                <div className="mb-4">
                    <label className="block text-slate-700 text-sm font-bold mb-2">Хэрэглэгчийн нэр</label>
                    <input 
                        type="text" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-slate-700 text-sm font-bold mb-2">Нууц үг</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                    />
                </div>

                <button 
                    type="submit" 
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition duration-200"
                >
                    Нэвтрэх
                </button>
            </form>
        </div>
    );
}