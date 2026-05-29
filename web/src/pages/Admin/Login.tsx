import React from 'react';
import { useStore } from '../../store/useStore';
import { Shield, ChevronRight } from 'lucide-react';

export const Login: React.FC = () => {
  const { signInWithGoogle, user, isAuthLoading } = useStore();

  // If already logged in, show a simple redirect message or just let the router handle it
  if (user) {
    window.location.hash = '#/admin';
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-sm relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-xl mb-4 shadow-lg">
            <Shield size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">SvitloSk Admin</h1>
          <p className="text-gray-500 text-sm">Вхід у панель управління</p>
        </div>

        <div className="bg-white border border-gray-200 p-8 rounded-xl shadow-sm">
          <p className="text-center text-gray-500 text-sm mb-6 leading-relaxed">
            Використовуйте Google-акаунт для авторизації.<br />
            Доступ лише для адміністраторів.
          </p>

          <button
            onClick={() => signInWithGoogle()}
            disabled={isAuthLoading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors active:scale-[0.98] disabled:opacity-50"
          >
            {isAuthLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Продовжити з Google
                <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-[10px] text-gray-400 font-medium">
            Secured by Supabase
          </p>
        </div>
      </div>
    </div>
  );
};
