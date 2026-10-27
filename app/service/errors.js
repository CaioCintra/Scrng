// traduz mensagens do backend e falhas de rede para textos amigáveis
const MESSAGES = {
  "Invalid credentials": "Usuário ou senha incorretos.",
  "User not found": "Usuário não encontrado.",
  "User with this name already exists": "Já existe um usuário com esse nome.",
  "Room not found": "Sala não encontrada. Ela pode ter sido removida.",
  "Room with this name already exists for this user":
    "Você já tem uma sala com esse nome.",
  "Room has reached its player limit":
    "A sala atingiu o limite de jogadores. Aumente o limite nas configurações.",
  "Player not found": "Jogador não encontrado. Ele pode ter sido removido da sala.",
  "Player not found in this room": "Jogador não encontrado nesta sala.",
  "Player with this name already exists in the room":
    "Já existe um jogador com esse nome na sala.",
  "No settings provided to update": "Nenhuma configuração foi alterada.",
  "Emojis are disabled in this room": "O envio de emojis está desativado nesta sala.",
  "Emoji limit reached, wait before sending more":
    "Aguarde um pouco para enviar mais emojis.",
};

const NETWORK_ERROR = /failed to fetch|networkerror|load failed|network request failed/i;

export function translateError(message, status) {
  const text = typeof message === "string" ? message.trim() : "";

  if (MESSAGES[text]) return MESSAGES[text];
  if (NETWORK_ERROR.test(text)) {
    return "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";
  }
  // erros de validação do zod chegam como um JSON em array
  if (text.startsWith("[")) {
    return "Alguns dados enviados são inválidos. Confira e tente novamente.";
  }
  if (status === 404) return "Não encontrado. Ele pode ter sido removido.";
  if (status >= 500) {
    return "O servidor encontrou um problema. Tente novamente em instantes.";
  }
  if (text && !text.startsWith("Request failed")) return text;
  return "Algo deu errado. Tente novamente.";
}
