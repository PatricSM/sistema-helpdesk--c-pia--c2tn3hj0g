import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Home from './pages/Home'
import Tickets from './pages/Tickets'
import TicketDetail from './pages/TicketDetail'
import CreateTicket from './pages/CreateTicket'
import KnowledgeBase from './pages/KnowledgeBase'
import Articles from './pages/Articles'
import ArticleDetail from './pages/ArticleDetail'
import ArticleEditor from './pages/ArticleEditor'
import Categories from './pages/Categories'
import CannedResponses from './pages/CannedResponses'
import Customers from './pages/Customers'
import Contacts from './pages/Contacts'
import Teams from './pages/Teams'
import TeamDetail from './pages/TeamDetail'
import Agents from './pages/Agents'
import Notifications from './pages/Notifications'
import Search from './pages/Search'
import Settings from './pages/Settings'
import { PublicDocsLayout } from './pages/PublicDocsLayout'
import { PublicDocsHome } from './pages/PublicDocsHome'
import { PublicDocsArticle } from './pages/PublicDocsArticle'
import { HelpCenterLayout } from './pages/HelpCenterLayout'
import { HelpTopicResolver } from './pages/HelpTopicResolver'
import NotFound from './pages/NotFound'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()
  if (loading) return <div>Carregando...</div>
  if (!user) return <Navigate to="/login" />
  return children
}

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/docs" element={<PublicDocsLayout />}>
            <Route index element={<PublicDocsHome />} />
            <Route path=":articleId" element={<PublicDocsArticle />} />
          </Route>

          <Route
            path="/help"
            element={
              <ProtectedRoute>
                <HelpCenterLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/help/intro" replace />} />
            <Route path=":topic" element={<HelpTopicResolver />} />
          </Route>

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/tickets/new" element={<CreateTicket />} />
            <Route path="/tickets/:id" element={<TicketDetail />} />
            <Route path="/my-tickets" element={<Tickets />} />
            <Route path="/my-tickets/new" element={<CreateTicket />} />
            <Route path="/my-tickets/:id" element={<TicketDetail />} />
            <Route path="/knowledge-base" element={<KnowledgeBase />} />
            <Route path="/knowledge-base/new" element={<ArticleEditor />} />
            <Route path="/knowledge-base/:id" element={<ArticleDetail />} />
            <Route path="/knowledge-base/:id/edit" element={<ArticleEditor />} />
            <Route path="/kb-public" element={<KnowledgeBase />} />
            <Route path="/kb-public/articles/:id" element={<ArticleDetail />} />
            <Route path="/kb-public/:categoryId" element={<Articles />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/canned-responses" element={<CannedResponses />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/teams/:id" element={<TeamDetail />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/search" element={<Search />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
