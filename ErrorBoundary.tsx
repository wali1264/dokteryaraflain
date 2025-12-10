import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.href = '/';
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-6 text-center font-sans" dir="rtl">
          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-red-100 max-w-md w-full">
             <div className="bg-red-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
               <AlertTriangle className="w-12 h-12 text-red-600" />
             </div>
             <h2 className="text-2xl font-bold text-gray-800 mb-2">مشکلی پیش آمده است</h2>
             <p className="text-gray-500 mb-8 text-sm leading-loose">
               متاسفانه برنامه هنگام پردازش اطلاعات با خطا مواجه شد.
               <br/>
               نگران نباشید، اطلاعات شما محفوظ است.
             </p>
             
             {this.state.error && (
               <div className="bg-gray-100 p-4 rounded-xl text-[10px] font-mono text-left text-gray-600 mb-6 overflow-auto max-h-32 border border-gray-200 dir-ltr opacity-70">
                  Error: {this.state.error.message}
               </div>
             )}

             <button
               onClick={this.handleReload}
               className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
             >
               <RefreshCw className="w-5 h-5" />
               بازنشانی و بازگشت به صفحه اصلی
             </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}