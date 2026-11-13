import React, { useEffect, useMemo, useState } from "react";
import API from "./api";

const todayString = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const QUICK_FOODS = [
  { name: "Бууз (3 ширхэг)", calories: 420, category: "Өдрийн хоол" },
  { name: "Цуйван (1 таваг)", calories: 650, category: "Өдрийн хоол" },
  { name: "Банштай цай (1 аяга)", calories: 380, category: "Өглөөний цай" },
  { name: "Чанасан өндөг (2 ш)", calories: 155, category: "Өглөөний цай" },
  { name: "Овъёосны каш", calories: 250, category: "Өглөөний цай" },
  { name: "Тахианы цээж мах, будаа", calories: 450, category: "Өдрийн хоол" },
  { name: "Ногооны салат", calories: 180, category: "Оройн хоол" },
  { name: "Алим / Гадил (1 ш)", calories: 95, category: "Зууш" },
  { name: "Тараг (1 аяга)", calories: 130, category: "Зууш" },
  { name: "Хар кофе (чихэргүй)", calories: 5, category: "Өглөөний цай" },
];

const CATEGORIES = [
  { key: "Өглөөний цай", icon: "🌅" },
  { key: "Өдрийн хоол", icon: "☀️" },
  { key: "Оройн хоол", icon: "🌙" },
  { key: "Зууш", icon: "🍎" },
];

const money = (n) => Number(n || 0).toLocaleString("en-US");

function Card({ children, className = "" }) {
  return <section className={`glass-card rounded-2xl p-5 ${className}`}>{children}</section>;
}

function Icon({ children, className = "" }) {
  return <i className={`fa-solid ${children} ${className}`} aria-hidden="true" />;
}

function WeightChart({ weights, target }) {
  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  if (!sorted.length) {
    return <div className="h-64 flex items-center justify-center text-sm text-slate-400">Жингийн бүртгэл оруулснаар график энд харагдана</div>;
  }

  const width = 720;
  const height = 270;
  const left = 48;
  const right = 22;
  const top = 22;
  const bottom = 34;
  const values = [...sorted.map((x) => x.weight), target];
  let min = Math.min(...values) - 1.5;
  let max = Math.max(...values) + 1.5;
  if (max - min < 4) { min -= 1; max += 1; }
  const x = (i) => sorted.length === 1 ? width / 2 : left + (i / (sorted.length - 1)) * (width - left - right);
  const y = (v) => top + ((max - v) / (max - min)) * (height - top - bottom);
  const points = sorted.map((item, i) => `${x(i)},${y(item.weight)}`).join(" ");
  const targetY = y(target);
  const area = `${left},${height - bottom} ${points} ${x(sorted.length - 1)},${height - bottom}`;

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64 sm:h-72" role="img" aria-label="Жингийн өөрчлөлтийн график">
        {[0, 1, 2, 3, 4].map((step) => {
          const val = min + (step / 4) * (max - min);
          const yy = y(val);
          return <g key={step}>
            <line x1={left} x2={width - right} y1={yy} y2={yy} stroke="#e2e8f0" />
            <text x={left - 8} y={yy + 4} textAnchor="end" fontSize="11" fill="#64748b">{val.toFixed(1)}</text>
          </g>;
        })}
        <line x1={left} x2={width - right} y1={targetY} y2={targetY} stroke="#f59e0b" strokeDasharray="5 5" strokeWidth="1.5" />
        <text x={left + 5} y={targetY - 7} fontSize="11" fill="#d97706">Зорилго: {target} кг</text>
        {sorted.length > 1 && <polygon points={area} fill="rgba(16,185,129,.12)" />}
        <polyline points={points} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {sorted.map((item, i) => <g key={item.date}>
          <circle cx={x(i)} cy={y(item.weight)} r="5" fill="white" stroke="#059669" strokeWidth="2.5">
            <title>{item.date}: {item.weight} кг</title>
          </circle>
          {(sorted.length <= 7 || i === 0 || i === sorted.length - 1 || i % Math.ceil(sorted.length / 6) === 0) &&
            <text x={x(i)} y={height - 10} textAnchor="middle" fontSize="10" fill="#64748b">{item.date.slice(5)}</text>}
        </g>)}
      </svg>
    </div>
  );
}

export default function App({ onLogout }) {
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [profile, setProfile] = useState({
    start_weight: 80,
    target_weight: 70,
    height_cm: 170,
    daily_calorie_goal: 1800,
    daily_water_goal_ml: 2000,
  });
  const [weights, setWeights] = useState([]);
  const [dailyLog, setDailyLog] = useState({ id: null, foods: [], exercises: [], water_ml: 0, weight_kg: "" });
  
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [weightInput, setWeightInput] = useState("");
  const [mealForm, setMealForm] = useState({ category: "Өглөөний цай", name: "", calories: "" });
  const [exerciseForm, setExerciseForm] = useState({ name: "", duration: "", calories: "" });
  const [profileForm, setProfileForm] = useState(profile);

  const notify = (message, type = "success") => setToast({ message, type });

  // Өгөгдөл татах (Profile болон Weights)
  useEffect(() => {
    API.get('accounts/profile/')
      .then(res => {
        setProfile(res.data);
        setProfileForm(res.data);
      })
      .catch(() => notify("Профайл мэдээлэл авахад алдаа гарлаа", "error"));

    API.get('logs/')
      .then(res => {
        const formattedWeights = res.data
          .filter(log => log.weight_kg !== null)
          .map(log => ({ date: log.date, weight: log.weight_kg }));
        setWeights(formattedWeights);
      })
      .catch(() => {});
  }, []);

  // Сонгогдсон огноо өөрчлөгдөхөд тухайн өдрийн лог татах
  useEffect(() => {
    API.get(`logs/?date=${selectedDate}`)
      .then(res => {
        const found = res.data.find(l => l.date === selectedDate);
        if (found) {
          setDailyLog({
            id: found.id,
            foods: found.foods || [],
            exercises: found.burned_calories ? [{ id: 1, name: "Дасгал", calories: found.burned_calories }] : [],
            water_ml: found.water_ml || 0,
            weight_kg: found.weight_kg || ""
          });
          if (found.weight_kg) setWeightInput(found.weight_kg);
        } else {
          setDailyLog({ id: null, foods: [], exercises: [], water_ml: 0, weight_kg: "" });
          setWeightInput("");
        }
      })
      .catch(() => {
        setDailyLog({ id: null, foods: [], exercises: [], water_ml: 0, weight_kg: "" });
      });
  }, [selectedDate]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const sortedWeights = useMemo(() => [...weights].sort((a, b) => a.date.localeCompare(b.date)), [weights]);
  const latestWeight = sortedWeights.length ? sortedWeights[sortedWeights.length - 1].weight : Number(profile.start_weight);
  
  const foodCalories = dailyLog.foods.reduce((sum, meal) => sum + Number(meal.calories), 0);
  const exerciseCalories = dailyLog.exercises.reduce((sum, exercise) => sum + Number(exercise.calories), 0);
  const remainingCalories = profile.daily_calorie_goal - foodCalories + exerciseCalories;
  
  const waterGoalLiters = profile.daily_water_goal_ml / 1000;
  const waterPct = Math.min(100, Math.round((dailyLog.water_ml / profile.daily_water_goal_ml) * 100));
  
  const bmiValue = profile.height_cm > 0 ? latestWeight / ((profile.height_cm / 100) ** 2) : 0;
  const bmi = bmiValue < 18.5
    ? { label: "Жингийн дутагдалтай", color: "bg-sky-100 text-sky-700" }
    : bmiValue < 25
      ? { label: "Хэвийн жинтэй", color: "bg-emerald-100 text-emerald-700" }
      : bmiValue < 30
        ? { label: "Илүүдэл жинтэй", color: "bg-amber-100 text-amber-700" }
        : { label: "Таргалалттай", color: "bg-rose-100 text-rose-700" };

  let progress = 0;
  if (profile.start_weight > profile.target_weight) {
    progress = Math.min(100, Math.max(0, Math.round(((profile.start_weight - latestWeight) / (profile.start_weight - profile.target_weight)) * 100)));
  } else if (profile.start_weight < profile.target_weight) {
    progress = Math.min(100, Math.max(0, Math.round(((latestWeight - profile.start_weight) / (profile.target_weight - profile.start_weight)) * 100)));
  } else progress = 100;

  // Тухайн өдрийн лог байхгүй бол үүсгэх эсвэл шинэчлэх туслах функц
  const getOrCreateDailyLog = async (extraData = {}) => {
    if (dailyLog.id) {
      const res = await API.patch(`logs/${dailyLog.id}/`, extraData);
      return res.data;
    } else {
      const res = await API.post('logs/', { date: selectedDate, ...extraData });
      setDailyLog(prev => ({ ...prev, id: res.data.id }));
      return res.data;
    }
  };

  const saveWeight = async (e) => {
    e.preventDefault();
    const value = Number(weightInput);
    if (!value || value < 20 || value > 350) return;
    try {
      await getOrCreateDailyLog({ weight_kg: value });
      setDailyLog(prev => ({ ...prev, weight_kg: value }));
      
      // Жингийн жагсаалтаа шинэчлэх
      setWeights(prev => {
        const filtered = prev.filter(w => w.date !== selectedDate);
        return [...filtered, { date: selectedDate, weight: value }].sort((a, b) => a.date.localeCompare(b.date));
      });
      notify(`${selectedDate} өдрийн жин (${value} кг) баазанд хадгалагдлаа!`);
    } catch {
      notify("Жин хадгалахад алдаа гарлаа", "error");
    }
  };

  const deleteWeight = async (date) => {
    try {
      // Тухайн өдрийн лог олоод weight_kg-ийг null болгох
      const res = await API.get(`logs/?date=${date}`);
      const found = res.data.find(l => l.date === date);
      if (found) {
        await API.patch(`logs/${found.id}/`, { weight_kg: null });
        setWeights(prev => prev.filter(item => item.date !== date));
        if (selectedDate === date) setDailyLog(prev => ({ ...prev, weight_kg: "" }));
        notify("Жингийн бүртгэл устгагдлаа", "info");
      }
    } catch {
      notify("Устгахад алдаа гарлаа", "error");
    }
  };

  const addFood = async (food) => {
    try {
      const log = await getOrCreateDailyLog();
      const res = await API.post('foods/', {
        daily_log: log.id,
        name: food.name,
        calories: food.calories,
        meal_type: food.category === "Өглөөний цай" ? "breakfast" : food.category === "Өдрийн хоол" ? "lunch" : food.category === "Оройн хоол" ? "dinner" : "snack"
      });
      setDailyLog(prev => ({ ...prev, foods: [...prev.foods, res.data] }));
      notify(`${food.name} (+${food.calories} ккал) бүртгэгдлээ`);
    } catch {
      notify("Хоол нэмэхэд алдаа гарлаа", "error");
    }
  };

  const submitMeal = (e) => {
    e.preventDefault();
    const name = mealForm.name.trim();
    const calories = Number(mealForm.calories);
    if (!name || !calories || calories < 1) return;
    addFood({ ...mealForm, name, calories });
    setMealForm(prev => ({ ...prev, name: "", calories: "" }));
  };

  const deleteMeal = async (id) => {
    try {
      await API.delete(`foods/${id}/`);
      setDailyLog(prev => ({ ...prev, foods: prev.foods.filter(meal => meal.id !== id) }));
      notify("Хоолны бүртгэл устгагдлаа", "info");
    } catch {
      notify("Устгахад алдаа гарлаа", "error");
    }
  };

  const updateWater = async (delta) => {
    const newWater = Math.max(0, dailyLog.water_ml + delta);
    try {
      await getOrCreateDailyLog({ water_ml: newWater });
      setDailyLog(prev => ({ ...prev, water_ml: newWater }));
      if (delta > 0) notify(`+${delta} мл ус нэмэгдлээ 💧`, "info");
    } catch {
      notify("Усны мэдээлэл хадгалахад алдаа гарлаа", "error");
    }
  };

  const setWaterCups = async (index) => {
    const targetMl = (index + 1) * 250;
    const newWater = dailyLog.water_ml === targetMl ? Math.max(0, targetMl - 250) : targetMl;
    try {
      await getOrCreateDailyLog({ water_ml: newWater });
      setDailyLog(prev => ({ ...prev, water_ml: newWater }));
    } catch {
      notify("Алдаа гарлаа", "error");
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await API.put('accounts/profile/', {
        height_cm: Number(profileForm.height_cm),
        start_weight: Number(profileForm.start_weight),
        target_weight: Number(profileForm.target_weight),
        daily_calorie_goal: Number(profileForm.daily_calorie_goal),
        daily_water_goal_ml: Number(profileForm.daily_water_goal_ml),
        weigh_in_frequency: profileForm.weigh_in_frequency || 'weekly',
        preferred_weigh_in_day: profileForm.preferred_weigh_in_day || '1'
      });
      setProfile(res.data);
      setModalOpen(false);
      notify("Хувийн мэдээлэл ба зорилго амжилттай шинэчлэгдлээ!");
    } catch {
      notify("Профайл шинэчлэхэд алдаа гарлаа", "error");
    }
  };

  const inputClass = "w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition";
  const buttonClass = "rounded-xl transition font-semibold";

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7f5] text-slate-800 antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { font-family: Inter, sans-serif; }
        .glass-card { background:rgba(255,255,255,.95); backdrop-filter:blur(10px); border:1px solid rgba(226,232,240,.8); box-shadow:0 4px 20px -2px rgba(16,185,129,.06); }
      `}</style>

      {toast && <div className={`fixed top-4 right-4 z-[70] max-w-sm rounded-xl px-4 py-3 text-white shadow-lg text-sm flex gap-3 ${toast.type === "error" ? "bg-rose-600" : toast.type === "info" ? "bg-slate-800" : "bg-emerald-600"}`}>
        <Icon>{toast.type === "error" ? "fa-circle-exclamation" : toast.type === "info" ? "fa-circle-info" : "fa-circle-check"}</Icon>
        <span>{toast.message}</span>
      </div>}

      <header className="bg-white border-b border-emerald-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md"><Icon className="text-lg">fa-leaf</Icon></div>
            <div><h1 className="font-bold text-lg sm:text-xl tracking-tight">Эрүүл<span className="text-emerald-600">Жин</span></h1><p className="text-[11px] text-slate-500 hidden sm:block">Баазтай холбогдсон систем</p></div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
              <button onClick={() => {
                const d = new Date(`${selectedDate}T12:00:00`); d.setDate(d.getDate() - 1);
                setSelectedDate(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10));
              }} className="p-1.5 sm:px-2.5 text-slate-600 hover:text-emerald-600 rounded-lg"><Icon>fa-chevron-left</Icon></button>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent text-xs sm:text-sm font-semibold text-slate-700 px-1 sm:px-2 focus:outline-none cursor-pointer" />
              <button onClick={() => {
                const d = new Date(`${selectedDate}T12:00:00`); d.setDate(d.getDate() + 1);
                setSelectedDate(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10));
              }} className="p-1.5 sm:px-2.5 text-slate-600 hover:text-emerald-600 rounded-lg"><Icon>fa-chevron-right</Icon></button>
            </div>
            <button onClick={() => { setProfileForm(profile); setModalOpen(true); }} className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-2 rounded-xl font-medium text-xs sm:text-sm border border-emerald-200"><Icon>fa-user-gear</Icon><span className="hidden md:inline">Профайл</span></button>
            <button onClick={onLogout} className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-2 rounded-xl font-medium text-xs sm:text-sm border border-rose-200" title="Гарах"><Icon>fa-right-from-bracket</Icon></button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-start"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Одоогийн жин</p><div className="flex items-baseline gap-2 mt-1"><h2 className="text-3xl font-extrabold">{latestWeight.toFixed(1)}</h2><span className="text-sm text-slate-500">кг</span></div></div><div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Icon className="text-lg">fa-weight-scale</Icon></div></div>
            <div className="mt-4"><div className="flex justify-between text-xs font-medium mb-1.5"><span className="text-slate-500">Зорилго: <strong className="text-slate-700">{Number(profile.target_weight).toFixed(1)} кг</strong></span><span className="text-emerald-600 font-bold">{progress}%</span></div><div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden"><div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2.5 rounded-full transition-all" style={{ width: `${progress}%` }} /></div><p className="text-[11px] text-slate-500 mt-1.5">{progress === 100 ? "Баяр хүргэе! Та зорилтот жиндээ хүрлээ 🎉" : `Зорилгод хүрэхэд ${Math.abs(latestWeight - profile.target_weight).toFixed(1)} кг үлдлээ`}</p></div>
          </Card>

          <Card className="flex flex-col justify-between">
            <div className="flex justify-between items-start"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Биеийн жингийн индекс (BMI)</p><div className="flex flex-wrap items-center gap-2 mt-1"><h2 className="text-3xl font-extrabold">{bmiValue.toFixed(1)}</h2><span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${bmi.color}`}>{bmi.label}</span></div></div><div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center"><Icon className="text-lg">fa-heart-pulse</Icon></div></div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500"><span>Өндөр: <strong className="text-slate-700">{profile.height_cm} см</strong></span><button onClick={() => { setProfileForm(profile); setModalOpen(true); }} className="text-emerald-600 hover:underline font-medium">Засах</button></div>
          </Card>

          <Card className="flex flex-col justify-between">
            <div className="flex justify-between items-start"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Үлдсэн илчлэг (Өнөөдөр)</p><div className="flex items-baseline gap-2 mt-1"><h2 className={`text-3xl font-extrabold ${remainingCalories < 0 ? "text-rose-600" : "text-emerald-600"}`}>{money(remainingCalories)}</h2><span className="text-sm text-slate-500">ккал</span></div></div><div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center"><Icon className="text-lg">fa-fire-flame-curved</Icon></div></div>
            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-1 text-center text-[11px]">
              <div className="bg-slate-50 rounded-lg p-1"><span className="text-slate-400 block">Зорилт</span><strong>{profile.daily_calorie_goal}</strong></div>
              <div className="bg-slate-50 rounded-lg p-1"><span className="text-slate-400 block">Идсэн</span><strong>{foodCalories}</strong></div>
            </div>
          </Card>

          <Card className="flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-start z-10"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Усны хэрэглээ</p><div className="flex items-baseline gap-1.5 mt-1"><h2 className="text-3xl font-extrabold text-sky-600">{(dailyLog.water_ml / 1000).toFixed(2)}</h2><span className="text-sm text-slate-500">/ {waterGoalLiters} л</span></div></div><div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center"><Icon className="text-lg">fa-droplet</Icon></div></div>
            <div className="mt-4 z-10 flex items-center justify-between gap-2"><button onClick={() => updateWater(-250)} className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs">− 250мл</button><button onClick={() => updateWater(250)} className="flex-[2] py-1.5 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs">💧 +1 Аяга</button></div>
            <div className="absolute bottom-0 left-0 right-0 bg-sky-500/10 pointer-events-none transition-all" style={{ height: `${waterPct}%` }} />
          </Card>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4"><div><h3 className="text-base sm:text-lg font-bold flex items-center gap-2"><Icon className="text-emerald-500">fa-chart-line</Icon>Жингийн өөрчлөлтийн график</h3><p className="text-xs text-slate-500">Баазаас татсан жингийн бууралтын явц (кг)</p></div></div>
            <div className="bg-slate-50/70 rounded-xl border border-slate-100 p-2"><WeightChart weights={weights} target={Number(profile.target_weight)} /></div>
          </Card>

          <Card className="flex flex-col">
            <h3 className="text-base sm:text-lg font-bold mb-3 flex items-center gap-2"><Icon className="text-emerald-500">fa-clipboard-check</Icon>Жин бүртгэх & Түүх</h3>
            <form onSubmit={saveWeight} className="flex gap-2 mb-4">
              <div className="relative flex-grow"><input type="number" step="0.1" min="20" max="350" required value={weightInput} onChange={(e) => setWeightInput(e.target.value)} placeholder="Жин (кг)" className={inputClass} /><span className="absolute right-3 top-3 text-xs font-semibold text-slate-400">кг</span></div>
              <button type="submit" className={`${buttonClass} bg-emerald-600 hover:bg-emerald-700 text-white px-4 text-sm`}>Хадгалах</button>
            </form>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex justify-between"><span>Огноо</span><span>Жин</span></div>
            <div className="flex-grow overflow-y-auto max-h-52 space-y-2 pr-1">
              {[...sortedWeights].reverse().length === 0 ? <p className="text-xs text-slate-400 text-center py-6">Бүртгэл одоогоор хоосон байна.</p> : [...sortedWeights].reverse().map((item) => (
                <div key={item.date} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 text-xs">
                  <span className="font-medium text-slate-600">{item.date}</span>
                  <div className="flex items-center gap-2">
                    <strong className="text-sm">{item.weight} кг</strong>
                    <button onClick={() => deleteWeight(item.date)} className="text-slate-300 hover:text-rose-500 ml-1" title="Устгах"><Icon>fa-trash-can</Icon></button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3"><div><h3 className="text-base sm:text-lg font-bold flex items-center gap-2"><Icon className="text-emerald-500">fa-utensils</Icon>Хоол ба Илчлэгийн бүртгэл</h3><p className="text-xs text-slate-500">Өдрийн хоол хүнсээ баазад хадгалах</p></div><div className="text-right"><span className="text-xs text-slate-400 block">Нийт авсан илчлэг</span><span className="text-lg font-extrabold">{money(foodCalories)} ккал</span></div></div>
            <form onSubmit={submitMeal} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
              <div className="sm:col-span-3"><select value={mealForm.category} onChange={(e) => setMealForm({ ...mealForm, category: e.target.value })} className={`${inputClass} bg-white`}><option value="Өглөөний цай">🌅 Өглөө</option><option value="Өдрийн хоол">☀️ Өдөр</option><option value="Оройн хоол">🌙 Орой</option><option value="Зууш">🍎 Зууш</option></select></div>
              <div className="sm:col-span-5"><input required value={mealForm.name} onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })} placeholder="Хоолны нэр" className={`${inputClass} bg-white`} /></div>
              <div className="sm:col-span-2"><input type="number" required min="1" max="5000" value={mealForm.calories} onChange={(e) => setMealForm({ ...mealForm, calories: e.target.value })} placeholder="Ккал" className={`${inputClass} bg-white`} /></div>
              <div className="sm:col-span-2"><button type="submit" className={`${buttonClass} w-full h-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-3 text-sm`}>＋ Нэмэх</button></div>
            </form>
            <div><p className="text-xs font-semibold text-slate-500 mb-2">⚡ Түгээмэл хоолнууд:</p><div className="flex flex-wrap gap-1.5">{QUICK_FOODS.map((food) => <button type="button" key={food.name} onClick={() => addFood(food)} className="text-xs bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5"><span>{food.name}</span><span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">{food.calories}</span></button>)}</div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {CATEGORIES.map((cat) => {
                const meals = dailyLog.foods.filter((meal) => {
                  if (cat.key === "Өглөөний цай") return meal.meal_type === "breakfast";
                  if (cat.key === "Өдрийн хоол") return meal.meal_type === "lunch";
                  if (cat.key === "Оройн хоол") return meal.meal_type === "dinner";
                  return meal.meal_type === "snack";
                });
                const total = meals.reduce((sum, meal) => sum + Number(meal.calories), 0);
                return <div key={cat.key} className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100">
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200/70"><span className="text-xs font-bold">{cat.icon} {cat.key}</span><span className="text-xs font-bold text-emerald-600">{total} ккал</span></div>
                  {meals.length === 0 ? <p className="text-[11px] text-slate-400 italic py-2">Бүртгэлгүй</p> : meals.map((meal) => <div key={meal.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0 text-xs"><span className="text-slate-700 font-medium truncate pr-2">{meal.name}</span><div className="flex items-center gap-2 shrink-0"><span className="font-semibold text-slate-600">{meal.calories} ккал</span><button onClick={() => deleteMeal(meal.id)} className="text-slate-300 hover:text-rose-500"><Icon>fa-xmark</Icon></button></div></div>)}
                </div>;
              })}
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-3"><h3 className="text-base font-bold flex items-center gap-2"><Icon className="text-sky-500">fa-glass-water</Icon>Өдрийн усны аяганууд</h3><span className="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-1 rounded-lg">{waterPct}%</span></div>
              <p className="text-xs text-slate-500 mb-3">1 аяга = 250 мл.</p>
              <div className="grid grid-cols-5 gap-2.5">
                {Array.from({ length: 8 }, (_, i) => {
                  const filled = i < Math.floor(dailyLog.water_ml / 250);
                  return <button type="button" key={i} onClick={() => setWaterCups(i)} className={`h-11 rounded-xl border flex flex-col items-center justify-center transition ${filled ? "bg-sky-500 border-sky-600 text-white shadow-sm" : "bg-slate-50 border-slate-200 text-slate-300 hover:border-sky-300 hover:text-sky-400"}`}><Icon className="text-sm">fa-glass-water</Icon><span className="text-[9px] font-semibold mt-0.5">{(i + 1) * 250}</span></button>;
                })}
              </div>
            </Card>
          </div>
        </section>
      </main>

      {modalOpen && <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4"><h3 className="text-lg font-bold flex items-center gap-2"><Icon className="text-emerald-600">fa-sliders</Icon>Профайл ба Зорилго</h3><button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 w-8 h-8 rounded-lg hover:bg-slate-100"><Icon>fa-xmark</Icon></button></div>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-slate-600">Эхэлсэн жин (кг)<input type="number" step="0.1" required value={profileForm.start_weight} onChange={(e) => setProfileForm({ ...profileForm, start_weight: e.target.value })} className={`${inputClass} mt-1`} /></label>
              <label className="block text-xs font-semibold text-slate-600">Зорилтот жин (кг)<input type="number" step="0.1" required value={profileForm.target_weight} onChange={(e) => setProfileForm({ ...profileForm, target_weight: e.target.value })} className={`${inputClass} mt-1`} /></label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-slate-600">Өндөр (см)<input type="number" required value={profileForm.height_cm} onChange={(e) => setProfileForm({ ...profileForm, height_cm: e.target.value })} className={`${inputClass} mt-1`} /></label>
              <label className="block text-xs font-semibold text-slate-600">Усны зорилт (мл)<input type="number" step="250" required value={profileForm.daily_water_goal_ml} onChange={(e) => setProfileForm({ ...profileForm, daily_water_goal_ml: e.target.value })} className={`${inputClass} mt-1`} /></label>
            </div>
            <label className="block text-xs font-semibold text-slate-600">Өдрийн илчлэгийн зорилт (ккал)<input type="number" required value={profileForm.daily_calorie_goal} onChange={(e) => setProfileForm({ ...profileForm, daily_calorie_goal: e.target.value })} className={`${inputClass} mt-1`} /></label>
            <div className="pt-2 flex justify-end gap-2"><button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100">Болих</button><button type="submit" className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white">Хадгалах</button></div>
          </form>
        </div>
      </div>}
    </div>
  );
}