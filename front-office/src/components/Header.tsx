import { useNavigate } from "react-router-dom";

interface HeaderProps {
    openOccurrencesCount: number;
    currentClass: string;
    showWarning: boolean;
}

function Header({ openOccurrencesCount, currentClass, showWarning }: HeaderProps) {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("savedPhone");

  function gerarDataFormatada() {
    const data = new Date();
    const dia = data.getDate();
    const ano = data.getFullYear();

    const meses = [
      "janeiro", "fevereiro", "março", "abril", "maio", "junho",
      "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];

    const mes = meses[data.getMonth()];
    return `Póvoa de Varzim, ${dia} de ${mes} de ${ano}.`;
  }

  function handleLogout(evt: React.MouseEvent<HTMLAnchorElement>) {
    evt.preventDefault();
    localStorage.removeItem("savedPhone");
    localStorage.removeItem("alunos");
    navigate("/"); // redireciona para a página de login
  }

  return (
    <div className="header">
      <div className="header-img">
        <img className="school-logo" src="./school-logo.png" alt="" />
      </div>
      <div
        className="sub-header"
        style={{ display: "flex", alignItems: "center", gap: "1rem" }}
      >
        {showWarning && openOccurrencesCount > 0 && (
          <p className="warning" style={{ margin: 0 }}>
            Existe(m){" "}
            <strong>{openOccurrencesCount.toString().padStart(2, "0")}</strong>{" "}
            ocorrência(s){openOccurrencesCount > 1 ? "s" : ""} em aberto para a turma{" "}
            <strong>{currentClass.toUpperCase()}</strong>.
          </p>
        )}

        <p className={!isLoggedIn ? "data-time" : ""}>{gerarDataFormatada()}</p>

        {isLoggedIn && !showWarning && (
          <a href="" className="logout-button" onClick={handleLogout}>
            Sair
          </a>
        )}
      </div>
    </div>
  );
}

export default Header;
