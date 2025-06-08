https://dbdiagram.io/d/68387282bd74709cb71c38db

??? índices ou views úteis para analytics e performance

FO
- QRCODE
- Login
- StudentsList

BO
- LiveCheckouts

Admin
- Upload de csv para alimentar banco (substituir/add)


https://dashboard.render.com/d/dpg-d0s9fhemcj7s73acs0fg-a

banco PostgreSQL
https://dashboard.render.com


# 🎓 ESCOLADIRETA

Este repositório contém o modelo e a estrutura do banco de dados relacional do Sistema Escolar, utilizando PostgreSQL, hospedado na nuvem com Render, e modelado visualmente com dbdiagram.io.

---

## 🗃️ Stack do Banco de Dados

| Ferramenta     | Descrição |
|----------------|-----------|
| **PostgreSQL** | Banco de dados relacional robusto, usado para armazenar e relacionar todas as entidades do sistema. |
| **Render**     | Plataforma de hospedagem onde o banco de dados PostgreSQL está disponível na nuvem. |
| **dbdiagram.io** | Ferramenta visual para modelagem e visualização do esquema do banco (ERD), usada para planejar a estrutura antes da criação real. |
PDM / dbml
---

## 🛠️ Como foi construído

1. **Modelagem**  
   A estrutura do banco foi inicialmente desenhada no [dbdiagram.io](https://dbdiagram.io), facilitando a visualização das entidades e seus relacionamentos.

2. **Criação das tabelas**  
   O SQL gerado no dbdiagram foi executado no [pgAdmin](https://www.pgadmin.org/), conectado ao banco de dados PostgreSQL hospedado no [Render](https://render.com).

3. **Gerenciamento**  
   Consultas, inserções e testes são realizados diretamente no pgAdmin via Query Tool, com comandos SQL manuais.

---

## 📊 Diagrama ERD (Entidade-Relacionamento)

> O diagrama completo está disponível no arquivo `esquema.dbml` ou pode ser visualizado online no [dbdiagram.io](https://dbdiagram.io).

---

## 📦 Tabelas principais

- `clients`: entidades clientes que possuem produtos, spots, alunos e cuidadores.
- `products`: soluções vendidas para cada cliente.
- `modules`: módulos internos de cada produto.
- `spots`: pontos físicos associados ao cliente (ex: portarias).
- `students`: alunos associados ao cliente e a um spot.
- `caregivers`: cuidadores responsáveis por alunos.
- `students_caregivers`: tabela de associação N:N entre alunos e cuidadores.
- `logs`: registros de ações feitas pelos cuidadores nos módulos, como check-in, pickup, etc.

---

## ✅ Exemplo de uso

```sql
-- Consultar todos os alunos ativos de um cliente específico
SELECT student_name_official
FROM students
WHERE client_id = 1 AND is_active = true;


gerar novo qrcode:
curl -X POST https://back-end-2vzw.onrender.com/api/notify-qrcode-update


Uma.ideia: enviar sms para os pais para avisar que o aluno ja saiu da escola.


Simule uma tabela de reajuste contratual a partir dos seguintes dados:
- Valor cheio: [coloque aqui, ex: 550.00]
- Percentual de reajuste ao fim de 12 meses: [ex: 20%]
- Planos disponíveis:
  - 12 meses → 0% de desconto
  - 24 meses → 2,5% de desconto
  - 36 meses → 5% de desconto
Mostre os seguintes dados para cada plano:
- Valor com desconto aplicado
- Valor final após o reajuste de 12 meses (calculado sobre o valor com desconto)
Exiba tudo em formato de tabela.


