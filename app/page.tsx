'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// 初始化 Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Participant = {
  id: number;
  name: string;
  category: string;
  phone: string;
  edit_code: string;
  created_at: string;
};

export default function TournamentRegistration() {
  // 比賽組別設定
  const categories = [
    { id: 'cat1', label: '3.29 以下 (入門組)', max: 16 },
    { id: 'cat2', label: '3.3 - 3.9 (中階組)', max: 16 },
    { id: 'cat3', label: '4.0 以上 (菁英組)', max: 16 },
    { id: 'cat4', label: '女性專場', max: 16 },
  ];

  const [activeTab, setActiveTab] = useState(categories[0].label);
  const [formData, setFormData] = useState({ name: '', phone: '', edit_code: '' });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('tournament_participants').select('*').order('id', { ascending: true });
    if (!error && data) setParticipants(data);
    setIsLoading(false);
  };

  // 報名邏輯
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.edit_code.length !== 4) { alert("請設定 4 位數修改密碼"); return; }

    const categoryList = participants.filter(p => p.category === activeTab);
    const currentMax = categories.find(c => c.label === activeTab)?.max || 16;

    if (categoryList.length >= currentMax) {
      if (!window.confirm("該組別已滿，確定要排入候補嗎？")) return;
    }

    const { error } = await supabase.from('tournament_participants').insert([{
      name: formData.name,
      phone: formData.phone,
      category: activeTab,
      edit_code: formData.edit_code
    }]);

    if (!error) {
      alert("報名成功！");
      setFormData({ name: '', phone: '', edit_code: '' });
      fetchParticipants();
    } else {
      alert("報名失敗：" + error.message);
    }
  };

  // 自助取消邏輯
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

  return (
    <main className="min-h-screen bg-slate-900 p-4 md:p-8 font-sans text-slate-100">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2">
            七賢匹克球積分賽 報名系統
          </h1>
          <p className="text-slate-400">專業積分、熱血對戰，展現您的最強實力！</p>
        </header>

        {/* 組別切換 */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.label)}
              className={`px-6 py-3 rounded-full font-bold transition-all whitespace-nowrap ${activeTab === cat.label ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* 左側：報名表單 */}
          <div className="md:col-span-2">
            <form onSubmit={handleRegister} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 sticky top-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-orange-500 text-2xl">✍️</span> 填寫報名表
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-500 ml-1">選手姓名</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="請輸入姓名" className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 ml-1">聯絡電話</label>
                  <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="僅供主辦方聯絡" className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 ml-1">修改密碼 (4 位數)</label>
                  <input type="password" maxLength={4} required value={formData.edit_code} onChange={e => setFormData({...formData, edit_code: e.target.value})} placeholder="自助取消用" className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-black py-4 rounded-xl hover:scale-[1.02] transition-transform shadow-lg">
                  立即報名參加
                </button>
                <p className="text-[10px] text-slate-500 text-center mt-2">＊您的電話與密碼將受到加密保護，不會公開顯示。</p>
              </div>
            </form>
          </div>

          {/* 右側：名單顯示 */}
          <div className="md:col-span-3">
            <div className="flex justify-between items-end mb-4">
              <h2 className="text-xl font-bold border-l-4 border-orange-500 pl-3">目前報名清單</h2>
              <span className="text-sm text-slate-400">名額：{currentList.length} / {currentCategoryInfo?.max}</span>
            </div>

            {isLoading ? (
              <div className="text-center py-20 text-slate-500 animate-pulse">讀取名單中...</div>
            ) : (
              <div className="space-y-3">
                {currentList.length === 0 && (
                  <div className="bg-slate-800/50 border border-dashed border-slate-700 p-10 rounded-2xl text-center text-slate-500">
                    目前尚無選手報名，快來當第一個！
                  </div>
                )}
                {currentList.map((p, index) => (
                  <div key={p.id} className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex justify-between items-center group hover:border-orange-500/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index < (currentCategoryInfo?.max || 16) ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                        {index < (currentCategoryInfo?.max || 16) ? index + 1 : '補'}
                      </span>
                      <span className="font-bold text-lg">{p.name}</span>
                    </div>
                    <button 
                      onClick={() => handleCancel(p)}
                      className="text-xs text-slate-500 hover:text-red-400 border border-slate-700 hover:border-red-400/50 px-3 py-1 rounded-lg transition-all"
                    >
                      取消
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}