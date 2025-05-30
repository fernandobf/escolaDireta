import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import StudentList from "./components/StudentList";
import LiveCheckouts from "./components/ClassList";
import Header from "./components/Header";
import { useLocation } from "react-router-dom";

function RequireAuthRedirect() {
  const savedPhone = localStorage.getItem("savedPhone");
  return savedPhone ? <Navigate to="/students" replace /> : <Navigate to="/login" replace />;
}

function RequireAuth({ children }: { children: React.ReactElement }) {
  const savedPhone = localStorage.getItem("savedPhone");
  return savedPhone ? children : <Navigate to="/login" replace />;
}

function App() {
  // Estado levantado para o header
  const [openOccurrencesCount, setOpenOccurrencesCount] = useState(0);
  const [currentClass, setCurrentClass] = useState("");

 const location = useLocation();

  // Checa se estamos na rota /sala e se tem o parâmetro "name"
  const searchParams = new URLSearchParams(location.search);
  const currentName = searchParams.get("name") || "";
  const showWarning = location.pathname === "/sala" && currentName !== "";



  return (
    <>
      <Header openOccurrencesCount={openOccurrencesCount} showWarning={showWarning} currentClass={currentClass} />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/students"
          element={
            <RequireAuth>
              <StudentList />
            </RequireAuth>
          }
        />
        <Route
          path="/sala"
          element={
            <LiveCheckouts
              setOpenOccurrencesCount={setOpenOccurrencesCount}
              setCurrentClass={setCurrentClass}
            />
          }
        />
      </Routes>
    </>
  );
}

export default App;
