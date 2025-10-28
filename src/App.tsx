import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SupabaseAuthProvider } from "@/hooks/useSupabaseAuth";
import InstallButton from "@/components/InstallButton";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import "./App.css";
const queryClient = new QueryClient();
const App = ()=>{
    console.log('App component rendered - Espaço Casal Monken System');
    return (<QueryClientProvider client={queryClient} data-spec-id="5HGTeIG6YG0v6rI1">
      <SupabaseAuthProvider data-spec-id="supabase-auth-provider">
        <TooltipProvider data-spec-id="PNdBVERh6NtuUAEc">
          <Toaster data-spec-id="GHKUeW88r1xMRDkE"/>
          <InstallButton data-spec-id="ZxSbBHzf6z0y1ILG"/>
          <BrowserRouter data-spec-id="OPFBFv3EEtPq2zdT">
          <Routes data-spec-id="5YjhpZwG7aWIAIwe">
            <Route path="/specai-page/Index" element={<Index data-spec-id="78aglOob21H09EpM"/>} data-spec-id="lPihQXwEuw7dQOPq"/>
            <Route path="/specai-page/NotFound" element={<NotFound data-spec-id="z8ttulNJhgTQMGre"/>} data-spec-id="QE8usksdPwUFfUVr"/>

            <Route path="/" element={<Index data-dora-id="1" data-spec-id="Br1hgL8txZNxQClO"/>} data-spec-id="5MAttsChNjNvCAGL"/>
            {}
            <Route path="*" element={<NotFound data-spec-id="b6BY46HvnxPlex8b"/>} data-spec-id="77uryi1IsFuZ7JOX"/>
          </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SupabaseAuthProvider>
    </QueryClientProvider>);
};
export default App;
