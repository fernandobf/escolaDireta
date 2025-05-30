export interface Responsavel {
  nome: string;
  telefone: string;
}

export interface Aluno {
  nome: string;
  sala: string;
  responsavel: Responsavel;
}
