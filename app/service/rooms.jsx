const getHost = () => {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_URL ? "producao" : "validacao";
  }

  const url = window.location.origin;
  if (url.includes("localhost")) {
    return "validacao";
  } else if (url.includes(process.env.NEXT_PUBLIC_SYSTEM_URL)) {
    return "producao";
  } else {
    return "invalid";
  }
};

const host = getHost();

export const apiConst =
  host === "producao"
    ? {
        api: process.env.NEXT_PUBLIC_API_URL,
      }
    : {
        api: process.env.NEXT_PUBLIC_API_URL,
      };

export const getRooms = async (user) => {
  try {
    const response = await fetch(`${apiConst.api}/userRooms/${user}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json().catch(() => null);

    if (response.ok) {
      return data;
    }
    return {
      error:
        data?.error ??
        data?.message ??
        `Request failed with status ${response.status}`,
    };
  } catch (error) {
    console.error("Error fetching rooms:", error);
    throw error;
  }
};

export const getRoom = async (roomId) => {
  try {
    const response = await fetch(`${apiConst.api}/rooms/${roomId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json().catch(() => null);

    if (response.ok) return data;

    return {
      error:
        data?.error ??
        data?.message ??
        `Request failed with status ${response.status}`,
    };
  } catch (error) {
    console.error("Error fetching room:", error);
    throw error;
  }
};

export const createRoom = async (user, name) => {
  try {
    const response = await fetch(`${apiConst.api}/rooms/${user}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await response.json().catch(() => null);
    if (response.ok) return data;

    return {
      error:
        data?.error ??
        data?.message ??
        `Request failed with status ${response.status}`,
    };
  } catch (error) {
    console.error("Error creating room:", error);
    throw error;
  }
};

export const deleteRoom = async (roomId) => {
  try {
    const response = await fetch(`${apiConst.api}/rooms/${roomId}`, {
      method: "DELETE",
    });
    const data = await response.json().catch(() => null);
    if (response.ok) return data;

    return {
      error:
        data?.error ??
        data?.message ??
        `Request failed with status ${response.status}`,
    };
  } catch (error) {
    console.error("Error deleting room:", error);
    throw error;
  }
};

export const addPlayer = async (roomId, playerName) => {
  try {
    const response = await fetch(`${apiConst.api}/rooms/${roomId}/players`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName }),
    });
    const data = await response.json().catch(() => null);
    if (response.ok) return data;
    return {
      error:
        data?.error ??
        data?.message ??
        `Request failed with status ${response.status}`,
    };
  } catch (error) {
    console.error("Error adding player:", error);
    throw error;
  }
};

// service/players.ts
export async function getPlayer(id) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/players/${id}`);
    if (!res.ok) {
      return { error: `Erro ao buscar jogador (${res.status})` };
    }
    return await res.json();
  } catch (err) {
    return { error: String(err) };
  }
}

export async function updatePlayer(id, data) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/players/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );
    if (!res.ok) {
      return { error: `Erro ao atualizar jogador (${res.status})` };
    }
    return await res.json().catch(() => ({}));
  } catch (err) {
    return { error: String(err) };
  }
}
export async function getRoomSettings(roomId) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/rooms/${roomId}/settings`,
    );
    if (!res.ok) {
      return { error: `Erro ao buscar configurações (${res.status})` };
    }
    return await res.json();
  } catch (err) {
    return { error: String(err) };
  }
}

export async function updateRoomSettings(roomId, data) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/rooms/${roomId}/settings`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );
    if (!res.ok) {
      return { error: `Erro ao salvar configurações (${res.status})` };
    }
    return await res.json();
  } catch (err) {
    return { error: String(err) };
  }
}
