import { useState } from 'react';
import API from '../api';

export default function Register({ onSwitchToLogin }) {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            await API.post('accounts/register/', formData);
            setSuccess('Бүртгэл амжилттай боллоо! Нэвтрэх хэсэг рүү шилжиж байна...');
            setTimeout(() => {
                onSwitchToLogin();
            }, 1500);
        } catch (err) {
            setError('Бүртгүүлэхэд алдаа гарлаа. Хэрэглэгчийн нэр аль хэдийн бүртгэгдсэн байж магадгүй.');
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-slate-100 px-4">
            <form onSubmit={handleRegister} className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-slate-800">Бүртгүүлэх</h2>
                
                {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
                {success && <p className="text-green-500 text-sm mb-4 text-center">{success}</p>}
                
                <div className="mb-4">
                    <label className="block text-slate-700 text-sm font-bold mb-2">Хэрэглэгчийн нэр</label>
                    <input 
                        type="text" 
                        name="username"
                        value={formData.username} 
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-slate-700 text-sm font-bold mb-2">Имэйл хаяг</label>
                    <input 
                        type="email" 
                        name="email"
                        value={formData.email} 
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-slate-700 text-sm font-bold mb-2">Нууц үг</label>
                    <input 
                        type="password" 
                        name="password"
                        value={formData.password} 
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                    />
                </div>

                <button 
                    type="submit" 
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition duration-200"
                >
                    Бүртгүүлэх
                </button>

                <div className="text-center mt-4">
                    <button 
                        type="button" 
                        onClick={onSwitchToLogin}
                        className="text-sm text-indigo-600 hover:underline font-medium"
                    >
                        Аль хэдийн бүртгэлтэй юу? Нэвтрэх
                    </button>
                </div>
            </form>
        </div>
    );
}