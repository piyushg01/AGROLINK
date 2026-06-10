import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Leaf, User, Mail, Lock, Phone, MapPin, ShieldAlert, Award } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState('farmer');
  const [coords, setCoords] = useState([73.8567, 18.5204]); // Default to Pune [lng, lat]
  const [geoStatus, setGeoStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Automatically request coordinates when page loads
  useEffect(() => {
    if (navigator.geolocation) {
      setGeoStatus('Locating...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          setCoords([longitude, latitude]);
          setGeoStatus('Location captured!');
        },
        (err) => {
          console.warn('Geolocation capture failed, using default coordinate values:', err.message);
          setGeoStatus('Failed to capture. Using default coordinates.');
        }
      );
    } else {
      setGeoStatus('Geolocation not supported by browser.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const userData = {
      name,
      email,
      password,
      role,
      phone,
      address,
      coordinates: coords
    };

    const res = await register(userData);
    setLoading(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.message || t('authError'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12">
      <div className="glass-panel w-full max-w-lg p-8 relative overflow-hidden">
        {/* Glow orb */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-emerald-500/20 p-2.5 rounded-2xl mb-2 border border-emerald-500/30">
            <Leaf className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">{t('appName')}</h1>
        </div>

        <h2 className="text-xl font-bold text-center text-slate-200 mb-6">{t('authRegister')}</h2>

        {error && (
          <div className="bg-red-500/15 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg mb-6 flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role selection cards */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-300">{t('authRole')}</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'farmer', label: 'Farmer' },
                { id: 'dealer', label: 'Dealer' },
                { id: 'shopkeeper', label: 'Shopkeeper' }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRole(item.id)}
                  className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    role === item.id
                      ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/10'
                      : 'bg-emerald-950/20 border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-300">{t('authName')}</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ram Prasad"
                  className="glass-input w-full pl-9 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-300">{t('authEmail')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ram@gmail.com"
                  className="glass-input w-full pl-9 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-300">{t('authPassword')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="glass-input w-full pl-9 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-300">{t('authPhone')}</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="glass-input w-full pl-9 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-300">{t('authAddress')}</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Kolhapur Highway, Maharashtra"
                className="glass-input w-full pl-9 py-2 text-sm"
              />
            </div>
          </div>

          {/* Geolocation visual badge */}
          <div className="flex items-center gap-2.5 bg-emerald-950/25 border border-emerald-900/40 p-2.5 rounded-lg text-xs">
            <Award className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div className="flex-1 flex justify-between items-center text-slate-300">
              <span>Smart GPS Mapping:</span>
              <span className={`font-semibold ${geoStatus.includes('captured') ? 'text-emerald-400' : 'text-amber-400'}`}>
                {geoStatus}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2 flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            {loading ? 'Registering account...' : t('authRegister')}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-5">
          {t('authHaveAccount')}{' '}
          <Link to="/login" className="text-emerald-400 hover:underline font-semibold">
            {t('authLogin')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
