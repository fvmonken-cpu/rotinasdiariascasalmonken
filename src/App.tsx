import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginForm from "@/components/auth/LoginForm";
import MainLayout from "@/components/layout/MainLayout";
import NotFound from "./pages/NotFound";
import "./App.css";
const queryClient = new QueryClient();
const AppContent = ()=>{
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) {
        return (<div className="min-h-screen flex items-center justify-center bg-gray-50" data-spec-id="lLMzYST32fRnt0IW">
        <div className="text-center" data-spec-id="iWtCMly0rD8NrDpy">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D2AE6D] mx-auto mb-4" data-spec-id="t4G40U6tcfn8lbG7"></div>
          <p className="text-gray-600" data-spec-id="UG97fTCJfo2qAfAF">Carregando...</p>
        </div>
      </div>);
    }
    if (!isAuthenticated) {
        return <LoginForm data-spec-id="P9h8Ng7wtlpz6k65"/>;
    }
    return <MainLayout data-spec-id="NWAtexjSe8Y1rvVc"/>;
};
const App = ()=>(<QueryClientProvider client={queryClient} data-spec-id="X5xRAQa1NmnwRGP7">
    <TooltipProvider data-spec-id="pLtXgN7d3o35yfEw">
      <Toaster data-spec-id="oBFrKE4I7eZ5q5Sv"/>
      <AuthProvider data-spec-id="zQW7lD9HHpUoozzc">
        <BrowserRouter data-spec-id="SNAJZr9WuGKaWJEl">
          <Routes data-spec-id="iXPZxodd7MHqPpGP">
            <Route path="/specai-page/Index" element={<AppContent data-spec-id="mhImgrb3ImjWe4v8"/>} data-spec-id="MgENe3oJhyOEmNXB"/>
            <Route path="/specai-page/NotFound" element={<NotFound data-spec-id="XZSfmcsAwUxjtOSh"/>} data-spec-id="WJD7Pwz3B5oiLSbU"/>
            <Route path="/" element={<AppContent data-spec-id="FflG6BLUsn93qDuF"/>} data-spec-id="DgYux4lnMcP56VSZ"/>
            <Route path="*" element={<NotFound data-spec-id="4qcRYkNaZGK7haGx"/>} data-spec-id="rXDUWnyEYVi1aZbM"/>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>);
export default App;
