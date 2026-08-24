'use client';

import { useState, useEffect, useRef  } from 'react';
import Navbar from '../components/Navbar';
import countries from '../../lib/countries';

interface ProfileData {
  name: string;
  email: string;
  countryCode: string;
  mobile: string;
  dob: string;
  profileImage: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
   const [countryCode, setCountryCode] = useState('+91');
  const [countryIso, setCountryIso] = useState('in');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [mobile, setMobile] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      const res = await fetch('/api/profile', { cache: 'no-store' });
      const data = await res.json();

      if (res.ok) {
        setProfile(data.user);
        setCountryCode(data.user.countryCode || '+91');
        const matched = countries.find((c) => c.code === (data.user.countryCode || '+91'));
        setCountryIso(matched ? matched.iso : 'in');
        setMobile(data.user.mobile || '');
        setImagePreview(data.user.profileImage || '');

        if (data.user.dob) {
          const d = new Date(data.user.dob);
          setDobMonth(String(d.getMonth() + 1));
          setDobDay(String(d.getDate()));
          setDobYear(String(d.getFullYear()));
        }
      }
    }

    fetchProfile();
  }, []);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }
   const countryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setShowCountryDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage('');
    setError('');

    let dob = '';
    if (dobMonth && dobDay && dobYear) {
      const mm = dobMonth.padStart(2, '0');
      const dd = dobDay.padStart(2, '0');
      dob = `${dobYear}-${mm}-${dd}`;
    }

    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile,
        countryCode,
        profileImage: imagePreview,
        dob,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setMessage('Profile updated!');
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const daysInMonth = dobMonth
    ? new Date(Number(dobYear) || currentYear, Number(dobMonth), 0).getDate()
    : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const selectClass =
    'w-full px-3 py-2.5 bg-white border border-[#DDD8CC] rounded-md text-[#14140F] focus:outline-none focus:border-[#B8935F] focus:ring-1 focus:ring-[#B8935F] transition-colors appearance-none cursor-pointer';

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F7F5EF]">
        <Navbar />
        <p className="text-center mt-24 text-[#6B6858]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF]">
      <Navbar />

      <div className="flex justify-center px-6 py-16">
        <div className="max-w-md w-full">
          <p className="font-mono text-xs tracking-[0.2em] text-[#B8935F] mb-3 uppercase">
            My Profile
          </p>
          <h1 className="font-serif text-3xl text-[#14140F] mb-8">
            {profile.name}'s Profile
          </h1>

                    <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-full bg-[#DDD8CC] overflow-hidden mb-3 flex items-center justify-center">
              {imagePreview ? (
                <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-serif text-[#6B6858]">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-[#122A22] font-medium underline cursor-pointer">
                Change Profile Picture
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
              {imagePreview && (
                <>
                  <span className="text-[#DDD8CC]">|</span>
                  <button
                    type="button"
                    onClick={() => setImagePreview('')}
                    className="text-sm text-red-600 font-medium underline hover:no-underline"
                  >
                    Remove Photo
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm text-[#14140F] mb-1.5">Name</label>
              <input
                type="text"
                value={profile.name}
                disabled
                className="w-full px-4 py-2.5 bg-[#EFEDE4] border border-[#DDD8CC] rounded-md text-[#6B6858]"
              />
            </div>

            <div>
              <label className="block text-sm text-[#14140F] mb-1.5">Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-2.5 bg-[#EFEDE4] border border-[#DDD8CC] rounded-md text-[#6B6858]"
              />
            </div>

                      <div>
              <label className="block text-sm text-[#14140F] mb-1.5">Mobile Number</label>
              <div className="flex gap-2">
                <div className="relative shrink-0" ref={countryDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowCountryDropdown((prev) => !prev)}
                    className="flex items-center gap-1.5 px-2.5 py-2.5 bg-white border border-[#DDD8CC] rounded-md text-[#14140F] focus:outline-none focus:border-[#B8935F] focus:ring-1 focus:ring-[#B8935F] transition-colors w-24"
                  >
                    <img
                      src={`https://flagcdn.com/24x18/${countryIso}.png`}
                      alt=""
                      className="w-5 h-auto rounded-sm"
                    />
                    <span className="text-sm">{countryCode}</span>
                  </button>

                  {showCountryDropdown && (
                    <div className="absolute left-0 top-12 w-56 max-h-64 overflow-y-auto bg-white border border-[#DDD8CC] rounded-md shadow-lg z-50">
                      {countries.map((c) => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => {
                            setCountryCode(c.code);
                            setCountryIso(c.iso);
                            setShowCountryDropdown(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[#F7F5EF] transition-colors"
                        >
                          <img
                            src={`https://flagcdn.com/24x18/${c.iso}.png`}
                            alt=""
                            className="w-5 h-auto rounded-sm"
                          />
                          <span className="text-[#14140F]">{c.name}</span>
                          <span className="text-[#6B6858] ml-auto">{c.code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Enter your mobile number"
                  className="flex-1 px-4 py-2.5 bg-white border border-[#DDD8CC] rounded-md text-[#14140F] focus:outline-none focus:border-[#B8935F] focus:ring-1 focus:ring-[#B8935F] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#14140F] mb-1.5">Date of Birth</label>
              <div className="grid grid-cols-3 gap-2">
                <select value={dobMonth} onChange={(e) => setDobMonth(e.target.value)} className={selectClass}>
                  <option value="">Month</option>
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
                <select value={dobDay} onChange={(e) => setDobDay(e.target.value)} className={selectClass}>
                  <option value="">Day</option>
                  {days.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select value={dobYear} onChange={(e) => setDobYear(e.target.value)} className={selectClass}>
                  <option value="">Year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </p>
            )}
            {message && (
              <p className="text-sm text-[#122A22] bg-[#E8E5D8] rounded-md px-3 py-2">
                {message}
              </p>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#122A22] text-[#F7F5EF] py-2.5 rounded-md font-medium hover:bg-[#0D1F19] disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}