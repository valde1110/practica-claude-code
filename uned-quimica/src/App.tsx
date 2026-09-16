import { useAuth } from "./lib/useAuth";
import { LoginScreen } from "./components/LoginScreen";
import { AsignaturasScreen } from "./components/AsignaturasScreen";

export default function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="screen-center muted">Cargando...</div>;
  }

  return session ? <AsignaturasScreen /> : <LoginScreen />;
}
