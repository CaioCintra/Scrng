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
        api: "http://localhost:3333",
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
