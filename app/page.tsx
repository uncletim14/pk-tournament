'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Participant = {
  id: number;
  name: string;
  category: string;
  dupr: string;
  edit_code: string;
  created_at: string;
};

export default function TournamentRegistration() {
  const categories = [
    { id: 'cat1', label: '3.29 以下 (入門組)', max: 5, enabled: true },
    { id: 'cat2', label: '3.3 - 3.9 (中階組)', max: 5, enabled: false },
    { id: 'cat3', label: '4.0 以上 (菁英組)', max: 5, enabled: false },
    { id: 'cat4', label: '女性專場', max: 5, enabled: false },
  ];

  const [activeTab, setActiveTab] = useState(categories[0].label);
  const [formData, setFormData] = useState({ name: '', dupr: '', edit_code: '' });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = "七賢國小匹克球積分賽";
    fetchParticipants();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_participants' }, fetchParticipants)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchParticipants = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('tournament_participants').select('*').order('id', { ascending: true });
    if (!error && data) setParticipants(data);
    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const currentCat = categories.find(c => c.label === activeTab);
    if (currentCat && !currentCat.enabled) {
      alert("該組別目前未開放報名喔！");
      return;
    }

    if (formData.edit_code.length !== 4) { alert("請設定 4 位數修改密碼"); return; }
    if (!formData.dupr) { alert("請輸入 DUPR ID"); return; }

    const isDuplicate = participants.some(
      p => p.name.trim() === formData.name.trim() && p.category === activeTab
    );
    
    if (isDuplicate) {
      alert(`「${formData.name}」已經在【${activeTab}】名單中囉，請勿重複報名！`);
      return;
    }

    const categoryList = participants.filter(p => p.category === activeTab);
    const currentMax = currentCat?.max || 5;

    if (categoryList.length >= currentMax) {
      const waitlistNum = categoryList.length - currentMax + 1;
      if (!window.confirm(`目前正取已滿，報名後將列為「備取第 ${waitlistNum} 位」，確定報名嗎？`)) return;
    }

    const { error } = await supabase.from('tournament_participants').insert([{
      name: formData.name.trim(),
      category: activeTab,
      dupr: formData.dupr,
      edit_code: formData.edit_code
    }]);

    if (!error) {
      alert("報名成功！");
      setFormData({ name: '', dupr: '', edit_code: '' });
      fetchParticipants();
    } else {
      alert("報名失敗：" + error.message);
    }
  };

  const handleCancel = async (participant: Participant) => {
    const inputCode = window.prompt("請輸入報名時設定的 4 碼密碼以取消報名：");
    if (inputCode === null) return;
    
    if (inputCode === participant.edit_code) {
      if (window.confirm("確定要取消報名嗎？")) {
        const { error } = await supabase.from('tournament_participants').delete().eq('id', participant.id);
        if (!error) {
          alert("已成功取消報名");
          fetchParticipants();
        }
      }
    } else {
      alert("密碼錯誤，無法取消！");
    }
  };

  const currentList = participants.filter(p => p.category === activeTab);
  const currentCategoryInfo = categories.find(c => c.label === activeTab);
  const maxLimit = currentCategoryInfo?.max || 5;

  return (
    <main className="min-h-screen bg-slate-900 p-4 md:p-8 font-sans text-slate-100">
      <div className="max-w-4xl mx-auto">
        
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-4 tracking-tighter">
            七賢國小匹克球積分賽
          </h1>
          <p className="text-slate-400 text-base md:text-lg tracking-wide font-medium">專業積分、熱血對戰，展現您的最強實力！</p>
        </header>

        {/* 比賽時間 */}
        <div className="flex justify-center mb-6">
          <div className="bg-orange-500/10 border border-orange-500/30 px-8 py-3 rounded-full shadow-xl">
             <span className="text-orange-400 font-black tracking-widest text-xl md:text-2xl">比賽時間：6/1 18:00-21:00</span>
          </div>
        </div>

        {/* 類別分頁 */}
        <div className="relative mb-12 group">
          <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.label)}
                className={`px-8 py-5 rounded-[2rem] font-bold transition-all whitespace-nowrap snap-start shrink-0 border-2 flex flex-col items-center gap-3 ${
                  activeTab === cat.label 
                  ? 'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/30 scale-105' 
                  : 'bg-slate-800 border-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <span className="text-xl md:text-2xl tracking-tight">{cat.label}</span>
                {cat.enabled ? (
                  <span className="bg-white text-slate-900 px-4 py-1.5 rounded-full text-base md:text-lg font-black shadow-inner ring-2 ring-white/20">
                    ● 有開放報名
                  </span>
                ) : (
                  <span className={`text-sm md:text-base font-bold ${activeTab === cat.label ? 'text-slate-200' : 'text-slate-500'}`}>
                    ○ 未開放報名
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:grid md:grid-cols-5 gap-10">
          
          <div className="md:col-span-3 order-1 md:order-2">
            <div className="flex justify-between items-end mb-6 px-1">
              <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                <span className="w-2.5 h-8 bg-orange-500 rounded-full"></span>
                目前報名清單
              </h2>
              <span className="text-sm text-slate-400 font-bold bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
                正取剩餘：{currentCategoryInfo?.enabled ? Math.max(0, maxLimit - currentList.length) : '未開放'}
              </span>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-20 animate-pulse">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {!currentCategoryInfo?.enabled ? (
                  <div className="bg-slate-800/50 border-2 border-dashed border-slate-700 p-20 rounded-[2rem] text-center text-slate-500 text-xl font-bold italic">
                    此組別目前未開放報名
                  </div>
                ) : currentList.length === 0 ? (
                  <div className="bg-slate-800/50 border-2 border-dashed border-slate-700 p-20 rounded-[2rem] text-center text-slate-600 text-xl font-bold">
                    尚無選手報名，快來搶頭香！
                  </div>
                ) : (
                  currentList.map((p, index) => {
                    const isWaitlist = index >= maxLimit;
                    return (
                      <div key={p.id} className="bg-slate-800 border-2 border-slate-700/50 p-6 md:p-8 rounded-[2rem] flex justify-between items-center group hover:bg-slate-800/90 transition-all active:scale-[0.99] shadow-xl">
                        <div className="flex items-center gap-6 md:gap-10">
                          <div className={`px-6 py-4 rounded-2xl flex items-center justify-center shrink-0 min-w-[90px] ${
                            isWaitlist ? 'bg-amber-500/20 text-amber-500' : 'bg-green-500/20 text-green-500'
                          }`}>
                            <span className="text-2xl md:text-3xl font-black tracking-widest">{isWaitlist ? '備取' : '正取'}</span>
                          </div>
                          <div>
                            <div className="font-black text-slate-100 text-2xl md:text-4xl mb-2">{p.name}</div>
                            <div className="text-sm md:text-base text-slate-500 font-bold tracking-[0.2em] uppercase">DUPR: {p.dupr}</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleCancel(p)} 
                          className="px-6 py-4 rounded-2xl text-lg md:text-2xl font-black text-slate-500 border-2 border-slate-700 hover:text-red-400 hover:border-red-400/50 hover:bg-red-500/5 transition-all active:scale-95 shrink-0"
                        >
                          取消
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="md:col-span-2 order-2 md:order-1">
            <form onSubmit={handleRegister} className="bg-slate-800 p-10 rounded-[3rem] border-2 border-slate-700 shadow-2xl md:sticky md:top-8 overflow-hidden">
              <h2 className="text-2xl font-black mb-10 flex items-center gap-3">
                {currentCategoryInfo?.enabled ? '✍️ 填寫報名' : '🚫 暫未開放'}
              </h2>
              
              <div className="space-y-8">
                <div className={!currentCategoryInfo?.enabled ? 'opacity-30 pointer-events-none' : ''}>
                  <label className="text-sm font-black text-slate-400 ml-1 mb-2 block tracking-wider uppercase">LINE群內的ID</label>
                  <input 
                    type="text" 
                    disabled={!currentCategoryInfo?.enabled}
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="請輸入LINE ID" 
                    className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl px-6 py-5 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-2xl font-bold text-slate-100 placeholder:text-slate-700" 
                  />
                </div>
                <div className={!currentCategoryInfo?.enabled ? 'opacity-30 pointer-events-none' : ''}>
                  <label className="text-sm font-black text-slate-400 ml-1 mb-2 block tracking-wider uppercase">DUPR 完整ID</label>
                  <input 
                    type="text" 
                    disabled={!currentCategoryInfo?.enabled}
                    required 
                    value={formData.dupr} 
                    onChange={e => setFormData({...formData, dupr: e.target.value})} 
                    placeholder="請輸入 DUPR ID" 
                    className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl px-6 py-5 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-2xl font-bold text-slate-100 placeholder:text-slate-700" 
                  />
                </div>
                <div className={!currentCategoryInfo?.enabled ? 'opacity-30 pointer-events-none' : ''}>
                  <label className="text-sm font-black text-slate-400 ml-1 mb-2 block tracking-wider uppercase">設定 4 碼密碼 (取消報名用)</label>
                  <input 
                    type="password" 
                    disabled={!currentCategoryInfo?.enabled}
                    maxLength={4} 
                    inputMode="numeric"
                    required 
                    value={formData.edit_code} 
                    onChange={e => setFormData({...formData, edit_code: e.target.value})} 
                    placeholder="密碼" 
                    className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl px-6 py-5 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-3xl tracking-[0.4em] font-mono font-bold text-slate-100" 
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={!currentCategoryInfo?.enabled}
                  className={`w-full font-black py-6 rounded-2xl transition-all shadow-xl text-2xl mt-6 ${
                    currentCategoryInfo?.enabled 
                    ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white hover:brightness-110 active:scale-95 shadow-orange-900/40' 
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed shadow-none opacity-50'
                  }`}
                >
                  {currentCategoryInfo?.enabled ? '確認報名' : '本組未開放'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
      
      <footer className="mt-28 pb-16 text-center">
        <p className="text-slate-600 text-sm font-black tracking-[0.4em] uppercase">七賢國小匹克球積分賽 • KAOHSIUNG PICKLEBALL</p>
      </footer>
    </main>
  );
}