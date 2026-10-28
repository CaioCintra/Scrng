import { translateError } from "./errors";

const api = () => process.env.NEXT_PUBLIC_API_URL;

// respostas de erro carregam o status e dados extras (ex.: minBid) para a interface reagir
async function request(path, options) {
  try {
    const res = await fetch(`${api()}${path}`, options);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return {
        error: translateError(data?.message, res.status),
        status: res.status,
        minBid: data?.minBid,
      };
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

export const getCurrentAuction = (roomId) =>
  request(`/rooms/${roomId}/auctions/current`);

export const getAuctionHistory = (roomId, limit = 50) =>
  request(`/rooms/${roomId}/auctions?limit=${limit}`);

export const startAuction = (roomId, settings) =>
  request(`/rooms/${roomId}/auctions`, post(settings));

export const placeBid = (roomId, auctionId, playerId, amount) =>
  request(`/rooms/${roomId}/auctions/${auctionId}/bids`, post({ playerId, amount }));

export const cancelAuction = (roomId, auctionId) =>
  request(`/rooms/${roomId}/auctions/${auctionId}/cancel`, post());
