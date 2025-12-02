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

export const authUser = async (name, password) => {
  try {
    const response = await fetch(`${apiConst.api}/users/authenticate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
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
    console.error("Error during authentication:", error);
    throw error;
  }
};
