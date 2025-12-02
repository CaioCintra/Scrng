export const apiConst = {
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

export const createUser = async (name, password) => {
  try {
    const response = await fetch(`${apiConst.api}/users`, {
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
    console.error("Error creating user:", error);
    throw error;
  }
};
