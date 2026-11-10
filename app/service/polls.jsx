import { translateError } from "./errors";

const api = () => process.env.NEXT_PUBLIC_API_URL;

async function request(path, options) {
  try {
    const res = await fetch(`${api()}${path}`, options);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { error: translateError(data?.message, res.status), status: res.status };
    }
    return data;
  } catch (err) {
    return { error: translateError(String(err)) };
  }
}

const post = (body) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body ?? {}),
});

// playerId (opcional) faz a API devolver também a resposta daquele jogador
export const getCurrentPoll = (roomId, playerId) =>
  request(`/rooms/${roomId}/polls/current${playerId ? `?playerId=${playerId}` : ""}`);

export const startPoll = (roomId, question) =>
  request(`/rooms/${roomId}/polls`, post({ question }));

export const answerPoll = (roomId, pollId, playerId, text) =>
  request(`/rooms/${roomId}/polls/${pollId}/answers`, post({ playerId, text }));

export const closePoll = (roomId, pollId) =>
  request(`/rooms/${roomId}/polls/${pollId}/close`, post());

export const finishPoll = (roomId, pollId) =>
  request(`/rooms/${roomId}/polls/${pollId}/finish`, post());
